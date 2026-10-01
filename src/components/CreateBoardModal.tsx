import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useDialogA11y } from '../hooks/useDialogA11y'

interface CreateBoardModalProps {
  heading?: string
  fieldLabel?: string
  placeholder?: string
  submitLabel?: string
  initialName?: string
  onCreate: (name: string) => void | Promise<void>
  onClose: () => void
}

export default function CreateBoardModal({
  heading = 'Create board',
  fieldLabel = 'Board name',
  placeholder = 'e.g. Product Roadmap',
  submitLabel = 'Create',
  initialName = '',
  onCreate,
  onClose,
}: CreateBoardModalProps) {
  const [name, setName] = useState(initialName)
  const dialogRef = useRef<HTMLFormElement>(null)
  useDialogA11y(dialogRef, onClose)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onCreate(trimmed)
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form ref={dialogRef} className="modal create-board-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={heading}>
        <h2 className="modal-title" style={{ marginBottom: 24 }}>{heading}</h2>
        <div className="form">
          <label className="field">
            <span className="field-label">{fieldLabel}</span>
            <input
              className="input"
              autoFocus
              onFocus={(e) => e.target.select()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{submitLabel}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
