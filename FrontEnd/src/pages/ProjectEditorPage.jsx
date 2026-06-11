import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { ROUTES } from '../app/routes'
import { createProject } from '../features/projects/api/createProject'
import { runProjectSimulation } from '../features/projects/api/runProjectSimulation'
import { updateProject } from '../features/projects/api/updateProject'
import { TextFieldEmailUsername } from '../shared/ui/FormRegister'

const CANVAS_SIZE = 256
const WALL_WIDTH = 0.5
const DRAFT_WALL_WIDTH = 1
const ERASE_RADIUS = 4
const MAX_APS = 3

const tools = [
  { id: 'wall', label: 'Pared' },
  { id: 'erase', label: 'Borrar' },
  { id: 'ap', label: 'Router' },
]

const buttonSx = {
  textTransform: 'none',
  fontWeight: 800,
  borderRadius: 2,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function getPointerPosition(event, svgElement) {
  const bounds = svgElement.getBoundingClientRect()
  return {
    x: clamp(Math.round(((event.clientX - bounds.left) / bounds.width) * CANVAS_SIZE), 0, CANVAS_SIZE - 1),
    y: clamp(Math.round(((event.clientY - bounds.top) / bounds.height) * CANVAS_SIZE), 0, CANVAS_SIZE - 1),
  }
}

function getStraightEnd(start, end) {
  return Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
    ? { x: end.x, y: start.y }
    : { x: start.x, y: end.y }
}

function isNearPoint(point, target, radius = 6) {
  return Math.hypot(point.x - target.x, point.y - target.y) <= radius
}

function isNearWall(point, wall) {
  if (wall.x1 === wall.x2) {
    const minY = Math.min(wall.y1, wall.y2)
    const maxY = Math.max(wall.y1, wall.y2)
    return Math.abs(point.x - wall.x1) <= 4 && point.y >= minY - 4 && point.y <= maxY + 4
  }

  const minX = Math.min(wall.x1, wall.x2)
  const maxX = Math.max(wall.x1, wall.x2)
  return Math.abs(point.y - wall.y1) <= 4 && point.x >= minX - 4 && point.x <= maxX + 4
}

function drawLineAsPixels(context, wall) {
  if (wall.x1 === wall.x2) {
    const y = Math.min(wall.y1, wall.y2)
    const height = Math.abs(wall.y2 - wall.y1) + 1
    context.fillRect(wall.x1, y, 1, height)
    return
  }

  const x = Math.min(wall.x1, wall.x2)
  const width = Math.abs(wall.x2 - wall.x1) + 1
  context.fillRect(x, wall.y1, width, 1)
}

function loadCanvasImage(imageData) {
  return new Promise((resolve, reject) => {
    if (!imageData) {
      resolve(null)
      return
    }

    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = imageData
  })
}

export function ProjectEditorPage({ currentUser, onNavigate, onSessionExpired, project }) {
  const svgRef = useRef(null)
  const [currentProject, setCurrentProject] = useState(project)
  const [tool, setTool] = useState('wall')
  const [walls, setWalls] = useState([])
  const [apPositions, setApPositions] = useState([])
  const [erasePoints, setErasePoints] = useState([])
  const [draftWall, setDraftWall] = useState(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [predictionImageData, setPredictionImageData] = useState('')
  const [simulationError, setSimulationError] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [editingSavedProject, setEditingSavedProject] = useState(false)
  const isSavedProject = Boolean(currentProject)
  const canDraw = !isSavedProject || editingSavedProject

  function startDrawing(event) {
    if (!canDraw) return
    if (!svgRef.current) return

    const point = getPointerPosition(event, svgRef.current)

    if (tool === 'erase') {
      eraseAt(point)
      return
    }

    if (tool === 'ap') {
      addAp(point)
      return
    }

    setDraftWall({ x1: point.x, y1: point.y, x2: point.x, y2: point.y })
  }

  function movePointer(event) {
    if (!canDraw) return
    if (!svgRef.current || !draftWall) return

    const point = getPointerPosition(event, svgRef.current)
    setDraftWall((wall) => {
      const end = getStraightEnd({ x: wall.x1, y: wall.y1 }, point)
      return { ...wall, x2: end.x, y2: end.y }
    })
  }

  function stopDrawing() {
    if (!canDraw) return
    if (draftWall) {
      const length = Math.hypot(draftWall.x2 - draftWall.x1, draftWall.y2 - draftWall.y1)
      if (length > 2) {
        setWalls((currentWalls) => [...currentWalls, draftWall])
      }
    }

    setDraftWall(null)
  }

  function addAp(point) {
    setApPositions((currentAps) => {
      if (currentAps.length >= MAX_APS) return currentAps
      return [...currentAps, point]
    })
  }

  function eraseAt(point) {
    if (editingSavedProject) {
      setErasePoints((currentPoints) => [...currentPoints, point])
    }

    setApPositions((currentAps) => currentAps.filter((ap) => !isNearPoint(point, ap)))
    setWalls((currentWalls) => currentWalls.filter((wall) => !isNearWall(point, wall)))
  }

  function clearMap() {
    setWalls([])
    setApPositions([])
    setErasePoints([])
    setDraftWall(null)
  }

  function startEditing() {
    setEditingSavedProject(true)
    setPredictionImageData('')
    setSimulationError('')
    clearMap()
  }

  function cancelEditing() {
    setEditingSavedProject(false)
    clearMap()
  }

  function createMapImage({ includeWalls = true, includeAps = true } = {}) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    context.fillStyle = '#000000'
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    context.fillStyle = '#ffffff'
    if (includeWalls) {
      walls.forEach((wall) => drawLineAsPixels(context, wall))
    }
    if (includeAps) {
      apPositions.forEach((ap) => context.fillRect(ap.x, ap.y, 1, 1))
    }

    return canvas.toDataURL('image/png')
  }

  async function createEditedMapImage(baseImageData, { includeWalls = true, includeAps = true } = {}) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const baseImage = await loadCanvasImage(baseImageData)

    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE

    context.fillStyle = '#000000'
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    if (baseImage) {
      context.drawImage(baseImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }

    context.fillStyle = '#000000'
    erasePoints.forEach((point) => {
      context.fillRect(
        point.x - ERASE_RADIUS,
        point.y - ERASE_RADIUS,
        ERASE_RADIUS * 2 + 1,
        ERASE_RADIUS * 2 + 1,
      )
    })

    context.fillStyle = '#ffffff'
    if (includeWalls) {
      walls.forEach((wall) => drawLineAsPixels(context, wall))
    }
    if (includeAps) {
      apPositions.forEach((ap) => context.fillRect(ap.x, ap.y, 1, 1))
    }

    return canvas.toDataURL('image/png')
  }

  async function saveProject(event) {
    event.preventDefault()

    const trimmedName = projectName.trim()
    if (!trimmedName) {
      setSaveError('El nombre no puede estar vacio')
      return
    }

    if (!currentUser) {
      onNavigate?.(ROUTES.login)
      return
    }

    try {
      setSaving(true)
      setSaveError('')
      await createProject({
        projectName: trimmedName,
        imageData: createMapImage(),
        layoutImageData: createMapImage({ includeAps: false }),
        apMaskImageData: createMapImage({ includeWalls: false }),
      })
      setSaveDialogOpen(false)
      onNavigate?.(ROUTES.home)
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        onSessionExpired?.()
        return
      }

      setSaveError(error.message ?? 'No se pudo guardar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  async function saveProjectChanges() {
    if (!currentProject) return

    try {
      setSaving(true)
      setSimulationError('')
      const imageData = await createEditedMapImage(currentProject.imageData)
      const layoutImageData = await createEditedMapImage(currentProject.layoutImageData, { includeAps: false })
      const apMaskImageData = await createEditedMapImage(currentProject.apMaskImageData, { includeWalls: false })

      const updatedProject = await updateProject(currentProject.id, {
        projectName: currentProject.projectName,
        imageData,
        layoutImageData,
        apMaskImageData,
      })
      setCurrentProject(updatedProject)
      setEditingSavedProject(false)
      setPredictionImageData('')
      clearMap()
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        onSessionExpired?.()
        return
      }

      setSimulationError(error.message ?? 'No se pudieron guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  async function simulateProject() {
    if (!currentProject) return

    try {
      setSimulating(true)
      setSimulationError('')
      const response = await runProjectSimulation(currentProject)
      setPredictionImageData(response.predictionImageData)
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        onSessionExpired?.()
        return
      }

      setSimulationError(error.message ?? 'No se pudo ejecutar la simulacion')
    } finally {
      setSimulating(false)
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: { xs: '1.65rem', md: '2rem' }, fontWeight: 900 }}>
          {currentProject?.projectName ?? 'Nuevo Proyecto'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canDraw && tools.map(({ id, label }) => (
            <Button
              key={id}
              variant={tool === id ? 'contained' : 'outlined'}
              onClick={() => setTool(id)}
              sx={buttonSx}
            >
              {label}
            </Button>
          ))}

          {canDraw && (
            <>
              <Button variant='outlined' onClick={clearMap} sx={buttonSx}>
                Limpiar
              </Button>
              {!isSavedProject && (
                <Button variant='contained' onClick={() => setSaveDialogOpen(true)} sx={buttonSx}>
                  Guardar
                </Button>
              )}
              {editingSavedProject && (
                <>
                  <Button variant='contained' onClick={saveProjectChanges} disabled={saving} sx={buttonSx}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <Button variant='outlined' onClick={cancelEditing} disabled={saving} sx={buttonSx}>
                    Cancelar
                  </Button>
                </>
              )}
            </>
          )}

          {isSavedProject && !editingSavedProject && (
            <Button variant='outlined' onClick={startEditing} sx={buttonSx}>
              Editar
            </Button>
          )}

          <Button variant='text' onClick={() => onNavigate?.(ROUTES.home)} sx={buttonSx}>
            Volver
          </Button>
        </Box>
      </Box>

      <Box
        component='svg'
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        onPointerDown={startDrawing}
        onPointerMove={movePointer}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        sx={{
          width: 'min(80vh, 100%)',
          maxWidth: 640,
          aspectRatio: '1 / 1',
          display: 'block',
          mx: 'auto',
          border: '1px solid #cbd5e1',
          backgroundColor: '#000000',
          touchAction: 'none',
          userSelect: 'none',
          cursor: tool === 'wall' || tool === 'ap' ? 'crosshair' : 'default',
        }}
      >
        {currentProject?.imageData && (
          <image href={currentProject.imageData} x='0' y='0' width={CANVAS_SIZE} height={CANVAS_SIZE} />
        )}
        {predictionImageData && !editingSavedProject && (
          <image
            href={predictionImageData}
            x='0'
            y='0'
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            opacity='0.65'
            pointerEvents='none'
          />
        )}

        {erasePoints.map((point, index) => (
          <rect
            key={`${point.x}-${point.y}-${index}`}
            x={point.x - ERASE_RADIUS}
            y={point.y - ERASE_RADIUS}
            width={ERASE_RADIUS * 2 + 1}
            height={ERASE_RADIUS * 2 + 1}
            fill='#000000'
          />
        ))}

        {walls.map((wall, index) => (
          <line
            key={`${wall.x1}-${wall.y1}-${wall.x2}-${wall.y2}-${index}`}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            stroke='#ffffff'
            strokeWidth={WALL_WIDTH}
            strokeLinecap='square'
          />
        ))}

        {draftWall && (
          <line
            x1={draftWall.x1}
            y1={draftWall.y1}
            x2={draftWall.x2}
            y2={draftWall.y2}
            stroke='#93c5fd'
            strokeWidth={DRAFT_WALL_WIDTH}
            strokeDasharray='4 3'
            strokeLinecap='square'
          />
        )}

        {apPositions.map((ap, index) => (
          <circle key={`${ap.x}-${ap.y}-${index}`} cx={ap.x} cy={ap.y} r='0.5' fill='#ffffff' />
        ))}
      </Box>

      {isSavedProject && !editingSavedProject && (
        <Box sx={{ mt: 2, display: 'grid', justifyContent: 'center', gap: 1 }}>
          <Button variant='contained' onClick={simulateProject} disabled={simulating} sx={buttonSx}>
            {simulating ? 'Simulando...' : 'Simulacion'}
          </Button>
          {simulationError && (
            <Typography sx={{ color: '#b91c1c', fontSize: '.9rem', textAlign: 'center' }}>
              {simulationError}
            </Typography>
          )}
        </Box>
      )}

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} fullWidth maxWidth='xs'>
        <Box component='form' onSubmit={saveProject}>
          <DialogTitle>Guardar proyecto</DialogTitle>
          <DialogContent>
            <TextFieldEmailUsername
              autoFocus
              label='Nombre del proyecto'
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value)
                setSaveError('')
              }}
              error={Boolean(saveError)}
              helperText={saveError}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSaveDialogOpen(false)} sx={buttonSx}>
              Cancelar
            </Button>
            <Button type='submit' variant='contained' disabled={saving} sx={buttonSx}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
