import { useState } from 'react'
import '../styles/boards.css'
import plusWhite from '../assets/icons/plus-white.svg'
import CreateBoardModal from './CreateBoardModal'
import ConfirmDialog from './ConfirmDialog'
import type { Board } from '../types'

interface BoardsPageProps {
  boards: Board[]
  onOpen: (boardId: string) => void
  onCreate: (name: string) => Promise<string | null>
  onRename: (boardId: string, name: string) => void | Promise<void>
  onDelete: (boardId: string) => void | Promise<void>
}

export default function BoardsPage({ boards, onOpen, onCreate, onRename, onDelete }: BoardsPageProps) {
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Board | null>(null)
  const [deleting, setDeleting] = useState<Board | null>(null)

  return (
    <main className="boards-page">
      <div className="boards-header">
        <h1 className="boards-title">My Boards</h1>
        <button type="button" className="btn btn-accent" onClick={() => setCreating(true)}>
          <img src={plusWhite} alt="" width={18} height={18} />
          New Board
        </button>
      </div>
      {boards.length === 0 ? (
        <p className="empty-note">No boards yet. Create your first one.</p>
      ) : (
        <div className="boards-grid">
          {boards.map((b) => (
            <div key={b.id} className="board-tile">
              <button type="button" className="board-tile-open" onClick={() => onOpen(b.id)}>
                <span className="board-tile-name">{b.name}</span>
                <span className="board-tile-date">
                  {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </button>
              <div className="board-tile-actions">
                <button type="button" onClick={() => setRenaming(b)}>Rename</button>
                <span className="dot">·</span>
                <button type="button" className="danger" onClick={() => setDeleting(b)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {creating && (
        <CreateBoardModal
          onClose={() => setCreating(false)}
          onCreate={async (name) => {
            const id = await onCreate(name)
            setCreating(false)
            if (id) onOpen(id)
          }}
        />
      )}
      {renaming && (
        <CreateBoardModal
          heading="Rename board"
          submitLabel="Save"
          initialName={renaming.name}
          onClose={() => setRenaming(null)}
          onCreate={async (name) => {
            await onRename(renaming.id, name)
            setRenaming(null)
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete board"
          message={`Delete "${deleting.name}" and all of its cards? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await onDelete(deleting.id)
            setDeleting(null)
          }}
        />
      )}
    </main>
  )
}
