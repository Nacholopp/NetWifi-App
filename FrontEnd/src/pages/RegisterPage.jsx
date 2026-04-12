import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useRegisterForm } from '../features/auth/hooks/useRegisterForm'
import { PasswordField, TextFieldEmailUsername } from '../shared/ui/FormRegister'

export function RegisterPage() {
  const {
    username,
    email,
    password,
    repeatPassword,
    usernameError,
    emailError,
    passwordError,
    repeatPasswordError,
    submitting,
    submitError,
    submitSuccess,
    handleUsernameChange,
    handleUsernameBlur,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange,
    handlePasswordBlur,
    handleRepeatPasswordChange,
    handleRepeatPasswordBlur,
    handleSubmit,
  } = useRegisterForm()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        backgroundColor: '#c6cdd8'
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
            <Typography variant='h6' sx={{ fontWeight: 700, gap: 1, mb: 0.0005 }}>
              Sign In
            </Typography>
            <Typography variant='h10' sx={{ fontWeight: 100, gap: 1, mb: 1 }}>
              Crea una cuenta de NetWify
            </Typography>

            {submitError ? <Alert severity='error'>{submitError}</Alert> : null}
            {submitSuccess ? <Alert severity='success'>{submitSuccess}</Alert> : null}

            <TextFieldEmailUsername
              label='Username*'
              type='text'
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onBlur={handleUsernameBlur}
              error={usernameError}
              helperText={usernameError}
            />

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
              onBlur={(e) => handlePasswordBlur(e.target.value)}
              error={passwordError}
              helperText={passwordError}
            />

            <PasswordField
              label='Repeat password*'
              value={repeatPassword}
              onChange={(e) => handleRepeatPasswordChange(e.target.value)}
              onBlur={(e) => handleRepeatPasswordBlur(e.target.value)}
              error={repeatPasswordError}
              helperText={repeatPasswordError}
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
                '& .arrow': { opacity: 0, ml: 0.5, transition: 'opacity .2s ease' },
                '&:hover .arrow': { opacity: 1 },
              }}
            >
              {submitting ? 'Creating account...' : 'Create Account'}
              <span className='arrow'>→</span>
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
