import { Card } from '@/shared/ui/Card'

const metrics = [
  { label: 'Pantallas definidas', value: '03' },
  { label: 'Componentes reutilizables', value: '05' },
  { label: 'Features estructuradas', value: '03' },
]

export function MetricsPanel() {
  return (
    <section className='grid grid-3'>
      {metrics.map((metric) => (
        <Card key={metric.label} title={metric.value} subtitle={metric.label}>
          <p>Dato provisional para ayudarte a modelar tu dashboard.</p>
        </Card>
      ))}
    </section>
  )
}

