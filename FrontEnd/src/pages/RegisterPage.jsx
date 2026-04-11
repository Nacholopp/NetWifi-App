import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export function RegisterPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 620,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #d1d5db',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              Sign In
            </Typography>

            <TextField label='Username*' variant='outlined' fullWidth />
            <TextField label='Email*' type='email' variant='outlined' fullWidth />
            <TextField label='Password*' type='password' variant='outlined' fullWidth />

            <Button
              type='button'
              variant='contained'
              fullWidth
              sx={{

                backgroundColor: '#0d5283',
                '&:hover': {
                  backgroundColor: '#062644',
                  color: '#fff',
                },
                borderRadius: 3,
                py: 1.2,
                textTransform: 'none',
                fontSize: '1rem',

              }}
            >
              Create Account
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
