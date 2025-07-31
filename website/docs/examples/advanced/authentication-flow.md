---
id: examples-authentication-flow
title: Authentication Flow
sidebar_label: Authentication Flow
---

# Authentication Flow

A complete authentication flow with login, registration, and password reset using individual stage components and StageRenderer.

## Overview

This example demonstrates a comprehensive authentication system with the following features:

- **Authentication Flow**: Complete login/register/forgot password flow
- **Individual Stage Components**: Each stage is a separate React component
- **StageRenderer**: Automatic stage rendering based on current stage
- **Credential Handling**: Secure management of username/password
- **Async Authentication**: Simulated API calls with loading states
- **Error States**: Proper error handling for invalid credentials
- **Success Flow**: Welcome message and logout functionality
- **State Management**: Clean state management and transitions

## Key Features to Observe

1. **Individual Stage Components**: Each stage (login, register, forgot, loading, dashboard) is a separate component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Authentication Flow**: Follow the stages: 'login' → 'loading' → 'dashboard'/'error'
4. **Credential Handling**: See how username/password are managed
5. **Async Authentication**: Watch the simulated API call during the 'loading' stage
6. **Error States**: Observe how invalid credentials trigger the 'error' stage
7. **Success Flow**: See the welcome message and logout functionality
8. **State Management**: Notice how credentials are cleared when logging out

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function AuthenticationFlow() {
  // Common UI Components
  function FormContainer({ children, title = "Authentication" }) {
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
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
          {title}
        </h2>
        {children}
      </div>
    );
  }

  function FormInput({ type = "text", placeholder, value, onChange, style = {} }) {
    const inputStyle = {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "white",
      color: "#2c3e50",
      ...style,
    };

    return (
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        style={inputStyle}
      />
    );
  }

  function FormButton({ onClick, children, variant = "primary", disabled = false, style = {} }) {
    const buttonStyles = {
      primary: {
        backgroundColor: "#007bff",
        color: "white",
      },
      secondary: {
        backgroundColor: "#6c757d",
        color: "white",
      },
      success: {
        backgroundColor: "#28a745",
        color: "white",
      },
      danger: {
        backgroundColor: "#dc3545",
        color: "white",
      },
    };

    const buttonStyle = {
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px",
      fontWeight: "500",
      opacity: disabled ? 0.6 : 1,
      ...buttonStyles[variant],
      ...style,
    };

    return (
      <button onClick={onClick} style={buttonStyle} disabled={disabled}>
        {children}
      </button>
    );
  }

  function ErrorDisplay({ error }) {
    if (!error) return null;
    
    return (
      <div style={{ 
        marginTop: "10px", 
        padding: "10px", 
        backgroundColor: "#f8d7da", 
        border: "1px solid #f5c6cb", 
        borderRadius: "4px",
        color: "#721c24"
      }}>
        {error}
      </div>
    );
  }

  function LoadingSpinner() {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Loading...</h3>
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
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  function DebugInfo() {
    const { currentStage, data, send } = useStageFlow();
    const [editStage, setEditStage] = React.useState(currentStage);
    const [editData, setEditData] = React.useState(JSON.stringify(data, null, 2));
    const [isEditing, setIsEditing] = React.useState(false);

    // Update edit state when actual state changes
    React.useEffect(() => {
      if (!isEditing) {
        setEditStage(currentStage);
        setEditData(JSON.stringify(data, null, 2));
      }
    }, [currentStage, data, isEditing]);

    const handleStageChange = React.useCallback((e) => {
      setEditStage(e.target.value);
    }, []);

    const handleDataChange = React.useCallback((e) => {
      setEditData(e.target.value);
    }, []);

    const handleApplyChanges = React.useCallback(() => {
      try {
        const parsedData = JSON.parse(editData);
        send("updateForm", parsedData);
        setIsEditing(false);
      } catch (error) {
        alert("Invalid JSON data");
      }
    }, [editData, send]);

    const handleReset = React.useCallback(() => {
      setEditStage(currentStage);
      setEditData(JSON.stringify(data, null, 2));
      setIsEditing(false);
    }, [currentStage, data]);

    return (
      <div style={{ 
        marginBottom: "20px", 
        padding: "15px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "4px", 
        border: "1px solid #e9ecef",
        maxWidth: "400px",
        width: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h4 style={{ margin: "0", color: "#495057" }}>Debug Info:</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: "5px 10px",
              backgroundColor: isEditing ? "#dc3545" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "3px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditing ? (
          <div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#495057", marginBottom: "5px" }}>
                <strong>Current Stage:</strong>
              </label>
              <select
                value={editStage}
                onChange={handleStageChange}
                style={{
                  padding: "5px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  width: "100%"
                }}
              >
                <option value="login">login</option>
                <option value="register">register</option>
                <option value="forgot">forgot</option>
                <option value="loading">loading</option>
                <option value="dashboard">dashboard</option>
              </select>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#495057", marginBottom: "5px" }}>
                <strong>Current Data (JSON):</strong>
              </label>
              <textarea
                value={editData}
                onChange={handleDataChange}
                style={{
                  padding: "5px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  width: "100%",
                  height: "100px",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleApplyChanges}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Apply
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Stage:</strong> {currentStage}
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Stage Components:</strong> login, register, forgot, loading, dashboard
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Data:</strong> {JSON.stringify(data)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Login stage component
  function LoginStage({ data, send }) {
    const handleLogin = React.useCallback(async () => {
    if (!data?.username || !data?.password) {
      send("updateForm", { 
        ...(data || {}), 
        error: "Please enter both username and password" 
      });
      return;
    }

    const currentData = { ...(data || {}) };
    
    send("login", { 
      ...currentData, 
      isLoading: true, 
      error: "" 
    });

    // Simulate API call
    setTimeout(() => {
      if (currentData.username === "admin" && currentData.password === "password123") {
        send("success", { 
          ...currentData, 
          isLoading: false, 
          user: { username: "admin", role: "admin" } 
        });
      } else {
        send("error", { 
          ...currentData, 
          isLoading: false, 
          error: "Invalid credentials" 
        });
      }
    }, 1000);
    }, [data, send]);

    const updateFormData = React.useCallback((field, value) => {
      send("updateForm", { ...(data || {}), [field]: value, error: "" });
    }, [data, send]);

    return (
      <FormContainer>
        <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Login</h3>
        
        <FormInput
          placeholder="Username"
          value={data?.username}
          onChange={(e) => updateFormData("username", e.target.value)}
        />
        
        <FormInput
          type="password"
          placeholder="Password"
          value={data?.password}
          onChange={(e) => updateFormData("password", e.target.value)}
        />
        
        <div style={{ display: "flex", gap: "10px" }}>
          <FormButton onClick={handleLogin} style={{ flex: 1 }}>
            Login
          </FormButton>
        </div>
        
        <ErrorDisplay error={data?.error} />
        
        <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
          <p style={{ margin: "0", fontSize: "12px", color: "#495057" }}>Test account: admin / password123</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <FormButton onClick={() => send("goToRegister")} variant="success">
            Register
          </FormButton>
          <FormButton onClick={() => send("goToForgot")} variant="secondary">
            Forgot Password?
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Register stage component
  function RegisterStage({ data, send }) {
    const handleRegister = React.useCallback(async () => {
    if (!data?.username || !data?.password || !data?.confirmPassword) {
      send("updateForm", { 
        ...(data || {}), 
        error: "Please fill in all fields" 
      });
      return;
    }

    if (data?.password !== data?.confirmPassword) {
      send("updateForm", { 
        ...(data || {}), 
        error: "Passwords do not match" 
      });
      return;
    }

    const currentData = { ...(data || {}) };

    send("register", { 
      ...currentData, 
      isLoading: true, 
      error: "" 
    });

    // Simulate API call
    setTimeout(() => {
      send("success", { 
        ...currentData, 
        isLoading: false, 
        user: { username: currentData.username, role: "user" } 
      });
    }, 1000);
    }, [data, send]);

    const updateFormData = React.useCallback((field, value) => {
      send("updateForm", { ...(data || {}), [field]: value, error: "" });
    }, [data, send]);

    return (
      <FormContainer>
        <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Register</h3>
        
        <FormInput
          placeholder="Username"
          value={data?.username}
          onChange={(e) => updateFormData("username", e.target.value)}
        />
        
        <FormInput
          type="password"
          placeholder="Password"
          value={data?.password}
          onChange={(e) => updateFormData("password", e.target.value)}
        />
        
        <FormInput
          type="password"
          placeholder="Confirm Password"
          value={data?.confirmPassword}
          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
          style={{ marginBottom: "15px" }}
        />
        
        <div style={{ display: "flex", gap: "10px" }}>
          <FormButton onClick={handleRegister} variant="success" style={{ flex: 1 }}>
            Register
          </FormButton>
        </div>
        
        <ErrorDisplay error={data?.error} />
        
        <FormButton onClick={() => send("goToLogin")} variant="secondary" style={{ width: "100%", marginTop: "10px" }}>
          Back to Login
        </FormButton>
      </FormContainer>
    );
  }

  // Forgot password stage component
  function ForgotStage({ data, send }) {
    const handleReset = React.useCallback(async () => {
    if (!data?.email) {
      send("updateForm", { 
        ...(data || {}), 
        error: "Please enter your email" 
      });
      return;
    }

    const currentData = { ...(data || {}) };

    send("reset", { 
      ...currentData, 
      isLoading: true, 
      error: "" 
    });

    // Simulate API call
    setTimeout(() => {
      send("resetSuccess", { 
        ...currentData, 
        isLoading: false, 
        message: "Password reset link sent to your email"
      });
    }, 1000);
    }, [data, send]);

    const updateFormData = React.useCallback((field, value) => {
      send("updateForm", { ...(data || {}), [field]: value, error: "" });
    }, [data, send]);

    return (
      <FormContainer>
        <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Reset Password</h3>
        
        {data?.message ? (
          <div style={{ textAlign: "center" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#28a745" }}>Success!</h4>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              {data.message}
            </p>
            <FormButton onClick={() => send("goToLogin")}>
              Back to Login
            </FormButton>
          </div>
        ) : (
          <>
            <FormInput
              type="email"
              placeholder="Email"
              value={data?.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              style={{ marginBottom: "15px" }}
            />
            
            <div style={{ display: "flex", gap: "10px" }}>
              <FormButton onClick={handleReset} style={{ flex: 1 }}>
                Send Reset Link
              </FormButton>
              <FormButton onClick={() => send("goToLogin")} variant="secondary">
                Back to Login
              </FormButton>
            </div>
          </>
        )}
      </FormContainer>
    );
  }

  // Loading stage component
  function LoadingStage({ data, send }) {
    return (
      <FormContainer>
        <LoadingSpinner />
      </FormContainer>
    );
  }

  // Dashboard stage component
  function DashboardStage({ data, send }) {
    const handleLogout = React.useCallback(() => {
    send("logout", { 
      username: "", 
      password: "", 
      confirmPassword: "",
      email: "",
      error: "", 
      isLoading: false,
      user: null 
    });
    }, [send]);

  return (
      <FormContainer>
            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
              Welcome, {data?.user?.username}!
            </h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              You have successfully logged in.
            </p>
        <FormButton onClick={handleLogout} variant="danger">
              Logout
        </FormButton>
      </FormContainer>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
      initial: "login",
      data: { 
        username: "", 
        password: "", 
      confirmPassword: "",
      email: "",
        error: "", 
        isLoading: false,
        user: null 
      },
      stages: [
        {
          name: "login",
          transitions: [
            { target: "loading", event: "login" },
          { target: "register", event: "goToRegister" },
          { target: "forgot", event: "goToForgot" },
            { target: "login", event: "updateForm" },
          ],
        },
      {
        name: "register",
        transitions: [
          { target: "loading", event: "register" },
          { target: "login", event: "goToLogin" },
          { target: "register", event: "updateForm" },
        ],
      },
      {
        name: "forgot",
        transitions: [
          { target: "loading", event: "reset" },
          { target: "login", event: "goToLogin" },
          { target: "forgot", event: "updateForm" },
        ],
      },
        {
          name: "loading",
          transitions: [
            { target: "dashboard", event: "success" },
            { target: "login", event: "error" },
          { target: "register", event: "error" },
          { target: "forgot", event: "error" },
          { target: "forgot", event: "resetSuccess" },
          ],
        },
        {
          name: "dashboard",
          transitions: [
            { target: "login", event: "logout" },
          ],
        },
      ],
    });
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <DebugInfo />
      <StageRenderer
        currentStage="login"
        stageComponents={{
          login: LoginStage,
          register: RegisterStage,
          forgot: ForgotStage,
          loading: LoadingStage,
          dashboard: DashboardStage,
        }}
        data={{ 
          username: "", 
          password: "", 
          confirmPassword: "",
          email: "",
          error: "", 
          isLoading: false,
          user: null 
        }}
        send={(event, data) => {
          if (event === "login") {
            engine.send("login", data);
          } else if (event === "register") {
            engine.send("register", data);
          } else if (event === "reset") {
            engine.send("reset", data);
          } else if (event === "success") {
            engine.send("success", data);
          } else if (event === "error") {
            engine.send("error", data);
          } else if (event === "resetSuccess") {
            engine.send("resetSuccess", data);
          } else if (event === "logout") {
            engine.send("logout", data);
          } else if (event === "goToRegister") {
            engine.send("goToRegister", data);
          } else if (event === "goToLogin") {
            engine.send("goToLogin", data);
          } else if (event === "goToForgot") {
            engine.send("goToForgot", data);
          } else if (event === "updateForm") {
            engine.send("updateForm", data);
          }
        }}
      />
    </StageFlowProvider>
  );
}
```

## Debug Interface Techniques

The debug interface demonstrates several advanced React and Stage Flow techniques:

### 1. **Real-time State Monitoring**
- Uses `useStageFlow()` hook to access current stage and data
- Automatically updates when engine state changes
- Provides live feedback of form state without manual refresh

### 2. **Conditional State Synchronization**
```jsx
React.useEffect(() => {
  if (!isEditing) {
    setEditStage(currentStage);
    setEditData(JSON.stringify(data, null, 2));
  }
}, [currentStage, data, isEditing]);
```
- Only updates local state when not in editing mode
- Prevents user input from being overwritten during editing
- Maintains data consistency between debug panel and actual form state

### 3. **Interactive State Manipulation**
- **Stage Selection**: Dropdown to change current stage programmatically
- **Data Editing**: JSON textarea for direct data manipulation
- **Apply/Reset**: Buttons to apply changes or revert to current state
- **Error Handling**: JSON validation with user feedback

### 4. **Dual Mode Interface**
- **View Mode**: Read-only display of current state
- **Edit Mode**: Interactive controls for state manipulation
- **Toggle Control**: Single button to switch between modes

### 5. **State Management Patterns**
- **Controlled Components**: Form inputs bound to React state
- **Callback Optimization**: `useCallback` for event handlers
- **Error Boundaries**: Try-catch for JSON parsing validation
- **State Isolation**: Local edit state separate from global engine state

### 6. **Developer Experience Features**
- **Visual Feedback**: Color-coded buttons and status indicators
- **Data Formatting**: Pretty-printed JSON for readability
- **Responsive Design**: Consistent styling with main form
- **Accessibility**: Proper labels and semantic HTML structure

This debug interface serves as a powerful development tool, allowing developers to:
- Monitor form state in real-time
- Test different data scenarios quickly
- Debug state transitions and data flow
- Validate form behavior with various inputs
- Understand the relationship between UI actions and state changes