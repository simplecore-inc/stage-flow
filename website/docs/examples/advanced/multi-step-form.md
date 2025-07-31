---
id: examples-multi-step-form
title: Multi-Step Form
sidebar_label: Multi-Step Form
---

# Multi-Step Form

A complex multi-step form with validation and navigation using individual stage components and StageRenderer.

## Overview

This example demonstrates a comprehensive multi-step form with the following features:

- **Multi-Stage Flow**: Progression through stages: 'personal' → 'contact' → 'preferences' → 'confirmation' → 'complete'
- **Individual Stage Components**: Each stage is a separate React component
- **StageRenderer**: Automatic stage rendering based on current stage
- **Form Validation**: Real-time validation with error handling and display
- **Data Persistence**: Form data persists across stage transitions
- **Error Handling**: Graceful handling of validation errors
- **Navigation**: Back/forward navigation between stages
- **Progress Indicator**: Visual progress indicator at the top
- **Debug Interface**: Interactive debug panel for real-time state monitoring and manipulation

## Key Features to Observe

1. **Individual Stage Components**: Each stage (personal, contact, preferences, confirmation, complete) is a separate component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Multi-Stage Flow**: Watch the progression through stages: 'personal' → 'contact' → 'preferences' → 'confirmation' → 'complete'
4. **Form Validation**: See how validation errors are handled and displayed
5. **Data Persistence**: Notice how form data persists across stage transitions
6. **Error Handling**: Watch how the form handles validation errors
7. **Navigation**: Observe the back/forward navigation between stages
8. **Progress Indicator**: See the visual progress indicator at the top
9. **Debug Interface**: Interactive debug panel for real-time state monitoring and manipulation

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function MultiStepForm() {
  // Common UI Components
  function ProgressIndicator({ currentStage }) {
    const stages = ["personal", "contact", "preferences", "confirmation"];

    return (
      <div style={{ display: "flex", marginBottom: "20px", gap: "5px" }}>
        {stages.map((stage, index) => (
          <div
            key={stage}
            style={{
              padding: "10px",
              backgroundColor: stage === currentStage ? "#007bff" : "#f8f9fa",
              color: stage === currentStage ? "white" : "#495057",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: stage === currentStage ? "600" : "400",
            }}
          >
            {index + 1}. {stage}
          </div>
        ))}
      </div>
    );
  }

  function ErrorDisplay({ error }) {
    if (!error) return null;

    return (
      <div
        style={{
          color: "#721c24",
          marginBottom: "10px",
          padding: "10px",
          backgroundColor: "#f8d7da",
          borderRadius: "4px",
          border: "1px solid #f5c6cb",
        }}
      >
        {error}
      </div>
    );
  }

  function FormButton({ onClick, children, variant = "primary", disabled = false }) {
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

    const style = {
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px",
      fontWeight: "500",
      opacity: disabled ? 0.6 : 1,
      ...buttonStyles[variant],
    };

    return (
      <button onClick={onClick} style={style} disabled={disabled}>
        {children}
      </button>
    );
  }

  function FormContainer({ children, title = "Multi-Step Form" }) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "600px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>{title}</h2>
        {children}
      </div>
    );
  }

  function FormInput({ type = "text", placeholder, value, onChange, style = {} }) {
    const inputStyle = {
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      width: "100%",
      marginBottom: "10px",
      color: "#2c3e50",
      fontSize: "14px",
      backgroundColor: "white",
      ...style,
    };

    return <input type={type} placeholder={placeholder} value={value || ""} onChange={onChange} style={inputStyle} />;
  }

  function FormLabel({ children, style = {} }) {
    const labelStyle = {
      display: "block",
      marginBottom: "10px",
      color: "#495057",
      fontSize: "14px",
      ...style,
    };

    return <label style={labelStyle}>{children}</label>;
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

    const handleStageChange = React.useCallback(e => {
      setEditStage(e.target.value);
    }, []);

    const handleDataChange = React.useCallback(e => {
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
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef",
          maxWidth: "600px",
          width: "100%",
        }}
      >
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
              cursor: "pointer",
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
                  width: "100%",
                }}
              >
                <option value="personal">personal</option>
                <option value="contact">contact</option>
                <option value="preferences">preferences</option>
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
                  fontFamily: "monospace",
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
                  cursor: "pointer",
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
                  cursor: "pointer",
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
              <strong>Stage Components:</strong> personal, contact, preferences, confirmation, complete
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Data:</strong> {JSON.stringify(data)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Personal stage component
  function PersonalStage({ data, send }) {
    const handleNameChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), name: e.target.value };
        send("updateData", updatedData);
      },
      [data, send]
    );

    const handleNext = React.useCallback(() => {
      if (!data?.name || data.name.trim() === "") {
        const dataWithError = { ...(data || {}), errors: { personal: "Name is required" } };
        send("updateData", dataWithError);
        return;
      }
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send]);

    return (
      <FormContainer>
        <ProgressIndicator currentStage="personal" />
        <ErrorDisplay error={data?.errors?.personal} />

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Personal Information</h3>
          <FormInput placeholder="Name" value={data?.name} onChange={handleNameChange} />
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <FormButton onClick={handleNext}>Next</FormButton>
        </div>
      </FormContainer>
    );
  }

  // Contact stage component
  function ContactStage({ data, send }) {
    const handleEmailChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), email: e.target.value };
        send("updateData", updatedData);
      },
      [data, send]
    );

    const handlePhoneChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), phone: e.target.value };
        send("updateData", updatedData);
      },
      [data, send]
    );

    const handleNext = React.useCallback(() => {
      if (!data?.email || data.email.trim() === "") {
        const dataWithError = { ...(data || {}), errors: { contact: "Email is required" } };
        send("updateData", dataWithError);
        return;
      }
      if (!data.email.includes("@")) {
        const dataWithError = { ...(data || {}), errors: { contact: "Invalid email format" } };
        send("updateData", dataWithError);
        return;
      }
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send]);

    const handleBack = React.useCallback(() => {
      send("back", data || {});
    }, [data, send]);

    return (
      <FormContainer>
        <ProgressIndicator currentStage="contact" />
        <ErrorDisplay error={data?.errors?.contact} />

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Contact Information</h3>
          <FormInput type="email" placeholder="Email" value={data?.email} onChange={handleEmailChange} />
          <FormInput type="tel" placeholder="Phone (optional)" value={data?.phone} onChange={handlePhoneChange} style={{ marginBottom: "0" }} />
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <FormButton onClick={handleBack} variant="secondary">
            Back
          </FormButton>
          <FormButton onClick={handleNext}>Next</FormButton>
        </div>
      </FormContainer>
    );
  }

  // Preferences stage component
  function PreferencesStage({ data, send }) {
    const handlePreferenceChange = React.useCallback(
      (pref, checked) => {
        const prefs = data?.preferences || [];
        const updatedPrefs = checked ? [...prefs, pref] : prefs.filter(p => p !== pref);
        const updatedData = { ...(data || {}), preferences: updatedPrefs };
        send("updateData", updatedData);
      },
      [data, send]
    );

    const handleNext = React.useCallback(() => {
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send]);

    const handleBack = React.useCallback(() => {
      send("back", data || {});
    }, [data, send]);

    return (
      <FormContainer>
        <ProgressIndicator currentStage="preferences" />

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Preferences</h3>
          <FormLabel>
            <input
              type="checkbox"
              checked={data?.preferences?.includes("newsletter") || false}
              onChange={e => handlePreferenceChange("newsletter", e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Newsletter
          </FormLabel>
          <FormLabel>
            <input
              type="checkbox"
              checked={data?.preferences?.includes("notifications") || false}
              onChange={e => handlePreferenceChange("notifications", e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Notifications
          </FormLabel>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <FormButton onClick={handleBack} variant="secondary">
            Back
          </FormButton>
          <FormButton onClick={handleNext}>Next</FormButton>
        </div>
      </FormContainer>
    );
  }

  // Confirmation stage component
  function ConfirmationStage({ data, send }) {
    const handleSubmit = React.useCallback(() => {
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send]);

    const handleBack = React.useCallback(() => {
      send("back", data || {});
    }, [data, send]);

    return (
      <FormContainer>
        <ProgressIndicator currentStage="confirmation" />

        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Confirmation</h3>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              border: "1px solid #e9ecef",
            }}
          >
            <p style={{ margin: "5px 0", color: "#495057" }}>
              <strong style={{ color: "#2c3e50" }}>Name:</strong> {data?.name}
            </p>
            <p style={{ margin: "5px 0", color: "#495057" }}>
              <strong style={{ color: "#2c3e50" }}>Email:</strong> {data?.email}
            </p>
            <p style={{ margin: "5px 0", color: "#495057" }}>
              <strong style={{ color: "#2c3e50" }}>Phone:</strong> {data?.phone || "Not provided"}
            </p>
            <p style={{ margin: "5px 0", color: "#495057" }}>
              <strong style={{ color: "#2c3e50" }}>Preferences:</strong> {data?.preferences?.join(", ") || "None"}
            </p>
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <FormButton onClick={handleBack} variant="secondary">
            Back
          </FormButton>
          <FormButton onClick={handleSubmit}>Submit</FormButton>
        </div>
      </FormContainer>
    );
  }

  // Complete stage component
  function CompleteStage({ data, send }) {
    const handleStartOver = React.useCallback(() => {
      const resetData = {
        name: "",
        email: "",
        phone: "",
        preferences: [],
        errors: {},
      };
      send("restart", resetData);
    }, [send]);

    return (
      <FormContainer>
        <div>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Thank you!</h3>
          <p style={{ color: "#28a745", fontSize: "16px", fontWeight: "500" }}>Your information has been submitted successfully.</p>
          <FormButton onClick={handleStartOver} variant="success" style={{ marginTop: "10px" }}>
            Start Over
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "personal",
    data: {
      name: "",
      email: "",
      phone: "",
      preferences: [],
      errors: {},
    },
    stages: [
      {
        name: "personal",
        transitions: [
          { target: "contact", event: "next" },
          { target: "personal", event: "updateData" },
        ],
      },
      {
        name: "contact",
        transitions: [
          { target: "preferences", event: "next" },
          { target: "personal", event: "back" },
          { target: "contact", event: "updateData" },
        ],
      },
      {
        name: "preferences",
        transitions: [
          { target: "confirmation", event: "next" },
          { target: "contact", event: "back" },
          { target: "preferences", event: "updateData" },
        ],
      },
      {
        name: "confirmation",
        transitions: [
          { target: "complete", event: "next" },
          { target: "preferences", event: "back" },
          { target: "confirmation", event: "updateData" },
        ],
      },
      {
        name: "complete",
        transitions: [{ target: "personal", event: "restart" }],
      },
    ],
  });
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <DebugInfo />
      <StageRenderer
        currentStage="personal"
        stageComponents={{
          personal: PersonalStage,
          contact: ContactStage,
          preferences: PreferencesStage,
          confirmation: ConfirmationStage,
          complete: CompleteStage,
        }}
        data={{ name: "", email: "", phone: "", preferences: [], errors: {} }}
        send={(event, data) => {
          if (event === "next") {
            engine.send("next", data);
          } else if (event === "back") {
            engine.send("back", data);
          } else if (event === "updateData") {
            engine.send("updateData", data);
          } else if (event === "restart") {
            engine.send("restart", data);
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
