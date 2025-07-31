/**
 * Test setup for vitest
 */

import '@testing-library/jest-dom';
import { stageFlowMatchers } from './react-testing';

// Extend Jest matchers
if (typeof globalThis !== 'undefined' && 'expect' in globalThis) {
  (globalThis as any).expect.extend(stageFlowMatchers);
}

// Mock global functions that might not be available in test environment
(globalThis as any).setImmediate = (globalThis as any).setImmediate || ((fn: () => void) => setTimeout(fn, 0));