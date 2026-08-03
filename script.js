const STORAGE_KEY = "clearlist.todos";

/** @typedef {{ id: string, text: string, done: boolean, createdAt: number }} Todo */

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const emptyEl = document.getElementById("empty-state");
const countEl = document.getElementById("count");
const filterButtons = document.querySelectorAll(".filter");

/** @type {Todo[]} */
let todos = loadTodos();
/** @type {"all" | "active" | "done"} */
let filter = "all";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos = [
    {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    },
    ...todos,
  ];
  input.value = "";
  persist();
  render();
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filter = /** @type {"all" | "active" | "done"} */ (button.dataset.filter);
    filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
    render();
  });
});

listEl.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
  const id = target.closest(".item")?.dataset.id;
  if (!id) return;

  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, done: target.checked } : todo
  );
  persist();
  render();
});

listEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest(".item__delete");
  if (!(button instanceof HTMLElement)) return;

  const item = button.closest(".item");
  const id = item?.dataset.id;
  if (!id || !item) return;

  item.classList.add("is-leaving");
  window.setTimeout(() => {
    todos = todos.filter((todo) => todo.id !== id);
    persist();
    render();
  }, 220);
});

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.done === "boolean"
    );
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function visibleTodos() {
  if (filter === "active") return todos.filter((todo) => !todo.done);
  if (filter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

function render() {
  const visible = visibleTodos();
  listEl.innerHTML = "";

  for (const todo of visible) {
    const li = document.createElement("li");
    li.className = `item${todo.done ? " is-done" : ""}`;
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item__check";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as ${todo.done ? "active" : "done"}`);

    const text = document.createElement("p");
    text.className = "item__text";
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "item__delete";
    del.setAttribute("aria-label", `Delete "${todo.text}"`);
    del.textContent = "×";

    li.append(checkbox, text, del);
    listEl.append(li);
  }

  const activeCount = todos.filter((todo) => !todo.done).length;
  countEl.textContent =
    todos.length === 0
      ? ""
      : `${activeCount} active · ${todos.length} total`;

  emptyEl.hidden = visible.length > 0;
}

render();
