import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { Expense } from '@/types/expense'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Button, buttonVariants } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { ExpenseForm } from './expense-form'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (id: string, data: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Data</TableHead>
            <TableHead className="whitespace-nowrap">Descrição</TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Valor
            </TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {expense.description}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(expense.amount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Dialog
                    open={editingExpenseId === expense.id}
                    onOpenChange={(open) =>
                      setEditingExpenseId(open ? expense.id : null)
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      asChild
                    >
                      <DialogTrigger>
                        <Edit className="h-4 w-4" />
                      </DialogTrigger>
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Gasto</DialogTitle>
                      </DialogHeader>
                      <ExpenseForm
                        expense={expense}
                        onSubmit={async (data) => {
                          await onEdit(expense.id, {
                            description: data.description,
                            amount: Number(data.amount),
                            date: data.date.toISOString(),
                            id: expense.id,
                            user_id: expense.user_id,
                          })
                          setEditingExpenseId(null)
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      title="Excluir"
                      asChild
                    >
                      <AlertDialogTrigger>
                        <Trash2 className="h-4 w-4" />
                      </AlertDialogTrigger>
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Gasto</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este gasto? Esta ação
                          não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(expense.id)}
                          className={cn(
                            buttonVariants({ variant: 'destructive' })
                          )}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
