---
id: setup-wizard
title: Setup Wizard
sidebar_label: Setup Wizard
---

# Setup Wizard

Multi-step configuration wizard using individual stage components and StageRenderer for guided setup process.

## Overview

This example demonstrates how to create a step-by-step setup wizard using Stage Flow for managing complex configuration flows with validation and progress tracking.

- **Individual Stage Components**: Each stage is a separate React component
- **StageRenderer**: Automatic stage rendering based on current stage
- **Step-by-Step Navigation**: Guided progression through setup steps
- **Validation**: Form validation at each step
- **Progress Tracking**: Visual progress indicator
- **Data Persistence**: Maintaining data across steps
- **Back Navigation**: Ability to go back and modify previous steps

## Key Features to Observe

1. **Individual Stage Components**: Each stage (welcome, personalInfo, preferences, account, confirmation, complete) is a separate component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Step-by-Step Navigation**: Guided progression through setup steps
4. **Validation**: Form validation at each step
5. **Progress Tracking**: Visual progress indicator
6. **Data Persistence**: Maintaining data across steps
7. **Back Navigation**: Ability to go back and modify previous steps

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function SetupWizard() {
  // Common UI Components
  function FormContainer({ children, title = "Setup Wizard" }) {
    return (
      <div style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        maxWidth: "600px",
        backgroundColor: "white"
      }}>
        <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>{title}</h2>
        {children}
      </div>
    );
  }

  function FormInput({ type = "text", name, placeholder, defaultValue, required = false, style = {} }) {
    const inputStyle = {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      ...style,
    };

    return (
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue || ""}
        required={required}
        style={inputStyle}
      />
    );
  }

  function FormButton({ onClick, children, variant = "primary", type = "button", style = {} }) {
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
    };

    const buttonStyle = {
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      ...buttonStyles[variant],
      ...style,
    };

    return (
      <button onClick={onClick} type={type} style={buttonStyle}>
        {children}
      </button>
    );
    }

  function FormLabel({ children, style = {} }) {
    const labelStyle = {
      display: "block",
      marginBottom: "5px",
      color: "#333",
      ...style,
    };

    return <label style={labelStyle}>{children}</label>;
  }

  function ProgressBar({ currentStep, totalSteps }) {
    const percentage = (currentStep / totalSteps) * 100;
    
    return (
      <div style={{ marginBottom: "30px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px"
        }}>
          <span style={{ fontSize: "14px", color: "#666" }}>
            Step {currentStep} of {totalSteps}
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>
            {Math.round(percentage)}%
          </span>
        </div>
        <div style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e9ecef",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: "#007bff",
            transition: "width 0.3s ease"
          }} />
        </div>
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
        send("updateData", parsedData);
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
        maxWidth: "600px",
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
                <option value="welcome">welcome</option>
                <option value="personalInfo">personalInfo</option>
                <option value="preferences">preferences</option>
                <option value="account">account</option>
                <option value="confirmation">confirmation</option>
                <option value="complete">complete</option>
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
              <strong>Stage Components:</strong> welcome, personalInfo, preferences, account, confirmation, complete
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Data:</strong> {JSON.stringify(data)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Welcome stage component
  function WelcomeStage({ data, send }) {
    const handleStartSetup = React.useCallback(() => {
      send("startSetup", {
        ...(data || {}),
        currentStep: 2,
        totalSteps: 6
      });
    }, [data, send]);

    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 1} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px",
          textAlign: "center"
        }}>
      <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
        Welcome to Setup Wizard
      </h3>
      <p style={{ color: "#666", marginBottom: "30px", lineHeight: "1.6" }}>
        This wizard will guide you through the setup process.
        We'll collect some basic information to personalize your experience.
      </p>
          <FormButton onClick={handleStartSetup} style={{ fontSize: "16px", padding: "12px 24px" }}>
        Start Setup
          </FormButton>
    </div>
      </FormContainer>
    );
  }

  // Personal Info stage component
  function PersonalInfoStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back", { 
        ...(data || {}), 
        currentStep: 1,
        totalSteps: 6
      });
    }, [data, send]);
    
    const handleSubmit = React.useCallback((personalInfo) => {
      send("savePersonalInfo", { 
        ...(data || {}), 
        personalInfo,
        currentStep: 3,
        totalSteps: 6
      });
    }, [data, send]);

    const handleFormSubmit = React.useCallback((e) => {
          e.preventDefault();
          const formData = {
            name: e.target.name.value,
            email: e.target.email.value
          };
          if (formData.name && formData.email) {
            handleSubmit(formData);
          }
    }, [handleSubmit]);

    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 2} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
            Personal Information
          </h3>
          <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: "15px" }}>
              <FormLabel>Name *</FormLabel>
              <FormInput
              name="name"
                placeholder="Enter your name"
              defaultValue={data?.personalInfo?.name || ""}
              required
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
              <FormLabel>Email *</FormLabel>
              <FormInput
              name="email"
              type="email"
                placeholder="Enter your email"
              defaultValue={data?.personalInfo?.email || ""}
              required
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
              <FormButton onClick={handleBack} variant="secondary">
              Back
              </FormButton>
              <FormButton type="submit">
              Next
              </FormButton>
          </div>
        </form>
      </div>
      </FormContainer>
    );
  }

  // Preferences stage component
  function PreferencesStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back", { 
        ...(data || {}), 
        currentStep: 2,
        totalSteps: 6
      });
    }, [data, send]);
    
    const handleSubmit = React.useCallback((preferences) => {
      send("savePreferences", { 
        ...(data || {}), 
        preferences,
        currentStep: 4,
        totalSteps: 6
      });
    }, [data, send]);

    const handleFormSubmit = React.useCallback((e) => {
          e.preventDefault();
          const formData = {
            theme: e.target.theme.value,
            notifications: e.target.notifications.checked
          };
          handleSubmit(formData);
    }, [handleSubmit]);

    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 3} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
            Preferences
          </h3>
          <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: "15px" }}>
              <FormLabel>Theme</FormLabel>
            <select
              name="theme"
              defaultValue={data?.preferences?.theme || "light"}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div style={{ marginBottom: "20px" }}>
              <FormLabel>
              <input
                name="notifications"
                type="checkbox"
                defaultChecked={data?.preferences?.notifications !== false}
                style={{ marginRight: "8px" }}
              />
              Enable notifications
              </FormLabel>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
              <FormButton onClick={handleBack} variant="secondary">
              Back
              </FormButton>
              <FormButton type="submit">
              Next
              </FormButton>
          </div>
        </form>
      </div>
      </FormContainer>
    );
  }

  // Account stage component
  function AccountStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back", { 
        ...(data || {}), 
        currentStep: 3,
        totalSteps: 6
      });
    }, [data, send]);
    
    const handleSubmit = React.useCallback((account) => {
      send("saveAccount", { 
        ...(data || {}), 
        account,
        currentStep: 5,
        totalSteps: 6
      });
    }, [data, send]);

    const handleFormSubmit = React.useCallback((e) => {
          e.preventDefault();
          const formData = {
            username: e.target.username.value,
            password: e.target.password.value
          };
          if (formData.username && formData.password) {
            handleSubmit(formData);
          }
    }, [handleSubmit]);

    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 4} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
            Account Setup
          </h3>
          <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: "15px" }}>
              <FormLabel>Username *</FormLabel>
              <FormInput
              name="username"
                placeholder="Enter username"
              defaultValue={data?.account?.username || ""}
              required
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
              <FormLabel>Password *</FormLabel>
              <FormInput
              name="password"
              type="password"
                placeholder="Enter password"
              defaultValue={data?.account?.password || ""}
              required
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
              <FormButton onClick={handleBack} variant="secondary">
              Back
              </FormButton>
              <FormButton type="submit">
              Next
              </FormButton>
          </div>
        </form>
      </div>
      </FormContainer>
    );
  }

  // Confirmation stage component
  function ConfirmationStage({ data, send }) {
    const handleBack = React.useCallback(() => {
      send("back", { 
        ...(data || {}), 
        currentStep: 4,
        totalSteps: 6
      });
    }, [data, send]);
    
    const handleConfirm = React.useCallback(() => {
      send("confirm", { 
        ...(data || {}), 
        currentStep: 6,
        totalSteps: 6
      });
    }, [data, send]);
    
    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 5} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px"
        }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
          Confirmation
        </h3>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#333", marginBottom: "10px" }}>Personal Information</h4>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Name:</strong> {data?.personalInfo?.name || "Not provided"}
          </p>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Email:</strong> {data?.personalInfo?.email || "Not provided"}
          </p>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#333", marginBottom: "10px" }}>Preferences</h4>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Theme:</strong> {data?.preferences?.theme || "Not set"}
          </p>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Notifications:</strong> {data?.preferences?.notifications ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#333", marginBottom: "10px" }}>Account</h4>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Username:</strong> {data?.account?.username || "Not provided"}
          </p>
          <p style={{ color: "#666", margin: "5px 0" }}>
            <strong>Password:</strong> {"*".repeat(data?.account?.password?.length || 0)}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
            <FormButton onClick={handleBack} variant="secondary">
            Back
            </FormButton>
            <FormButton onClick={handleConfirm} variant="success">
            Complete Setup
            </FormButton>
        </div>
      </div>
      </FormContainer>
    );
  }

  // Complete stage component
  function CompleteStage({ data, send }) {
    const handleRestart = React.useCallback(() => {
      send("restart", { 
        ...(data || {}), 
        currentStep: 1,
        totalSteps: 6
      });
    }, [data, send]);
    
    return (
      <FormContainer>
        <ProgressBar currentStep={data?.currentStep || 6} totalSteps={data?.totalSteps || 6} />
        
        <div style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          minHeight: "300px",
          textAlign: "center"
        }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
          Setup Complete!
        </h3>
        <p style={{ color: "#666", marginBottom: "30px", lineHeight: "1.6" }}>
          Your setup has been completed successfully.
          You can now start using the application with your personalized settings.
        </p>
          <FormButton onClick={handleRestart} style={{ fontSize: "16px", padding: "12px 24px" }}>
          Start Over
          </FormButton>
      </div>
      </FormContainer>
    );
  }

  // Create engine directly without useRef
const engine = new StageFlowEngine({
  initial: "welcome",
    data: {
      personalInfo: { name: "", email: "" },
      preferences: { theme: "light", notifications: true },
      account: { username: "", password: "" },
      currentStep: 1,
      totalSteps: 6
    },
  stages: [
      {
        name: "welcome",
        transitions: [
          { target: "personalInfo", event: "startSetup" }
        ],
      },
    {
      name: "personalInfo",
      transitions: [
        { target: "preferences", event: "savePersonalInfo" },
          { target: "welcome", event: "back" }
        ],
      },
      {
        name: "preferences",
        transitions: [
          { target: "account", event: "savePreferences" },
          { target: "personalInfo", event: "back" }
      ],
    },
      {
        name: "account",
        transitions: [
          { target: "confirmation", event: "saveAccount" },
          { target: "preferences", event: "back" }
        ],
      },
      {
        name: "confirmation",
        transitions: [
          { target: "complete", event: "confirm" },
          { target: "account", event: "back" }
        ],
      },
      {
        name: "complete",
        transitions: [
          { target: "welcome", event: "restart" }
        ],
      },
  ],
});
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <DebugInfo />
      <StageRenderer
        currentStage="welcome"
        stageComponents={{
          welcome: WelcomeStage,
          personalInfo: PersonalInfoStage,
          preferences: PreferencesStage,
          account: AccountStage,
          confirmation: ConfirmationStage,
          complete: CompleteStage,
        }}
        data={{
          personalInfo: { name: "", email: "" },
          preferences: { theme: "light", notifications: true },
          account: { username: "", password: "" },
          currentStep: 1,
          totalSteps: 6
        }}
        send={(event, data) => {
          if (event === "startSetup") {
            engine.send("startSetup", data);
          } else if (event === "savePersonalInfo") {
            engine.send("savePersonalInfo", data);
          } else if (event === "savePreferences") {
            engine.send("savePreferences", data);
          } else if (event === "saveAccount") {
            engine.send("saveAccount", data);
          } else if (event === "confirm") {
            engine.send("confirm", data);
          } else if (event === "restart") {
            engine.send("restart", data);
          } else if (event === "back") {
            engine.send("back", data);
          } else if (event === "updateData") {
            engine.send("updateData", data);
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
