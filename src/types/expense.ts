export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  user_id: string
  category_id?: string
  category?: {
    id: string
    name: string
  }
}
