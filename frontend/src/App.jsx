import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './features/auth/pages/AuthPage'
import AddExpense from './features/expenses/pages/AddExpense'
import Dashboard from './features/dashboard/pages/Dashboard'
import Wallet from './features/wallet/pages/Wallet'
import Analytics from './features/dashboard/pages/Analytics'
import Settings from './features/dashboard/pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './features/admin/pages/AdminDashboard'
import AdminUsers from './features/admin/pages/AdminUsers'
import AdminExpenses from './features/admin/pages/AdminExpenses'
import AdminCategories from './features/admin/pages/AdminCategories'
import AdminSettings from './features/admin/pages/AdminSettings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/expenses/new" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/expenses" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminExpenses /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ROLE_ADMIN"><AdminSettings /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
