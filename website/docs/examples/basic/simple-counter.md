---
id: simple-counter
title: Simple Counter
sidebar_label: Simple Counter
---

# Simple Counter

A basic counter example demonstrating fundamental Stage Flow concepts.

## Overview

This example demonstrates a simple counter with increment, decrement, and reset functionality using Stage Flow with individual stage components and StageRenderer.

## Key Features to Observe

1. **Individual Stage Components**: Each stage is a separate React component
2. **Props-based Communication**: Stage components receive data and actions as props
3. **StageRenderer Integration**: Uses StageRenderer for automatic stage switching
4. **Event Handling**: Button clicks trigger state changes
5. **Data Persistence**: Counter value persists across state changes
6. **Reset Functionality**: Ability to reset to initial state

## Live Example

```jsx live
function SimpleCounter() {
  // Individual stage component for the counter
  function IdleStage({ data, send }) {
    const handleIncrement = React.useCallback(() => {
      send("increment", { count: (data?.count || 0) + 1 });
    }, [data?.count, send]);

    const handleDecrement = React.useCallback(() => {
      send("decrement", { count: Math.max(0, (data?.count || 0) - 1) });
    }, [data?.count, send]);

    const handleReset = React.useCallback(() => {
      send("reset", { count: 0 });
    }, [send]);

    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "400px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Simple Counter</h2>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Count: {data?.count || 0}</h3>
          <p style={{ color: "#6c757d", margin: 0 }}>Current Stage: idle</p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={handleIncrement}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Increment
          </button>
          <button
            onClick={handleDecrement}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Decrement
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Reset
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
        data: { count: 0 },
        transitions: [
          { target: "idle", event: "increment" },
          { target: "idle", event: "decrement" },
          { target: "idle", event: "reset" },
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
        }}
        data={{ count: 0 }}
        send={(event, data) => {
          if (event === "increment") {
            engine.send("increment", data);
          } else if (event === "decrement") {
            engine.send("decrement", data);
          } else if (event === "reset") {
            engine.send("reset", data);
          }
        }}
      />
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Stage Component Structure

The counter now uses individual stage components:

```javascript
function IdleStage({ data, send }) {
  // Stage-specific logic and UI
  return <div>{/* Counter UI */}</div>;
}
```

### Key Features

- **Individual Stage Components**: Each stage is a separate React component
- **Props-based Communication**: Stage components receive `data` and `send` as props
- **StageRenderer Integration**: Automatic stage switching based on current stage
- **Minimal React dependency**: Only useRef for engine storage
- **Stage Flow state management**: All counter data managed by engine
- **Event Handling**: Three events: increment, decrement, reset
- **Boundary Conditions**: Decrement won't go below 0

### Engine Creation

The engine is created **once using useRef** for minimal React dependency:

```javascript
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function SimpleCounter() {
  // Create engine once using useRef (minimal dependency)
  const engineRef = React.useRef();

  if (!engineRef.current) {
    engineRef.current = new StageFlowEngine({
      initial: "idle",
      stages: [
        {
          name: "idle",
          data: { count: 0 },
          transitions: [
            { target: "idle", event: "increment" },
            { target: "idle", event: "decrement" },
            { target: "idle", event: "reset" },
          ],
        },
      ],
    });

    engineRef.current.start();
  }

  const { currentStage, data, send } = useStageFlow(engineRef.current);
}
```

### StageRenderer Setup

```javascript
const stageComponents = {
  idle: IdleStage,
};

return (
  <StageFlowProvider engine={engineRef.current}>
    <StageRenderer currentStage={currentStage} stageComponents={stageComponents} data={data} send={send} />
  </StageFlowProvider>
);
```

### State Management

```javascript
const { currentStage, data, send } = useStageFlow(engineRef.current);
```

- `currentStage`: Always "idle" in this simple example
- `data`: Contains the counter value
- `send`: Function to send events to the engine

### Event Handling in Stage Component

```javascript
function IdleStage({ data, send }) {
  const handleIncrement = () => {
    send("increment", { count: (data?.count || 0) + 1 });
  };
}
```

Each event updates the counter value in the engine data.

## Benefits of This Approach

1. **Separation of Concerns**: Each stage has its own component
2. **Reusability**: Stage components can be reused across different flows
3. **Maintainability**: Easier to maintain and test individual stages
4. **Scalability**: Easy to add new stages or modify existing ones
5. **Type Safety**: Better TypeScript support with component props

## Related Examples

- **[Todo List](./todo-list.md)** - Add, complete, and delete items
- **[Toggle Switch](./toggle-switch.md)** - Simple on/off state management
- **[Advanced Examples](../advanced/overview)** - Complex multi-stage examples
