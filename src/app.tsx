import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './contexts/auth-context'
import { AuthPage } from './pages/auth'
import { HomePage } from './pages/home'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Meus Gastos - Controle suas finanças</title>
        <meta
          name="description"
          content="Aplicativo para controle de gastos pessoais"
        />
        <meta
          name="keywords"
          content="finanças, gastos, controle financeiro, orçamento"
        />
        <meta
          property="og:title"
          content="Meus Gastos - Controle suas finanças"
        />
        <meta
          property="og:description"
          content="Aplicativo para controle de gastos pessoais"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
      </Routes>
    </HelmetProvider>
  )
}

export default App
