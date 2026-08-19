import { useEffect, useRef, useState } from 'react'

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  function startEditing() {
    setDraft(todo.text)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraft(todo.text)
    setIsEditing(false)
  }

  function saveEditing() {
    const next = draft.trim()
    if (!next) {
      cancelEditing()
      return
    }
    onUpdate(todo.id, next)
    setIsEditing(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveEditing()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  return (
    <li className={`todo-item${todo.completed ? ' is-complete' : ''}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'active' : 'complete'}`}
        />
        <span className="check-mark" aria-hidden="true" />
      </label>

      {isEditing ? (
        <input
          ref={inputRef}
          className="edit-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={saveEditing}
          onKeyDown={handleKeyDown}
          aria-label="Edit task"
        />
      ) : (
        <button
          type="button"
          className="todo-text"
          onDoubleClick={startEditing}
          title="Double-click to edit"
        >
          {todo.text}
        </button>
      )}

      <div className="item-actions">
        {!isEditing && (
          <button type="button" className="icon-button" onClick={startEditing}>
            Edit
          </button>
        )}
        <button
          type="button"
          className="icon-button danger"
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
