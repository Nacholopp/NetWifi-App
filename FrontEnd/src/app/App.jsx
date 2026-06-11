import { useCallback, useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { deleteCurrentUser } from '../features/auth/api/deleteCurrentUser'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LogInPage'
import { ProjectEditorPage } from '../pages/ProjectEditorPage'
import { RegisterPage } from '../pages/RegisterPage'
import { WifiTestPage } from '../pages/WifiTestPage'
import { ROUTES } from './routes'

function App() {
  const [route, setRoute] = useState(ROUTES.home)
  const [selectedProject, setSelectedProject] = useState(null)
  const [authUser, setAuthUser] = useState(() => {
    const storedUsername = localStorage.getItem('authUsername')
    const storedToken = localStorage.getItem('authToken')

    if (storedUsername && storedToken) {
      return { username: storedUsername }
    }

    localStorage.removeItem('authUsername')
    localStorage.removeItem('authToken')
    return null
  })

  function handleAuthSuccess(payload) {
    const username = payload?.username
    const token = payload?.token

    if (token) {
      localStorage.setItem('authToken', token)
    }

    if (username) {
      localStorage.setItem('authUsername', username)
      setAuthUser({ username })
    }
    setRoute(ROUTES.home)
  }

  function handleNavigate(routeName) {
    if (routeName === ROUTES.projectEditor) {
      setSelectedProject(null)
    }
    setRoute(routeName)
  }

  function handleOpenProject(project) {
    setSelectedProject(project)
    setRoute(ROUTES.projectEditor)
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUsername')
    setSelectedProject(null)
    setAuthUser(null)
    setRoute(ROUTES.home)
  }

  const handleSessionExpired = useCallback(function handleSessionExpired() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUsername')
    setSelectedProject(null)
    setAuthUser(null)
    setRoute(ROUTES.login)
  }, [])

  async function handleDeleteAccount() {
    try {
      await deleteCurrentUser()
      localStorage.removeItem('wifiProjects')
      handleLogout()
    } catch (error) {
      window.alert(error.message ?? 'No se pudo borrar la cuenta')
    }
  }

  return (
    <MainLayout
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
      currentRoute={route}
      currentUser={authUser}
      variant={route === ROUTES.register ? 'register' : 'default'}
    >
      {route === ROUTES.home && (
        <HomePage
          currentUser={authUser}
          onNavigate={handleNavigate}
          onOpenProject={handleOpenProject}
          onSessionExpired={handleSessionExpired}
        />
      )}
      {route === ROUTES.login && <LoginPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />}
      {route === ROUTES.projectEditor && (
        <ProjectEditorPage
          currentUser={authUser}
          onNavigate={handleNavigate}
          onSessionExpired={handleSessionExpired}
          project={selectedProject}
        />
      )}
      {route === ROUTES.register && <RegisterPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />}
      {route === ROUTES.wifiTest && <WifiTestPage />}
    </MainLayout>
  )
}

export default App
