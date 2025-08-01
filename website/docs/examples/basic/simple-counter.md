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
    const { engine } = useStageFlow();
    
    const handleIncrement = React.useCallback(() => {
      const newCount = (data?.count || 0) + 1;
      engine.setStageData({ count: newCount });
    }, [data?.count, engine]);

    const handleDecrement = React.useCallback(() => {
      const newCount = Math.max(0, (data?.count || 0) - 1);
      engine.setStageData({ count: newCount });
    }, [data?.count, engine]);

    const handleReset = React.useCallback(() => {
      engine.setStageData({ count: 0 });
    }, [engine]);

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
          // Removed self-transitions since we're using setStageData
        ],
      },
    ],
  });

  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          idle: IdleStage,
        }}
      />
    </StageFlowProvider>
  );
}