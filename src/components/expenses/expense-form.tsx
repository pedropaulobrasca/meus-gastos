import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { z } from 'zod'

import type { Expense } from '@/types/expense'

import { Button } from '../ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'

const formSchema = z.object({
  id: z.string().optional(),
  description: z
    .string()
    .min(3, 'A descrição deve ter no mínimo 3 caracteres')
    .max(100, 'A descrição deve ter no máximo 100 caracteres'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{0,2})?$/, 'O valor deve ter no máximo 2 casas decimais')
    .refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
      message: 'O valor deve ser maior que zero',
    }),
  date: z.date(),
})

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
}

export type ExpenseFormValues = z.infer<typeof formSchema>

export function ExpenseForm({ expense, onSubmit }: ExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: expense
      ? {
          id: expense.id,
          description: expense.description,
          amount: String(expense.amount),
          date: new Date(expense.date),
        }
      : {
          description: '',
          amount: '',
          date: new Date(),
        },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Conta de luz"
                  maxLength={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <NumericFormat
                  customInput={Input}
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.value)
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator="."
                  thousandSeparator=","
                  prefix="R$ "
                  placeholder="Digite o valor"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={
                    field.value
                      ? new Date(field.value).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {expense ? 'Salvar' : 'Adicionar'}
        </Button>
      </form>
    </Form>
  )
}
