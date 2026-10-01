import { useRef } from 'react'
import { useDialogA11y } from '../hooks/useDialogA11y'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogA11y(dialogRef, onClose)

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className="modal-title" style={{ marginBottom: 12 }}>{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button type="button" className="btn" autoFocus onClick={onClose}>Cancel</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
