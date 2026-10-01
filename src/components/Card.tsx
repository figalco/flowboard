import { useEffect, useRef, useState } from 'react'
import type { Card as CardType } from '../types'

interface CardProps {
  card: CardType
  dragging: boolean
  doneColumn: boolean
  onOpen: (card: CardType) => void
  onRenameTitle: (cardId: string, title: string) => void
  onDragStart: (cardId: string) => void
  onDragEnd: () => void
}

function parseDueDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDue(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(card: CardType, doneColumn: boolean): boolean {
  if (!card.dueDate || doneColumn) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parseDueDate(card.dueDate) < today
}

export default function Card({ card, dragging, doneColumn, onOpen, onRenameTitle, onDragStart, onDragEnd }: CardProps) {
  const overdue = isOverdue(card, doneColumn)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(card.title)
  }, [card.title, editing])

  const commit = () => {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== card.title) onRenameTitle(card.id, trimmed)
    else setDraft(card.title)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`card${dragging ? ' dragging' : ''}${overdue ? ' card-overdue' : ''}`}
      draggable={!editing}
      onClick={() => {
        if (!editing) onOpen(card)
      }}
      onKeyDown={(e) => {
        if (editing) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(card)
        }
      }}
      onDragStart={(e) => {
        if (editing) {
          e.preventDefault()
          return
        }
        e.dataTransfer.setData('text/plain', card.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(card.id)
      }}
      onDragEnd={onDragEnd}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="card-title-input"
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              setDraft(card.title)
              setEditing(false)
            }
          }}
        />
      ) : (
        <span
          className="card-title"
          title="Click to rename"
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
        >
          {card.title}
        </span>
      )}
      <span className="card-meta">
        <span className={`badge badge-${card.priority}`}>{card.priority}</span>
        {card.assignee && <span>{card.assignee}</span>}
        {card.dueDate && (
          <span className={overdue ? 'due-overdue' : undefined}>
            {overdue ? 'Overdue ' : 'Due '}
            {formatDue(parseDueDate(card.dueDate))}
          </span>
        )}
      </span>
    </div>
  )
}
