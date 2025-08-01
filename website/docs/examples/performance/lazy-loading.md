---
id: lazy-loading
title: Lazy Loading
sidebar_label: Lazy Loading
---

# Lazy Loading

Lazy loading components based on stage transitions.

## Overview

This example demonstrates how to use React's lazy loading with Stage Flow to improve performance by only loading components when they're needed.

## Key Features to Observe

1. **Lazy Loading**: Components are loaded only when needed
2. **Suspense Integration**: Loading states during component loading
3. **Performance Optimization**: Reduced initial bundle size
4. **Stage-Based Loading**: Components load based on current stage

## Live Example

```jsx live
// import React, { lazy, Suspense } from 'react';
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow, StageRenderer } from '@stage-flow/react';

function LazyLoadingExample() {
  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "login",
    stages: [
      {
        name: "login",
        transitions: [{ target: "dashboard", event: "login" }],
      },
      {
        name: "dashboard",
        transitions: [
          { target: "profile", event: "navigateToProfile" },
          { target: "settings", event: "navigateToSettings" },
          { target: "login", event: "logout" },
        ],
      },
      {
        name: "profile",
        transitions: [
          { target: "dashboard", event: "navigateToDashboard" },
          { target: "settings", event: "navigateToSettings" },
          { target: "login", event: "logout" },
        ],
      },
      {
        name: "settings",
        transitions: [
          { target: "dashboard", event: "navigateToDashboard" },
          { target: "profile", event: "navigateToProfile" },
          { target: "login", event: "logout" },
        ],
      },
    ],
  });
  
  engine.start();

  // Lazy load components
  const LoginPage = React.lazy(() =>
    Promise.resolve({
      default: ({ data, send }) => (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ color: "#333", margin: "0 0 15px 0" }}>Login Page</h3>
          <p style={{ color: "#666", margin: "0 0 20px 0" }}>This component is lazy loaded.</p>
          <button
            onClick={() => send("login")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      ),
    })
  );

  const DashboardPage = React.lazy(() =>
    Promise.resolve({
      default: ({ data, send }) => (
        <div style={{ padding: "20px" }}>
          <h3 style={{ color: "#333", margin: "0 0 15px 0" }}>Dashboard</h3>
          <p style={{ color: "#666", margin: "0 0 20px 0" }}>This dashboard component is lazy loaded for better performance.</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <h4 style={{ color: "#333", margin: "0 0 10px 0" }}>Analytics</h4>
              <p style={{ color: "#666", margin: "0" }}>View your analytics data</p>
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <h4 style={{ color: "#333", margin: "0 0 10px 0" }}>Reports</h4>
              <p style={{ color: "#666", margin: "0" }}>Generate reports</p>
            </div>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => send("navigateToProfile")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Go to Profile
            </button>
            <button
              onClick={() => send("navigateToSettings")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      ),
    })
  );

  const ProfilePage = React.lazy(() =>
    Promise.resolve({
      default: ({ data, send }) => (
        <div style={{ padding: "20px" }}>
          <h3 style={{ color: "#333", margin: "0 0 15px 0" }}>Profile</h3>
          <p style={{ color: "#666", margin: "0 0 20px 0" }}>This profile component is lazy loaded.</p>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              marginTop: "15px",
            }}
          >
            <h4 style={{ color: "#333", margin: "0 0 15px 0" }}>User Information</h4>
            <p style={{ color: "#666", margin: "0 0 8px 0" }}>
              <strong style={{ color: "#333" }}>Name:</strong> John Doe
            </p>
            <p style={{ color: "#666", margin: "0 0 8px 0" }}>
              <strong style={{ color: "#333" }}>Email:</strong> john@example.com
            </p>
            <p style={{ color: "#666", margin: "0" }}>
              <strong style={{ color: "#333" }}>Member since:</strong> January 2024
            </p>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => send("navigateToDashboard")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => send("navigateToSettings")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      ),
    })
  );

  const SettingsPage = React.lazy(() =>
    Promise.resolve({
      default: ({ data, send }) => (
        <div style={{ padding: "20px" }}>
          <h3 style={{ color: "#333", margin: "0 0 15px 0" }}>Settings</h3>
          <p style={{ color: "#666", margin: "0 0 20px 0" }}>This settings component is lazy loaded.</p>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              marginTop: "15px",
            }}
          >
            <h4 style={{ color: "#333", margin: "0 0 15px 0" }}>Preferences</h4>
            <label style={{ display: "block", marginBottom: "10px", color: "#666" }}>
              <input
                type="checkbox"
                defaultChecked
                style={{ marginRight: "8px" }}
              />
              Email notifications
            </label>
            <label style={{ display: "block", marginBottom: "10px", color: "#666" }}>
              <input
                type="checkbox"
                defaultChecked
                style={{ marginRight: "8px" }}
              />
              Push notifications
            </label>
            <label style={{ display: "block", color: "#666" }}>
              <input type="checkbox" style={{ marginRight: "8px" }} />
              SMS notifications
            </label>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => send("navigateToDashboard")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => send("navigateToProfile")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      ),
    })
  );

  return (
    <StageFlowProvider engine={engine}>
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "800px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
          Lazy Loading Example
        </h2>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            minHeight: "300px",
          }}
        >
          <React.Suspense
            fallback={
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #007bff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto",
                  }}
                />
                <p style={{ marginTop: "15px", color: "#666" }}>
                  Loading component...
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            }
          >
            <StageRenderer
              stageComponents={{
                login: LoginPage,
                dashboard: DashboardPage,
                profile: ProfilePage,
                settings: SettingsPage,
              }}
            />
          </React.Suspense>
        </div>
      </div>
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Engine Setup

The Stage Flow Engine is created directly:

```javascript
const engine = new StageFlowEngine({
  initial: "login",
  stages: [...]
});

engine.start();
```

### Lazy Loading Setup

Components are lazy loaded using React.lazy:

```javascript
const LoginPage = React.lazy(() =>
  Promise.resolve({
    default: () => <LoginComponent />
  })
);
```

### Suspense Integration

Suspense provides a fallback during component loading:

```javascript
<React.Suspense fallback={<LoadingSpinner />}>
  {renderStage()}
</React.Suspense>
```

### Stage-Based Rendering

Components are rendered using StageRenderer:

```javascript
<StageRenderer
  stageComponents={{
    login: LoginPage,
    dashboard: DashboardPage,
    profile: ProfilePage,
    settings: SettingsPage,
  }}
/>
```

## Benefits

1. **Reduced Initial Bundle Size**: Only load components when needed
2. **Better Performance**: Faster initial page load
3. **Memory Efficiency**: Components are loaded on demand
4. **User Experience**: Smooth loading states with Suspense

## Related Examples

- **[Memoization](./memoization.md)** - Using React.memo and useCallback

- **[Basic Examples](/docs/examples/basic/simple-counter)** - Simple stage machine examples 