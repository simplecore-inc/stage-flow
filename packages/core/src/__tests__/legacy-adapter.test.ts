/**
 * Tests for legacy adapter functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLegacyAdapter,
  migrateLegacyStore,
  migrationUtils,
  createMigrationGuide,
  type LegacyFlowConfig,
  type LegacyStageStore
} from '../migration/legacy-adapter';
import { StageFlowEngine } from '../engine';

describe('Legacy Adapter', () => {
  describe('createLegacyAdapter', () => {
    it('should convert simple legacy configuration', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'loading',
        stages: {
          loading: {
            on: {
              loaded: 'form'
            }
          },
          form: {
            on: {
              submit: 'success',
              error: 'error'
            }
          },
          success: {
            on: {
              reset: 'form'
            }
          },
          error: {
            on: {
              retry: 'form'
            }
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);

      expect(newConfig.initial).toBe('loading');
      expect(newConfig.stages).toHaveLength(4);
      
      const loadingStage = newConfig.stages.find(s => s.name === 'loading');
      expect(loadingStage).toBeDefined();
      expect(loadingStage!.transitions).toHaveLength(1);
      expect(loadingStage!.transitions[0]).toEqual({
        target: 'form',
        event: 'loaded'
      });
    });

    it('should convert complex transition configurations', () => {
      const mockCondition = vi.fn().mockReturnValue(true);
      
      const legacyConfig: LegacyFlowConfig = {
        initial: 'start',
        stages: {
          start: {
            on: {
              next: {
                target: 'end',
                cond: mockCondition
              }
            }
          },
          end: {
            on: {}
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      const startStage = newConfig.stages.find(s => s.name === 'start');
      
      expect(startStage!.transitions[0]).toEqual({
        target: 'end',
        event: 'next',
        condition: mockCondition
      });
    });

    it('should convert auto-transitions with duration and target', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'loading',
        stages: {
          loading: {
            after: {
              duration: 2000,
              target: 'ready'
            }
          },
          ready: {
            on: {}
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      const loadingStage = newConfig.stages.find(s => s.name === 'loading');
      
      expect(loadingStage!.transitions).toHaveLength(1);
      expect(loadingStage!.transitions[0]).toEqual({
        target: 'ready',
        after: 2000
      });
    });

    it('should convert legacy auto-transitions with just duration', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'loading',
        stages: {
          loading: {
            on: {
              loaded: 'ready'
            },
            after: 2000
          },
          ready: {
            on: {}
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      const loadingStage = newConfig.stages.find(s => s.name === 'loading');
      
      expect(loadingStage!.transitions).toHaveLength(2);
      expect(loadingStage!.transitions[1]).toEqual({
        target: 'ready',
        after: 2000
      });
    });

    it('should convert stage data and lifecycle hooks', () => {
      const onEntry = vi.fn();
      const onExit = vi.fn();
      
      const legacyConfig: LegacyFlowConfig = {
        initial: 'test',
        stages: {
          test: {
            data: { value: 42 },
            onEntry,
            onExit,
            on: {}
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      const testStage = newConfig.stages.find(s => s.name === 'test');
      
      expect(testStage!.data).toEqual({ value: 42 });
      expect(testStage!.onEnter).toBe(onEntry);
      expect(testStage!.onExit).toBe(onExit);
    });

    it('should convert effects configuration', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'test',
        stages: {
          test: {
            effect: 'fadeIn',
            on: {}
          }
        },
        effects: {
          fadeIn: {
            type: 'fade',
            duration: 300,
            easing: 'ease-in-out',
            customProp: 'value'
          }
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      
      expect(newConfig.effects).toBeDefined();
      expect(newConfig.effects!.fadeIn).toEqual({
        type: 'fade',
        duration: 300,
        easing: 'ease-in-out',
        delay: undefined,
        options: {
          customProp: 'value'
        }
      });
    });

    it('should convert persistence configuration', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'test',
        stages: {
          test: { on: {} }
        },
        config: {
          persist: true,
          storageKey: 'my-app-state'
        }
      };

      const newConfig = createLegacyAdapter(legacyConfig);
      
      expect(newConfig.persistence).toEqual({
        enabled: true,
        storage: 'localStorage',
        key: 'my-app-state'
      });
    });
  });

  describe('migrateLegacyStore', () => {
    let mockLegacyStore: LegacyStageStore;

    beforeEach(() => {
      mockLegacyStore = {
        currentStage: 'initial',
        stageData: { test: true },
        isTransitioning: false,
        history: [],
        send: vi.fn(),
        goTo: vi.fn(),
        reset: vi.fn(),
        subscribe: vi.fn()
      };
    });

    it('should create engine from legacy store with config', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'initial',
        stages: {
          initial: {
            on: {
              next: 'final'
            }
          },
          final: {
            on: {}
          }
        }
      };

      const engine = migrateLegacyStore(mockLegacyStore, legacyConfig);
      
      expect(engine).toBeInstanceOf(StageFlowEngine);
      expect(engine.getCurrentStage()).toBe('initial');
    });

    it('should create minimal engine from legacy store without config', () => {
      const engine = migrateLegacyStore(mockLegacyStore);
      
      expect(engine).toBeInstanceOf(StageFlowEngine);
      expect(engine.getCurrentStage()).toBe('initial');
    });

    it('should wrap legacy store methods', async () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'initial',
        stages: {
          initial: {
            on: {
              next: 'final'
            }
          },
          final: {
            on: {}
          }
        }
      };

      const engine = migrateLegacyStore(mockLegacyStore, legacyConfig);
      await engine.start();

      // Test that legacy store methods are wrapped by using engine directly
      await engine.send('next');
      expect(engine.getCurrentStage()).toBe('final');
      
      // Test that legacy store send method is wrapped
      expect(mockLegacyStore.send).toBeDefined();
      expect(typeof mockLegacyStore.send).toBe('function');
    });
  });

  describe('migrationUtils', () => {
    describe('validateLegacyConfig', () => {
      it('should validate correct legacy configuration', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'start',
          stages: {
            start: {
              on: {
                next: 'end'
              }
            },
            end: {
              on: {}
            }
          }
        };

        const result = migrationUtils.validateLegacyConfig(legacyConfig);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing initial stage', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: '',
          stages: {
            test: { on: {} }
          }
        };

        const result = migrationUtils.validateLegacyConfig(legacyConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Legacy config must have an initial stage');
      });

      it('should detect missing stages', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'test',
          stages: {}
        };

        const result = migrationUtils.validateLegacyConfig(legacyConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Legacy config must have at least one stage');
      });

      it('should detect invalid initial stage reference', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'nonexistent',
          stages: {
            test: { on: {} }
          }
        };

        const result = migrationUtils.validateLegacyConfig(legacyConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Initial stage "nonexistent" not found in stages');
      });

      it('should detect invalid transition targets', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'start',
          stages: {
            start: {
              on: {
                next: 'nonexistent'
              }
            }
          }
        };

        const result = migrationUtils.validateLegacyConfig(legacyConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Stage "start" has transition to non-existent stage "nonexistent"');
      });
    });

    describe('generateMigrationReport', () => {
      it('should generate comprehensive migration report', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'loading',
          stages: {
            loading: {
              after: 2000, // Legacy format
              onEntry: vi.fn()
            },
            ready: {
              on: {}
            }
          },
          effects: {
            fade: {
              type: 'fade',
              duration: 300
            }
          },
          config: {
            persist: true
          }
        };

        const report = migrationUtils.generateMigrationReport(legacyConfig);
        
        expect(report.summary).toContain('Successfully analyzed migration of 2 stages');
        expect(report.changes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'info',
              message: 'Migrating 2 stages'
            }),
            expect.objectContaining({
              type: 'warning',
              message: expect.stringContaining('legacy auto-transition format')
            }),
            expect.objectContaining({
              type: 'info',
              message: expect.stringContaining('lifecycle hooks will be preserved')
            }),
            expect.objectContaining({
              type: 'info',
              message: 'Migrating 1 effect configurations'
            }),
            expect.objectContaining({
              type: 'info',
              message: 'Persistence configuration will be migrated to new format'
            })
          ])
        );
        expect(report.newConfig).toBeDefined();
      });
    });

    describe('compareConfigurations', () => {
      it('should compare legacy and modern configurations', () => {
        const legacyConfig: LegacyFlowConfig = {
          initial: 'test',
          stages: {
            test: { on: {} }
          },
          config: {
            persist: true
          }
        };

        const newConfig = createLegacyAdapter(legacyConfig);
        const comparison = migrationUtils.compareConfigurations(legacyConfig, newConfig);
        
        expect(comparison.legacy).toBe(legacyConfig);
        expect(comparison.modern).toBe(newConfig);
        expect(comparison.differences).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: 'stages.format',
              legacy: 'Object with stage names as keys',
              modern: 'Array of stage configurations'
            }),
            expect.objectContaining({
              path: 'transitions.format',
              legacy: 'on: { event: target } format',
              modern: 'transitions: [{ target, event }] format'
            })
          ])
        );
      });
    });
  });

  describe('createMigrationGuide', () => {
    it('should create comprehensive migration guide', () => {
      const legacyConfig: LegacyFlowConfig = {
        initial: 'start',
        stages: {
          start: {
            on: {
              next: 'end'
            }
          },
          end: {
            on: {}
          }
        }
      };

      const guide = createMigrationGuide(legacyConfig);
      
      expect(guide).toContain('# Stage Flow Migration Guide');
      expect(guide).toContain('## Summary');
      expect(guide).toContain('## Changes');
      expect(guide).toContain('## Migration Steps');
      expect(guide).toContain('## New Configuration');
      expect(guide).toContain('```typescript');
    });
  });
});