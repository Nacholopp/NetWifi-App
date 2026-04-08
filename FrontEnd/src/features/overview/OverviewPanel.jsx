import { Card } from '@/shared/ui/Card'

const cards = [
  {
    title: 'Objetivo de producto',
    subtitle: 'Define aqui tu propuesta de valor',
    text: 'Sustituye este bloque por el resumen del objetivo principal de tu app.',
  },
  {
    title: 'Usuarios objetivo',
    subtitle: 'Perfiles y necesidades',
    text: 'Incluye los perfiles, contexto de uso y problemas que quieres resolver.',
  },
  {
    title: 'Primer MVP',
    subtitle: 'Alcance minimo inicial',
    text: 'Lista las funcionalidades imprescindibles para tu primera entrega.',
  },
]

export function OverviewPanel() {
  return (
    <section className='grid grid-3'>
      {cards.map((card) => (
        <Card key={card.title} title={card.title} subtitle={card.subtitle}>
          <p>{card.text}</p>
        </Card>
      ))}
    </section>
  )
}

