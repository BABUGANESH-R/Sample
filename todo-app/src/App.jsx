import TodoFilters from './components/TodoFilters.jsx'
import TodoForm from './components/TodoForm.jsx'
import TodoItem from './components/TodoItem.jsx'
import { useTodos } from './hooks/useTodos.js'
import './App.css'

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export default function App() {
  const {
    todos,
    visibleTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    activeCount,
    completedCount,
  } = useTodos()

  const emptyCopy = {
    all: 'Nothing on the list yet. Add a task above.',
    active: 'Every task is done. Nice work.',
    completed: 'No completed tasks yet.',
  }[filter]

  return (
    <div className="page">
      <header className="masthead">
        <p className="date">{formatToday()}</p>
        <h1>Today</h1>
        <p className="lede">
          Capture what you need to do. Tasks stay in this browser until you
          clear them.
        </p>
      </header>

      <main className="card">
        <TodoForm onAdd={addTodo} />

        {visibleTodos.length === 0 ? (
          <p className="empty">{emptyCopy}</p>
        ) : (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onUpdate={updateTodo}
                onDelete={deleteTodo}
              />
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <TodoFilters
            filter={filter}
            onFilterChange={setFilter}
            activeCount={activeCount}
            completedCount={completedCount}
            onClearCompleted={clearCompleted}
          />
        )}
      </main>
    </div>
  )
}
