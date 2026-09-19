/**
 * FocusList core logic.
 *
 * Pure, DOM-free functions used by js/app.js to render the UI, and covered
 * directly by tests/logic.test.js. Kept dependency-free (no DOM APIs) so it
 * runs identically in the browser and under Node's test runner.
 *
 * Exposed as:
 *   - CommonJS export (module.exports) when required from Node/tests
 *   - window.FocusListLogic global when loaded via <script> in the browser
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FocusListLogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const VALID_PRIORITIES = ["high", "medium", "low"];
  const VALID_STATUSES = ["all", "active", "completed"];

  /**
   * Generate a reasonably unique id for a new task.
   * Not cryptographically strong -- fine for a client-only task list.
   * @returns {string}
   */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Human-readable label for a priority value. Defaults to "Medium" for
   * anything unrecognized, matching the <select> default in the UI.
   * @param {string} priority
   * @returns {"High"|"Medium"|"Low"}
   */
  function priorityLabel(priority) {
    if (priority === "high") return "High";
    if (priority === "low") return "Low";
    return "Medium";
  }

  /**
   * Escape a string for safe insertion into HTML markup.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Create a new task object.
   * @param {string} title
   * @param {"high"|"medium"|"low"} priority
   * @returns {{id:string,title:string,priority:string,completed:boolean,createdAt:number}}
   */
  function createTask(title, priority) {
    return {
      id: uid(),
      title: String(title).trim(),
      priority: VALID_PRIORITIES.includes(priority) ? priority : "medium",
      completed: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Filter a task list by status, priority, and a case-insensitive title search.
   * @param {Array<object>} tasks
   * @param {{status?: "all"|"active"|"completed", priority?: string, search?: string}} filters
   * @returns {Array<object>}
   */
  function filterTasks(tasks, filters) {
    const status = VALID_STATUSES.includes(filters && filters.status) ? filters.status : "all";
    const priority = filters && filters.priority ? filters.priority : "all";
    const search = (filters && filters.search ? filters.search : "").trim().toLowerCase();

    return (tasks || []).filter(function (task) {
      if (status === "active" && task.completed) return false;
      if (status === "completed" && !task.completed) return false;
      if (priority !== "all" && task.priority !== priority) return false;
      if (search && !task.title.toLowerCase().includes(search)) return false;
      return true;
    });
  }

  /**
   * Sort tasks newest-first by createdAt. Returns a new array; does not mutate input.
   * @param {Array<object>} tasks
   * @returns {Array<object>}
   */
  function sortByCreatedDesc(tasks) {
    return (tasks || []).slice().sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Compute total/completed/pending counts for a task list.
   * @param {Array<object>} tasks
   * @returns {{total:number, completed:number, pending:number}}
   */
  function computeStats(tasks) {
    const total = (tasks || []).length;
    const completed = (tasks || []).filter(function (t) { return t.completed; }).length;
    return { total: total, completed: completed, pending: total - completed };
  }

  return {
    VALID_PRIORITIES: VALID_PRIORITIES,
    VALID_STATUSES: VALID_STATUSES,
    uid: uid,
    priorityLabel: priorityLabel,
    escapeHtml: escapeHtml,
    createTask: createTask,
    filterTasks: filterTasks,
    sortByCreatedDesc: sortByCreatedDesc,
    computeStats: computeStats,
  };
});
