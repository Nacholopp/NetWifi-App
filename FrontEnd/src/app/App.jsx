import { useHashRoute } from '@/shared/hooks/useHashRoute'
import { navigationItems } from '@/shared/config/navigation'
import { AppShell } from '@/shared/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { PlanningPage } from '@/pages/PlanningPage'
import { MetricsPage } from '@/pages/MetricsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const routeMap = {
  '/inicio': HomePage,
  '/planificacion': PlanningPage,
  '/metricas': MetricsPage,
}

function App() {
  const { route, navigate } = useHashRoute('/inicio')
  const PageComponent = routeMap[route] ?? NotFoundPage

  return (
    <AppShell
      currentRoute={route}
      navigationItems={navigationItems}
      onNavigate={navigate}
    >
      <PageComponent />
    </AppShell>
  )
}

export default App

