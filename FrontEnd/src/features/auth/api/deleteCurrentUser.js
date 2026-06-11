const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function tryParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function deleteCurrentUser() {
  const token = localStorage.getItem('authToken')

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const rawBody = await response.text()
  const data = tryParseJson(rawBody)

  if (!response.ok) {
    const message = data?.message ?? `Error ${response.status}`
    throw new Error(message)
  }
}
