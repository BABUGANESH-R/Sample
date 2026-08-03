import { useState, type FormEvent } from 'react'

interface TodoFormProps {
  onAdd: (text: string) => void
}

export function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onAdd(text)
    setText('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="todo-input">
        What needs doing?
      </label>
      <input
        id="todo-input"
        className="todo-input"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs doing?"
        autoComplete="off"
      />
      <button className="todo-add" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
