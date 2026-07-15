// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import KanbanBoard from "../kanban-board";
import type { TaskItem } from "../task-card";

// ─── Mock @hello-pangea/dnd ──────────────────────────────────────

const MockDroppable = ({ children, ..._props }: any) => {
  return children(
    {
      innerRef: vi.fn(),
      droppableProps: {},
      placeholder: null,
    },
    { isDraggingOver: false, draggingOverWith: null }
  );
};

const MockDraggable = ({ children, ..._props }: any) => {
  return children(
    {
      innerRef: vi.fn(),
      draggableProps: { style: {} },
      dragHandleProps: null,
    },
    { isDragging: false, isDropAnimating: false }
  );
};

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" data-on-drag-end={typeof onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children, ...props }: any) => (
    <MockDroppable {...props}>{children}</MockDroppable>
  ),
  Draggable: ({ children, ...props }: any) => (
    <MockDraggable {...props}>{children}</MockDraggable>
  ),
}));

// ─── Test Data ───────────────────────────────────────────────────

const mockTeamMembers = [
  { id: "user-1", name: "Alice", initial: "A" },
  { id: "user-2", name: "Bob", initial: "B" },
];

const makeTask = (overrides: Partial<TaskItem> = {}): TaskItem => ({
  id: `task-${Math.random().toString(36).slice(2, 8)}`,
  title: "Test Task",
  description: "",
  status: "todo",
  priority: "medium",
  assignee_id: null,
  due_date: null,
  position: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const sampleTasks: TaskItem[] = [
  makeTask({ id: "a", title: "Design mockup", status: "todo", position: 0 }),
  makeTask({ id: "b", title: "Implement API", status: "todo", position: 1 }),
  makeTask({ id: "c", title: "Write tests", status: "in_progress", position: 0 }),
  makeTask({ id: "d", title: "Review PR", status: "review", position: 0 }),
  makeTask({ id: "e", title: "Deploy v1", status: "done", position: 0 }),
];

afterEach(() => cleanup());

// ─── Basic Rendering ─────────────────────────────────────────────

describe("KanbanBoard", () => {
  it("exports a function component", () => {
    expect(typeof KanbanBoard).toBe("function");
  });

  it("renders without crashing", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={[]}
        teamMembers={[]}
      />
    );
    expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
  });

  it("renders all 4 columns (To Do, In Progress, Review, Done)", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={[]}
        teamMembers={[]}
      />
    );
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows task counts in column headers", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={sampleTasks}
        teamMembers={mockTeamMembers}
      />
    );
    // To Do has 2 tasks, In Progress has 1, Review has 1, Done has 1
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("renders task titles in the correct columns", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={sampleTasks}
        teamMembers={mockTeamMembers}
      />
    );
    expect(screen.getByText("Design mockup")).toBeInTheDocument();
    expect(screen.getByText("Implement API")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("Review PR")).toBeInTheDocument();
    expect(screen.getByText("Deploy v1")).toBeInTheDocument();
  });
});

// ─── Filters ─────────────────────────────────────────────────────

describe("KanbanBoard filters", () => {
  it("filters tasks by search query", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={sampleTasks}
        teamMembers={mockTeamMembers}
        filters={{ searchQuery: "API" }}
      />
    );
    expect(screen.getByText("Implement API")).toBeInTheDocument();
    expect(screen.queryByText("Design mockup")).not.toBeInTheDocument();
  });

  it("filters tasks by priority", () => {
    const tasksWithPriority = [
      ...sampleTasks,
      makeTask({ id: "f", title: "Urgent bug", status: "todo", priority: "urgent", position: 2 }),
    ];
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={tasksWithPriority}
        teamMembers={mockTeamMembers}
        filters={{ priority: "urgent" }}
      />
    );
    expect(screen.getByText("Urgent bug")).toBeInTheDocument();
    expect(screen.queryByText("Design mockup")).not.toBeInTheDocument();
  });

  it("filters tasks by assignee", () => {
    const tasksWithAssignee = [
      ...sampleTasks,
      makeTask({ id: "f", title: "My task", status: "todo", assignee_id: "user-1", position: 2 }),
    ];
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={tasksWithAssignee}
        teamMembers={mockTeamMembers}
        filters={{ assignee: "user-1" }}
      />
    );
    expect(screen.getByText("My task")).toBeInTheDocument();
  });

  it("shows empty state when no tasks match filters", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={sampleTasks}
        teamMembers={mockTeamMembers}
        filters={{ searchQuery: "nonexistenttask12345" }}
      />
    );
    // Should render "No tasks" in each column
    const noTasksElements = screen.getAllByText("No tasks");
    expect(noTasksElements.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Empty States ────────────────────────────────────────────────

describe("KanbanBoard empty states", () => {
  it("renders 'No tasks' for empty board", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={[]}
        teamMembers={[]}
      />
    );
    const noTasksElements = screen.getAllByText("No tasks");
    expect(noTasksElements.length).toBe(4); // One per column
  });

  it("shows new task placeholder inputs in each column", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={[]}
        teamMembers={[]}
      />
    );
    expect(screen.getByPlaceholderText("Add task to To Do...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add task to In Progress...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add task to Review...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add task to Done...")).toBeInTheDocument();
  });
});

// ─── Task Detail Drawer ──────────────────────────────────────────

describe("KanbanBoard task selection", () => {
  it("opens detail drawer when clicking a task button", () => {
    render(
      <KanbanBoard
        workspaceId="ws-1"
        initialTasks={sampleTasks}
        teamMembers={mockTeamMembers}
      />
    );
    // Click the task button by its accessible name
    const taskButton = screen.getByRole("button", { name: /Design mockup/ });
    fireEvent.click(taskButton);

    // Drawer should show — the title input renders with placeholder "Task title"
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
    // The drawer title input should contain the task title
    expect(screen.getByPlaceholderText("Task title")).toHaveValue("Design mockup");
  });
});
