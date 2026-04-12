import { describe, expect, it } from 'vitest'
import {
  hasValidationErrors,
  validateEmail,
  validatePassword,
  validateRegisterForm,
  validateRepeatPassword,
  validateUsername,
} from './registerValidation'

describe('registerValidation', () => {
  it('validates username', () => {
    expect(validateUsername('')).toBe('El username es obligatorio')
    expect(validateUsername('nacho')).toBe('')
  })

  it('validates email format', () => {
    expect(validateEmail('')).toBe('El email es obligatorio')
    expect(validateEmail('correo-invalido')).toBe('Introduce un email válido')
    expect(validateEmail('test@example.com')).toBe('')
  })

  it('validates password rules', () => {
    expect(validatePassword('')).toBe('La contraseña es obligatoria')
    expect(validatePassword('abc12')).toBe('La contraseña debe tener al menos 8 caracteres')
    expect(validatePassword('abcdefgh')).toBe('La contraseña debe contener al menos una letra y un número')
    expect(validatePassword('abcde123')).toBe('')
  })

  it('validates repeat password', () => {
    expect(validateRepeatPassword('abcde123', '')).toBe('Repetir la contraseña es obligatorio')
    expect(validateRepeatPassword('abcde123', 'abcde124')).toBe('Las contraseñas no coinciden')
    expect(validateRepeatPassword('abcde123', 'abcde123')).toBe('')
  })

  it('validates full form and detects errors', () => {
    const invalid = validateRegisterForm({
      username: '',
      email: 'bad-email',
      password: 'aaaaaaa',
      repeatPassword: 'bbbbbbb',
    })

    expect(invalid.username).toBeTruthy()
    expect(invalid.email).toBeTruthy()
    expect(invalid.password).toBeTruthy()
    expect(invalid.repeatPassword).toBeTruthy()
    expect(hasValidationErrors(invalid)).toBe(true)

    const valid = validateRegisterForm({
      username: 'nacho',
      email: 'nacho@example.com',
      password: 'abcde123',
      repeatPassword: 'abcde123',
    })

    expect(valid).toEqual({
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
    })
    expect(hasValidationErrors(valid)).toBe(false)
  })
})

