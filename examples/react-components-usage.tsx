/**
 * Example demonstrating React components usage
 */

import React from 'react';
import { 
  StageFlowEngine, 
  StageFlowProvider, 
  StageRenderer, 
  StageErrorBoundary,
  StageProps 
} from '@stage-flow/react';

// Define stage types
type AppStage = 'loading' | 'form' | 'success' | 'error';

interface AppData {
  username?: string;
  error?: string;
}

// Create stage flow configuration
const stageConfig = {
  initial: 'loading' as AppStage,
  stages: [
    {
      name: 'loading' as AppStage,
      transitions: [
        { target: 'form' as AppStage, duration: 2000 }
      ]
    },
    {
      name: 'form' as AppStage,
      transitions: [
        { target: 'success' as AppStage, event: 'submit' },
        { target: 'error' as AppStage, event: 'error' }
      ]
    },
    {
      name: 'success' as AppStage,
      transitions: [
        { target: 'form' as AppStage, event: 'reset' }
      ]
    },
    {
      name: 'error' as AppStage,
      transitions: [
        { target: 'form' as AppStage, event: 'retry' }
      ]
    }
  ],
  effects: {
    loading: { type: 'fade', duration: 300 },
    form: { type: 'slide', duration: 400 },
    success: { type: 'scale', duration: 300 },
    error: { type: 'slideUp', duration: 300 }
  }
};

// Create engine instance
const stageFlowEngine = new StageFlowEngine(stageConfig);

// Custom stage components
const LoadingStage = (_props: StageProps<AppStage, AppData>) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <h2>Loading...</h2>
    <div>Please wait while we prepare your experience</div>
  </div>
);

const FormStage = ({ stage: _stage, data, send }: StageProps<AppStage, AppData>) => (
  <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
    <h2>Welcome!</h2>
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const username = formData.get('username') as string;
      
      if (username.trim()) {
        send('submit', { username });
      } else {
        send('error', { error: 'Username is required' });
      }
    }}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="username">Username:</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          style={{ 
            width: '100%', 
            padding: '8px', 
            marginTop: '4px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          defaultValue={data?.username || ''}
        />
      </div>
      <button 
        type="submit"
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Submit
      </button>
    </form>
  </div>
);

const SuccessStage = ({ stage: _stage, data, send }: StageProps<AppStage, AppData>) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <h2>Success! 🎉</h2>
    <p>Welcome, {data?.username}!</p>
    <button 
      onClick={() => send('reset')}
      style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Start Over
    </button>
  </div>
);

const ErrorStage = ({ stage: _stage, data, send }: StageProps<AppStage, AppData>) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <h2>Error ❌</h2>
    <p style={{ color: 'red' }}>{data?.error || 'Something went wrong'}</p>
    <button 
      onClick={() => send('retry')}
      style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Try Again
    </button>
  </div>
);

// Main App component
export const ReactComponentsExample = () => {
  return (
    <StageFlowProvider engine={stageFlowEngine}>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minWidth: '500px',
          minHeight: '300px'
        }}>
          <StageErrorBoundary>
            <StageRenderer
              engine={stageFlowEngine as StageFlowEngine<AppStage, AppData>}
              stageComponents={{
                loading: LoadingStage,
                form: FormStage,
                success: SuccessStage,
                error: ErrorStage
              }}
              effects={stageConfig.effects}
            />
          </StageErrorBoundary>
        </div>
      </div>
    </StageFlowProvider>
  );
};

// Start the engine when the component mounts
stageFlowEngine.start();

export default ReactComponentsExample;