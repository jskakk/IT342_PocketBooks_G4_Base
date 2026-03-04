import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [navigate, user])

  if (!user) {
    return null
  }

  return <div>This is the dashboard. WIP</div>
}

export default Dashboard
