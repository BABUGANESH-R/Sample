import { useState } from 'react'

export default function TodoForm({ onAdd }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onAdd(text)
    setText('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">
        Add a task
      </label>
      <input
        id="new-todo"
        className="todo-input"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs doing?"
        autoComplete="off"
        maxLength={180}
      />
      <button className="add-button" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
