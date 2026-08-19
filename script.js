const STORAGE_KEY = "simple-todo-app";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const empty = document.getElementById("empty");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterButtons = Array.from(document.querySelectorAll(".filter"));

let todos = loadTodos();
let filter = "all";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function visibleTodos() {
  if (filter === "active") return todos.filter((todo) => !todo.completed);
  if (filter === "completed") return todos.filter((todo) => todo.completed);
  return todos;
}

function render() {
  const items = visibleTodos();
  list.innerHTML = "";

  items.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item${todo.completed ? " completed" : ""}`;
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "check";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `Mark "${todo.title}" complete`);

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = todo.title;
    title.title = "Double-click to edit";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-btn";
    remove.setAttribute("aria-label", `Delete "${todo.title}"`);
    remove.textContent = "×";

    checkbox.addEventListener("change", () => toggleTodo(todo.id));
    title.addEventListener("dblclick", () => startEdit(li, todo));
    remove.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, title, remove);
    list.appendChild(li);
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  const completed = todos.length - remaining;
  countEl.textContent = `${remaining} remaining`;
  empty.hidden = items.length !== 0;
  clearBtn.hidden = completed === 0;
}

function addTodo(title) {
  const trimmed = title.trim();
  if (!trimmed) return;

  todos.unshift({
    id: createId(),
    title: trimmed,
    completed: false,
  });
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function updateTodo(id, title) {
  const trimmed = title.trim();
  if (!trimmed) {
    deleteTodo(id);
    return;
  }

  todos = todos.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo));
  saveTodos();
  render();
}

function clearCompleted() {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

function startEdit(item, todo) {
  const inputEl = document.createElement("input");
  inputEl.className = "edit-input";
  inputEl.type = "text";
  inputEl.value = todo.title;
  inputEl.maxLength = 180;

  const title = item.querySelector(".title");
  title.replaceWith(inputEl);
  inputEl.focus();
  inputEl.select();

  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    if (save) updateTodo(todo.id, inputEl.value);
    else render();
  };

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  inputEl.addEventListener("blur", () => finish(true));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(input.value);
  form.reset();
  input.focus();
});

clearBtn.addEventListener("click", clearCompleted);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filterButtons.forEach((other) => {
      const active = other === button;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    render();
  });
});

render();
input.focus();
