import { useState } from 'react'
import { loginUser } from '../api/loginUser'
import {
  emptyLoginErrors,
  hasValidationErrors,
  validateEmail,
  validateLoginForm,
  validatePassword,
} from '../validation/registerValidation'

const initialForm = {
  email: '',
  password: '',
}

export function useLoginForm({ onSuccess } = {}) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(emptyLoginErrors)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

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

    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }))
    }
  }

  function handlePasswordBlur() {
    setErrors((prev) => ({ ...prev, password: validatePassword(form.password) }))
  }

  async function handleSubmit() {
    const nextErrors = validateLoginForm(form)
    setErrors(nextErrors)
    setSubmitError('')
    setSubmitSuccess('')

    if (hasValidationErrors(nextErrors)) {
      return
    }

    try {
      setSubmitting(true)
      const data = await loginUser({
        email: form.email,
        password: form.password,
      })

      if (data?.token) {
        localStorage.setItem('authToken', data.token)
      }

      setSubmitSuccess('Login correcto.')
      onSuccess?.(data)
    } catch (error) {
      setSubmitError(error.message ?? 'No se pudo completar la peticion')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    email: form.email,
    password: form.password,
    emailError: errors.email,
    passwordError: errors.password,
    submitting,
    submitError,
    submitSuccess,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange,
    handlePasswordBlur,
    handleSubmit,
  }
}
