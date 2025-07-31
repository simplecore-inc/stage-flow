---
id: animation-effects
title: Animation Effects
sidebar_label: Animation Effects
---

# Animation Effects with Stage Flow

A demonstration of different animation effects during stage transitions using individual stage components and StageRenderer with advanced timer control features.

**Key features to observe:**

1. **Individual Stage Components**: Each page is a separate React component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Loading Stage**: Initial loading animation with self-implemented timer (3 seconds)
4. **Page Navigation**: Navigate between 5 different colored pages
5. **Built-in Effects**: Using Stage Flow's built-in animation effects
6. **Navigation Controls**: Previous/Next buttons and direct page selection
7. **Smooth Transitions**: Observe how animations enhance the user experience
8. **State Management**: Page state and animation state management
9. **Advanced Timer Control**: Pause/resume timers on hover, reset functionality, and real-time remaining time display
10. **StageFlowEngine Integration**: All timer functionality relies on the engine's internal timer mechanisms

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow, StageRenderer } from '@stage-flow/react';

function AnimationWithStageFlow() {
  // Common UI Components
  function PageContainer({ children, backgroundColor, color = "white", style = {}, onMouseEnter, onMouseLeave, onResetTimer }) {
    const containerStyle = {
      minHeight: "400px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor,
      color,
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      margin: "20px",
      position: "relative",
      overflow: "hidden",
      ...style,
    };

    const resetButtonStyle = {
      position: "absolute",
      bottom: "15px",
      right: "15px",
      padding: "6px 12px",
      fontSize: "12px",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "white",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "4px",
      cursor: "pointer",
      backdropFilter: "blur(5px)",
      transition: "all 0.2s ease",
    };

    return (
      <div 
        style={containerStyle} 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
        {onResetTimer && (
          <button 
            onClick={onResetTimer}
            style={resetButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            Reset Timer
          </button>
        )}
      </div>
    );
  }

  function PageTitle({ children, style = {} }) {
    const titleStyle = {
      fontSize: "48px",
      margin: "0 0 20px 0",
      ...style,
    };

    return <h1 style={titleStyle}>{children}</h1>;
  }

  function PageDescription({ children, style = {} }) {
    const descStyle = {
      fontSize: "18px",
      margin: "0 0 30px 0",
      textAlign: "center",
      ...style,
    };

    return <p style={descStyle}>{children}</p>;
  }

  function EffectInfo({ effect, color, style = {} }) {
    const infoStyle = {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      ...style,
    };

    return (
      <div style={infoStyle}>
        <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
          Effect: <strong>{effect}</strong>
        </p>
        <p style={{ margin: "0", fontSize: "14px", opacity: 0.9 }}>Color: {color}</p>
      </div>
    );
  }

  function NavigationButton({ onClick, children, variant = "primary", style = {} }) {
    const buttonStyles = {
      primary: {
        backgroundColor: "#007bff",
        color: "white",
      },
      secondary: {
        backgroundColor: "#6c757d",
        color: "white",
      },
    };

    const buttonStyle = {
      padding: "12px 24px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      ...buttonStyles[variant],
      ...style,
    };

    return (
      <button onClick={onClick} style={buttonStyle}>
        {children}
      </button>
    );
  }

  function PageButton({ onClick, isActive, color, children, style = {} }) {
    const buttonStyle = {
      padding: "8px 16px",
      backgroundColor: isActive ? color : "#e9ecef",
      color: isActive ? "white" : "#495057",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s ease",
      ...style,
    };

    return (
      <button onClick={onClick} style={buttonStyle}>
        {children}
      </button>
    );
  }

  function TimerDisplay({ remainingTime, isPaused, style = {} }) {
    const timerStyle = {
      fontSize: "12px",
      color: "rgba(255,255,255,0.8)",
      marginTop: "10px",
      ...style,
    };

    return (
      <p style={timerStyle}>
        Stage Timer: {remainingTime}ms {isPaused ? "(Paused)" : ""}
      </p>
    );
  }



  // Loading stage component
  function LoadingStage({ stage, data, send, goTo, isTransitioning }) {
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const startTime = React.useRef(Date.now());

    React.useEffect(() => {
      // Auto-transition from loading to page1 after 3 seconds
      const timer = setTimeout(() => {
        send("loaded");
      }, 3000);

      // Update elapsed time every 100ms
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.current);
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }, [send]);

    return (
      <PageContainer backgroundColor="#f8f9fa" color="#333">
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "20px", fontSize: "18px" }}>Loading...</p>
        <p style={{ fontSize: "14px", color: "#666" }}>Initializing animation system...</p>
        <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
          Elapsed: {elapsedTime}ms
        </p>
      </PageContainer>
    );
  }

  // Red page stage component
  function RedPageStage({ stage, data, send, goTo, isTransitioning, remainingTime, isPaused, onMouseEnter, onMouseLeave, onResetTimer }) {
    return (
      <PageContainer 
        backgroundColor="#dc3545"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onResetTimer={onResetTimer}
      >
        <PageTitle>Red Page</PageTitle>
        <PageDescription>
          This page demonstrates the <strong>slideRight</strong> effect.
        </PageDescription>
        <EffectInfo effect="slideRight" color="#dc3545" />
        <TimerDisplay remainingTime={remainingTime} isPaused={isPaused} />
      </PageContainer>
    );
  }

  // Blue page stage component
  function BluePageStage({ stage, data, send, goTo, isTransitioning, remainingTime, isPaused, onMouseEnter, onMouseLeave, onResetTimer }) {
    return (
      <PageContainer 
        backgroundColor="#007bff"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onResetTimer={onResetTimer}
      >
        <PageTitle>Blue Page</PageTitle>
        <PageDescription>
          This page demonstrates the <strong>slideLeft</strong> effect.
        </PageDescription>
        <EffectInfo effect="slideLeft" color="#007bff" />
        <TimerDisplay remainingTime={remainingTime} isPaused={isPaused} />
      </PageContainer>
    );
  }

  // Green page stage component
  function GreenPageStage({ stage, data, send, goTo, isTransitioning, remainingTime, isPaused, onMouseEnter, onMouseLeave, onResetTimer }) {
    return (
      <PageContainer 
        backgroundColor="#28a745"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onResetTimer={onResetTimer}
      >
        <PageTitle>Green Page</PageTitle>
        <PageDescription>
          This page demonstrates the <strong>scaleUp</strong> effect.
        </PageDescription>
        <EffectInfo effect="scaleUp" color="#28a745" />
        <TimerDisplay remainingTime={remainingTime} isPaused={isPaused} />
      </PageContainer>
    );
  }

  // Purple page stage component
  function PurplePageStage({ stage, data, send, goTo, isTransitioning, remainingTime, isPaused, onMouseEnter, onMouseLeave, onResetTimer }) {
    return (
      <PageContainer 
        backgroundColor="#6f42c1"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onResetTimer={onResetTimer}
      >
        <PageTitle>Purple Page</PageTitle>
        <PageDescription>
          This page demonstrates the <strong>rotate</strong> effect.
        </PageDescription>
        <EffectInfo effect="rotate" color="#6f42c1" />
        <TimerDisplay remainingTime={remainingTime} isPaused={isPaused} />
      </PageContainer>
    );
  }

  // Orange page stage component
  function OrangePageStage({ stage, data, send, goTo, isTransitioning, remainingTime, isPaused, onMouseEnter, onMouseLeave, onResetTimer }) {
    return (
      <PageContainer 
        backgroundColor="#fd7e14"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onResetTimer={onResetTimer}
      >
        <PageTitle>Orange Page</PageTitle>
        <PageDescription>
          This page demonstrates the <strong>zoom</strong> effect.
        </PageDescription>
        <EffectInfo effect="zoom" color="#fd7e14" />
        <TimerDisplay remainingTime={remainingTime} isPaused={isPaused} />
      </PageContainer>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "loading",
    stages: [
      {
        name: "loading",
        transitions: [{ target: "page1", event: "loaded"}], // Handle timer directly within the step to trigger transition
        effect: "fade",
      },
      {
        name: "page1",
        transitions: [
          { target: "page2", event: "next", after: 5000 },
          { target: "page5", event: "previous" },
        ],
        effect: "slideRight",
      },
      {
        name: "page2",
        transitions: [
          { target: "page3", event: "next", after: 5000 },
          { target: "page1", event: "previous" },
        ],
        effect: "slideLeft",
      },
      {
        name: "page3",
        transitions: [
          { target: "page4", event: "next", after: 5000 },
          { target: "page2", event: "previous" },
        ],
        effect: "scaleUp",
      },
      {
        name: "page4",
        transitions: [
          { target: "page5", event: "next", after: 5000 },
          { target: "page3", event: "previous" },
        ],
        effect: "rotate",
      },
      {
        name: "page5",
        transitions: [
          { target: "page1", event: "next", after: 5000 },
          { target: "page4", event: "previous" },
        ],
        effect: "zoom",
      },
    ],
  });
  engine.start();

  // AnimationContent component inside the main function
  function AnimationContent({ engine }) {
    const { 
      currentStage, 
      data, 
      send, 
      goTo,
      pauseTimers,
      resumeTimers,
      resetTimers,
      getTimerRemainingTime,
      areTimersPaused
    } = useStageFlow();

    const [remainingTime, setRemainingTime] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);

    // Update timer display from engine
    React.useEffect(() => {
      const interval = setInterval(() => {
        const remaining = getTimerRemainingTime();
        const paused = areTimersPaused();
        setRemainingTime(remaining);
        setIsPaused(paused);
      }, 100);

      return () => clearInterval(interval);
    }, [getTimerRemainingTime, areTimersPaused, currentStage]);



    // Page configurations
    const pages = [
      {
        id: "page1",
        name: "Red Page",
        color: "#dc3545",
        effect: "slideRight",
      },
      {
        id: "page2",
        name: "Blue Page",
        color: "#007bff",
        effect: "slideLeft",
      },
      {
        id: "page3",
        name: "Green Page",
        color: "#28a745",
        effect: "scaleUp",
      },
      {
        id: "page4",
        name: "Purple Page",
        color: "#6f42c1",
        effect: "rotate",
      },
      {
        id: "page5",
        name: "Orange Page",
        color: "#fd7e14",
        effect: "zoom",
      },
    ];

    const currentPage = pages.find(p => p.id === currentStage) || pages[0];

    const handleNext = React.useCallback(() => {
      send("next");
    }, [send]);

    const handlePrevious = React.useCallback(() => {
      send("previous");
    }, [send]);

    const handlePageSelect = React.useCallback((pageId) => {
      // Navigate directly to the selected page
      if (pageId !== currentStage) {
        goTo(pageId);
      }
    }, [currentStage, goTo]);



    const handleMouseEnter = React.useCallback(() => {
      if (currentStage !== "loading") {
        pauseTimers();
      }
    }, [currentStage, pauseTimers]);

    const handleMouseLeave = React.useCallback(() => {
      if (currentStage !== "loading") {
        resumeTimers();
      }
    }, [currentStage, resumeTimers]);

    const handleResetTimer = React.useCallback(() => {
      if (currentStage !== "loading") {
        resetTimers();
      }
    }, [currentStage, resetTimers]);

    return (
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 20px 0", color: "#333", textAlign: "center" }}>Animation Effects with Stage Flow</h2>

          <p style={{ margin: "0 0 15px 0", color: "#666", textAlign: "center" }}>
            Current Stage: <strong>{currentStage}</strong>
          </p>

          {/* Timer Instructions */}
          <div style={{ 
            backgroundColor: "#e3f2fd", 
            padding: "15px", 
            borderRadius: "8px", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#1976d2" }}>
              <strong>Timer Control:</strong> Hover over the content area to pause timers, move mouse away to resume.
            </p>
            <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
              Each page auto-advances after 5 seconds. Timer shows remaining time in milliseconds. Use Reset Timer button to restart from 5 seconds.
            </p>
          </div>

          {/* Main Content Area */}
          <div 
            style={{ position: "relative", minHeight: "400px" }}
          >
            <StageRenderer
              engine={engine}
              stageComponents={{
                loading: LoadingStage,
                page1: (props) => <RedPageStage {...props} remainingTime={remainingTime} isPaused={isPaused} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onResetTimer={handleResetTimer} />,
                page2: (props) => <BluePageStage {...props} remainingTime={remainingTime} isPaused={isPaused} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onResetTimer={handleResetTimer} />,
                page3: (props) => <GreenPageStage {...props} remainingTime={remainingTime} isPaused={isPaused} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onResetTimer={handleResetTimer} />,
                page4: (props) => <PurplePageStage {...props} remainingTime={remainingTime} isPaused={isPaused} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onResetTimer={handleResetTimer} />,
                page5: (props) => <OrangePageStage {...props} remainingTime={remainingTime} isPaused={isPaused} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onResetTimer={handleResetTimer} />,
              }}
              disableAnimations={false}
              style={{ minHeight: "400px" }}
            />


          </div>

          {/* Navigation Controls */}
          {currentStage !== "loading" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <NavigationButton onClick={handlePrevious} variant="secondary">
                ← Previous
              </NavigationButton>

              <div style={{ display: "flex", gap: "10px" }}>
                {pages.map(page => (
                  <PageButton
                    key={page.id}
                    onClick={() => handlePageSelect(page.id)}
                    isActive={currentStage === page.id}
                    color={page.color}
                  >
                    {page.name.split(" ")[0]}
                  </PageButton>
                ))}
              </div>

              <NavigationButton onClick={handleNext}>
                Next →
              </NavigationButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <StageFlowProvider engine={engine}>
      <AnimationContent engine={engine} />
    </StageFlowProvider>
  );
}
```

## Code Explanation

### Stage Configuration

The animation example uses multiple stages for different animation effects with automatic transitions:

```javascript
const engine = new StageFlowEngine({
  initial: "loading",
  stages: [
    { 
      name: "loading", 
      transitions: [{ target: "page1", event: "loaded" }], 
      effect: "fade" 
    },
    { 
      name: "page1", 
      transitions: [
        { target: "page2", event: "next", after: 5000 },
        { target: "page5", event: "previous" }
      ], 
      effect: "slideRight" 
    },
    // ... other stages with 5-second auto-advance
  ],
});
```

### Animation Effects

Each stage demonstrates different animation effects:

- **Loading**: Fade effect with self-implemented 3-second timer
- **Red Page**: slideRight effect with 5-second auto-advance
- **Blue Page**: slideLeft effect with 5-second auto-advance
- **Green Page**: scaleUp effect with 5-second auto-advance
- **Purple Page**: rotate effect with 5-second auto-advance
- **Orange Page**: zoom effect with 5-second auto-advance

### Advanced Timer Control Features

The example includes comprehensive timer control functionality that relies entirely on StageFlowEngine:

```javascript
const { 
  pauseTimers, 
  resumeTimers, 
  resetTimers, 
  getTimerRemainingTime, 
  areTimersPaused 
} = useStageFlow();

// Real-time timer display update
React.useEffect(() => {
  const interval = setInterval(() => {
    const remaining = getTimerRemainingTime();
    const paused = areTimersPaused();
    setRemainingTime(remaining);
    setIsPaused(paused);
  }, 100);
  return () => clearInterval(interval);
}, [getTimerRemainingTime, areTimersPaused, currentStage]);

// Pause timers on mouse enter
const handleMouseEnter = React.useCallback(() => {
  if (currentStage !== "loading") {
    pauseTimers();
  }
}, [currentStage, pauseTimers]);

// Resume timers on mouse leave
const handleMouseLeave = React.useCallback(() => {
  if (currentStage !== "loading") {
    resumeTimers();
  }
}, [currentStage, resumeTimers]);

// Reset timers to original duration
const handleResetTimer = React.useCallback(() => {
  if (currentStage !== "loading") {
    resetTimers();
  }
}, [currentStage, resetTimers]);
```

### Timer Display Component

Real-time timer display showing remaining time and pause status:

```javascript
function TimerDisplay({ remainingTime, isPaused, style = {} }) {
  return (
    <p style={timerStyle}>
      Stage Timer: {remainingTime}ms {isPaused ? "(Paused)" : ""}
    </p>
  );
}
```

### Navigation System

Real-time navigation with multiple controls:

```javascript
const handlePageSelect = React.useCallback((pageId) => {
  if (pageId !== currentStage) {
    goTo(pageId);
  }
}, [currentStage, goTo]);
```

## Benefits

1. **Visual Feedback**: Different animation effects for each page
2. **Smooth Transitions**: Built-in animation system
3. **Flexible Navigation**: Multiple ways to navigate between pages
4. **State Management**: Centralized state for all animation data
5. **Component Reusability**: Common UI components for consistency
6. **Individual Stage Components**: Each page is a separate component
7. **Advanced Timer Control**: Pause, resume, and reset functionality for automatic transitions
8. **Interactive Experience**: Mouse hover controls for timer management
9. **Real-time Timer Display**: Live remaining time and pause status indication
10. **Engine Integration**: All timer functionality relies on StageFlowEngine's internal mechanisms
11. **Reset Button**: Convenient reset functionality positioned in each stage
12. **Loading Stage Independence**: Self-implemented timer for loading stage

## Related Examples

- **[Setup Wizard](../advanced/setup-wizard.md)** - Multi-step configuration wizard
- **[Authentication Flow](../advanced/authentication-flow.md)** - Complex login/logout workflows
- **[Shopping Cart](../advanced/shopping-cart.md)** - Multi-step purchase process
- **[Basic Examples](../basic/basic)** - Simple stage machine examples
