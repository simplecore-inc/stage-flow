/**
 * @stage-flow/testing - Testing utilities for stage flow library
 */

// Re-export core types for convenience
export * from '@stage-flow/core';

// Test engine and utilities
export { StageFlowTestEngine } from './test-engine';
export type { TestEngineOptions } from './test-engine';

// Mock utilities
export {
  createMockPlugin,
  createMockMiddleware,
  createSpyPlugin,
  createSpyMiddleware,
  createAsyncPlugin,
  createAsyncMiddleware,
  createErrorPlugin,
  createErrorMiddleware,
  waitForCalls,
  resetPluginMocks,
  resetMiddlewareMocks
} from './mocks';
export type {
  MockPluginConfig,
  MockMiddlewareConfig
} from './mocks';

// React testing utilities
export {
  renderStageFlow,
  createMockStageComponent,
  createTestProvider,
  createStageFlowTestSetup,
  createStageFlowInteractions,
  waitForReactUpdate,
  StageFlowTestInteractions,
  stageFlowMatchers
} from './react-testing';
export type {
  StageFlowRenderResult,
  RenderStageFlowOptions,
  StageFlowTestSetup
} from './react-testing';