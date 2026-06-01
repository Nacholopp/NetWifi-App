import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { useWifiSignalTest } from '../features/wifi/hooks/useWifiSignalTest'

function formatDbm(value) {
  return typeof value === 'number' ? `${value} dBm` : '-- dBm'
}

function signalColor(dbm) {
  if (typeof dbm !== 'number') return '#9ca3af'
  if (dbm >= -60) return '#22c55e'
  if (dbm >= -70) return '#f59e0b'
  return '#ef4444'
}

function formatValue(value, unit) {
  return typeof value === 'number' ? `${value} ${unit}` : `-- ${unit}`
}

export function WifiTestPage() {
  const { running, wifiSignal, error, toggleRunning } = useWifiSignalTest()
  const color = signalColor(wifiSignal?.rssiDbm)

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 900 }}>
        Test WiFi
      </Typography>
      <Typography sx={{ mt: 0.5, color: '#6b7280', fontWeight: 600 }}>
        Mide la senal WiFi actual de tu equipo.
      </Typography>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Typography sx={{ color: '#6b7280', fontWeight: 700 }}>Senal WiFi</Typography>

          <Typography sx={{ mt: 1, fontSize: '4rem', lineHeight: 1, fontWeight: 900, color }}>
            {formatDbm(wifiSignal?.rssiDbm)}
          </Typography>

          <Typography sx={{ mt: 1, fontSize: '1.2rem', fontWeight: 800, color }}>
            {wifiSignal?.quality ?? 'Sin datos'}
          </Typography>

          <Box sx={{ mt: 3, display: 'grid', gap: 1 }}>
            <Typography>
              <strong>Potencia:</strong> {formatDbm(wifiSignal?.dbm ?? wifiSignal?.rssiDbm)}
            </Typography>
            <Typography>
              <strong>Red:</strong> {wifiSignal?.ssid ?? '--'}
            </Typography>
            <Typography>
              <strong>Banda:</strong> {wifiSignal?.band ?? '--'}
            </Typography>
            <Typography>
              <strong>Calidad:</strong>{' '}
              {typeof wifiSignal?.signalPercent === 'number' ? `${wifiSignal.signalPercent}%` : '--'}
            </Typography>
          </Box>

          {wifiSignal?.rssiEstimated && (
            <Typography sx={{ mt: 2, color: '#6b7280', fontSize: '.9rem' }}>
              El valor dBm es estimado
            </Typography>
          )}
        </Card>

        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Typography sx={{ color: '#6b7280', fontWeight: 700 }}>Rendimiento</Typography>

          <Typography sx={{ mt: 1, fontSize: '4rem', lineHeight: 1, fontWeight: 900, color: '#24384f' }}>
            {formatValue(wifiSignal?.pingMs, 'ms')}
          </Typography>

          <Typography sx={{ mt: 1, fontSize: '1.2rem', fontWeight: 800, color: '#24384f' }}>
            Ping a 1.1.1.1
          </Typography>

          <Box sx={{ mt: 3, display: 'grid', gap: 1 }}>
            <Typography>
              <strong>Velocidad de recepcion:</strong> {formatValue(wifiSignal?.rxMbps, 'Mbps')}
            </Typography>
            <Typography>
              <strong>Velocidad de transmision:</strong> {formatValue(wifiSignal?.txMbps, 'Mbps')}
            </Typography>
          </Box>

        </Card>
      </Box>

      {error && (
        <Typography sx={{ mt: 2, color: '#b91c1c', fontWeight: 700 }}>
          {error}
        </Typography>
      )}

      <Button
        variant='contained'
        onClick={toggleRunning}
        sx={{
          mt: 3,
          borderRadius: 3,
          px: 2.5,
          py: 1,
          textTransform: 'none',
          fontWeight: 800,
          backgroundColor: '#24384f',
          '&:hover': { backgroundColor: '#172033' },
        }}
      >
        {running ? 'Detener test' : 'Iniciar test'}
      </Button>
    </Box>
  )
}
