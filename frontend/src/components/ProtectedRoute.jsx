import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, requiredRole = null }) {
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null')
  const authToken = localStorage.getItem('authToken')

  if (!authToken || !authUser) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && authUser.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
