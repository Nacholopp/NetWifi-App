import { API_BASE_URL } from '../../../shared/api/config'

function tryParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function deleteProject(projectId) {
  const token = localStorage.getItem('authToken')

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const rawBody = await response.text()
  const data = tryParseJson(rawBody)

  if (!response.ok) {
    const message = data?.message ?? `Error ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }
}
