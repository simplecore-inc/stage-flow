/**
 * Tests for StageFlowProvider component
 */


import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StageFlowProvider, useStageFlowContext } from '../components/StageFlowProvider';
import { StageFlowEngine } from '@stage-flow/core';

// Mock StageFlowEngine
const mockEngine = {
  getCurrentStage: vi.fn(() => 'initial'),
  getCurrentData: vi.fn(() => undefined),
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
} as unknown as StageFlowEngine<string, unknown>;

// Test component that uses the context
const TestComponent = () => {
  const engine = useStageFlowContext();
  return <div data-testid="test-component">Engine available: {String(!!engine)}</div>;
};

describe('StageFlowProvider', () => {
  it('should provide engine to child components', () => {
    render(
      <StageFlowProvider engine={mockEngine}>
        <TestComponent />
      </StageFlowProvider>
    );

    expect(screen.getByTestId('test-component')).toHaveTextContent('Engine available: true');
  });

  it('should render children correctly', () => {
    render(
      <StageFlowProvider engine={mockEngine}>
        <div data-testid="child">Child content</div>
      </StageFlowProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child content');
  });

  it('should throw error when useStageFlowContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useStageFlowContext must be used within a StageFlowProvider');

    consoleSpy.mockRestore();
  });
});