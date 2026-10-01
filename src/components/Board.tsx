import { useMemo, useState } from 'react'
import '../styles/board.css'
import Column from './Column'
import CardModal from './CardModal'
import CreateBoardModal from './CreateBoardModal'
import ConfirmDialog from './ConfirmDialog'
import plusIcon from '../assets/icons/plus.svg'
import type { Board as BoardType, Card, CardInput, Column as ColumnType } from '../types'

interface BoardProps {
  board: BoardType
  onBack: () => void
  onAddCard: (input: CardInput) => void
  onUpdateCard: (cardId: string, input: CardInput) => void
  onDeleteCard: (cardId: string) => void
  onMoveCard: (cardId: string, columnId: string) => void
  onAddColumn: (name: string) => void
  onDeleteColumn: (columnId: string) => void
}

type ModalState = { mode: 'add'; columnId: string } | { mode: 'edit'; card: Card } | null

const blankCard = (columnId: string): CardInput => ({
  title: '',
  description: '',
  assignee: '',
  priority: 'Medium',
  dueDate: '',
  columnId,
})

function matchesQuery(card: Card, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    card.title.toLowerCase().includes(q) ||
    card.description.toLowerCase().includes(q) ||
    card.assignee.toLowerCase().includes(q)
  )
}

export default function Board({
  board, onBack, onAddCard, onUpdateCard, onDeleteCard, onMoveCard, onAddColumn, onDeleteColumn,
}: BoardProps) {
  const [modal, setModal] = useState<ModalState>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [deletingColumn, setDeletingColumn] = useState<ColumnType | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [query, setQuery] = useState('')

  const close = () => setModal(null)
  const trimmedQuery = query.trim().toLowerCase()

  const handleRenameTitle = (cardId: string, title: string) => {
    const card = board.cards.find((c) => c.id === cardId)
    if (!card) return
    const { id: _id, ...input } = card
    onUpdateCard(cardId, { ...input, title })
  }

  const deletingColumnCardCount = useMemo(
    () => (deletingColumn ? board.cards.filter((c) => c.columnId === deletingColumn.id).length : 0),
    [deletingColumn, board.cards],
  )

  return (
    <>
      <main className="board-view">
      <div className="subheader">
        <button type="button" className="crumb" onClick={onBack}>Boards</button>
        <span className="crumb-sep">/</span>
        <h1 className="board-name">{board.name}</h1>
        <span className="board-meta">{board.columns.length} columns</span>
        <div className="board-search">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards..."
            aria-label="Search cards"
          />
          {query && (
            <button type="button" className="clear" aria-label="Clear search" onClick={() => setQuery('')}>
              ×
            </button>
          )}
        </div>
      </div>
      <div className="board-columns">
        {board.columns.map((col) => {
          const columnCards = board.cards.filter((c) => c.columnId === col.id)
          return (
            <Column
              key={col.id}
              id={col.id}
              label={col.name}
              cards={columnCards.filter((c) => matchesQuery(c, trimmedQuery))}
              hasAnyCards={columnCards.length > 0}
              draggingId={draggingId}
              canDelete={board.columns.length > 1}
              onAdd={(columnId) => setModal({ mode: 'add', columnId })}
              onOpenCard={(card) => setModal({ mode: 'edit', card })}
              onRenameTitle={handleRenameTitle}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
              onDropCard={(cardId, columnId) => {
                setDraggingId(null)
                onMoveCard(cardId, columnId)
              }}
              onDelete={(columnId) => {
                const target = board.columns.find((c) => c.id === columnId)
                if (target) setDeletingColumn(target)
              }}
            />
          )
        })}
        <button type="button" className="add-column" onClick={() => setAddingColumn(true)}>
          <img src={plusIcon} alt="" width={16} height={16} />
          Add column
        </button>
      </div>
      </main>
      {modal && (
        <CardModal
          key={modal.mode === 'edit' ? modal.card.id : 'new'}
          isEdit={modal.mode === 'edit'}
          columns={board.columns}
          initial={modal.mode === 'edit' ? modal.card : blankCard(modal.columnId)}
          onClose={close}
          onSave={(input) => {
            if (modal.mode === 'edit') onUpdateCard(modal.card.id, input)
            else onAddCard(input)
            close()
          }}
          onDelete={() => {
            if (modal.mode === 'edit') setDeletingCard(modal.card)
            close()
          }}
        />
      )}
      {deletingCard && (
        <ConfirmDialog
          title="Delete card"
          message={`Delete "${deletingCard.title}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeletingCard(null)}
          onConfirm={() => {
            onDeleteCard(deletingCard.id)
            setDeletingCard(null)
          }}
        />
      )}
      {addingColumn && (
        <CreateBoardModal
          heading="Add column"
          fieldLabel="Column name"
          placeholder="e.g. Testing"
          submitLabel="Add"
          onClose={() => setAddingColumn(false)}
          onCreate={(name) => {
            onAddColumn(name)
            setAddingColumn(false)
          }}
        />
      )}
      {deletingColumn && (
        <ConfirmDialog
          title="Delete column"
          message={
            deletingColumnCardCount > 0
              ? `Delete "${deletingColumn.name}"? ${deletingColumnCardCount} card(s) in it will be deleted too.`
              : `Delete the empty column "${deletingColumn.name}"?`
          }
          confirmLabel="Delete"
          danger
          onClose={() => setDeletingColumn(null)}
          onConfirm={() => {
            onDeleteColumn(deletingColumn.id)
            setDeletingColumn(null)
          }}
        />
      )}
    </>
  )
}
