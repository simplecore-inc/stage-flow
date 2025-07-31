---
id: todo-list
title: Todo List
sidebar_label: Todo List
---

# Todo List

A todo list example demonstrating Stage Flow with dynamic data management using individual stage components and StageRenderer.

## Overview

This example demonstrates a todo list with add, complete, and delete functionality using Stage Flow with individual stage components and StageRenderer.

## Key Features to Observe

1. **Individual Stage Components**: Each stage is a separate React component
2. **Props-based Communication**: Stage components receive data and actions as props
3. **StageRenderer Integration**: Uses StageRenderer for automatic stage switching
4. **Dynamic Data Management**: Adding and removing items from the list
5. **State Persistence**: Todo items persist across state changes
6. **Event Handling**: Add, complete, and delete operations
7. **Data Validation**: Input validation for new todos

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function TodoList() {
  // Individual stage component for the todo list
  function IdleStage({ data, send }) {
    const handleAddTodo = React.useCallback(() => {
      if (data?.newTodo?.trim()) {
        const todo = {
          id: Date.now(),
          text: data.newTodo.trim(),
          completed: false,
        };
        send("addTodo", {
          todos: [...(data?.todos || []), todo],
          newTodo: "",
        });
      }
    }, [data?.newTodo, data?.todos, send]);

    const handleCompleteTodo = React.useCallback((id) => {
      const updatedTodos = (data?.todos || []).map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      send("completeTodo", { todos: updatedTodos });
    }, [data?.todos, send]);

    const handleDeleteTodo = React.useCallback((id) => {
      const updatedTodos = (data?.todos || []).filter((todo) => todo.id !== id);
      send("deleteTodo", { todos: updatedTodos });
    }, [data?.todos, send]);

    const handleUpdateNewTodo = React.useCallback((value) => {
      send("updateNewTodo", { ...data, newTodo: value });
    }, [data, send]);

    const handleKeyPress = React.useCallback((e) => {
      if (e.key === "Enter") {
        handleAddTodo();
      }
    }, [handleAddTodo]);

    const handleSave = React.useCallback(() => {
      send("save", { ...data });
    }, [data, send]);

    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "500px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
          Todo List
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={data?.newTodo || ""}
              onChange={(e) => handleUpdateNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new todo..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginRight: "10px",
                fontSize: "14px",
                color: "#2c3e50",
                backgroundColor: "white",
              }}
            />
            <button
              onClick={handleAddTodo}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Add
            </button>
          </div>
          <p style={{ color: "#6c757d", margin: 0, fontSize: "14px" }}>
            Current Stage: idle
          </p>
        </div>

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
            Todos ({data?.todos?.length || 0})
          </h3>
          {data?.todos?.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", fontStyle: "italic" }}>
              No todos yet. Add one above!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data?.todos?.map((todo) => (
                <div
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    backgroundColor: todo.completed ? "#f8f9fa" : "white",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleCompleteTodo(todo.id)}
                    style={{ marginRight: "10px" }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "#6c757d" : "#495057",
                    }}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Save Todos
          </button>
        </div>
      </div>
    );
  }

  // Saved stage component
  function SavedStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back", { ...data });
    }, [data, send]);

    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "500px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
          ✅ Todos Saved Successfully!
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#28a745", margin: "0 0 10px 0", fontSize: "16px" }}>
            Your todos have been saved successfully.
          </p>
          <p style={{ color: "#6c757d", margin: 0, fontSize: "14px" }}>
            Current Stage: saved
          </p>
        </div>

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
            Saved Todos ({data?.todos?.length || 0})
          </h3>
          {data?.todos?.length === 0 ? (
            <p style={{ color: "#6c757d", textAlign: "center", fontStyle: "italic" }}>
              No todos were saved.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data?.todos?.map((todo) => (
                <div
                  key={todo.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    backgroundColor: todo.completed ? "#f8f9fa" : "white",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    disabled
                    style={{ marginRight: "10px" }}
                  />
                  <span
                    style={{
                      flex: 1,
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "#6c757d" : "#495057",
                    }}
                  >
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Back to Edit
          </button>
        </div>
      </div>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "idle",
    stages: [
      {
        name: "idle",
        data: { todos: [], newTodo: "" },
        transitions: [
          { target: "idle", event: "addTodo" },
          { target: "idle", event: "completeTodo" },
          { target: "idle", event: "deleteTodo" },
          { target: "idle", event: "updateNewTodo" },
          { target: "saved", event: "save" },
        ],
      },
      {
        name: "saved",
        data: { todos: [], newTodo: "" },
        transitions: [
          { target: "idle", event: "back" },
        ],
      },
    ],
  });

  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        currentStage="idle"
        stageComponents={{
          idle: IdleStage,
          saved: SavedStage,
        }}
        data={{ todos: [], newTodo: "" }}
        send={(event, data) => {
          if (event === "addTodo") {
            engine.send("addTodo", data);
          } else if (event === "completeTodo") {
            engine.send("completeTodo", data);
          } else if (event === "deleteTodo") {
            engine.send("deleteTodo", data);
          } else if (event === "updateNewTodo") {
            engine.send("updateNewTodo", data);
          } else if (event === "save") {
            engine.send("save", data);
          } else if (event === "back") {
            engine.send("back", data);
          }
        }}
      />
    </StageFlowProvider>
  );
}
```