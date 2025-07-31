---
id: react-router-integration
title: React Router Integration
sidebar_label: React Router Integration
---

# React Router Integration

Simple integration between Stage Flow and React Router for managing navigation states.

## Overview

This example demonstrates a simple integration between Stage Flow and React Router, showing how to manage navigation states and route-based permissions.

## Key Features

1. **Simple Navigation States**: Home, About, Dashboard, Settings
2. **Route-Based Permissions**: Protected routes for authenticated users
3. **Navigation Guards**: Preventing access to protected routes
4. **State Synchronization**: Keeping Stage Flow state in sync with router state

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function ReactRouterIntegration() {
  const engineRef = React.useRef();
  
  // Define common transitions
  const commonTransitions = [
    { target: "home", event: "navigateToHome" },
    { target: "about", event: "navigateToAbout" },
    { target: "dashboard", event: "navigateToDashboard" },
    { target: "settings", event: "navigateToSettings" },
    { target: "login", event: "navigateToLogin" }
  ];

  if (!engineRef.current) {
    engineRef.current = new StageFlowEngine({
      initial: "home",
      data: {
        currentRoute: "/",
        isAuthenticated: false,
        user: null,
        navigationHistory: []
      },
      stages: [
        {
          name: "home",
          transitions: commonTransitions,
        },
        {
          name: "about",
          transitions: commonTransitions,
        },
        {
          name: "dashboard",
          transitions: commonTransitions,
        },
        {
          name: "settings",
          transitions: commonTransitions,
        },
        {
          name: "login",
          transitions: [
            ...commonTransitions.filter(t => t.event !== "navigateToDashboard" && t.event !== "navigateToSettings"),
            { target: "dashboard", event: "loginSuccess" },
            { target: "settings", event: "loginSuccess" }
          ],
        },
      ],
    });

    engineRef.current.start();
  }

  const { currentStage, data, send } = useStageFlow(engineRef.current);

  // Navigation handlers
  const handleNavigateToHome = () => {
    send("navigateToHome", { 
      ...data, 
      currentRoute: "/",
      navigationHistory: [...(data?.navigationHistory || []), currentStage]
    });
  };

  const handleNavigateToAbout = () => {
    send("navigateToAbout", { 
      ...data, 
      currentRoute: "/about",
      navigationHistory: [...(data?.navigationHistory || []), currentStage]
    });
  };

  const handleNavigateToDashboard = () => {
    if (data?.isAuthenticated) {
      send("navigateToDashboard", { 
        ...data, 
        currentRoute: "/dashboard",
        navigationHistory: [...(data?.navigationHistory || []), currentStage]
      });
    } else {
      send("navigateToLogin", { 
        ...data, 
        currentRoute: "/login",
        navigationHistory: [...(data?.navigationHistory || []), currentStage]
      });
    }
  };

  const handleNavigateToSettings = () => {
    if (data?.isAuthenticated) {
      send("navigateToSettings", { 
        ...data, 
        currentRoute: "/settings",
        navigationHistory: [...(data?.navigationHistory || []), currentStage]
      });
    } else {
      send("navigateToLogin", { 
        ...data, 
        currentRoute: "/login",
        navigationHistory: [...(data?.navigationHistory || []), currentStage]
      });
    }
  };

  const handleNavigateToLogin = () => {
    send("navigateToLogin", { 
      ...data, 
      currentRoute: "/login",
      navigationHistory: [...(data?.navigationHistory || []), currentStage]
    });
  };

  // Authentication handlers
  const handleLogin = () => {
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com"
    };
    
    send("loginSuccess", {
      ...data,
      isAuthenticated: true,
      user: mockUser,
      currentRoute: "/dashboard"
    });
  };

  const handleLogout = () => {
    send("navigateToHome", {
      ...data,
      isAuthenticated: false,
      user: null,
      currentRoute: "/"
    });
  };

  return (
    <StageFlowProvider engine={engineRef.current}>
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        maxWidth: "800px",
        backgroundColor: "white"
      }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
          React Router Integration
        </h2>

        {/* Navigation Bar */}
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "20px", 
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={handleNavigateToHome}
            style={{
              padding: "8px 16px",
              backgroundColor: currentStage === "home" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Home
          </button>
          <button
            onClick={handleNavigateToAbout}
            style={{
              padding: "8px 16px",
              backgroundColor: currentStage === "about" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            About
          </button>
          <button
            onClick={handleNavigateToDashboard}
            style={{
              padding: "8px 16px",
              backgroundColor: currentStage === "dashboard" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Dashboard
          </button>
          <button
            onClick={handleNavigateToSettings}
            style={{
              padding: "8px 16px",
              backgroundColor: currentStage === "settings" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Settings
          </button>
          
          <div style={{ marginLeft: "auto" }}>
            {data?.isAuthenticated ? (
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleNavigateToLogin}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e9ecef", 
          borderRadius: "4px",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          <strong>Current Route:</strong> {data?.currentRoute} | 
          <strong> Stage:</strong> {currentStage} | 
          <strong> Authenticated:</strong> {data?.isAuthenticated ? "Yes" : "No"}
          {data?.user && (
            <> | <strong> User:</strong> {data.user.name}</>
          )}
        </div>

        {/* Page Content */}
        <div style={{ 
          padding: "20px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "4px",
          minHeight: "300px"
        }}>
          {currentStage === "home" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
                Welcome to Home Page
              </h3>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                This is the public home page. Anyone can access this page.
              </p>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Available Actions:</h4>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#666" }}>
                  <li>Navigate to About page</li>
                  <li>Try to access Dashboard (requires login)</li>
                  <li>Try to access Settings (requires login)</li>
                  <li>Login to access protected routes</li>
                </ul>
              </div>
            </div>
          )}

          {currentStage === "about" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
                About Page
              </h3>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                This is the about page. It's also publicly accessible.
              </p>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>About Our App:</h4>
                <p style={{ color: "#666", margin: "0" }}>
                  This example demonstrates how Stage Flow can manage navigation states 
                  and route-based permissions in a React application.
                </p>
              </div>
            </div>
          )}

          {currentStage === "dashboard" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", color: "#28a745" }}>
                Dashboard - Protected Page
              </h3>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                Welcome to your dashboard, {data?.user?.name}! This page is only accessible to authenticated users.
              </p>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px",
                marginBottom: "15px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>User Information:</h4>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  <strong>Name:</strong> {data?.user?.name}
                </p>
                <p style={{ margin: "5px 0", color: "#666" }}>
                  <strong>Email:</strong> {data?.user?.email}
                </p>
              </div>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Dashboard Features:</h4>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#666" }}>
                  <li>View user profile</li>
                  <li>Access settings</li>
                  <li>View analytics</li>
                  <li>Manage preferences</li>
                </ul>
              </div>
            </div>
          )}

          {currentStage === "settings" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", color: "#17a2b8" }}>
                Settings - Protected Page
              </h3>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                Settings page for {data?.user?.name}. This page is only accessible to authenticated users.
              </p>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Available Settings:</h4>
                <ul style={{ margin: "0", paddingLeft: "20px", color: "#666" }}>
                  <li>Profile settings</li>
                  <li>Notification preferences</li>
                  <li>Privacy settings</li>
                  <li>Account security</li>
                </ul>
              </div>
            </div>
          )}

          {currentStage === "login" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", color: "#ffc107" }}>
                Login Required
              </h3>
              <p style={{ color: "#666", marginBottom: "15px" }}>
                You need to be logged in to access the requested page.
              </p>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "white", 
                borderRadius: "4px",
                marginBottom: "15px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Login to continue:</h4>
                <button
                  onClick={handleLogin}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Login (Demo)
                </button>
              </div>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "#fff3cd", 
                borderRadius: "4px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>Navigation Guard:</h4>
                <p style={{ color: "#856404", margin: "0", fontSize: "14px" }}>
                  This demonstrates how Stage Flow can act as a navigation guard, 
                  preventing access to protected routes and redirecting to login.
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          backgroundColor: "#e9ecef", 
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666"
        }}>
          <strong>Integration Note:</strong> This example shows how Stage Flow can manage navigation states 
          and implement route-based permissions similar to React Router guards.
        </div>
      </div>
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Simple Navigation States

Stage Flow manages navigation states with clear transitions:

```javascript
const engine = new StageFlowEngine({
  initial: "home",
  stages: [
    { name: "home", transitions: [
      { target: "about", event: "navigateToAbout" },
      { target: "dashboard", event: "navigateToDashboard" }
    ]},
    { name: "about", transitions: [
      { target: "home", event: "navigateToHome" }
    ]},
    // ... more stages
  ]
});
```

### Route-Based Permissions

Protected routes check authentication before navigation:

```javascript
const handleNavigateToDashboard = () => {
  if (data?.isAuthenticated) {
    send("navigateToDashboard", { ...data, currentRoute: "/dashboard" });
  } else {
    send("navigateToLogin", { ...data, currentRoute: "/login" });
  }
};
```

### Navigation Guards

Stage Flow acts as a navigation guard:

```javascript
// In a real React Router setup
function ProtectedRoute({ children }) {
  const { currentStage, data } = useStageFlow(engine);
  
  if (!data?.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

## Benefits

1. **Simple State Management**: Clear navigation states
2. **Route Protection**: Automatic guards for protected routes
3. **State Synchronization**: Keep Stage Flow state in sync with router
4. **Predictable Navigation**: Clear state transitions
5. **Easy Testing**: Test navigation logic independently

## Integration Patterns

### With React Router

```javascript
// In your React Router setup
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </StageFlowProvider>
  );
}
```

### Navigation Hook

```javascript
// Custom hook for navigation
function useNavigation() {
  const { currentStage, data, send } = useStageFlow(engine);
  
  const navigate = (route) => {
    const routeMap = {
      "/": "navigateToHome",
      "/about": "navigateToAbout", 
      "/dashboard": "navigateToDashboard",
      "/settings": "navigateToSettings"
    };
    
    const event = routeMap[route];
    if (event) {
      send(event, { ...data, currentRoute: route });
    }
  };
  
  return { navigate, currentStage, currentRoute: data?.currentRoute };
}
```

## Related Examples

- **[Setup Wizard](../advanced/setup-wizard.md)** - Multi-step configuration process
- **[Basic Examples](../basic/basic)** - Simple stage machine examples 