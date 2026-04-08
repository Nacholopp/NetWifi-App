export function Card({ title, subtitle, children }) {
  return (
    <article className='card'>
      <header className='card-header'>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div>{children}</div>
    </article>
  )
}

