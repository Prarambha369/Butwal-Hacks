import { describe, it, expect } from "vitest"
import {
  columns,
  getTasksByColumn,
  reorderWithinColumn,
  moveBetweenColumns,
  applyDragResult,
} from "./board-utils"
import type { TaskItem } from "@/components/tasks/task-card"

// ─── Helpers ────────────────────────────────────────────────────────

function makeTask(overrides: Partial<TaskItem>): TaskItem {
  return {
    id: "t1",
    title: "Task",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: null,
    due_date: null,
    position: 0,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function sampleTasks(): TaskItem[] {
  return [
    makeTask({ id: "a", title: "Alpha", status: "todo", position: 0 }),
    makeTask({ id: "b", title: "Beta", status: "todo", position: 1 }),
    makeTask({ id: "c", title: "Gamma", status: "in_progress", position: 0 }),
    makeTask({ id: "d", title: "Delta", status: "in_progress", position: 1 }),
    makeTask({ id: "e", title: "Epsilon", status: "done", position: 0 }),
  ]
}

// ─── Column definitions ─────────────────────────────────────────────

describe("columns", () => {
  it("defines exactly 4 columns in order", () => {
    expect(columns.map((c) => c.key)).toEqual(["todo", "in_progress", "review", "done"])
  })

  it("each column has a label and a color", () => {
    for (const col of columns) {
      expect(col.label).toBeTruthy()
      expect(col.color).toBeTruthy()
    }
  })
})

// ─── getTasksByColumn ───────────────────────────────────────────────

describe("getTasksByColumn", () => {
  it("returns tasks filtered by status, sorted by position", () => {
    const tasks = sampleTasks()
    const result = getTasksByColumn(tasks, "todo")
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("a")
    expect(result[1].id).toBe("b")
  })

  it("returns empty array when no tasks match", () => {
    const result = getTasksByColumn(sampleTasks(), "review")
    expect(result).toHaveLength(0)
  })

  it("sorts correctly when positions are out of order", () => {
    const tasks = [
      makeTask({ id: "x", status: "todo", position: 2 }),
      makeTask({ id: "y", status: "todo", position: 0 }),
      makeTask({ id: "z", status: "todo", position: 1 }),
    ]
    const result = getTasksByColumn(tasks, "todo")
    expect(result.map((t) => t.id)).toEqual(["y", "z", "x"])
  })

  it("handles empty input", () => {
    expect(getTasksByColumn([], "todo")).toHaveLength(0)
  })
})

// ─── reorderWithinColumn ────────────────────────────────────────────

describe("reorderWithinColumn", () => {
  it("moves a task down within the same column", () => {
    const tasks = sampleTasks()
    // Move "Alpha" (index 0) to position 1 in "todo"
    const result = reorderWithinColumn(tasks, "a", 0, 1, "todo")

    const todoTasks = result
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position)

    expect(todoTasks.map((t) => t.id)).toEqual(["b", "a"])
    expect(todoTasks[0].position).toBe(0)
    expect(todoTasks[1].position).toBe(1)
  })

  it("moves a task up within the same column", () => {
    const tasks = sampleTasks()
    // Move "Beta" (index 1) to position 0 in "todo"
    const result = reorderWithinColumn(tasks, "b", 1, 0, "todo")

    const todoTasks = result
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position)

    expect(todoTasks.map((t) => t.id)).toEqual(["b", "a"])
    expect(todoTasks[0].position).toBe(0)
    expect(todoTasks[1].position).toBe(1)
  })

  it("does nothing when task id is not found", () => {
    const tasks = sampleTasks()
    const result = reorderWithinColumn(tasks, "nonexistent", 0, 1, "todo")
    expect(result).toEqual(tasks)
  })

  it("preserves tasks in other columns", () => {
    const tasks = sampleTasks()
    const result = reorderWithinColumn(tasks, "a", 0, 1, "todo")

    const inProgressTasks = result.filter((t) => t.status === "in_progress")
    expect(inProgressTasks).toHaveLength(2)

    const doneTasks = result.filter((t) => t.status === "done")
    expect(doneTasks).toHaveLength(1)
  })

  it("maintains total task count", () => {
    const tasks = sampleTasks()
    const result = reorderWithinColumn(tasks, "a", 0, 1, "todo")
    expect(result).toHaveLength(tasks.length)
  })
})

// ─── moveBetweenColumns ────────────────────────────────────────────

describe("moveBetweenColumns", () => {
  it("moves a task from one column to another", () => {
    const tasks = sampleTasks()
    // Move "Alpha" (todo, index 0) to "in_progress" at position 0
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 0)

    const moved = result.find((t) => t.id === "a")
    expect(moved?.status).toBe("in_progress")
    expect(moved?.position).toBe(0)
  })

  it("recalculates source column positions after removal", () => {
    const tasks = sampleTasks()
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 0)

    const todoTasks = result
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position)

    // Only "Beta" should remain, at position 0
    expect(todoTasks).toHaveLength(1)
    expect(todoTasks[0].id).toBe("b")
    expect(todoTasks[0].position).toBe(0)
  })

  it("recalculates destination column positions after insertion", () => {
    const tasks = sampleTasks()
    // Insert "Alpha" at the end (position 1) of in_progress
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 1)

    const inProgressTasks = result
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.position - b.position)

    expect(inProgressTasks).toHaveLength(3)
    // "Gamma" was at 0, "Delta" was at 1, now "Alpha" is inserted at index 1
    expect(inProgressTasks[0].id).toBe("c") // Gamma stays at 0
    expect(inProgressTasks[1].id).toBe("a") // Alpha goes to 1
    expect(inProgressTasks[2].id).toBe("d") // Delta shifts to 2
    expect(inProgressTasks[0].position).toBe(0)
    expect(inProgressTasks[1].position).toBe(1)
    expect(inProgressTasks[2].position).toBe(2)
  })

  it("does nothing when task id is not found", () => {
    const tasks = sampleTasks()
    const result = moveBetweenColumns(tasks, "nonexistent", "todo", "in_progress", 0, 0)
    expect(result).toEqual(tasks)
  })

  it("preserves tasks in unaffected columns", () => {
    const tasks = sampleTasks()
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 0)

    const doneTasks = result.filter((t) => t.status === "done")
    expect(doneTasks).toHaveLength(1)
  })

  it("maintains total task count", () => {
    const tasks = sampleTasks()
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 0)
    expect(result).toHaveLength(tasks.length)
  })
})

// ─── applyDragResult ───────────────────────────────────────────────

describe("applyDragResult", () => {
  const tasks = sampleTasks()

  it("returns tasks unchanged when destination is null (dropped outside)", () => {
    const result = applyDragResult(tasks, "a", { droppableId: "todo", index: 0 }, null)
    expect(result).toEqual(tasks)
  })

  it("returns tasks unchanged when source and destination are identical", () => {
    const result = applyDragResult(
      tasks,
      "a",
      { droppableId: "todo", index: 0 },
      { droppableId: "todo", index: 0 }
    )
    expect(result).toEqual(tasks)
  })

  it("routes to reorderWithinColumn when same column", () => {
    const result = applyDragResult(
      tasks,
      "a",
      { droppableId: "todo", index: 0 },
      { droppableId: "todo", index: 1 }
    )
    const todoTasks = result
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position)
    expect(todoTasks.map((t) => t.id)).toEqual(["b", "a"])
  })

  it("routes to moveBetweenColumns when different columns", () => {
    const result = applyDragResult(
      tasks,
      "a",
      { droppableId: "todo", index: 0 },
      { droppableId: "done", index: 0 }
    )
    expect(result.find((t) => t.id === "a")?.status).toBe("done")
  })
})

// ─── Integration scenarios ──────────────────────────────────────────

describe("drag-and-drop integration scenarios", () => {
  it("reorders a task within a column that has multiple items", () => {
    const tasks = [
      makeTask({ id: "1", status: "in_progress", position: 0 }),
      makeTask({ id: "2", status: "in_progress", position: 1 }),
      makeTask({ id: "3", status: "in_progress", position: 2 }),
    ]

    // Move task 1 (index 0) to index 2
    const result = reorderWithinColumn(tasks, "1", 0, 2, "in_progress")
    const colTasks = result
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.position - b.position)

    expect(colTasks.map((t) => t.id)).toEqual(["2", "3", "1"])
    expect(colTasks.map((t) => t.position)).toEqual([0, 1, 2])
  })

  it("moves a task and recalculates all positions sequentially", () => {
    // Tasks with non-sequential positions (simulating DB state after prior moves)
    const tasks = [
      makeTask({ id: "a", status: "todo", position: 5 }),
      makeTask({ id: "b", status: "todo", position: 10 }),
      makeTask({ id: "c", status: "in_progress", position: 0 }),
    ]

    // Move "a" from todo (index 0) to in_progress at index 1
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 1)

    const todoTasks = result
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position)
    expect(todoTasks).toHaveLength(1)
    expect(todoTasks[0].position).toBe(0)

    const ipTasks = result
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.position - b.position)
    expect(ipTasks).toHaveLength(2)
    expect(ipTasks[0].id).toBe("c") // stays at 0
    expect(ipTasks[1].id).toBe("a") // inserted at 1
    expect(ipTasks.map((t) => t.position)).toEqual([0, 1])
  })

  it("moves the last task in a column to another column at the end", () => {
    const tasks = [
      makeTask({ id: "a", status: "todo", position: 0 }),
      makeTask({ id: "b", status: "in_progress", position: 0 }),
    ]

    // Move "a" from todo (index 0) to in_progress at the end (index 1)
    const result = moveBetweenColumns(tasks, "a", "todo", "in_progress", 0, 1)

    const ipTasks = result
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.position - b.position)

    expect(ipTasks).toHaveLength(2)
    expect(ipTasks[0].id).toBe("b") // stays at 0
    expect(ipTasks[1].id).toBe("a") // appended at 1
    expect(ipTasks[1].position).toBe(1)
  })

  it("handles full Kanban lifecycle: create → reorder → move", () => {
    // Simulate: start with 1 task, add another, reorder, move to done
    let tasks: TaskItem[] = [
      makeTask({ id: "t1", title: "Design", status: "todo", position: 0 }),
    ]

    // Add a new task
    const newTask = makeTask({ id: "t2", title: "Code", status: "todo", position: 1 })
    tasks = [...tasks, newTask]
    expect(tasks).toHaveLength(2)

    // Reorder: move "Design" (index 0) after "Code" (index 1)
    tasks = reorderWithinColumn(tasks, "t1", 0, 1, "todo")
    const todoAfterReorder = getTasksByColumn(tasks, "todo")
    expect(todoAfterReorder.map((t) => t.id)).toEqual(["t2", "t1"])

    // Move "Design" to in_progress
    tasks = moveBetweenColumns(tasks, "t1", "todo", "in_progress", 1, 0)
    expect(tasks.find((t) => t.id === "t1")?.status).toBe("in_progress")

    // Verify todo column now only has "Code" at position 0
    const todoFinal = getTasksByColumn(tasks, "todo")
    expect(todoFinal).toHaveLength(1)
    expect(todoFinal[0].id).toBe("t2")
    expect(todoFinal[0].position).toBe(0)
  })

  it("does not mutate the original tasks array", () => {
    const tasks = sampleTasks()
    const originalJson = JSON.stringify(tasks)

    applyDragResult(tasks, "a", { droppableId: "todo", index: 0 }, { droppableId: "done", index: 0 })
    moveBetweenColumns(tasks, "a", "todo", "done", 0, 0)
    reorderWithinColumn(tasks, "a", 0, 1, "todo")

    expect(JSON.stringify(tasks)).toBe(originalJson)
  })
})
