/**
 * Tests for StageRenderer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StageRenderer, StageProps } from '../components/StageRenderer';
import { StageFlowEngine, DEFAULT_EFFECTS } from '@stage-flow/core';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children, onExitComplete }: { children: React.ReactNode; onExitComplete?: () => void }) => {
    // Simulate animation completion without using React hooks
    if (onExitComplete) {
      setTimeout(onExitComplete, 100);
    }
    return <div data-testid="animate-presence">{children}</div>;
  },
  motion: {
    div: ({ children, className, style, onAnimationStart, onAnimationComplete, ...props }: { 
      children?: React.ReactNode; 
      className?: string; 
      style?: React.CSSProperties; 
      onAnimationStart?: () => void;
      onAnimationComplete?: () => void;
      [key: string]: unknown;
    }) => {
      // Simulate animation lifecycle without using React hooks
      if (onAnimationStart) {
        onAnimationStart();
      }
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 50);
      }
      
      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    }
  }
}));

// Mock StageFlowEngine
const mockEngine = {
  getCurrentStage: vi.fn(() => 'stage1'),
  getCurrentData: vi.fn(() => ({ test: 'data' })),
  getCurrentStageEffect: vi.fn(() => undefined),
  getStageEffect: vi.fn(() => undefined),
  send: vi.fn(),
  goTo: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  installPlugin: vi.fn(),
  uninstallPlugin: vi.fn(),
  getInstalledPlugins: vi.fn(() => []),
  getPlugin: vi.fn(),
  getPluginState: vi.fn(),
  setPluginState: vi.fn(),
  addMiddleware: vi.fn(),
  removeMiddleware: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn()
} as unknown as StageFlowEngine<'stage1' | 'stage2', { test: string }>;

// Mock useStageFlow hook
vi.mock('../hooks/useStageFlow', () => ({
  useStageFlow: () => ({
    currentStage: 'stage1',
    data: { test: 'data' },
    send: vi.fn(),
    goTo: vi.fn(),
    isTransitioning: false
  })
}));

// Test stage component
const TestStageComponent = ({ stage, data }: StageProps<'stage1' | 'stage2', { test: string }>) => (
  <div data-testid="stage-component">
    Stage: {stage}, Data: {data?.test}
  </div>
);

describe('StageRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the current stage with default component', () => {
    render(<StageRenderer engine={mockEngine} />);

    expect(screen.getByText('Stage: stage1')).toBeInTheDocument();
  });

  it('should render custom stage component when provided', () => {
    const stageComponents = {
      stage1: TestStageComponent
    };

    render(
      <StageRenderer 
        engine={mockEngine} 
        stageComponents={stageComponents}
      />
    );

    expect(screen.getByTestId('stage-component')).toHaveTextContent('Stage: stage1, Data: data');
  });

  it('should render fallback component for stages without specific components', () => {
    const FallbackComponent = ({ stage }: StageProps<'stage1' | 'stage2', { test: string }>) => (
      <div data-testid="fallback">Fallback for {stage}</div>
    );

    render(
      <StageRenderer 
        engine={mockEngine} 
        fallbackComponent={FallbackComponent}
      />
    );

    expect(screen.getByTestId('fallback')).toHaveTextContent('Fallback for stage1');
  });

  it('should apply custom className and style', () => {
    const { container } = render(
      <StageRenderer 
        engine={mockEngine} 
        className="custom-class"
        style={{ backgroundColor: 'red' }}
      />
    );

    const rendererDiv = container.firstChild as HTMLElement;
    expect(rendererDiv).toHaveClass('custom-class');
    expect(rendererDiv.style.backgroundColor).toBe('red');
  });

  it('should disable animations when disableAnimations is true', () => {
    render(
      <StageRenderer 
        engine={mockEngine} 
        disableAnimations={true}
      />
    );

    // Should render without AnimatePresence wrapper
    expect(screen.getByText('Stage: stage1')).toBeInTheDocument();
    expect(screen.queryByTestId('animate-presence')).not.toBeInTheDocument();
  });

  it('should use stage-specific effect from engine', () => {
    const mockEngineWithEffect = {
      ...mockEngine,
      getCurrentStageEffect: vi.fn(() => 'slide')
    } as unknown as StageFlowEngine<'stage1' | 'stage2', { test: string }>;

    render(<StageRenderer engine={mockEngineWithEffect} />);

    expect(mockEngineWithEffect.getCurrentStageEffect).toHaveBeenCalled();
  });

  it('should use effect override from props', () => {
    const customEffect = DEFAULT_EFFECTS.scale;
    const effects = {
      stage1: customEffect
    };

    render(
      <StageRenderer 
        engine={mockEngine} 
        effects={effects}
      />
    );

    // Should render with AnimatePresence when animations are enabled
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('should use default effect when no stage-specific effect is defined', () => {
    const customDefaultEffect = DEFAULT_EFFECTS.zoom;

    render(
      <StageRenderer 
        engine={mockEngine} 
        defaultEffect={customDefaultEffect}
      />
    );

    // Should render with AnimatePresence
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('should handle animation lifecycle callbacks', async () => {
    // Mock StageAnimation to accept and call the callbacks
    vi.doMock('./StageAnimation', () => ({
      StageAnimation: ({ onAnimationStart, onAnimationComplete, children }: {
        onAnimationStart?: () => void;
        onAnimationComplete?: () => void;
        children: React.ReactNode;
      }) => {
        React.useEffect(() => {
          onAnimationStart?.();
          const timer = setTimeout(() => {
            onAnimationComplete?.();
          }, 50);
          return () => clearTimeout(timer);
        }, [onAnimationStart, onAnimationComplete]);
        
        return <div data-testid="stage-animation">{children}</div>;
      }
    }));

    render(<StageRenderer engine={mockEngine} />);

    // Animation callbacks should be handled internally
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('should warn when stage effect is not found', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const mockEngineWithInvalidEffect = {
      ...mockEngine,
      getCurrentStageEffect: vi.fn(() => 'invalid-effect')
    } as unknown as StageFlowEngine<'stage1' | 'stage2', { test: string }>;

    render(<StageRenderer engine={mockEngineWithInvalidEffect} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Effect "invalid-effect" not found')
    );

    consoleSpy.mockRestore();
  });
});