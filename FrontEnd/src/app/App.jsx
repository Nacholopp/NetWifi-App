import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { RegisterPage } from '../pages/RegisterPage'
import { ROUTES } from './routes'

function App() {
  const [route] = useState(ROUTES.register)

  return (
    <MainLayout>
      {route === ROUTES.register && <RegisterPage />}
    </MainLayout>
  )
}

export default App
