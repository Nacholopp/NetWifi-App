import { useEffect, useState } from 'react'

const normalizeRoute = (hash, fallback) => {
  const cleanHash = hash.replace(/^#/, '')
  if (!cleanHash || cleanHash === '/') {
    return fallback
  }
  return cleanHash.startsWith('/') ? cleanHash : `/${cleanHash}`
}

export function useHashRoute(fallbackRoute) {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.hash, fallbackRoute))

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(normalizeRoute(window.location.hash, fallbackRoute))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [fallbackRoute])

  const navigate = (nextRoute) => {
    if (nextRoute === route) {
      return
    }
    window.location.hash = nextRoute
  }

  return { route, navigate }
}

