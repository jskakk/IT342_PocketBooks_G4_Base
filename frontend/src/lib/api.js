const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export const apiUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}