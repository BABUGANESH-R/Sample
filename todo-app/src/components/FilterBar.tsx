import type { Filter } from '../types'

interface FilterBarProps {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  activeCount: number
  completedCount: number
  onClearCompleted: () => void
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
]

export function FilterBar({
  filter,
  onFilterChange,
  activeCount,
  completedCount,
  onClearCompleted,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <p className="filter-count">
        {activeCount} left
      </p>
      <div className="filter-tabs" role="tablist" aria-label="Filter todos">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`filter-tab${filter === item.id ? ' is-active' : ''}`}
            onClick={() => onFilterChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="clear-completed"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
      >
        Clear done
      </button>
    </div>
  )
}
