import { useState } from 'react'
import Navbar from './components/Navbar'
import BoardsPage from './components/BoardsPage'
import Board from './components/Board'
import LoginPage from './components/LoginPage'
import { useBoards } from './hooks/useBoards'
import { useSession } from './hooks/useSession'
import { supabase } from './lib/supabase'

function Workspace({ email }: { email: string }) {
  const {
    boards, loading, error, clearError,
    createBoard, renameBoard, deleteBoard, addColumn, deleteColumn,
    addCard, updateCard, deleteCard, moveCard,
  } = useBoards()
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = boards.find((b) => b.id === activeId)

  return (
    <>
      <Navbar email={email} onHome={() => setActiveId(null)} onSignOut={() => supabase.auth.signOut()} />
      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      )}
      {loading ? (
        <p className="center-note">Loading your boards…</p>
      ) : active ? (
        <Board
          board={active}
          onBack={() => setActiveId(null)}
          onAddCard={(input) => addCard(active.id, input)}
          onUpdateCard={(cardId, input) => updateCard(active.id, cardId, input)}
          onDeleteCard={(cardId) => deleteCard(active.id, cardId)}
          onMoveCard={(cardId, columnId) => moveCard(active.id, cardId, columnId)}
          onAddColumn={(name) => addColumn(active.id, name)}
          onDeleteColumn={(columnId) => deleteColumn(active.id, columnId)}
        />
      ) : (
        <BoardsPage
          boards={boards}
          onOpen={setActiveId}
          onCreate={createBoard}
          onRename={renameBoard}
          onDelete={deleteBoard}
        />
      )}
    </>
  )
}

export default function App() {
  const { session, loading } = useSession()
  if (loading) return <p className="center-note">Loading…</p>
  if (!session) return <LoginPage />
  // Keyed by user so switching accounts never shows the previous user's boards.
  return <Workspace key={session.user.id} email={session.user.email ?? ''} />
}
