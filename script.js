(function () {
  const STORAGE_KEY = "desk.v1";
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const PRIORITIES = ["high", "medium", "low"];

  const els = {};
  let state = { tasks: [], notes: [], activity: [] };
  let filter = "all";
  let pending = null;

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function last7Days(now) {
    const today = startOfDay(now || new Date());
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      days.push(day);
    }
    return days;
  }

  function atDaysAgo(days, hour, minute) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    let resolvedHour = hour;
    if (days === 0) {
      resolvedHour = Math.min(hour, Math.max(0, date.getHours() - 1));
    }
    date.setHours(resolvedHour, minute || 0, 0, 0);
    return date.toISOString();
  }

  function formatWhen(iso) {
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return "";
    const minutes = Math.round((Date.now() - then.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.round(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return days + "d ago";
    return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function priorityOf(value) {
    return PRIORITIES.indexOf(value) === -1 ? "medium" : value;
  }

  function task(title, priority, createdDays, createdHour, doneDays, doneHour) {
    const createdAt = atDaysAgo(createdDays, createdHour, 10);
    const item = {
      id: uid(),
      title: title,
      priority: priorityOf(priority),
      done: doneDays !== undefined,
      createdAt: createdAt,
      completedAt: null
    };
    if (item.done) {
      item.completedAt = atDaysAgo(doneDays, doneHour, 20);
    }
    return item;
  }

  function note(text, days, hour) {
    return {
      id: uid(),
      text: text,
      createdAt: atDaysAgo(days, hour, 30)
    };
  }

  function createSample() {
    const tasks = [
      task("Finish the quarterly notes", "high", 1, 9),
      task("Send the chess club schedule", "medium", 1, 11, 0, 9),
      task("Review yesterday's game", "low", 2, 16, 1, 18),
      task("Book a dentist appointment", "medium", 2, 10),
      task("Outline Friday's demo", "high", 4, 9, 2, 15),
      task("Clear the downloads folder", "low", 5, 13, 3, 11),
      task("Prepare questions for standup", "medium", 4, 17, 3, 16),
      task("Water the office plant", "low", 6, 8, 5, 9),
      task("Update the reading list", "low", 6, 19, 6, 20),
      task("Reply to Priya about the mockups", "medium", 0, 8)
    ];
    const notes = [
      note("Standup is at 9:30. Lead with the dashboard.", 0, 8),
      note("Priya prefers annotated screenshots.", 1, 15),
      note("The chess club email should include the new time.", 2, 12)
    ];
    const activity = [];
    tasks.forEach(function (item) {
      activity.push({ id: uid(), text: 'Added "' + item.title + '"', at: item.createdAt });
      if (item.done) {
        activity.push({ id: uid(), text: 'Finished "' + item.title + '"', at: item.completedAt });
      }
    });
    notes.forEach(function (item) {
      activity.push({ id: uid(), text: "Saved a note", at: item.createdAt });
    });
    activity.sort(function (a, b) {
      return new Date(b.at) - new Date(a.at);
    });
    return { tasks: tasks, notes: notes, activity: activity.slice(0, 20) };
  }

  function sanitize(data) {
    if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.notes) || !Array.isArray(data.activity)) {
      return null;
    }
    return {
      tasks: data.tasks.filter(function (item) {
        return item && typeof item.id === "string" && typeof item.title === "string";
      }).map(function (item) {
        return {
          id: item.id,
          title: item.title.slice(0, 140),
          priority: priorityOf(item.priority),
          done: Boolean(item.done),
          createdAt: item.createdAt || new Date().toISOString(),
          completedAt: item.done ? (item.completedAt || item.createdAt || new Date().toISOString()) : null
        };
      }),
      notes: data.notes.filter(function (item) {
        return item && typeof item.id === "string" && typeof item.text === "string";
      }).map(function (item) {
        return {
          id: item.id,
          text: item.text.slice(0, 240),
          createdAt: item.createdAt || new Date().toISOString()
        };
      }),
      activity: data.activity.filter(function (item) {
        return item && typeof item.text === "string";
      }).slice(0, 20).map(function (item) {
        return {
          id: item.id || uid(),
          text: item.text.slice(0, 180),
          at: item.at || new Date().toISOString()
        };
      })
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createSample();
      return sanitize(JSON.parse(raw)) || createSample();
    } catch (err) {
      return createSample();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Private mode or a full storage quota still leaves the session usable.
    }
  }

  function announce(message) {
    els.status.textContent = "";
    window.setTimeout(function () {
      els.status.textContent = message;
    }, 20);
  }

  function pushActivity(text) {
    state.activity.unshift({ id: uid(), text: text, at: new Date().toISOString() });
    state.activity = state.activity.slice(0, 20);
  }

  function counts() {
    const today = startOfDay(new Date());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const open = state.tasks.filter(function (item) { return !item.done; });
    const doneToday = state.tasks.filter(function (item) {
      return item.done && item.completedAt && new Date(item.completedAt) >= today;
    });
    const doneWeek = state.tasks.filter(function (item) {
      return item.done && item.completedAt && new Date(item.completedAt) >= weekStart;
    });
    return {
      open: open.length,
      high: open.filter(function (item) { return item.priority === "high"; }).length,
      doneToday: doneToday.length,
      doneWeek: doneWeek.length,
      notes: state.notes.length,
      done: state.tasks.filter(function (item) { return item.done; }).length,
      total: state.tasks.length
    };
  }

  function renderGreeting() {
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const summary = counts();
    els.greeting.textContent = hello;
    els.dateLine.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
    if (summary.high > 0) {
      els.summaryLine.textContent = summary.high === 1
        ? "You have 1 high-priority task open."
        : "You have " + summary.high + " high-priority tasks open.";
    } else if (summary.open > 0) {
      els.summaryLine.textContent = summary.open === 1
        ? "You have 1 task still open."
        : "You have " + summary.open + " tasks still open.";
    } else {
      els.summaryLine.textContent = "You're clear for today.";
    }
  }

  function renderStats() {
    const summary = counts();
    els.statOpen.textContent = String(summary.open);
    els.statToday.textContent = String(summary.doneToday);
    els.statWeek.textContent = String(summary.doneWeek);
    els.statNotes.textContent = String(summary.notes);
    if (summary.total === 0) {
      els.progressLabel.textContent = "No tasks yet";
      els.progressBar.style.width = "0%";
    } else {
      const pct = Math.round((summary.done / summary.total) * 100);
      els.progressLabel.textContent = summary.done + " of " + summary.total + " complete";
      els.progressBar.style.width = pct + "%";
    }
  }

  function visibleTasks() {
    const query = els.taskSearch.value.trim().toLowerCase();
    return state.tasks.filter(function (item) {
      if (filter === "open" && item.done) return false;
      if (filter === "done" && !item.done) return false;
      if (query && item.title.toLowerCase().indexOf(query) === -1) return false;
      return true;
    });
  }

  function renderTasks() {
    const items = visibleTasks();
    els.taskList.replaceChildren();
    const noData = state.tasks.length === 0 && state.notes.length === 0;
    els.taskEmpty.hidden = items.length !== 0;
    els.emptySample.hidden = !noData;
    if (items.length === 0) {
      els.taskEmptyText.textContent = state.tasks.length === 0
        ? "Nothing on the list yet."
        : "No tasks match this view.";
    }
    items.forEach(function (item) {
      const row = document.createElement("li");
      row.className = "task" + (item.done ? " is-done" : "");

      const label = document.createElement("label");
      label.className = "task-check";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = item.done;
      box.dataset.id = item.id;
      const hidden = document.createElement("span");
      hidden.className = "sr-only";
      hidden.textContent = (item.done ? "Reopen " : "Complete ") + item.title;
      label.append(box, hidden);

      const body = document.createElement("div");
      body.className = "task-body";
      const title = document.createElement("p");
      title.className = "task-title";
      title.textContent = item.title;
      const meta = document.createElement("p");
      meta.className = "task-meta";
      meta.textContent = item.done
        ? "Finished " + formatWhen(item.completedAt).toLowerCase()
        : "Added " + formatWhen(item.createdAt).toLowerCase();
      body.append(title, meta);

      const pill = document.createElement("span");
      pill.className = "pill pill-" + item.priority;
      pill.textContent = item.priority.charAt(0).toUpperCase() + item.priority.slice(1);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn";
      remove.dataset.delete = item.id;
      remove.textContent = "Delete";

      row.append(label, body, pill, remove);
      els.taskList.appendChild(row);
    });
  }

  function renderChart() {
    const days = last7Days(new Date());
    const countsByDay = days.map(function (day) {
      return state.tasks.filter(function (item) {
        return item.done && item.completedAt && sameDay(new Date(item.completedAt), day);
      }).length;
    });
    const max = Math.max.apply(null, countsByDay.concat([1]));
    const total = countsByDay.reduce(function (sum, value) { return sum + value; }, 0);
    els.chartCaption.textContent = total === 1 ? "1 task completed" : total + " tasks completed";
    els.chart.replaceChildren();
    days.forEach(function (day, index) {
      const count = countsByDay[index];
      const col = document.createElement("div");
      col.className = "bar-col"
        + (sameDay(day, new Date()) ? " is-today" : "")
        + (count === 0 ? " is-zero" : "");
      col.setAttribute("role", "listitem");
      const name = day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      col.setAttribute("aria-label", name + ": " + count + (count === 1 ? " task completed" : " tasks completed"));

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      if (count > 0) {
        fill.style.height = Math.max(12, Math.round((count / max) * 100)) + "%";
      }
      track.appendChild(fill);

      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = DAY_LABELS[day.getDay()];
      col.append(track, label);
      els.chart.appendChild(col);
    });
  }

  function renderNotes() {
    els.noteList.replaceChildren();
    els.noteEmpty.hidden = state.notes.length !== 0;
    state.notes.forEach(function (item) {
      const row = document.createElement("li");
      row.className = "note";
      const copy = document.createElement("div");
      const text = document.createElement("p");
      text.textContent = item.text;
      const time = document.createElement("time");
      time.dateTime = item.createdAt;
      time.textContent = formatWhen(item.createdAt);
      copy.append(text, time);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn";
      remove.dataset.deleteNote = item.id;
      remove.setAttribute("aria-label", "Delete note");
      remove.textContent = "Delete";
      row.append(copy, remove);
      els.noteList.appendChild(row);
    });
  }

  function renderActivity() {
    els.activityList.replaceChildren();
    els.activityEmpty.hidden = state.activity.length !== 0;
    state.activity.forEach(function (item) {
      const row = document.createElement("li");
      row.className = "activity";
      const dot = document.createElement("span");
      dot.className = "activity-dot";
      dot.setAttribute("aria-hidden", "true");
      const text = document.createElement("p");
      text.textContent = item.text;
      const time = document.createElement("time");
      time.dateTime = item.at;
      time.textContent = formatWhen(item.at);
      row.append(dot, text, time);
      els.activityList.appendChild(row);
    });
  }

  function render() {
    renderGreeting();
    renderStats();
    renderTasks();
    renderChart();
    renderNotes();
    renderActivity();
  }

  function commit(message) {
    save();
    render();
    if (message) announce(message);
  }

  function addTask(title, priority) {
    const clean = title.trim();
    if (!clean) return;
    state.tasks.unshift({
      id: uid(),
      title: clean.slice(0, 140),
      priority: priorityOf(priority),
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    });
    pushActivity('Added "' + clean.slice(0, 140) + '"');
    commit("Task added");
  }

  function setTaskDone(id, done) {
    const item = state.tasks.find(function (taskItem) { return taskItem.id === id; });
    if (!item || item.done === done) return;
    item.done = done;
    item.completedAt = done ? new Date().toISOString() : null;
    pushActivity((done ? 'Finished "' : 'Reopened "') + item.title + '"');
    commit(done ? "Task completed" : "Task reopened");
  }

  function deleteTask(id) {
    const item = state.tasks.find(function (taskItem) { return taskItem.id === id; });
    if (!item) return;
    state.tasks = state.tasks.filter(function (taskItem) { return taskItem.id !== id; });
    pushActivity('Removed "' + item.title + '"');
    commit("Task removed");
  }

  function addNote(text) {
    const clean = text.trim();
    if (!clean) return;
    state.notes.unshift({
      id: uid(),
      text: clean.slice(0, 240),
      createdAt: new Date().toISOString()
    });
    pushActivity("Saved a note");
    commit("Note saved");
  }

  function deleteNote(id) {
    const item = state.notes.find(function (noteItem) { return noteItem.id === id; });
    if (!item) return;
    state.notes = state.notes.filter(function (noteItem) { return noteItem.id !== id; });
    pushActivity("Removed a note");
    commit("Note removed");
  }

  function loadSample() {
    state = createSample();
    pushActivity("Loaded sample data");
    commit("Sample data loaded");
  }

  function resetDashboard() {
    state = { tasks: [], notes: [], activity: [] };
    pushActivity("Cleared the dashboard");
    commit("Dashboard cleared");
  }

  function ask(options) {
    pending = options.action;
    els.confirmTitle.textContent = options.title;
    els.confirmText.textContent = options.text;
    els.confirmAccept.textContent = options.accept;
    els.confirmAccept.classList.toggle("danger", Boolean(options.danger));
    els.dialog.showModal();
  }

  function hasUserData() {
    return state.tasks.length > 0 || state.notes.length > 0;
  }

  function requestSample() {
    if (!hasUserData()) {
      loadSample();
      return;
    }
    ask({
      title: "Load sample data?",
      text: "This replaces the tasks and notes currently stored in this browser.",
      accept: "Load sample",
      danger: false,
      action: loadSample
    });
  }

  function bind() {
    els.greeting = document.getElementById("greeting");
    els.dateLine = document.getElementById("date-line");
    els.summaryLine = document.getElementById("summary-line");
    els.statOpen = document.getElementById("stat-open");
    els.statToday = document.getElementById("stat-today");
    els.statWeek = document.getElementById("stat-week");
    els.statNotes = document.getElementById("stat-notes");
    els.progressLabel = document.getElementById("progress-label");
    els.progressBar = document.getElementById("progress-bar");
    els.taskSearch = document.getElementById("task-search");
    els.taskList = document.getElementById("task-list");
    els.taskEmpty = document.getElementById("task-empty");
    els.taskEmptyText = document.getElementById("task-empty-text");
    els.emptySample = document.getElementById("empty-sample");
    els.chart = document.getElementById("chart");
    els.chartCaption = document.getElementById("chart-caption");
    els.noteList = document.getElementById("note-list");
    els.noteEmpty = document.getElementById("note-empty");
    els.activityList = document.getElementById("activity-list");
    els.activityEmpty = document.getElementById("activity-empty");
    els.status = document.getElementById("status");
    els.dialog = document.getElementById("confirm-dialog");
    els.confirmTitle = document.getElementById("confirm-title");
    els.confirmText = document.getElementById("confirm-text");
    els.confirmAccept = document.getElementById("confirm-accept");

    document.getElementById("task-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const title = document.getElementById("task-title");
      const priority = document.getElementById("task-priority");
      addTask(title.value, priority.value);
      title.value = "";
      priority.value = "medium";
      title.focus();
    });

    document.getElementById("note-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const input = document.getElementById("note-text");
      addNote(input.value);
      input.value = "";
      input.focus();
    });

    els.taskSearch.addEventListener("input", renderTasks);

    document.querySelectorAll("[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach(function (chip) {
          const active = chip === button;
          chip.classList.toggle("is-active", active);
          chip.setAttribute("aria-pressed", active ? "true" : "false");
        });
        renderTasks();
      });
    });

    els.taskList.addEventListener("change", function (event) {
      const input = event.target.closest("input[type='checkbox']");
      if (!input) return;
      setTaskDone(input.dataset.id, input.checked);
    });

    els.taskList.addEventListener("click", function (event) {
      const button = event.target.closest("[data-delete]");
      if (!button) return;
      deleteTask(button.dataset.delete);
    });

    els.noteList.addEventListener("click", function (event) {
      const button = event.target.closest("[data-delete-note]");
      if (!button) return;
      deleteNote(button.dataset.deleteNote);
    });

    document.getElementById("sample-btn").addEventListener("click", requestSample);
    document.getElementById("empty-sample").addEventListener("click", requestSample);
    document.getElementById("reset-btn").addEventListener("click", function () {
      ask({
        title: "Clear this dashboard?",
        text: "Tasks, notes, and activity stored in this browser will be removed.",
        accept: "Clear data",
        danger: true,
        action: resetDashboard
      });
    });

    document.getElementById("confirm-cancel").addEventListener("click", function () {
      pending = null;
      els.dialog.close();
    });
    els.confirmAccept.addEventListener("click", function () {
      const action = pending;
      pending = null;
      els.dialog.close();
      if (action) action();
    });
    els.dialog.addEventListener("click", function (event) {
      if (event.target === els.dialog) {
        pending = null;
        els.dialog.close();
      }
    });
  }

  function init() {
    bind();
    state = load();
    save();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
