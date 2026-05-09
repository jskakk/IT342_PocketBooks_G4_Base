import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './features/auth/pages/AuthPage'
import AddExpense from './features/expenses/pages/AddExpense'
import Dashboard from './features/dashboard/pages/Dashboard'
import Wallet from './features/wallet/pages/Wallet'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/expenses/new" element={<AddExpense />} />
      <Route path="/wallet" element={<Wallet />} />
    </Routes>
  )
}

export default App
