import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ROUTES } from '../app/routes'
import { deleteProject } from '../features/projects/api/deleteProject'
import { getMyProjects } from '../features/projects/api/getMyProjects'

const primaryButtonSx = {
  borderRadius: 3,
  px: 2.2,
  py: 1,
  textTransform: 'none',
  fontWeight: 700,
  backgroundColor: '#0d2f52',
  '&:hover': {
    backgroundColor: '#091f37',
  },
}

export function HomePage({ currentUser, onNavigate, onOpenProject, onSessionExpired }) {
  const username = currentUser?.username ?? 'Invitado'
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const visibleProjects = currentUser ? projects : []
  const hasProjects = visibleProjects.length > 0

  useEffect(() => {
    if (!currentUser) {
      return
    }

    async function loadProjects() {
      try {
        setLoading(true)
        setError('')
        setProjects(await getMyProjects())
      } catch (loadError) {
        if (loadError.status === 401 || loadError.status === 403) {
          onSessionExpired?.()
          return
        }

        setError(loadError.message ?? 'No se pudieron cargar los proyectos')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [currentUser, onSessionExpired])

  function handleNewProjectClick() {
    if (!currentUser) {
      onNavigate?.(ROUTES.login)
      return
    }

    onNavigate?.(ROUTES.projectEditor)
  }

  async function handleDeleteProject(projectId) {
    try {
      setError('')
      await deleteProject(projectId)
      setProjects((currentProjects) => currentProjects.filter((project) => project.id !== projectId))
    } catch (deleteError) {
      if (deleteError.status === 401 || deleteError.status === 403) {
        onSessionExpired?.()
        return
      }

      setError(deleteError.message ?? 'No se pudo borrar el proyecto')
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 4, pt: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.85) 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: '1.65rem', md: '2rem' }, fontWeight: 800 }}>
              Hola, {username}
            </Typography>
            <Typography sx={{ mt: 0.6, color: '#6b7280' }}>
              Gestiona tus proyectos de analisis Wi-Fi o crea uno nuevo.
            </Typography>
          </Box>

          <Button variant='contained' sx={primaryButtonSx} onClick={handleNewProjectClick}>
            Nuevo Proyecto
          </Button>
        </Box>

        <Typography sx={{ mt: 3, fontWeight: 800, fontSize: '1.25rem' }}>Mis Proyectos</Typography>
        {loading && <Typography sx={{ mt: 1, color: '#6b7280' }}>Cargando proyectos...</Typography>}
        {error && <Typography sx={{ mt: 1, color: '#b91c1c' }}>{error}</Typography>}

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: hasProjects ? 'repeat(2, minmax(0, 1fr))' : 'minmax(250px, 320px)',
              lg: hasProjects ? 'repeat(4, minmax(0, 1fr))' : 'minmax(250px, 320px)',
            },
            gap: 2,
            justifyContent: hasProjects ? 'stretch' : 'start',
          }}
        >
          {visibleProjects.map((project) => (
            <Card key={project.id} sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <CardActionArea onClick={() => onOpenProject?.(project)}>
                <Box
                  component='img'
                  src={project.imageData}
                  alt={project.projectName}
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    display: 'block',
                    backgroundColor: '#000000',
                    objectFit: 'contain',
                  }}
                />
                <CardContent>
                  <Typography sx={{ fontWeight: 800 }}>{project.projectName}</Typography>
                  <Typography sx={{ mt: 0.5, color: '#6b7280', fontSize: '.9rem' }}>
                    {project.username}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  variant='outlined'
                  color='error'
                  fullWidth
                  onClick={() => handleDeleteProject(project.id)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
                >
                  Borrar proyecto
                </Button>
              </Box>
            </Card>
          ))}

          {!hasProjects && !loading && (
            <Card
              sx={{
                borderRadius: 3,
                border: '2px dashed #cfd4dc',
                backgroundColor: 'rgba(255,255,255,0.65)',
                minHeight: 245,
              }}
            >
              <CardActionArea
                onClick={handleNewProjectClick}
                sx={{
                  minHeight: 245,
                  display: 'grid',
                  placeItems: 'center',
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <CardContent>
                  <Typography sx={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 }}>+</Typography>
                  <Typography sx={{ mt: 1.5, fontWeight: 800 }}>Nuevo Proyecto</Typography>
                  <Typography sx={{ mt: 0.7, color: '#6b7280', fontSize: '.95rem' }}>
                    Crea tu proyecto y empieza el analisis de red.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
