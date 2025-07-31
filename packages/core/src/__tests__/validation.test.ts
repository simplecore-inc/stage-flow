/**
 * Tests for the validation system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StageFlowValidator,
  validateStageFlowConfig,
  validateStageFlowConfigStrict,
  RuntimeTypeChecker,
  DevelopmentWarnings
} from '../validation';
import { StageFlowConfig } from '../types/core';
import { ConfigurationError } from '../types/errors';

describe('StageFlowValidator', () => {
  let validator: StageFlowValidator<any, any>;

  beforeEach(() => {
    validator = new StageFlowValidator();
    DevelopmentWarnings.clearWarnings();
  });

  describe('basic validation', () => {
    it('should validate a correct configuration', () => {
      const config: StageFlowConfig<'loading' | 'form' | 'success', any> = {
        initial: 'loading',
        stages: [
          {
            name: 'loading',
            transitions: [{ target: 'form' }]
          },
          {
            name: 'form',
            transitions: [{ target: 'success' }]
          },
          {
            name: 'success',
            transitions: []
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without initial stage', () => {
      const config = {
        stages: [
          { name: 'loading', transitions: [] }
        ]
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial stage must be specified');
    });

    it('should reject configuration without stages', () => {
      const config = {
        initial: 'loading'
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Stages array is required');
    });

    it('should reject configuration with empty stages array', () => {
      const config = {
        initial: 'loading',
        stages: []
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one stage must be defined');
    });

    it('should reject configuration where initial stage does not exist', () => {
      const config: StageFlowConfig<'loading' | 'form', any> = {
        initial: 'nonexistent' as any,
        stages: [
          { name: 'loading', transitions: [] },
          { name: 'form', transitions: [] }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial stage "nonexistent" not found in stages array');
    });
  });

  describe('stage validation', () => {
    it('should reject duplicate stage names', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [
          { name: 'loading', transitions: [] },
          { name: 'loading', transitions: [] }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate stage name'))).toBe(true);
    });

    it('should reject stages without names', () => {
      const config = {
        initial: 'loading',
        stages: [
          { transitions: [] }
        ]
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Stage name is required'))).toBe(true);
    });

    it('should reject stages without transitions array', () => {
      const config = {
        initial: 'loading',
        stages: [
          { name: 'loading' }
        ]
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Transitions array is required'))).toBe(true);
    });
  });

  describe('transition validation', () => {
    it('should reject transitions to non-existent stages', () => {
      const config: StageFlowConfig<'loading' | 'form', any> = {
        initial: 'loading',
        stages: [
          {
            name: 'loading',
            transitions: [{ target: 'nonexistent' as any }]
          },
          {
            name: 'form',
            transitions: []
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Target stage "nonexistent" does not exist'))).toBe(true);
    });

    it('should reject transitions without target', () => {
      const config = {
        initial: 'loading',
        stages: [
          {
            name: 'loading',
            transitions: [{}]
          }
        ]
      } as any;

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Target stage is required'))).toBe(true);
    });

    it('should reject invalid duration values', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [
          {
            name: 'loading',
            transitions: [{ target: 'loading', after: -100 }]
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('After must be a non-negative number'))).toBe(true);
    });

    it('should warn about very long durations', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [
          {
            name: 'loading',
            transitions: [{ target: 'loading', after: 400000 }]
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(warning => warning.includes('After is very long'))).toBe(true);
    });
  });

  describe('plugin validation', () => {
    it('should reject plugins without names', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        plugins: [
          { install: () => {} } as any
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Plugin name is required'))).toBe(true);
    });

    it('should reject plugins without install function', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        plugins: [
          { name: 'test-plugin' } as any
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Install function is required'))).toBe(true);
    });

    it('should reject duplicate plugin names', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        plugins: [
          { name: 'test-plugin', install: () => {} },
          { name: 'test-plugin', install: () => {} }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate plugin name'))).toBe(true);
    });

    it('should reject plugins with missing dependencies', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        plugins: [
          { 
            name: 'dependent-plugin', 
            install: () => {},
            dependencies: ['missing-plugin']
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('depends on "missing-plugin" which is not included'))).toBe(true);
    });
  });

  describe('middleware validation', () => {
    it('should reject middleware without names', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        middleware: [
          { execute: async () => {} } as any
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Middleware name is required'))).toBe(true);
    });

    it('should reject middleware without execute function', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [{ name: 'loading', transitions: [] }],
        middleware: [
          { name: 'test-middleware' } as any
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Execute function is required'))).toBe(true);
    });
  });

  describe('development warnings', () => {
    it('should warn about unreachable stages', () => {
      const config: StageFlowConfig<'loading' | 'unreachable', any> = {
        initial: 'loading',
        stages: [
          { name: 'loading', transitions: [] },
          { name: 'unreachable', transitions: [] }
        ]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(warning => warning.includes('is not reachable from the initial stage'))).toBe(true);
    });

    it('should warn about stages with no outgoing transitions', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [
          { name: 'loading', transitions: [] }
        ]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(warning => warning.includes('has no outgoing transitions'))).toBe(true);
    });

    it('should warn about unconditional self-loops', () => {
      const config: StageFlowConfig<'loading', any> = {
        initial: 'loading',
        stages: [
          { 
            name: 'loading', 
            transitions: [{ target: 'loading' }] 
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(warning => warning.includes('unconditional self-loop'))).toBe(true);
    });
  });
});

describe('validateStageFlowConfig', () => {
  it('should return validation result', () => {
    const config: StageFlowConfig<'loading', any> = {
      initial: 'loading',
      stages: [{ name: 'loading', transitions: [] }]
    };

    const result = validateStageFlowConfig(config);
    expect(result.isValid).toBe(true);
  });
});

describe('validateStageFlowConfigStrict', () => {
  it('should not throw for valid configuration', () => {
    const config: StageFlowConfig<'loading', any> = {
      initial: 'loading',
      stages: [{ name: 'loading', transitions: [] }]
    };

    expect(() => validateStageFlowConfigStrict(config)).not.toThrow();
  });

  it('should throw ConfigurationError for invalid configuration', () => {
    const config = {
      initial: 'loading'
    } as any;

    expect(() => validateStageFlowConfigStrict(config)).toThrow(ConfigurationError);
  });
});

describe('RuntimeTypeChecker', () => {
  let checker: RuntimeTypeChecker<'loading' | 'form' | 'success', any>;
  let config: StageFlowConfig<'loading' | 'form' | 'success', any>;

  beforeEach(() => {
    config = {
      initial: 'loading',
      stages: [
        {
          name: 'loading',
          transitions: [{ target: 'form', event: 'loaded' }]
        },
        {
          name: 'form',
          transitions: [{ target: 'success', event: 'submit' }]
        },
        {
          name: 'success',
          transitions: []
        }
      ]
    };
    checker = new RuntimeTypeChecker(config);
  });

  describe('isValidStage', () => {
    it('should return true for valid stage names', () => {
      expect(checker.isValidStage('loading')).toBe(true);
      expect(checker.isValidStage('form')).toBe(true);
      expect(checker.isValidStage('success')).toBe(true);
    });

    it('should return false for invalid stage names', () => {
      expect(checker.isValidStage('invalid')).toBe(false);
      expect(checker.isValidStage(123)).toBe(false);
      expect(checker.isValidStage(null)).toBe(false);
      expect(checker.isValidStage(undefined)).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => checker.validateTransition('loading', 'form', 'loaded')).not.toThrow();
    });

    it('should throw for invalid target stage', () => {
      expect(() => checker.validateTransition('loading', 'invalid' as any)).toThrow(ConfigurationError);
    });

    it('should throw for non-existent transition', () => {
      expect(() => checker.validateTransition('loading', 'success')).toThrow(ConfigurationError);
    });

    it('should throw for transition with wrong event', () => {
      expect(() => checker.validateTransition('loading', 'form', 'wrong-event')).toThrow(ConfigurationError);
    });
  });

  describe('validateStageData', () => {
    it('should not throw for valid data', () => {
      expect(() => checker.validateStageData('loading', { test: true })).not.toThrow();
      expect(() => checker.validateStageData('loading', undefined)).not.toThrow();
      expect(() => checker.validateStageData('loading', null)).not.toThrow();
    });

    it('should warn for non-object data in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      checker.validateStageData('loading', 'string-data');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('data should be an object')
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('DevelopmentWarnings', () => {
  beforeEach(() => {
    DevelopmentWarnings.clearWarnings();
  });

  it('should show warnings only once', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    DevelopmentWarnings.warn('Test warning');
    DevelopmentWarnings.warn('Test warning');
    DevelopmentWarnings.warn('Test warning');
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(DevelopmentWarnings.getWarningCount()).toBe(1);
    
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should not show warnings in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    DevelopmentWarnings.warn('Test warning');
    
    expect(consoleSpy).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});

describe('after property validation', () => {
  let validator: StageFlowValidator<any, any>;

  beforeEach(() => {
    validator = new StageFlowValidator();
  });

  it('should reject configuration with multiple after transitions', () => {
    const config: StageFlowConfig<'loading' | 'success' | 'error', any> = {
      initial: 'loading',
      stages: [
        {
          name: 'loading',
          transitions: [
            { target: 'success', after: 5000 },
            { target: 'error', after: 3000 } // Multiple after transitions
          ]
        },
        {
          name: 'success',
          transitions: []
        },
        {
          name: 'error',
          transitions: []
        }
      ]
    };

    const result = validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Stage "loading" has multiple transitions with \'after\' property. Only one automatic transition is allowed per stage.');
  });

  it('should accept configuration with single after transition', () => {
    const config: StageFlowConfig<'loading' | 'success', any> = {
      initial: 'loading',
      stages: [
        {
          name: 'loading',
          transitions: [
            { target: 'success', after: 5000 } // Single after transition
          ]
        },
        {
          name: 'success',
          transitions: []
        }
      ]
    };

    const result = validator.validate(config);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept configuration with after transition and other transitions', () => {
    const config: StageFlowConfig<'loading' | 'success' | 'error', any> = {
      initial: 'loading',
      stages: [
        {
          name: 'loading',
          transitions: [
            { target: 'success', event: 'loaded' },
            { target: 'error', after: 5000 } // After transition with other transitions
          ]
        },
        {
          name: 'success',
          transitions: []
        },
        {
          name: 'error',
          transitions: []
        }
      ]
    };

    const result = validator.validate(config);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});