/**
 * FocusList app wiring: DOM rendering, event handling, and persistence.
 * All non-DOM logic lives in js/logic.js (loaded before this file) and is
 * exposed here via the FocusListLogic global.
 */
function setupCustomSelect(select) {
  
  if (!select) return;

  const trigger = select.querySelector(".custom-select-trigger");
  const valueElement = select.querySelector(".custom-select-value");
  const options = select.querySelectorAll('[role="option"]');
  const hiddenInput = select.querySelector('input[type="hidden"]');

  if (!trigger || !valueElement || !hiddenInput) return;

  trigger.addEventListener("click", function () {
    const isOpen = select.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  options.forEach(function (option) {
    option.addEventListener("click", function () {
      const value = option.dataset.value;

      valueElement.textContent = option.textContent.trim();
      hiddenInput.value = value;

      options.forEach(function (item) {
        item.setAttribute("aria-selected", "false");
      });

      option.setAttribute("aria-selected", "true");

      select.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");

      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}
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

  setupCustomSelect(el.newTaskPriority);
  setupCustomSelect(el.priorityFilter);

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
          '<div class="custom-select edit-priority">' +
            '<button type="button" class="custom-select-trigger" ' +
              'aria-haspopup="listbox" aria-expanded="false" ' +
              'aria-label="Edit task priority">' +
              '<span class="custom-select-value">' +
                Logic.priorityLabel(task.priority) +
              '</span>' +
              '<span class="custom-select-arrow">⌄</span>' +
            '</button>' +

            '<ul class="custom-select-options" role="listbox">' +

              '<li role="option" data-value="high" ' +
                'aria-selected="' + (task.priority === "high" ? "true" : "false") + '">' +
                'High' +
              '</li>' +

              '<li role="option" data-value="medium" ' +
                'aria-selected="' + (task.priority === "medium" ? "true" : "false") + '">' +
                'Medium' +
              '</li>' +

              '<li role="option" data-value="low" ' +
                'aria-selected="' + (task.priority === "low" ? "true" : "false") + '">' +
                'Low' +
              '</li>' +

            '</ul>' +

            '<input type="hidden" value="' + task.priority + '">' +
          '</div>' +            '<button type="button" class="btn btn-primary save-edit">Save</button>' +
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
      const editPriority = li.querySelector(".edit-priority");

      if (editPriority) {
        setupCustomSelect(editPriority);
      }
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

    const priority = el.newTaskPriority.querySelector(
      'input[type="hidden"]'
    ).value;

    addTask(el.newTaskInput.value, priority);

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
    state.priority = el.priorityFilter.querySelector(
      'input[type="hidden"]'
    ).value;

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
      const priority = prioritySelect.querySelector(
        'input[type="hidden"]'
      ).value;

      saveEdit(id, input.value, priority);
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
      const priority = prioritySelect.querySelector(
        'input[type="hidden"]'
      ).value;

      saveEdit(li.dataset.id, e.target.value, priority);
    }
    if (e.target.classList.contains("edit-input") && e.key === "Escape") {
      cancelEdit();
    }
  });

  el.themeToggle.addEventListener("click", toggleTheme);
  document.addEventListener("click", function (e) {
  document.querySelectorAll(".custom-select.open").forEach(function (select) {
    if (!select.contains(e.target)) {
      select.classList.remove("open");

      const trigger = select.querySelector(".custom-select-trigger");

      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    }
  });
  });

  loadTheme();
  tasks = loadTasks();
  render();
})();

