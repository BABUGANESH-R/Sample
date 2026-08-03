import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commitEdit() {
    onEdit(todo.id, draft)
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(todo.text)
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') commitEdit()
    if (event.key === 'Escape') cancelEdit()
  }

  return (
    <li className={`todo-item${todo.completed ? ' is-completed' : ''}`}>
      <button
        type="button"
        className="todo-check"
        aria-label={todo.completed ? 'Mark as active' : 'Mark as done'}
        aria-pressed={todo.completed}
        onClick={() => onToggle(todo.id)}
      >
        <span className="todo-check-mark" aria-hidden="true" />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="todo-edit"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className="todo-text"
          onDoubleClick={() => setEditing(true)}
          onClick={() => setEditing(true)}
        >
          {todo.text}
        </button>
      )}

      <button
        type="button"
        className="todo-delete"
        aria-label={`Delete ${todo.text}`}
        onClick={() => onDelete(todo.id)}
      >
        ×
      </button>
    </li>
  )
}
