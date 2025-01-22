import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ExpenseChart } from '@/components/expenses/expense-chart'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseList } from '@/components/expenses/expense-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useExpenses } from '@/hooks/use-expenses'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/expense'

interface ChartDataItem {
  month: string
  total: number
}

export function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { expenses, isLoading, addExpense, editExpense, deleteExpense } =
    useExpenses()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  // Wrapper para converter tipos
  const handleEditExpenseWrapper = async (id: string, data: Expense) => {
    editExpense({
      id,
      values: {
        description: data.description,
        amount: String(data.amount),
        date: new Date(data.date),
        id: data.id,
      },
    })
  }

  // Baixar relatório
  function handleDownloadReport() {
    try {
      const csvContent = [
        ['Data', 'Descrição', 'Valor'],
        ...expenses.map((expense) => [
          format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR }),
          expense.description,
          expense.amount.toString(),
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `relatorio-gastos-${format(new Date(), 'MM-yyyy')}.csv`
      )
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: unknown) {
      toast({
        title: 'Erro ao baixar relatório',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  // Fazer logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      navigate('/auth')
    } catch (error: unknown) {
      toast({
        title: 'Erro ao sair',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  // Preparar dados para o gráfico
  const chartData = expenses.reduce((acc: ChartDataItem[], expense) => {
    const month = format(new Date(expense.date), 'MMMM/yyyy', { locale: ptBR })
    const existingMonth = acc.find((item) => item.month === month)

    if (existingMonth) {
      existingMonth.total += expense.amount
    } else {
      acc.push({ month, total: expense.amount })
    }

    return acc
  }, [])

  // Total de gastos do mês atual
  const totalExpenses = expenses.reduce((total, expense) => {
    const expenseDate = new Date(expense.date)
    const now = new Date()

    if (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    ) {
      return total + expense.amount
    }

    return total
  }, 0)

  return (
    <div className="container mx-auto p-4 sm:py-8">
      <div className="mb-8 space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Meus Gastos</h1>
          <p className="text-muted-foreground">
            Total em {format(new Date(), 'MMMM/yyyy', { locale: ptBR })}:{' '}
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalExpenses)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">Adicionar Gasto</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Gasto</DialogTitle>
              </DialogHeader>
              <ExpenseForm
                onSubmit={async (values) => {
                  addExpense(values)
                  setIsModalOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            className="w-full sm:w-auto"
            disabled={isLoading || expenses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            Sair
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {expenses.length > 0 ? (
              <>
                <ExpenseChart data={chartData} />
                <ExpenseList
                  expenses={expenses}
                  onEdit={handleEditExpenseWrapper}
                  onDelete={async (id) => deleteExpense(id)}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <p className="text-muted-foreground">
                  Você ainda não tem nenhum gasto registrado.
                </p>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button>Adicionar Primeiro Gasto</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Novo Gasto</DialogTitle>
                    </DialogHeader>
                    <ExpenseForm
                      onSubmit={async (values) => {
                        addExpense(values)
                        setIsModalOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
