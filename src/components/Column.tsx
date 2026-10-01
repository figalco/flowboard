import { useState } from 'react'
import plusIcon from '../assets/icons/plus.svg'
import uploadIcon from '../assets/icons/upload.svg'
import Card from './Card'
import type { Card as CardType } from '../types'

interface ColumnProps {
  id: string
  label: string
  cards: CardType[]
  hasAnyCards: boolean
  draggingId: string | null
  canDelete: boolean
  onAdd: (columnId: string) => void
  onOpenCard: (card: CardType) => void
  onRenameTitle: (cardId: string, title: string) => void
  onDragStart: (cardId: string) => void
  onDragEnd: () => void
  onDropCard: (cardId: string, columnId: string) => void
  onDelete: (columnId: string) => void
}

export default function Column({
  id, label, cards, hasAnyCards, draggingId, canDelete,
  onAdd, onOpenCard, onRenameTitle, onDragStart, onDragEnd, onDropCard, onDelete,
}: ColumnProps) {
  const [over, setOver] = useState(false)
  const doneColumn = label.trim().toLowerCase() === 'done'

  return (
    <section
      className={`column${over ? ' drag-over' : ''}`}
      aria-label={label}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const cardId = e.dataTransfer.getData('text/plain')
        if (cardId) onDropCard(cardId, id)
      }}
    >
      <div className="column-header">
        <h2 className="column-title">{label}</h2>
        <div className="column-header-actions">
          <span className="column-count">{cards.length}</span>
          {canDelete && (
            <button
              type="button"
              className="column-delete"
              aria-label={`Delete ${label} column`}
              onClick={() => onDelete(id)}
            >
              ×
            </button>
          )}
        </div>
      </div>
      {cards.length === 0 ? (
        <div className="column-empty">
          {hasAnyCards ? (
            <span>No matching cards</span>
          ) : (
            <>
              <img src={uploadIcon} alt="" width={24} height={24} />
              <span>Drop a card here or add one below</span>
            </>
          )}
        </div>
      ) : (
        <div className="column-cards">
          {cards.map((c) => (
            <Card
              key={c.id}
              card={c}
              dragging={draggingId === c.id}
              doneColumn={doneColumn}
              onOpen={onOpenCard}
              onRenameTitle={onRenameTitle}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
      <button type="button" className="add-card" onClick={() => onAdd(id)}>
        <img src={plusIcon} alt="" width={16} height={16} />
        Add card
      </button>
    </section>
  )
}
