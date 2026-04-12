import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ROUTES } from '../app/routes'

const projects = []

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

export function HomePage({ currentUser, onNavigate }) {
  const username = currentUser?.username ?? 'Invitado'
  const hasProjects = projects.length > 0

  function handleNewProjectClick() {
    if (!currentUser) {
      onNavigate?.(ROUTES.login)
      return
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

          <Button variant='contained' startIcon={<AddIcon />} sx={primaryButtonSx} onClick={handleNewProjectClick}>
            Nuevo Proyecto
          </Button>
        </Box>

        <Box
          sx={{
            mt: 3,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 1.5,
          }}
        >

        </Box>

        <Typography sx={{ mt: 3, fontWeight: 800, fontSize: '1.25rem' }}>Mis Proyectos</Typography>

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
          {!hasProjects && (
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
                  <Box
                    sx={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      margin: '0 auto',
                    }}
                  >
                    <AddIcon />
                  </Box>
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
