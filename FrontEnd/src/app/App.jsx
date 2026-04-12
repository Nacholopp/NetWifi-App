import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LogInPage'
import { RegisterPage } from '../pages/RegisterPage'
import { WifiTestPage } from '../pages/WifiTestPage'
import { ROUTES } from './routes'

function App() {
  const [route, setRoute] = useState(ROUTES.home)
  const [authUser, setAuthUser] = useState(() => {
    const storedUsername = localStorage.getItem('authUsername')
    return storedUsername ? { username: storedUsername } : null
  })

  function handleAuthSuccess(payload) {
    const username = payload?.username
    if (username) {
      localStorage.setItem('authUsername', username)
      setAuthUser({ username })
    }
    setRoute(ROUTES.home)
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUsername')
    setAuthUser(null)
    setRoute(ROUTES.home)
  }

  return (
    <MainLayout
      onNavigate={setRoute}
      onLogout={handleLogout}
      currentRoute={route}
      currentUser={authUser}
      variant={route === ROUTES.register ? 'register' : 'default'}
    >
      {route === ROUTES.home && <HomePage currentUser={authUser} onNavigate={setRoute} />}
      {route === ROUTES.login && <LoginPage onNavigate={setRoute} onAuthSuccess={handleAuthSuccess} />}
      {route === ROUTES.register && <RegisterPage onNavigate={setRoute} onAuthSuccess={handleAuthSuccess} />}
      {route === ROUTES.wifiTest && <WifiTestPage />}
    </MainLayout>
  )
}

export default App
