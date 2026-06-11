import { useState } from 'react'
import { loginUser } from '../api/loginUser'
import { registerUser } from '../api/registerUser'
import {
  emptyRegisterErrors,
  hasValidationErrors,
  validateEmail,
  validatePassword,
  validateRegisterForm,
  validateRepeatPassword,
  validateUsername,
} from '../validation/registerValidation'

const initialForm = {
  username: '',
  email: '',
  password: '',
  repeatPassword: '',
}

export function useRegisterForm({ onSuccess } = {}) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(emptyRegisterErrors)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  function handleUsernameChange(value) {
    setForm((prev) => ({ ...prev, username: value }))

    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: validateUsername(value) }))
    }
  }

  function handleUsernameBlur() {
    setErrors((prev) => ({ ...prev, username: validateUsername(form.username) }))
  }

  function handleEmailChange(value) {
    setForm((prev) => ({ ...prev, email: value }))

    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }))
    }
  }

  function handleEmailBlur() {
    setErrors((prev) => ({ ...prev, email: validateEmail(form.email) }))
  }

  function handlePasswordChange(value) {
    setForm((prev) => ({ ...prev, password: value }))

    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
      repeatPassword: form.repeatPassword
        ? validateRepeatPassword(value, form.repeatPassword)
        : prev.repeatPassword,
    }))
  }

  function handlePasswordBlur(value = form.password) {
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
      repeatPassword: validateRepeatPassword(value, form.repeatPassword),
    }))
  }

  function handleRepeatPasswordChange(value) {
    setForm((prev) => ({ ...prev, repeatPassword: value }))

    setErrors((prev) => ({
      ...prev,
      repeatPassword: validateRepeatPassword(form.password, value),
    }))
  }

  function handleRepeatPasswordBlur(value = form.repeatPassword) {
    setErrors((prev) => ({
      ...prev,
      repeatPassword: validateRepeatPassword(form.password, value),
    }))
  }

  async function handleSubmit() {
    const nextErrors = validateRegisterForm(form)
    setErrors(nextErrors)
    setSubmitError('')
    setSubmitSuccess('')

    if (hasValidationErrors(nextErrors)) {
      return
    }

    try {
      setSubmitting(true)
      const data = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      const authData = await loginUser({
        email: form.email,
        password: form.password,
      })

      if (authData?.token) {
        localStorage.setItem('authToken', authData.token)
      }

      setSubmitSuccess('Usuario registrado correctamente.')
      onSuccess?.(authData ?? data ?? { username: form.username })
    } catch (error) {
      setSubmitError(error.message ?? 'No se pudo completar la peticion')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    username: form.username,
    email: form.email,
    password: form.password,
    repeatPassword: form.repeatPassword,
    usernameError: errors.username,
    emailError: errors.email,
    passwordError: errors.password,
    repeatPasswordError: errors.repeatPassword,
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
  }
}
