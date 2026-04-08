export function AppShell({ currentRoute, navigationItems, onNavigate, children }) {
  return (
    <div className='app-shell'>
      <header className='app-header'>
        <div>
          <p className='app-kicker'>TFG Frontend</p>
          <h1>Base de interfaz</h1>
        </div>
        <p className='app-description'>
          Estructura inicial para que puedas diseñar y conectar funcionalidades sin depender de la plantilla de Vite.
        </p>
      </header>

      <nav className='app-nav' aria-label='Secciones principales'>
        {navigationItems.map((item) => {
          const isActive = item.route === currentRoute
          return (
            <button
              key={item.route}
              type='button'
              className={isActive ? 'nav-item nav-item-active' : 'nav-item'}
              onClick={() => onNavigate(item.route)}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <main className='app-main'>{children}</main>
    </div>
  )
}

