/**
 * Example demonstrating the integrated animation system with React components
 */

import React from 'react';
import { 
  StageFlowEngine, 
  StageFlowConfig, 
  DEFAULT_EFFECTS,
  effectRegistry,
  defineCustomEffect
} from '@stage-flow/core';
import { 
  StageRenderer, 
  StageFlowProvider, 
  useStageFlow,
  useStageEffect
} from '@stage-flow/react';

// Define our stage types
type AppStage = 'welcome' | 'loading' | 'dashboard' | 'settings';

interface AppData {
  user?: { name: string; email: string };
  loadingProgress?: number;
}

// Register a custom effect
const customBounceEffect = defineCustomEffect(
  'customBounce',
  (options = {}) => ({
    type: 'customBounce',
    duration: 600,
    easing: 'easeInOut',
    options: {
      variants: {
        initial: { scale: 0.3, opacity: 0, rotate: -180 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        exit: { scale: 0.3, opacity: 0, rotate: 180 }
      },
      ...options
    }
  }),
  'A bouncy entrance effect with rotation',
  { scale: 1, rotate: 0 }
);

effectRegistry.register(customBounceEffect);

// Stage flow configuration with effects
const stageFlowConfig: StageFlowConfig<AppStage, AppData> = {
  initial: 'welcome',
  stages: [
    {
      name: 'welcome',
      effect: 'fade', // Built-in effect
      transitions: [
        { target: 'loading', event: 'start' }
      ]
    },
    {
      name: 'loading',
      effect: 'slide', // Built-in effect
      transitions: [
        { target: 'dashboard', event: 'complete' },
        { target: 'welcome', event: 'cancel' }
      ]
    },
    {
      name: 'dashboard',
      effect: 'customBounce', // Custom effect
      transitions: [
        { target: 'settings', event: 'openSettings' },
        { target: 'welcome', event: 'logout' }
      ]
    },
    {
      name: 'settings',
      effect: 'slideUp', // Built-in effect
      transitions: [
        { target: 'dashboard', event: 'back' }
      ]
    }
  ]
};

// Stage components
const WelcomeStage: React.FC<{ send: (event: string, data?: AppData) => Promise<void> }> = ({ send }) => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <h1>Welcome to Stage Flow</h1>
    <p>Experience smooth animations between stages</p>
    <button onClick={() => send('start')}>
      Get Started
    </button>
  </div>
);

const LoadingStage: React.FC<{ send: (event: string, data?: AppData) => Promise<void>; data?: AppData }> = ({ send, data }) => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <h2>Loading...</h2>
    <div style={{ width: '200px', height: '10px', backgroundColor: '#f0f0f0', margin: '1rem auto' }}>
      <div 
        style={{ 
          width: `${data?.loadingProgress || 0}%`, 
          height: '100%', 
          backgroundColor: '#007bff',
          transition: 'width 0.3s ease'
        }} 
      />
    </div>
    <button onClick={() => send('cancel')}>Cancel</button>
  </div>
);

const DashboardStage: React.FC<{ send: (event: string, data?: AppData) => Promise<void>; data?: AppData }> = ({ send, data }) => (
  <div style={{ padding: '2rem' }}>
    <h2>Dashboard</h2>
    <p>Welcome, {data?.user?.name || 'User'}!</p>
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
      <button onClick={() => send('openSettings')}>
        Settings
      </button>
      <button onClick={() => send('logout')}>
        Logout
      </button>
    </div>
  </div>
);

const SettingsStage: React.FC<{ send: (event: string, data?: AppData) => Promise<void> }> = ({ send }) => (
  <div style={{ padding: '2rem' }}>
    <h2>Settings</h2>
    <div style={{ marginBottom: '1rem' }}>
      <label>
        <input type="checkbox" /> Enable notifications
      </label>
    </div>
    <div style={{ marginBottom: '1rem' }}>
      <label>
        <input type="checkbox" /> Dark mode
      </label>
    </div>
    <button onClick={() => send('back')}>
      Back to Dashboard
    </button>
  </div>
);

// Component that demonstrates animation disable/enable
const AnimationControls: React.FC<{ 
  disableAnimations: boolean; 
  onToggle: (disabled: boolean) => void;
}> = ({ disableAnimations, onToggle }) => (
  <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input 
        type="checkbox" 
        checked={disableAnimations}
        onChange={(e) => onToggle(e.target.checked)}
      />
      Disable Animations
    </label>
  </div>
);

// Component that shows current effect information
const EffectInfo: React.FC<{ engine: StageFlowEngine<AppStage, AppData> }> = ({ engine }) => {
  const { effect, isLoading } = useStageEffect(engine);
  const { currentStage } = useStageFlow(engine);

  if (isLoading) {
    return <div style={{ position: 'fixed', bottom: '10px', left: '10px' }}>Loading effect...</div>;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      padding: '0.5rem',
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: '4px',
      fontSize: '0.8rem'
    }}>
      <div><strong>Stage:</strong> {currentStage}</div>
      <div><strong>Effect:</strong> {effect?.type || 'none'}</div>
      <div><strong>Duration:</strong> {effect?.duration || 0}ms</div>
    </div>
  );
};

// Main app component
const AnimationIntegrationExample: React.FC = () => {
  const [engine] = React.useState(() => new StageFlowEngine(stageFlowConfig));
  const [disableAnimations, setDisableAnimations] = React.useState(false);

  React.useEffect(() => {
    engine.start();
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      if (engine.getCurrentStage() === 'loading') {
        progress += 10;
        if (progress >= 100) {
          engine.send('complete', { 
            user: { name: 'John Doe', email: 'john@example.com' },
            loadingProgress: 100 
          });
          clearInterval(interval);
        } else {
          // Update loading progress without changing stage
          engine.goTo('loading', { loadingProgress: progress });
        }
      }
    }, 200);

    return () => {
      clearInterval(interval);
      engine.stop();
    };
  }, [engine]);

  const stageComponents = {
    welcome: WelcomeStage,
    loading: LoadingStage,
    dashboard: DashboardStage,
    settings: SettingsStage
  };

  return (
    <StageFlowProvider engine={engine}>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        position: 'relative'
      }}>
        <AnimationControls 
          disableAnimations={disableAnimations}
          onToggle={setDisableAnimations}
        />
        
        <EffectInfo engine={engine} />
        
        <StageRenderer
          engine={engine}
          stageComponents={stageComponents}
          disableAnimations={disableAnimations}
          defaultEffect={DEFAULT_EFFECTS.fade}
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            minHeight: '400px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        />
      </div>
    </StageFlowProvider>
  );
};

export default AnimationIntegrationExample;

// Usage example with custom effects override
export const CustomEffectsExample: React.FC = () => {
  const engine = new StageFlowEngine(stageFlowConfig);

  // Custom effects that override stage-specific effects
  const customEffects = {
    welcome: DEFAULT_EFFECTS.scale,
    loading: DEFAULT_EFFECTS.slideLeft,
    dashboard: DEFAULT_EFFECTS.zoom,
    settings: DEFAULT_EFFECTS.flip,
    default: DEFAULT_EFFECTS.fade // Fallback effect
  };

  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        effects={customEffects}
        disableAnimations={false}
      />
    </StageFlowProvider>
  );
};

// Example demonstrating animation cleanup on rapid transitions
export const RapidTransitionExample: React.FC = () => {
  const engine = new StageFlowEngine(stageFlowConfig);

  const handleRapidTransitions = async () => {
    // These rapid transitions should properly clean up interrupted animations
    await engine.send('start');
    await engine.send('cancel');
    await engine.send('start');
    await engine.send('complete');
    await engine.send('openSettings');
    await engine.send('back');
  };

  return (
    <StageFlowProvider engine={engine}>
      <div>
        <button onClick={handleRapidTransitions}>
          Test Rapid Transitions
        </button>
        <StageRenderer
          engine={engine}
          defaultEffect={DEFAULT_EFFECTS.slide}
        />
      </div>
    </StageFlowProvider>
  );
};