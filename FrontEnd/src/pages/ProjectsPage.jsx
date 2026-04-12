import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function ProjectsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' sx={{ fontWeight: 700 }}>
        Proyectos
      </Typography>
      <Typography variant='body1' sx={{ mt: 1 }}>
        Aqui ira la gestion de proyectos.
      </Typography>
    </Box>
  )
}
