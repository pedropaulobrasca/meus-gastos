import { Button } from '../components/ui/button'

export function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-4">
        <h1 className="text-center text-2xl font-bold">Login</h1>
        <Button className="w-full">Entrar</Button>
      </div>
    </div>
  )
}
