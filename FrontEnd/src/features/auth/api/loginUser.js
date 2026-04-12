const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function tryParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const rawBody = await response.text()
  const data = tryParseJson(rawBody)

  if (!response.ok) {
    const message = data?.message ?? `Error ${response.status}`
    throw new Error(message)
  }

  return data
}
