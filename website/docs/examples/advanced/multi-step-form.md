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

## Key Features

This example demonstrates several advanced Stage Flow patterns:

### 1. **Data Management with `setStageData`**

The form uses `engine.setStageData()` to update form data without triggering stage transitions:

```tsx
const handleNameChange = React.useCallback(
  e => {
    const updatedData = { ...(data || {}), name: e.target.value };
    engine.setStageData(updatedData); // Updates data without stage change
  },
  [data, engine]
);
```

This allows for:
- **Real-time form updates**: Data changes immediately without transitions
- **Validation feedback**: Error states can be updated instantly
- **Performance**: No unnecessary stage transitions for data updates

### 2. **Multi-stage Form Flow**

The form progresses through multiple stages with data persistence:

```tsx
// Personal stage
{ name: 'personal', transitions: [{ target: 'contact', event: 'next' }] }

// Contact stage  
{ name: 'contact', transitions: [
  { target: 'personal', event: 'back' },
  { target: 'review', event: 'next' }
]}

// Review stage
{ name: 'review', transitions: [
  { target: 'contact', event: 'back' },
  { target: 'success', event: 'submit' }
]}
```

### 3. **Error Handling**

Each stage validates data and shows appropriate errors:

```tsx
const handleNext = React.useCallback(() => {
  if (!data?.name || data.name.trim() === "") {
    const dataWithError = { ...(data || {}), errors: { personal: "Name is required" } };
    engine.setStageData(dataWithError); // Update with error state
    return;
  }
  // Proceed to next stage
  send("next", updatedData);
}, [data, send, engine]);
```

### 4. **Progress Tracking**

The form shows current progress and allows navigation:

```tsx
function ProgressIndicator({ currentStage }) {
  const stages = ['personal', 'contact', 'review', 'success'];
  const currentIndex = stages.indexOf(currentStage);
  
  return (
    <div className="progress-bar">
      {stages.map((stage, index) => (
        <div key={stage} className={`step ${index <= currentIndex ? 'active' : ''}`}>
          {stage}
        </div>
      ))}
    </div>
  );
}
```

## Usage

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

// Create engine with form configuration
const engine = new StageFlowEngine(formConfig);

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <MultiStepForm />
    </StageFlowProvider>
  );
}
```

## Benefits

- **Type-safe data updates**: `setStageData` ensures data consistency
- **Reactive UI**: Changes are immediately reflected in components
- **Validation integration**: Error states update without transitions
- **Performance optimized**: No unnecessary re-renders or transitions
- **Developer experience**: Clean, predictable data flow

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
    const { currentStage, data } = useStageFlow();

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
        <div style={{ marginBottom: "10px" }}>
          <h4 style={{ margin: "0", color: "#495057" }}>Debug Info:</h4>
        </div>

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
      </div>
    );
  }

  // Personal stage component
  function PersonalStage({ data, send }) {
    const { engine } = useStageFlow();
    
    const handleNameChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), name: e.target.value };
        engine.setStageData(updatedData);
      },
      [data, engine]
    );

    const handleNext = React.useCallback(() => {
      if (!data?.name || data.name.trim() === "") {
        const dataWithError = { ...(data || {}), errors: { personal: "Name is required" } };
        engine.setStageData(dataWithError);
        return;
      }
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send, engine]);

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
    const { engine } = useStageFlow();
    
    const handleEmailChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), email: e.target.value };
        engine.setStageData(updatedData);
      },
      [data, engine]
    );

    const handlePhoneChange = React.useCallback(
      e => {
        const updatedData = { ...(data || {}), phone: e.target.value };
        engine.setStageData(updatedData);
      },
      [data, engine]
    );

    const handleNext = React.useCallback(() => {
      if (!data?.email || data.email.trim() === "") {
        const dataWithError = { ...(data || {}), errors: { contact: "Email is required" } };
        engine.setStageData(dataWithError);
        return;
      }
      if (!data.email.includes("@")) {
        const dataWithError = { ...(data || {}), errors: { contact: "Invalid email format" } };
        engine.setStageData(dataWithError);
        return;
      }
      const updatedData = { ...(data || {}), errors: {} };
      send("next", updatedData);
    }, [data, send, engine]);

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
    const { engine } = useStageFlow();
    
    const handlePreferenceChange = React.useCallback(
      (pref, checked) => {
        const prefs = data?.preferences || [];
        const updatedPrefs = checked ? [...prefs, pref] : prefs.filter(p => p !== pref);
        const updatedData = { ...(data || {}), preferences: updatedPrefs };
        engine.setStageData(updatedData);
      },
      [data, engine]
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
        ],
      },
      {
        name: "contact",
        transitions: [
          { target: "preferences", event: "next" },
          { target: "personal", event: "back" },
        ],
      },
      {
        name: "preferences",
        transitions: [
          { target: "confirmation", event: "next" },
          { target: "contact", event: "back" },
        ],
      },
      {
        name: "confirmation",
        transitions: [
          { target: "complete", event: "next" },
          { target: "preferences", event: "back" },
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
        stageComponents={{
          personal: PersonalStage,
          contact: ContactStage,
          preferences: PreferencesStage,
          confirmation: ConfirmationStage,
          complete: CompleteStage,
        }}
      />
    </StageFlowProvider>
  );
}