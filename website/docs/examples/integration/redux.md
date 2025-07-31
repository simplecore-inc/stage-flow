---
id: redux-integration
title: Redux Integration
sidebar_label: Redux Integration
---

# Redux Integration

Integration with Redux for state synchronization.

## Overview

This example demonstrates how to integrate Stage Flow with Redux for state synchronization and global state management.

## Key Features to Observe

1. **State Synchronization**: Stage Flow state syncs with Redux store
2. **Action Dispatching**: Stage Flow events trigger Redux actions
3. **Redux State Monitoring**: Real-time display of Redux state
4. **History Tracking**: Track stage transitions in Redux

## Live Example

```jsx live
// import React, { useEffect } from 'react';
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function ReduxIntegration() {
  const [engine] = React.useState(
    () =>
      new StageFlowEngine({
        initial: "idle",
        stages: [
          {
            name: "idle",
            data: { items: [], loading: false },
            transitions: [{ target: "loading", event: "fetchData" }],
          },
          {
            name: "loading",
            data: { items: [], loading: true },
            transitions: [
              { target: "success", event: "dataLoaded" },
              { target: "error", event: "dataError" },
            ],
          },
          {
            name: "success",
            data: { items: [], loading: false },
            transitions: [
              { target: "loading", event: "refresh" },
              { target: "idle", event: "reset" },
            ],
          },
          {
            name: "error",
            data: { items: [], loading: false },
            transitions: [
              { target: "loading", event: "retry" },
              { target: "idle", event: "reset" },
            ],
          },
        ],
      })
  );

  // Start the engine when component mounts
  React.useEffect(() => {
    engine.start();
  }, [engine]);

  const { currentStage, data, send } = useStageFlow(engine);

  // Simulated Redux store
  const [reduxState, setReduxState] = React.useState({
    stage: "idle",
    data: { items: [], loading: false },
    history: []
  });

  // Redux sync hook
  const useReduxSync = () => {
    const { currentStage, data } = useStageFlow(engine);
    
    React.useEffect(() => {
      setReduxState(prev => ({
        ...prev,
        stage: currentStage,
        data,
        history: [...prev.history, {
          stage: currentStage,
          timestamp: Date.now()
        }]
      }));
    }, [currentStage, data]);
    
    return { currentStage, data };
  };

  const { currentStage: syncedStage, data: syncedData } = useReduxSync();

  const handleFetchData = async () => {
    send("fetchData");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success or error
    if (Math.random() > 0.3) {
      send("dataLoaded", { 
        items: ["Item 1", "Item 2", "Item 3", "Item 4"], 
        loading: false 
      });
    } else {
      send("dataError", { 
        items: [], 
        loading: false, 
        error: "Failed to fetch data" 
      });
    }
  };

  return (
    <StageFlowProvider engine={engine}>
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>Redux Integration</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Current Stage: {currentStage}</h3>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button 
              onClick={handleFetchData}
              disabled={currentStage === "loading"}
              style={{
                padding: "10px 20px",
                backgroundColor: currentStage === "loading" ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: currentStage === "loading" ? "not-allowed" : "pointer"
              }}
            >
              {currentStage === "loading" ? "Loading..." : "Fetch Data"}
            </button>
            <button 
              onClick={() => send("reset")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Reset
            </button>
          </div>
        </div>
        
        <div style={{ 
          padding: "20px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "4px",
          minHeight: "150px"
        }}>
          {currentStage === "idle" && (
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Ready to Fetch</h4>
              <p style={{ color: "#666" }}>
                Click "Fetch Data" to load items from the API.
              </p>
            </div>
          )}
          
          {currentStage === "loading" && (
            <div style={{ textAlign: "center" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Loading...</h4>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
          
          {currentStage === "success" && (
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#28a745" }}>Data Loaded Successfully!</h4>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {data.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: "5px", color: "#333" }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {currentStage === "error" && (
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#dc3545" }}>Error Loading Data</h4>
              <p style={{ color: "#dc3545", marginBottom: "15px" }}>{data.error}</p>
              <button 
                onClick={() => send("retry")}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
        
        {/* Redux State Display */}
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#e9ecef", 
          borderRadius: "4px",
          marginTop: "15px"
        }}>
          <h5 style={{ margin: "0 0 10px 0", color: "#333" }}>Redux State</h5>
          <pre style={{ 
            margin: 0, 
            fontSize: "12px", 
            color: "#666",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "4px",
            overflow: "auto"
          }}>
            {JSON.stringify(reduxState, null, 2)}
          </pre>
        </div>
      </div>
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Redux Store Simulation

A simple Redux store simulation:

```javascript
const [reduxState, setReduxState] = React.useState({
  stage: "idle",
  data: { items: [], loading: false },
  history: []
});
```

### Redux Sync Hook

A custom hook to sync Stage Flow state with Redux:

```javascript
const useReduxSync = () => {
  const { currentStage, data } = useStageFlow(engine);
  
  React.useEffect(() => {
    setReduxState(prev => ({
      ...prev,
      stage: currentStage,
      data,
      history: [...prev.history, {
        stage: currentStage,
        timestamp: Date.now()
      }]
    }));
  }, [currentStage, data]);
  
  return { currentStage, data };
};
```

### Action Dispatching

Stage Flow events trigger Redux actions:

```javascript
const handleFetchData = async () => {
  send("fetchData"); // This triggers Redux action via useReduxSync
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (Math.random() > 0.3) {
    send("dataLoaded", { items: ["Item 1", "Item 2"], loading: false });
  } else {
    send("dataError", { items: [], loading: false, error: "Failed" });
  }
};
```

## Benefits

1. **Centralized State**: Redux manages global state while Stage Flow handles flow logic
2. **Predictable State**: Redux provides predictable state management
3. **Developer Tools**: Redux DevTools for debugging
4. **History Tracking**: Complete history of state changes

## Related Examples

- **[React Router Integration](./react-router.md)** - Navigation-based state management
- **[Context API Integration](./context-api.md)** - Global state management
- **[Basic Examples](../basic/basic)** - Simple stage machine examples 