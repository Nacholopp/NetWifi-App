import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function WifiTestPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' sx={{ fontWeight: 700 }}>
        Test Wifi
      </Typography>
      <Typography variant='body1' sx={{ mt: 1 }}>
        Aqui ira el modulo de test wifi.
      </Typography>
    </Box>
  )
}
