import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Board, Card, CardInput, Column, Priority } from '../types'

const DEFAULT_COLUMN_NAMES = ['Backlog', 'In Progress', 'In Review', 'Done']

interface CardRow {
  id: string
  board_id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  due_date: string | null
  column_id: string
}

interface BoardRow {
  id: string
  name: string
  created_at: string
  columns: Column[]
  cards: CardRow[]
}

const toCard = (r: CardRow): Card => ({
  id: r.id,
  title: r.title,
  description: r.description,
  assignee: r.assignee,
  priority: r.priority,
  dueDate: r.due_date ?? '',
  columnId: r.column_id,
})

const toRow = (input: CardInput) => ({
  title: input.title,
  description: input.description,
  assignee: input.assignee,
  priority: input.priority,
  due_date: input.dueDate || null,
  column_id: input.columnId,
})

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Never show raw backend/Postgres error text to the user (it can include table, column, or
  // policy names) — log the real error for debugging and surface a short, friendly message.
  const fail = (friendly: string, err: { message: string }) => {
    console.error(err.message)
    setError(friendly)
  }

  const patchBoard = (boardId: string, fn: (board: Board) => Board) =>
    setBoards((prev) => prev.map((b) => (b.id === boardId ? fn(b) : b)))

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('boards')
      .select(
        'id, name, created_at, ' +
          'columns(id, name, position), ' +
          'cards(id, board_id, title, description, assignee, priority, due_date, column_id, created_at)',
      )
      .order('created_at', { ascending: true })
      .order('position', { ascending: true, referencedTable: 'columns' })
      .order('created_at', { ascending: true, referencedTable: 'cards' })
    if (err) fail("Couldn't load your boards. Please refresh the page.", err)
    else
      setBoards(
        (data as unknown as BoardRow[]).map((b) => ({
          id: b.id,
          name: b.name,
          createdAt: b.created_at,
          columns: b.columns,
          cards: b.cards.map(toCard),
        })),
      )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createBoard = async (name: string): Promise<string | null> => {
    const { data, error: err } = await supabase.from('boards').insert({ name }).select('id, name, created_at').single()
    if (err) {
      fail("Couldn't create the board. Please try again.", err)
      return null
    }
    const { data: cols, error: colErr } = await supabase
      .from('columns')
      .insert(DEFAULT_COLUMN_NAMES.map((colName, position) => ({ board_id: data.id, name: colName, position })))
      .select('id, name, position')
    if (colErr) fail("Board created, but its columns couldn't be set up. Please try again.", colErr)
    setBoards((prev) => [
      ...prev,
      { id: data.id, name: data.name, createdAt: data.created_at, columns: cols ?? [], cards: [] },
    ])
    return data.id
  }

  const renameBoard = async (boardId: string, name: string) => {
    const { error: err } = await supabase.from('boards').update({ name }).eq('id', boardId)
    if (err) return fail("Couldn't rename the board. Please try again.", err)
    patchBoard(boardId, (b) => ({ ...b, name }))
  }

  const deleteBoard = async (boardId: string) => {
    // Remove immediately; restore from the server if the delete fails.
    setBoards((prev) => prev.filter((b) => b.id !== boardId))
    const { error: err } = await supabase.from('boards').delete().eq('id', boardId)
    if (err) {
      fail("Couldn't delete the board. Please try again.", err)
      void load()
    }
  }

  const addColumn = async (boardId: string, name: string) => {
    const board = boards.find((b) => b.id === boardId)
    const position = board ? board.columns.length : 0
    const { data, error: err } = await supabase
      .from('columns')
      .insert({ board_id: boardId, name, position })
      .select('id, name, position')
      .single()
    if (err) return fail("Couldn't add the column. Please try again.", err)
    patchBoard(boardId, (b) => ({ ...b, columns: [...b.columns, data as Column] }))
  }

  const deleteColumn = async (boardId: string, columnId: string) => {
    // Remove immediately (and any cards in it); restore from the server if the delete fails.
    patchBoard(boardId, (b) => ({
      ...b,
      columns: b.columns.filter((c) => c.id !== columnId),
      cards: b.cards.filter((c) => c.columnId !== columnId),
    }))
    const { error: err } = await supabase.from('columns').delete().eq('id', columnId)
    if (err) {
      fail("Couldn't delete the column. Please try again.", err)
      void load()
    }
  }

  const addCard = async (boardId: string, input: CardInput) => {
    const { data, error: err } = await supabase
      .from('cards')
      .insert({ ...toRow(input), board_id: boardId })
      .select('id, board_id, title, description, assignee, priority, due_date, column_id')
      .single()
    if (err) return fail("Couldn't add the card. Please try again.", err)
    patchBoard(boardId, (b) => ({ ...b, cards: [...b.cards, toCard(data as CardRow)] }))
  }

  const updateCard = async (boardId: string, cardId: string, input: CardInput) => {
    const { error: err } = await supabase.from('cards').update(toRow(input)).eq('id', cardId)
    if (err) return fail("Couldn't save the card. Please try again.", err)
    patchBoard(boardId, (b) => ({
      ...b,
      cards: b.cards.map((c) => (c.id === cardId ? { ...input, id: cardId } : c)),
    }))
  }

  const deleteCard = async (boardId: string, cardId: string) => {
    // Remove immediately; restore from the server if the delete fails.
    patchBoard(boardId, (b) => ({ ...b, cards: b.cards.filter((c) => c.id !== cardId) }))
    const { error: err } = await supabase.from('cards').delete().eq('id', cardId)
    if (err) {
      fail("Couldn't delete the card. Please try again.", err)
      void load()
    }
  }

  const moveCard = async (boardId: string, cardId: string, columnId: string) => {
    // Optimistic so dragging feels instant; reload on failure.
    patchBoard(boardId, (b) => ({
      ...b,
      cards: b.cards.map((c) => (c.id === cardId ? { ...c, columnId } : c)),
    }))
    const { error: err } = await supabase.from('cards').update({ column_id: columnId }).eq('id', cardId)
    if (err) {
      fail("Couldn't move the card. Please try again.", err)
      void load()
    }
  }

  return {
    boards, loading, error, clearError: () => setError(null),
    createBoard, renameBoard, deleteBoard, addColumn, deleteColumn,
    addCard, updateCard, deleteCard, moveCard,
  }
}
