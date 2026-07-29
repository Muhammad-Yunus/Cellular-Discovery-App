export function useApp() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const appName = config.public.appName as string
  const defaultLat = parseFloat(config.public.defaultLat as string)
  const defaultLon = parseFloat(config.public.defaultLon as string)

  return {
    apiBase,
    appName,
    defaultLat,
    defaultLon
  }
}
