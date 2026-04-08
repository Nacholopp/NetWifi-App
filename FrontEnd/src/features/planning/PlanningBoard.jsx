import { Card } from '@/shared/ui/Card'

const planningColumns = [
  {
    title: 'Pendiente',
    tasks: ['Definir componentes UI', 'Crear wireframes', 'Validar flujo principal'],
  },
  {
    title: 'En progreso',
    tasks: ['Diseño de pantallas clave', 'Sistema de estilos base'],
  },
  {
    title: 'Completado',
    tasks: ['Arquitectura frontend inicial'],
  },
]

export function PlanningBoard() {
  return (
    <section className='grid grid-3'>
      {planningColumns.map((column) => (
        <Card key={column.title} title={column.title}>
          <ul className='task-list'>
            {column.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </Card>
      ))}
    </section>
  )
}

