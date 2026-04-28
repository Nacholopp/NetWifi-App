export async function getCurrentWifiSignal() {
  if (!window.desktopAPI?.wifi?.getCurrent) {
    throw new Error('La medicion WiFi solo esta disponible dentro de Electron.')
  }

  const data = await window.desktopAPI.wifi.getCurrent()

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
