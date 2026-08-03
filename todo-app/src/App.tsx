import { FilterBar } from './components/FilterBar'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import './App.css'

function App() {
  const {
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    activeCount,
    completedCount,
  } = useTodos()

  return (
    <div className="app">
      <div className="app-atmosphere" aria-hidden="true" />
      <main className="app-shell">
        <header className="app-header">
          <p className="brand">Priori</p>
          <h1 className="headline">Keep the next step clear.</h1>
          <p className="lede">
            Capture tasks, check them off, and stay focused on what still matters.
          </p>
        </header>

        <section className="todo-panel" aria-label="Todo list">
          <TodoForm onAdd={addTodo} />
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
          />
          <FilterBar
            filter={filter}
            onFilterChange={setFilter}
            activeCount={activeCount}
            completedCount={completedCount}
            onClearCompleted={clearCompleted}
          />
        </section>
      </main>
    </div>
  )
}

export default App
