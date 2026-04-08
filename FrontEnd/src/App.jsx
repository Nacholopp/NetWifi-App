import { useState } from 'react'
import './App.css'

function App() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargarUsuarios = async () => {
    setCargando(true)
    setError('')

    try {
      const respuesta = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3')
      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar los datos')
      }

      const data = await respuesta.json()
      setUsuarios(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <header className='site-header'>
        <h1>Mi app React</h1>
      </header>

      <main className='site-main'>
        <section className='card'>
          <h2>Ejemplo simple con fetch</h2>
          <p>Pulsa el boton para traer 3 usuarios desde una API publica.</p>
          <button onClick={cargarUsuarios} disabled={cargando}>
            {cargando ? 'Cargando...' : 'Cargar usuarios'}
          </button>

          {error ? <p className='status error'>{error}</p> : null}

          {usuarios.length > 0 ? (
            <ul className='user-list'>
              {usuarios.map((usuario) => (
                <li key={usuario.id}>
                  {usuario.name} - {usuario.email}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>

      <footer className='site-footer'>
        <small>Footer de ejemplo</small>
      </footer>
    </>
  )
}

export default App
