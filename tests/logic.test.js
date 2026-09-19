const test = require("node:test");
const assert = require("node:assert/strict");
const Logic = require("../js/logic.js");

test("createTask trims the title and defaults invalid priority to medium", () => {
  const task = Logic.createTask("  Buy milk  ", "urgent");
  assert.equal(task.title, "Buy milk");
  assert.equal(task.priority, "medium");
  assert.equal(task.completed, false);
  assert.equal(typeof task.id, "string");
  assert.ok(task.id.length > 0);
});

test("createTask keeps a valid priority", () => {
  const task = Logic.createTask("Ship feature", "high");
  assert.equal(task.priority, "high");
});

test("priorityLabel maps known values and defaults to Medium", () => {
  assert.equal(Logic.priorityLabel("high"), "High");
  assert.equal(Logic.priorityLabel("low"), "Low");
  assert.equal(Logic.priorityLabel("medium"), "Medium");
  assert.equal(Logic.priorityLabel("nonsense"), "Medium");
  assert.equal(Logic.priorityLabel(undefined), "Medium");
});

test("escapeHtml neutralizes tags and quotes", () => {
  const input = `<script>alert("x")</script> & 'single'`;
  const out = Logic.escapeHtml(input);
  assert.ok(!out.includes("<script>"));
  assert.equal(
    out,
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;single&#39;"
  );
});

test("filterTasks filters by status", () => {
  const tasks = [
    { id: "1", title: "a", priority: "low", completed: false, createdAt: 1 },
    { id: "2", title: "b", priority: "low", completed: true, createdAt: 2 },
  ];
  assert.equal(Logic.filterTasks(tasks, { status: "active" }).length, 1);
  assert.equal(Logic.filterTasks(tasks, { status: "completed" }).length, 1);
  assert.equal(Logic.filterTasks(tasks, { status: "all" }).length, 2);
});

test("filterTasks filters by priority", () => {
  const tasks = [
    { id: "1", title: "a", priority: "high", completed: false, createdAt: 1 },
    { id: "2", title: "b", priority: "low", completed: false, createdAt: 2 },
  ];
  const result = Logic.filterTasks(tasks, { priority: "high" });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});

test("filterTasks searches by title, case-insensitively", () => {
  const tasks = [
    { id: "1", title: "Write report", priority: "low", completed: false, createdAt: 1 },
    { id: "2", title: "Buy milk", priority: "low", completed: false, createdAt: 2 },
  ];
  const result = Logic.filterTasks(tasks, { search: "REPORT" });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});

test("filterTasks combines status, priority, and search filters", () => {
  const tasks = [
    { id: "1", title: "Write report", priority: "high", completed: false, createdAt: 1 },
    { id: "2", title: "Write memo", priority: "low", completed: false, createdAt: 2 },
    { id: "3", title: "Write report", priority: "high", completed: true, createdAt: 3 },
  ];
  const result = Logic.filterTasks(tasks, { status: "active", priority: "high", search: "write" });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});

test("sortByCreatedDesc orders newest first without mutating input", () => {
  const tasks = [
    { id: "1", createdAt: 100 },
    { id: "2", createdAt: 300 },
    { id: "3", createdAt: 200 },
  ];
  const sorted = Logic.sortByCreatedDesc(tasks);
  assert.deepEqual(sorted.map(t => t.id), ["2", "3", "1"]);
  assert.deepEqual(tasks.map(t => t.id), ["1", "2", "3"]);
});

test("computeStats counts total, completed, and pending", () => {
  const tasks = [
    { completed: true },
    { completed: false },
    { completed: false },
  ];
  assert.deepEqual(Logic.computeStats(tasks), { total: 3, completed: 1, pending: 2 });
});

test("computeStats handles an empty list", () => {
  assert.deepEqual(Logic.computeStats([]), { total: 0, completed: 0, pending: 0 });
});
