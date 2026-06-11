const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function tryParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function createProject({ projectName, imageData, layoutImageData, apMaskImageData }) {
  const token = localStorage.getItem('authToken')

  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ projectName, imageData, layoutImageData, apMaskImageData }),
  })

  const rawBody = await response.text()
  const data = tryParseJson(rawBody)

  if (!response.ok) {
    const message = data?.message ?? `Error ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}
