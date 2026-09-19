/**
 * FocusList app wiring: DOM rendering, event handling, and persistence.
 * All non-DOM logic lives in js/logic.js (loaded before this file) and is
 * exposed here via the FocusListLogic global.
 */
(function () {
  "use strict";

  const Logic = window.FocusListLogic;
  const STORAGE_KEY = "focuslist.tasks.v1";
  const THEME_KEY = "focuslist.theme.v1";

  /** @type {Array<object>} */
  let tasks = [];
  let state = { status: "all", priority: "all", search: "", editingId: null };

  const el = {
    addForm: document.getElementById("addForm"),
    newTaskInput: document.getElementById("newTaskInput"),
    newTaskPriority: document.getElementById("newTaskPriority"),
    addBtn: document.getElementById("addBtn"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    priorityFilter: document.getElementById("priorityFilter"),
    taskList: document.getElementById("taskList"),
    emptyState: document.getElementById("emptyState"),
    emptyMessage: document.getElementById("emptyMessage"),
    statTotal: document.getElementById("statTotal"),
    statCompleted: document.getElementById("statCompleted"),
    statPending: document.getElementById("statPending"),
    themeToggle: document.getElementById("themeToggle"),
  };

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (t) {
        return t && typeof t.id === "string" && typeof t.title === "string";
      });
    } catch (e) {
      console.error("FocusList: failed to load tasks", e);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("FocusList: failed to save tasks", e);
    }
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch (e) { /* ignore */ }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentlyDark = current === "dark" || (!current && prefersDark);
    const next = currentlyDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
  }

  function updateStats() {
    const stats = Logic.computeStats(tasks);
    el.statTotal.textContent = stats.total;
    el.statCompleted.textContent = stats.completed;
    el.statPending.textContent = stats.pending;
  }

  function render() {
    const filtered = Logic.sortByCreatedDesc(Logic.filterTasks(tasks, state));
    el.taskList.innerHTML = "";

    if (filtered.length === 0) {
      el.emptyState.hidden = false;
      el.emptyMessage.textContent = tasks.length === 0
        ? "No tasks yet. Add your first one above."
        : "No tasks match your search or filters.";
    } else {
      el.emptyState.hidden = true;
    }

    filtered.forEach(function (task) {
      const li = document.createElement("li");
      li.className = "task" + (task.completed ? " done" : "");
      li.dataset.id = task.id;

      if (state.editingId === task.id) {
        li.innerHTML =
          '<div class="edit-row">' +
            '<input type="text" class="edit-input" value="' + Logic.escapeHtml(task.title) + '" maxlength="200" aria-label="Edit task title">' +
            '<select class="edit-priority" aria-label="Edit task priority">' +
              '<option value="high" ' + (task.priority === "high" ? "selected" : "") + '>High</option>' +
              '<option value="medium" ' + (task.priority === "medium" ? "selected" : "") + '>Medium</option>' +
              '<option value="low" ' + (task.priority === "low" ? "selected" : "") + '>Low</option>' +
            '</select>' +
            '<button type="button" class="btn btn-primary save-edit">Save</button>' +
            '<button type="button" class="icon-btn cancel-edit" aria-label="Cancel edit">\u2715</button>' +
          '</div>';
      } else {
        li.innerHTML =
          '<input type="checkbox" class="check" ' + (task.completed ? "checked" : "") +
            ' aria-label="Mark \'' + Logic.escapeHtml(task.title) + '\' as ' + (task.completed ? "active" : "completed") + '">' +
          '<div class="task-body">' +
            '<div class="task-title">' + Logic.escapeHtml(task.title) + '</div>' +
            '<div class="task-meta">' +
              '<span class="priority-tag p-' + task.priority + '"><span class="dot"></span>' + Logic.priorityLabel(task.priority) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="task-actions">' +
            '<button type="button" class="icon-btn edit-btn" aria-label="Edit task">\u270E</button>' +
            '<button type="button" class="icon-btn delete-btn" aria-label="Delete task">\u{1F5D1}</button>' +
          '</div>';
      }
      el.taskList.appendChild(li);
    });

    updateStats();
  }

  function addTask(title, priority) {
    if (!String(title).trim()) return;
    tasks.push(Logic.createTask(title, priority));
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
    render();
  }

  function toggleComplete(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      render();
    }
  }

  function startEdit(id) {
    state.editingId = id;
    render();
    const input = el.taskList.querySelector(".edit-input");
    if (input) { input.focus(); input.select(); }
  }

  function saveEdit(id, newTitle, newPriority) {
    const trimmed = String(newTitle).trim();
    if (!trimmed) { state.editingId = null; render(); return; }
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.title = trimmed;
      task.priority = Logic.VALID_PRIORITIES.includes(newPriority) ? newPriority : task.priority;
    }
    state.editingId = null;
    saveTasks();
    render();
  }

  function cancelEdit() {
    state.editingId = null;
    render();
  }

  el.addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addTask(el.newTaskInput.value, el.newTaskPriority.value);
    el.newTaskInput.value = "";
    el.newTaskInput.focus();
  });

  el.newTaskInput.addEventListener("input", function () {
    el.addBtn.disabled = el.newTaskInput.value.trim().length === 0;
  });
  el.addBtn.disabled = true;

  el.searchInput.addEventListener("input", function () {
    state.search = el.searchInput.value;
    render();
  });

  el.statusFilter.addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-value]");
    if (!btn) return;
    state.status = btn.dataset.value;
    Array.from(el.statusFilter.children).forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    render();
  });

  el.priorityFilter.addEventListener("change", function () {
    state.priority = el.priorityFilter.value;
    render();
  });

  el.taskList.addEventListener("click", function (e) {
    const li = e.target.closest(".task");
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest(".delete-btn")) { deleteTask(id); return; }
    if (e.target.closest(".edit-btn")) { startEdit(id); return; }
    if (e.target.closest(".save-edit")) {
      const input = li.querySelector(".edit-input");
      const prioritySelect = li.querySelector(".edit-priority");
      saveEdit(id, input.value, prioritySelect.value);
      return;
    }
    if (e.target.closest(".cancel-edit")) { cancelEdit(); return; }
    if (e.target.classList.contains("task-title")) { toggleComplete(id); return; }
  });

  el.taskList.addEventListener("change", function (e) {
    if (e.target.classList.contains("check")) {
      const li = e.target.closest(".task");
      toggleComplete(li.dataset.id);
    }
  });

  el.taskList.addEventListener("keydown", function (e) {
    if (e.target.classList.contains("edit-input") && e.key === "Enter") {
      e.preventDefault();
      const li = e.target.closest(".task");
      const prioritySelect = li.querySelector(".edit-priority");
      saveEdit(li.dataset.id, e.target.value, prioritySelect.value);
    }
    if (e.target.classList.contains("edit-input") && e.key === "Escape") {
      cancelEdit();
    }
  });

  el.themeToggle.addEventListener("click", toggleTheme);

  loadTheme();
  tasks = loadTasks();
  render();
})();
