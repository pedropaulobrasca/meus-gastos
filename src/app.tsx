import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthPage } from './pages/auth'
import { HomePage } from './pages/home'

const isAuthenticated = false // Temporário, depois vamos implementar a autenticação real

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  )
}

export default App
