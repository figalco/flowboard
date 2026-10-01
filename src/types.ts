export type Priority = 'High' | 'Medium' | 'Low'

export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

export interface Column {
  id: string
  name: string
  position: number
}

export interface Card {
  id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  dueDate: string
  columnId: string
}

export type CardInput = Omit<Card, 'id'>

export interface Board {
  id: string
  name: string
  createdAt: string
  columns: Column[]
  cards: Card[]
}
