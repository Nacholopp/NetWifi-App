import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ROUTES } from '../app/routes'
import { useLoginForm } from '../features/auth/hooks/useLoginForm'
import { PasswordField, TextFieldEmailUsername } from '../shared/ui/FormRegister'

export function LoginPage({ onNavigate, onAuthSuccess }) {
  const {
    email,
    password,
    emailError,
    passwordError,
    submitting,
    submitError,
    submitSuccess,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange,
    handlePasswordBlur,
    handleSubmit,
  } = useLoginForm({ onSuccess: onAuthSuccess })

  return (
    <Box
      sx={{
        minHeight: '95vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        backgroundColor: '#e2e3e7',
      }}
    >
      <Card
        sx={{
          width: '35%',
          maxWidth: 590,
          borderRadius: 5,
          border: '1px solid #ffffff',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.18)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.0005 }}>
              Log In
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 300, mb: 1 }}>
              Accede a tu cuenta de NetWifi
            </Typography>

            {submitError ? <Alert severity='error'>{submitError}</Alert> : null}
            {submitSuccess ? <Alert severity='success'>{submitSuccess}</Alert> : null}

            <TextFieldEmailUsername
              label='Email*'
              type='email'
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              error={emailError}
              helperText={emailError}
            />

            <PasswordField
              label='Password*'
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={handlePasswordBlur}
              error={passwordError}
              helperText={passwordError}
            />

            <Button
              type='button'
              onClick={handleSubmit}
              disabled={submitting}
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
              {submitting ? 'Accediendo...' : 'Acceder'}
            </Button>

            <Typography variant='body2' sx={{ textAlign: 'center', mt: 1 }}>
              Si no tienes cuenta,{' '}
              <Link
                component='button'
                type='button'
                underline='hover'
                onClick={() => onNavigate?.(ROUTES.register)}
              >
                registrate
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
