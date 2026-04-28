import { useEffect, useState } from 'react'
import { getCurrentWifiSignal } from '../api/getCurrentWifiSignal'

export function useWifiSignalTest() {
  const [running, setRunning] = useState(true)
  const [wifiSignal, setWifiSignal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!running) return undefined

    async function readSignal() {
      try {
        const data = await getCurrentWifiSignal()
        setWifiSignal(data)
        setError('')
      } catch (readError) {
        setError(readError.message)
      }
    }

    readSignal()
    const intervalId = window.setInterval(readSignal, 2000)

    return () => window.clearInterval(intervalId)
  }, [running])

  function toggleRunning() {
    setRunning((previousValue) => !previousValue)
  }

  return {
    running,
    wifiSignal,
    error,
    toggleRunning,
  }
}
