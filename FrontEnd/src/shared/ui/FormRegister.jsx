import { useState } from 'react'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

export function PasswordField({ label, value, onChange, onBlur, error, helperText }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TextField
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={Boolean(error)}
      helperText={helperText}
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 3,
        },
      }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                edge='end'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

export function TextFieldEmailUsername({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  sx,
  ...props
}) {
  return (
    <TextField
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={Boolean(error)}
      helperText={helperText}
      fullWidth
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 3,
        },
        ...sx,
      }}
    />
  )
}
