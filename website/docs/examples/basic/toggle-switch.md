---
id: toggle-switch
title: Toggle Switch
sidebar_label: Toggle Switch
---

# Toggle Switch

A toggle switch example demonstrating Stage Flow with individual stage components and StageRenderer, including a result page accessible from both states.

## Overview

This example demonstrates a toggle switch with on/off functionality using Stage Flow with individual stage components and StageRenderer. It includes a result page that can be accessed from both the OFF and ON states.

## Key Features to Observe

1. **Individual Stage Components**: Each stage is a separate React component
2. **Props-based Communication**: Stage components receive data and actions as props
3. **StageRenderer Integration**: Uses StageRenderer for automatic stage switching
4. **Multi-stage Navigation**: OFF ↔ ON ↔ Result page transitions
5. **State Persistence**: Toggle state persists across stage changes
6. **Event Handling**: Toggle and navigation operations
7. **Visual Feedback**: Different styles for each state

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function ToggleSwitch() {
  // Off stage component
  function OffStage({ data, send }) {
    const handleToggle = React.useCallback(() => {
      send("toggle");
    }, [send]);

    const handleGoResult = React.useCallback(() => {
      send("showResult");
    }, [send]);

    return (
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "400px", backgroundColor: "white" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Toggle Switch</h2>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Status: OFF</h3>
          <p style={{ color: "#6c757d", margin: 0 }}>Current Stage: off</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleToggle}
            style={{
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              border: "none",
              cursor: "pointer",
              position: "relative",
              backgroundColor: "#6c757d",
              transition: "background-color 0.3s ease",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "3px",
                left: "3px",
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: "#2c3e50", fontSize: "16px", fontWeight: "500" }}>Current State: off</p>
          <p style={{ color: "#495057", fontSize: "14px" }}>Switch is OFF</p>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={handleGoResult} style={{ padding: "10px 24px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Go to Result Page
          </button>
        </div>
      </div>
    );
  }

  // On stage component
  function OnStage({ data, send }) {
    const handleToggle = React.useCallback(() => {
      send("toggle");
    }, [send]);

    const handleGoResult = React.useCallback(() => {
      send("showResult");
    }, [send]);

    return (
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "400px", backgroundColor: "white" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Toggle Switch</h2>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Status: ON</h3>
          <p style={{ color: "#6c757d", margin: 0 }}>Current Stage: on</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleToggle}
            style={{
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              border: "none",
              cursor: "pointer",
              position: "relative",
              backgroundColor: "#28a745",
              transition: "background-color 0.3s ease",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "white",
                position: "absolute",
                top: "3px",
                left: "33px",
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: "#2c3e50", fontSize: "16px", fontWeight: "500" }}>Current State: on</p>
          <p style={{ color: "#495057", fontSize: "14px" }}>Switch is ON</p>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={handleGoResult} style={{ padding: "10px 24px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Go to Result Page
          </button>
        </div>
      </div>
    );
  }

  // Result stage component
  function ResultStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back");
    }, [send]);

    return (
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "400px", backgroundColor: "white" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>✅ Result Page</h2>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#28a745" }}>Switch Status Result</h3>
          <p style={{ color: "#6c757d", margin: 0 }}>Current Stage: result</p>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={handleBack} style={{ padding: "10px 24px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Back to Toggle
          </button>
        </div>
      </div>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "off",
    stages: [
      {
        name: "off",
        data: { isOn: false },
        transitions: [
          { target: "on", event: "toggle" },
          { target: "result", event: "showResult" },
        ],
      },
      {
        name: "on",
        data: { isOn: true },
        transitions: [
          { target: "off", event: "toggle" },
          { target: "result", event: "showResult" },
        ],
      },
      {
        name: "result",
        data: { isOn: null },
        transitions: [{ target: "off", event: "back" }],
      },
    ],
  });
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          off: OffStage,
          on: OnStage,
          result: ResultStage,
        }}
      />
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Stage Configuration

The toggle switch uses a three-stage configuration:

1. **off**: The switch is in the off state
2. **on**: The switch is in the on state
3. **result**: A result page accessible from both states

### Key Features

- **Individual Stage Components**: Each stage is a separate React component with its own UI and logic
- **Props-based Communication**: Stage components receive data and actions as props
- **StageRenderer Integration**: Uses StageRenderer for automatic stage switching
- **Multi-stage Navigation**: Both OFF and ON states can navigate to the result page
- **Event Handling**: Toggle and navigation operations with useCallback for performance
- **Visual Feedback**: Different colors and positions for each state
- **Smooth Transitions**: CSS transitions for smooth visual changes

### Engine Creation

The engine is created directly without useRef for simplicity:

```javascript
const engine = new StageFlowEngine({
  initial: "off",
  stages: [
    {
      name: "off",
      data: { isOn: false },
      transitions: [
        { target: "on", event: "toggle" },
        { target: "result", event: "showResult" },
      ],
    },
    {
      name: "on",
      data: { isOn: true },
      transitions: [
        { target: "off", event: "toggle" },
        { target: "result", event: "showResult" },
      ],
    },
    {
      name: "result",
      data: { isOn: null },
      transitions: [{ target: "off", event: "back" }],
    },
  ],
});
```

### Stage Components

Each stage is defined as a separate component within the main function:

```javascript
function OffStage({ data, send }) {
  const handleToggle = React.useCallback(() => {
    send("toggle");
  }, [send]);

  const handleGoResult = React.useCallback(() => {
    send("showResult");
  }, [send]);

  // Component JSX...
}
```

### Event Handling

Events are handled with useCallback for optimal performance:

```javascript
const handleToggle = React.useCallback(() => {
  send("toggle");
}, [send]);

const handleGoResult = React.useCallback(() => {
  send("showResult");
}, [send]);
```

### Visual Design

The toggle switch uses CSS transitions and positioning to create a smooth sliding effect:

```javascript
style={{
  backgroundColor: "#28a745", // or "#6c757d" for off state
  transition: "background-color 0.3s ease",
}}
```

## Related Examples

- **[Simple Counter](./simple-counter.md)** - Basic increment/decrement functionality
- **[Todo List](./todo-list.md)** - Add, complete, and delete items with stage components
- **[Advanced Examples](/docs/examples/advanced/examples-multi-step-form)** - Complex multi-stage examples
