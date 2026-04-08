import { EmptyState } from '@/shared/ui/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title='Ruta no encontrada'
      description='La vista que intentas abrir no existe en esta base inicial.'
    />
  )
}

