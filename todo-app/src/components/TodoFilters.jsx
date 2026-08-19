const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
]

export default function TodoFilters({
  filter,
  onFilterChange,
  activeCount,
  completedCount,
  onClearCompleted,
}) {
  const remainingLabel =
    activeCount === 1 ? '1 task left' : `${activeCount} tasks left`

  return (
    <footer className="todo-footer">
      <p className="remaining">{remainingLabel}</p>
      <div className="filters" role="tablist" aria-label="Filter tasks">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? 'is-active' : undefined}
            onClick={() => onFilterChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="clear-button"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
      >
        Clear done
      </button>
    </footer>
  )
}
