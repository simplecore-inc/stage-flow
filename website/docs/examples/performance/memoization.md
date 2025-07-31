---
id: memoization
title: Memoization
sidebar_label: Memoization
---

# Memoization

Using React.memo and useCallback for performance optimization.

## Overview

This example demonstrates how to use React.memo and useCallback with Stage Flow to prevent unnecessary re-renders and optimize performance.

## Key Features to Observe

1. **Memoized Components**: Components that only re-render when their props change
2. **Optimized Callbacks**: useCallback to prevent function recreation
3. **Computed Values**: useMemo for expensive calculations
4. **Performance Monitoring**: Console logs to track re-renders

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function MemoizationExample() {
  // Create engine once using useRef (minimal dependency)
  const engineRef = React.useRef();
  
  if (!engineRef.current) {
    engineRef.current = new StageFlowEngine({
      initial: "idle",
      data: { 
        items: [],
        totalValue: 0,
        averageValue: 0,
        loading: false,
        error: null
      },
      stages: [
        {
          name: "idle",
          transitions: [
            { target: "loading", event: "fetchData" },
            { target: "idle", event: "addItem" },
            { target: "idle", event: "removeItem" },
            { target: "idle", event: "updateItem" },
            { target: "idle", event: "reset" },
          ],
        },
        {
          name: "loading",
          transitions: [
            { target: "success", event: "dataLoaded" },
            { target: "error", event: "dataError" },
          ],
        },
        {
          name: "success",
          transitions: [
            { target: "idle", event: "reset" },
            { target: "loading", event: "fetchData" },
            { target: "success", event: "dataLoaded" },
            { target: "success", event: "updateItem" },
            { target: "success", event: "removeItem" },
            { target: "success", event: "addItem" },
          ],
        },
        {
          name: "error",
          transitions: [
            { target: "loading", event: "retry" },
            { target: "idle", event: "reset" },
          ],
        },
      ],
    });

    engineRef.current.start();
  }

  const { currentStage, data, send } = useStageFlow(engineRef.current);

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: `Item ${Date.now()}`,
      value: Math.floor(Math.random() * 100) + 1,
    };
    const updatedItems = [...(data?.items || []), newItem];
    const totalValue = updatedItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = updatedItems.length > 0 ? totalValue / updatedItems.length : 0;
    
    send("addItem", { 
      items: updatedItems,
      totalValue,
      averageValue
    });
  };

  const removeItem = (id) => {
    const updatedItems = data?.items?.filter((item) => item.id !== id) || [];
    const totalValue = updatedItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = updatedItems.length > 0 ? totalValue / updatedItems.length : 0;
    
    send("removeItem", { 
      items: updatedItems,
      totalValue,
      averageValue
    });
  };

  const updateItem = (id, newValue) => {
    const updatedItems = data?.items?.map((item) =>
      item.id === id ? { ...item, value: newValue } : item
    ) || [];
    const totalValue = updatedItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = updatedItems.length > 0 ? totalValue / updatedItems.length : 0;
    
    send("updateItem", { 
      items: updatedItems,
      totalValue,
      averageValue
    });
  };

  // Memoized component
  const MemoizedItem = React.memo(function Item({ 
    item, 
    onUpdate, 
    onDelete 
  }) {
    console.log(`Rendering item: ${item.name}`); // This will only log when the item actually re-renders
    
    return (
      <div style={{ 
        padding: "15px", 
        border: "1px solid #ddd", 
        borderRadius: "4px",
        marginBottom: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{item.name}</h4>
          <p style={{ margin: 0, color: "#333" }}>Value: {item.value}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => onUpdate(item.id, item.value + 1)}
            style={{
              padding: "4px 8px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            +
          </button>
          <button 
            onClick={() => onUpdate(item.id, Math.max(0, item.value - 1))}
            style={{
              padding: "4px 8px",
              backgroundColor: "#ffc107",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            -
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            style={{
              padding: "4px 8px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleUpdateItem = useCallback((id, value) => {
    const updatedItems = data?.items?.map(item =>
      item.id === id ? { ...item, value } : item
    ) || [];
    const totalValue = updatedItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = updatedItems.length > 0 ? totalValue / updatedItems.length : 0;
    
    send("updateItem", { 
      items: updatedItems,
      totalValue,
      averageValue
    });
  }, [data?.items, send]);
  
  const handleDeleteItem = useCallback((id) => {
    const updatedItems = data?.items?.filter(item => item.id !== id) || [];
    const totalValue = updatedItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = updatedItems.length > 0 ? totalValue / updatedItems.length : 0;
    
    send("removeItem", { 
      items: updatedItems,
      totalValue,
      averageValue
    });
  }, [data?.items, send]);
  
  const handleFetchData = useCallback(async () => {
    send("fetchData");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockItems = [
      { id: "1", name: "Item 1", value: 10 },
      { id: "2", name: "Item 2", value: 20 },
      { id: "3", name: "Item 3", value: 30 },
      { id: "4", name: "Item 4", value: 40 }
    ];
    
    const totalValue = mockItems.reduce((sum, item) => sum + item.value, 0);
    const averageValue = mockItems.length > 0 ? totalValue / mockItems.length : 0;
    
    send("dataLoaded", { 
      items: mockItems, 
      totalValue,
      averageValue,
      loading: false 
    });
  }, [send]);
  
  const handleReset = useCallback(() => {
    send("reset");
  }, [send]);
  
  const handleRetry = useCallback(() => {
    send("retry");
  }, [send]);
  
  // Memoized computed values
  const totalValue = useMemo(() => {
    return data?.items?.reduce((sum, item) => sum + item.value, 0) || 0;
  }, [data?.items]);
  
  const averageValue = useMemo(() => {
    return data?.items?.length > 0 ? totalValue / data.items.length : 0;
  }, [totalValue, data?.items?.length]);

  return (
    <StageFlowProvider engine={engineRef.current}>
      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px", backgroundColor: "white" }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>Memoization Example</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Current Stage: {currentStage}</h3>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
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
            {(currentStage === "idle" || currentStage === "success") && (
              <button 
                onClick={addItem}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Add Item
              </button>
            )}
            <button 
              onClick={handleReset}
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
          minHeight: "200px"
        }}>
          {currentStage === "idle" && (
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Ready to Fetch</h4>
              <p style={{ color: "#333", margin: "0 0 20px 0" }}>
                Click "Fetch Data" to load items or "Add Item" to add items manually. Components are memoized for better performance.
              </p>
              
              {data?.items && data.items.length > 0 && (
                <div>
                  <h5 style={{ margin: "0 0 15px 0", color: "#333" }}>Current Items ({data.items.length})</h5>
                  <div>
                    {data.items.map(item => (
                      <MemoizedItem
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </div>
              )}
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
              
              <div style={{ 
                display: "flex", 
                gap: "20px", 
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "4px"
              }}>
                <div style={{ color: "#333" }}>
                  <strong style={{ color: "#333" }}>Total Items:</strong> {data?.items?.length || 0}
                </div>
                <div style={{ color: "#333" }}>
                  <strong style={{ color: "#333" }}>Total Value:</strong> {totalValue}
                </div>
                <div style={{ color: "#333" }}>
                  <strong style={{ color: "#333" }}>Average Value:</strong> {averageValue.toFixed(1)}
                </div>
              </div>
              
              <div>
                {data?.items?.map(item => (
                  <MemoizedItem
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                )) || []}
              </div>
            </div>
          )}
          
          {currentStage === "error" && (
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#dc3545" }}>Error Loading Data</h4>
              <p style={{ color: "#dc3545", marginBottom: "15px" }}>{data?.error}</p>
              <button 
                onClick={handleRetry}
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
        
        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "4px",
          fontSize: "12px",
          color: "#333"
        }}>
          <strong style={{ color: "#333" }}>Performance Note:</strong> Check the console to see that items only re-render when their specific data changes, not when other items change.
        </div>
      </div>
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Memoized Component

Using React.memo to prevent unnecessary re-renders:

```javascript
const MemoizedItem = React.memo(function Item({ item, onUpdate, onDelete }) {
  console.log(`Rendering item: ${item.name}`); // Only logs when item actually re-renders
  return <div>{item.name}</div>;
});
```

### Optimized Callbacks

Using useCallback to prevent function recreation:

```javascript
const handleUpdateItem = useCallback((id, value) => {
  const updatedItems = data.items.map(item =>
    item.id === id ? { ...item, value } : item
  );
  send("dataLoaded", { items: updatedItems, loading: false });
}, [data.items, send]);
```

### Memoized Computed Values

Using useMemo for expensive calculations:

```javascript
const totalValue = useMemo(() => {
  return data.items.reduce((sum, item) => sum + item.value, 0);
}, [data.items]);

const averageValue = useMemo(() => {
  return data.items.length > 0 ? totalValue / data.items.length : 0;
}, [totalValue, data.items.length]);
```

## Benefits

1. **Reduced Re-renders**: Components only re-render when their specific props change
2. **Better Performance**: Expensive calculations are cached
3. **Predictable Behavior**: Clear dependency arrays for callbacks and computed values
4. **Easy Debugging**: Console logs help track when components actually re-render

## Related Examples

- **[Lazy Loading](./lazy-loading.md)** - Component lazy loading based on stages

- **[Basic Examples](../basic/basic)** - Simple stage machine examples 