import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ExpenseFormValues } from '@/components/expenses/expense-form'
import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types/expense'

import { useToast } from './use-toast'

export function useExpenses() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não encontrado')

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error

      return data || []
    },
  })

  const addExpense = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não encontrado')

      const amount = Number(values.amount)

      const { data, error } = await supabase.from('expenses').insert({
        description: values.description,
        amount,
        date: values.date.toISOString(),
        user_id: user.id,
      })

      if (error) throw error

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast({
        title: 'Sucesso!',
        description: 'Gasto adicionado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar gasto',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    },
  })

  const editExpense = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: ExpenseFormValues
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não encontrado')

      const amount = Number(values.amount)

      const { data, error } = await supabase
        .from('expenses')
        .update({
          description: values.description,
          amount,
          date: values.date.toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      return data
    },
    onMutate: async ({ id, values }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['expenses'] })

      // Snapshot do valor anterior
      const previousExpenses = queryClient.getQueryData(['expenses'])

      // Atualizar otimisticamente
      queryClient.setQueryData(['expenses'], (old: Expense[]) => {
        return old.map((expense) => {
          if (expense.id === id) {
            return {
              ...expense,
              description: values.description,
              amount: Number(values.amount),
              date: values.date.toISOString(),
            }
          }
          return expense
        })
      })

      return { previousExpenses }
    },
    onError: (error, variables, context) => {
      // Reverter para o valor anterior em caso de erro
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses)
      }
      toast({
        title: 'Erro ao atualizar gasto',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast({
        title: 'Sucesso!',
        description: 'Gasto atualizado com sucesso.',
      })
    },
  })

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não encontrado')

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast({
        title: 'Sucesso!',
        description: 'Gasto excluído com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir gasto',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    },
  })

  return {
    expenses,
    isLoading,
    addExpense: addExpense.mutate,
    editExpense: editExpense.mutate,
    deleteExpense: deleteExpense.mutate,
  }
}
