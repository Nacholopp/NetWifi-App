const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export const emptyRegisterErrors = {
  username: '',
  email: '',
  password: '',
  repeatPassword: '',
}

export function validateUsername(value) {
  if (!value.trim()) {
    return 'El username es obligatorio'
  }

  return ''
}

export function validateEmail(value) {
  if (!value.trim()) {
    return 'El email es obligatorio'
  }

  if (!emailRegex.test(value)) {
    return 'Introduce un email válido'
  }

  return ''
}

export function validatePassword(value) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 'La contraseña es obligatoria'
  }

  if (normalizedValue.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }

  if (!passwordRegex.test(normalizedValue)) {
    return 'La contraseña debe contener al menos una letra y un número'
  }

  return ''
}

export function validateRepeatPassword(password, repeatPassword) {
  if (!repeatPassword.trim()) {
    return 'Repetir la contraseña es obligatorio'
  }

  if (password !== repeatPassword) {
    return 'Las contraseñas no coinciden'
  }

  return ''
}

export function validateRegisterForm(form) {
  return {
    username: validateUsername(form.username),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    repeatPassword: validateRepeatPassword(form.password, form.repeatPassword),
  }
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean)
}
