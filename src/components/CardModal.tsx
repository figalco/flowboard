import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import closeIcon from '../assets/icons/close.svg'
import { useDialogA11y } from '../hooks/useDialogA11y'
import { PRIORITIES } from '../types'
import type { CardInput, Column, Priority } from '../types'

interface CardModalProps {
  initial: CardInput
  isEdit: boolean
  columns: Column[]
  onSave: (input: CardInput) => void
  onDelete: () => void
  onClose: () => void
}

export default function CardModal({ initial, isEdit, columns, onSave, onDelete, onClose }: CardModalProps) {
  const [form, setForm] = useState<CardInput>(initial)
  const dialogRef = useRef<HTMLFormElement>(null)
  useDialogA11y(dialogRef, onClose)

  const set = <K extends keyof CardInput>(key: K, value: CardInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return
    onSave({ ...form, title, assignee: form.assignee.trim() })
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form ref={dialogRef} className="modal card-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Card">
        <div className="modal-header">
          <h2 className="modal-title">Card</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <img src={closeIcon} alt="" width={20} height={20} />
          </button>
        </div>
        <div className="form">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              autoFocus
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter card name..."
            />
          </label>
          <label className="field">
            <span className="field-label small">Description</span>
            <textarea
              className="input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add a description..."
            />
          </label>
          <label className="field">
            <span className="field-label small">Assignee</span>
            <input
              className="input"
              value={form.assignee}
              onChange={(e) => set('assignee', e.target.value)}
              placeholder="Who is responsible?"
            />
          </label>
          <label className="field">
            <span className="field-label small">Column</span>
            <select
              className="input"
              value={form.columnId}
              onChange={(e) => set('columnId', e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label className="field">
              <span className="field-label small">Priority</span>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label small">Due Date</span>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </label>
          </div>
          <div className="modal-footer">
            {isEdit ? (
              <button type="button" className="link-danger" onClick={onDelete}>Delete card</button>
            ) : (
              <span />
            )}
            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
