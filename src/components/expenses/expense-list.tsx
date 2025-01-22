import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
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

const SwipeableRow = ({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense
  onEdit: (id: string, data: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) => {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const x = useMotionValue(0)

  // Transformar o valor X em porcentagem para os indicadores
  const progress = useTransform(x, [-100, 0, 100], [-1, 0, 1])

  // Cores baseadas na direção do arraste
  const bgColor = useTransform(
    progress,
    [-1, 0, 1],
    [
      'rgb(239 68 68 / 0.2)', // vermelho com transparência
      'rgb(255 255 255)', // branco
      'rgb(59 130 246 / 0.2)', // azul com transparência
    ]
  )

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -50) {
      setShowDeleteDialog(true)
    } else if (info.offset.x > 50) {
      setEditingExpenseId(expense.id)
    }
  }

  return (
    <>
      <div className="group relative">
        {/* Indicadores de ação nas bordas */}
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500/20 transition-all duration-200 group-hover:w-1.5" />
        <div className="absolute inset-y-0 right-0 w-1 bg-red-500/20 transition-all duration-200 group-hover:w-1.5" />

        {/* Container de fundo para os indicadores */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div className="flex items-center justify-center text-blue-500">
            <div className="flex flex-col items-center gap-1">
              <Edit className="h-6 w-6" />
              <span className="text-xs font-medium">Editar</span>
            </div>
          </div>
          <div className="flex items-center justify-center text-red-500">
            <div className="flex flex-col items-center gap-1">
              <Trash2 className="h-6 w-6" />
              <span className="text-xs font-medium">Excluir</span>
            </div>
          </div>
        </div>

        {/* Item arrastável */}
        <motion.div
          className="relative cursor-grab touch-pan-x bg-background active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ background: bgColor }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <span className="whitespace-nowrap">
                {format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              <span className="max-w-[200px] truncate">
                {expense.description}
              </span>
            </div>
            <span className="whitespace-nowrap">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(expense.amount)}
            </span>
          </div>
        </motion.div>

        {/* Dica visual para usuários novos */}
        <div className="absolute inset-x-0 -bottom-1 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-full border bg-background px-2 text-xs text-muted-foreground">
            Arraste para editar ou excluir
          </span>
        </div>
      </div>

      <Dialog
        open={editingExpenseId === expense.id}
        onOpenChange={(open) => setEditingExpenseId(open ? expense.id : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={expense}
            onSubmit={async (data) => {
              await onEdit(expense.id, {
                ...expense,
                description: data.description,
                amount: Number(data.amount),
                date: data.date.toISOString(),
              })
              setEditingExpenseId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={() => {
                onDelete(expense.id)
                setShowDeleteDialog(false)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="hidden md:block">
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
                  {format(new Date(expense.date), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Gasto</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm
                          expense={expense}
                          onSubmit={async (data) => {
                            await onEdit(expense.id, {
                              ...expense,
                              description: data.description,
                              amount: Number(data.amount),
                              date: data.date.toISOString(),
                            })
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Tem certeza que deseja excluir?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(
                              buttonVariants({ variant: 'destructive' })
                            )}
                            onClick={() => onDelete(expense.id)}
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

      <div className="flex flex-col divide-y md:hidden">
        {expenses.map((expense) => (
          <SwipeableRow
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
