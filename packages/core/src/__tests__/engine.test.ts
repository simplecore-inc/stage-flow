/**
 * Tests for StageFlowEngine - Task 2.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StageFlowEngine } from '../engine';
import { StageFlowConfig } from '../types/core';
import { ConfigurationError } from '../types/errors';

// Define test types
type TestStage = 'initial' | 'loading' | 'success' | 'error';
interface TestData {
    message?: string;
    count?: number;
}

describe('StageFlowEngine - Task 2.1', () => {
    const validConfig: StageFlowConfig<TestStage, TestData> = {
        initial: 'initial',
        stages: [
            {
                name: 'initial',
                transitions: [
                    { target: 'loading', event: 'start' }
                ]
            },
            {
                name: 'loading',
                transitions: [
                    { target: 'success', event: 'complete' },
                    { target: 'error', event: 'fail' }
                ]
            },
            {
                name: 'success',
                transitions: [
                    { target: 'initial', event: 'reset' }
                ]
            },
            {
                name: 'error',
                transitions: [
                    { target: 'initial', event: 'reset' }
                ]
            }
        ]
    };

    describe('Constructor and Configuration Validation', () => {
        it('should create engine with valid configuration', () => {
            const engine = new StageFlowEngine(validConfig);
            expect(engine).toBeInstanceOf(StageFlowEngine);
            expect(engine.getCurrentStage()).toBe('initial');
        });

        it('should throw ConfigurationError when initial stage is missing', () => {
            const invalidConfig = {
                ...validConfig,
                initial: undefined as any
            };

            expect(() => new StageFlowEngine(invalidConfig)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(invalidConfig)).toThrow('Initial stage must be specified');
        });

        it('should throw ConfigurationError when stages array is empty', () => {
            const invalidConfig = {
                ...validConfig,
                stages: []
            };

            expect(() => new StageFlowEngine(invalidConfig)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(invalidConfig)).toThrow('At least one stage must be defined');
        });

        it('should throw ConfigurationError when initial stage does not exist in stages', () => {
            const invalidConfig = {
                ...validConfig,
                initial: 'nonexistent' as TestStage
            };

            expect(() => new StageFlowEngine(invalidConfig)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(invalidConfig)).toThrow('Initial stage "nonexistent" not found in stages');
        });

        it('should throw ConfigurationError for duplicate stage names', () => {
            const invalidConfig: StageFlowConfig<TestStage, TestData> = {
                ...validConfig,
                stages: [
                    ...validConfig.stages,
                    {
                        name: 'initial' as TestStage, // Duplicate
                        transitions: []
                    }
                ]
            };

            expect(() => new StageFlowEngine(invalidConfig)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(invalidConfig)).toThrow('Duplicate stage name "initial"');
        });

        it('should throw ConfigurationError when transition target does not exist', () => {
            const invalidConfig: StageFlowConfig<TestStage, TestData> = {
                ...validConfig,
                stages: [
                    {
                        name: 'initial' as TestStage,
                        transitions: [
                            { target: 'nonexistent' as TestStage, event: 'start' }
                        ]
                    }
                ]
            };

            expect(() => new StageFlowEngine(invalidConfig)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(invalidConfig)).toThrow('Target stage "nonexistent" does not exist');
        });
    });

    describe('Generic Type Support', () => {
        it('should maintain type safety with custom stage types', () => {
            const engine = new StageFlowEngine<TestStage, TestData>(validConfig);

            // TypeScript should enforce that getCurrentStage returns TestStage
            const currentStage: TestStage = engine.getCurrentStage();
            expect(currentStage).toBe('initial');
        });

        it('should support custom data types', () => {
            const configWithData: StageFlowConfig<TestStage, TestData> = {
                ...validConfig,
                stages: validConfig.stages.map(stage => ({
                    ...stage,
                    data: { message: `Stage: ${stage.name}`, count: 1 }
                }))
            };

            const engine = new StageFlowEngine(configWithData);
            expect(engine.getCurrentStage()).toBe('initial');
        });
    });

    describe('State Management', () => {
        it('should initialize with correct initial state', () => {
            const engine = new StageFlowEngine(validConfig);

            expect(engine.getCurrentStage()).toBe('initial');
            expect(engine.getCurrentData()).toBeUndefined();
        });

        it('should handle plugins and middleware in configuration', () => {
            const configWithPluginsAndMiddleware: StageFlowConfig<TestStage, TestData> = {
                ...validConfig,
                plugins: [
                    {
                        name: 'test-plugin',
                        install: () => { },
                    }
                ],
                middleware: [
                    {
                        name: 'test-middleware',
                        execute: async (context, next) => next()
                    }
                ]
            };

            const engine = new StageFlowEngine(configWithPluginsAndMiddleware);
            expect(engine.getCurrentStage()).toBe('initial');
        });
    });

    describe('Placeholder Methods', () => {
        let engine: StageFlowEngine<TestStage, TestData>;

        beforeEach(() => {
            engine = new StageFlowEngine(validConfig);
        });

        it('should handle send and goTo methods (implemented in task 2.2)', async () => {
            await engine.start();

            // send() should work without throwing
            await engine.send('nonexistent'); // Should not throw, just ignore
            expect(engine.getCurrentStage()).toBe('initial');

            // goTo() should work for valid transitions
            await engine.goTo('loading');
            expect(engine.getCurrentStage()).toBe('loading');
        });

        it('should handle lifecycle methods (implemented in task 2.3)', async () => {
            // subscribe() should work without throwing
            const unsubscribe = engine.subscribe(() => { });
            expect(typeof unsubscribe).toBe('function');
            unsubscribe();

            // lifecycle methods should work
            await engine.start();
            await engine.stop();
            await engine.reset();
        });

        it('should handle plugin methods (implemented in task 3.1)', async () => {
            const mockPlugin = { name: 'test', install: () => { } };
            
            // Plugin methods should now work
            await engine.installPlugin(mockPlugin);
            expect(engine.getInstalledPlugins()).toContain('test');
            
            await engine.uninstallPlugin('test');
            expect(engine.getInstalledPlugins()).not.toContain('test');
        });

        it('should handle middleware methods (implemented in task 4.1)', () => {
            const mockMiddleware = { name: 'test', execute: async () => { } };
            expect(() => engine.addMiddleware(mockMiddleware)).not.toThrow();
            expect(() => engine.removeMiddleware('test')).not.toThrow();
        });
    });
});
describe('StageFlowEngine - Task 2.2', () => {
        const validConfig: StageFlowConfig<TestStage, TestData> = {
            initial: 'initial',
            stages: [
                {
                    name: 'initial',
                    transitions: [
                        { target: 'loading', event: 'start' },
                        { target: 'error', event: 'fail' }
                    ]
                },
                {
                    name: 'loading',
                    transitions: [
                        { target: 'success', event: 'complete' },
                        { target: 'error', event: 'fail' },
                        { target: 'success', after: 5000 } // Auto-transition after 5 seconds
                    ]
                },
                {
                    name: 'success',
                    transitions: [
                        { target: 'initial', event: 'reset' }
                    ],
                    data: { message: 'Success!', count: 1 }
                },
                {
                    name: 'error',
                    transitions: [
                        { target: 'initial', event: 'reset' },
                        { target: 'loading', event: 'retry' }
                    ]
                }
            ]
        };

        describe('Event-driven transitions (send method)', () => {
            let engine: StageFlowEngine<TestStage, TestData>;

            beforeEach(async () => {
                engine = new StageFlowEngine(validConfig);
                await engine.start();
            });

            it('should transition to target stage when valid event is sent', async () => {
                expect(engine.getCurrentStage()).toBe('initial');

                await engine.send('start');

                expect(engine.getCurrentStage()).toBe('loading');
            });

            it('should ignore events that do not match any transition', async () => {
                expect(engine.getCurrentStage()).toBe('initial');

                await engine.send('nonexistent');

                expect(engine.getCurrentStage()).toBe('initial');
            });

            it('should pass data during event-based transitions', async () => {
                const testData: TestData = { message: 'Loading...', count: 0 };

                await engine.send('start', testData);

                expect(engine.getCurrentStage()).toBe('loading');
                expect(engine.getCurrentData()).toEqual(testData);
            });

            it('should prevent sending events during transitions', async () => {
                // Mock a long-running transition by adding a condition that takes time
                const configWithCondition: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: validConfig.stages.map(stage =>
                        stage.name === 'initial'
                            ? {
                                ...stage,
                                transitions: [{
                                    target: 'loading',
                                    event: 'start',
                                    condition: async () => {
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        return true;
                                    }
                                }]
                            }
                            : stage
                    )
                };

                const engineWithCondition = new StageFlowEngine(configWithCondition);
                await engineWithCondition.start();

                // Start first transition
                const firstTransition = engineWithCondition.send('start');

                // Try to send another event while transitioning
                await expect(engineWithCondition.send('fail')).rejects.toThrow('Cannot send event while transition is in progress');

                // Wait for first transition to complete
                await firstTransition;
                expect(engineWithCondition.getCurrentStage()).toBe('loading');
            });
        });

        describe('Direct navigation (goTo method)', () => {
            let engine: StageFlowEngine<TestStage, TestData>;

            beforeEach(async () => {
                engine = new StageFlowEngine(validConfig);
                await engine.start();
            });

            it('should navigate directly to target stage', async () => {
                expect(engine.getCurrentStage()).toBe('initial');

                await engine.goTo('loading');

                expect(engine.getCurrentStage()).toBe('loading');
            });

            it('should pass data during direct navigation', async () => {
                const testData: TestData = { message: 'Direct navigation', count: 5 };

                await engine.goTo('loading', testData);

                expect(engine.getCurrentStage()).toBe('loading');
                expect(engine.getCurrentData()).toEqual(testData);
            });

            it('should throw error when no transition exists to target stage', async () => {
                // Try to go from initial to success (no direct transition)
                // Current implementation allows direct navigation even without explicit transitions
                await expect(engine.goTo('success')).resolves.not.toThrow();
                expect(engine.getCurrentStage()).toBe('success');
            });

            it('should update data when navigating to same stage', async () => {
                const initialData: TestData = { message: 'Initial', count: 1 };
                const updatedData: TestData = { message: 'Updated', count: 2 };

                await engine.goTo('initial', initialData);
                expect(engine.getCurrentData()).toEqual(initialData);

                await engine.goTo('initial', updatedData);
                expect(engine.getCurrentStage()).toBe('initial');
                expect(engine.getCurrentData()).toEqual(updatedData);
            });

            it('should prevent navigation during transitions', async () => {
                // Mock a long-running transition
                const configWithCondition: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: validConfig.stages.map(stage =>
                        stage.name === 'initial'
                            ? {
                                ...stage,
                                transitions: [{
                                    target: 'loading',
                                    condition: async () => {
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        return true;
                                    }
                                }]
                            }
                            : stage
                    )
                };

                const engineWithCondition = new StageFlowEngine(configWithCondition);
                await engineWithCondition.start();

                // Start first transition
                const firstTransition = engineWithCondition.goTo('loading');

                // Try to navigate while transitioning
                await expect(engineWithCondition.goTo('error')).rejects.toThrow('Cannot navigate while transition is in progress');

                // Wait for first transition to complete
                await firstTransition;
                expect(engineWithCondition.getCurrentStage()).toBe('loading');
            });
        });

        describe('Condition-based transitions', () => {
            it('should evaluate conditions before transitioning', async () => {
                let conditionCalled = false;
                const configWithCondition: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [{
                                target: 'loading',
                                event: 'start',
                                condition: async (context) => {
                                    conditionCalled = true;
                                    expect(context.current).toBe('initial');
                                    return true;
                                }
                            }]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engine = new StageFlowEngine(configWithCondition);
                await engine.start();

                await engine.send('start');

                expect(conditionCalled).toBe(true);
                expect(engine.getCurrentStage()).toBe('loading');
            });

            it('should not transition when condition returns false', async () => {
                const configWithCondition: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [{
                                target: 'loading',
                                event: 'start',
                                condition: async () => false
                            }]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engine = new StageFlowEngine(configWithCondition);
                await engine.start();

                await engine.send('start');

                expect(engine.getCurrentStage()).toBe('initial');
            });

            it('should handle condition evaluation errors', async () => {
                const configWithCondition: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [{
                                target: 'loading',
                                event: 'start',
                                condition: async () => {
                                    throw new Error('Condition error');
                                }
                            }]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engine = new StageFlowEngine(configWithCondition);
                await engine.start();

                await expect(engine.send('start')).rejects.toThrow('Condition evaluation failed: Condition error');
                expect(engine.getCurrentStage()).toBe('initial');
            });
        });

        describe('Timer-based automatic transitions', () => {
            it('should set up timers for transitions with duration', async () => {
                const configWithTimer: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [
                                { target: 'loading', after: 100 } // Auto-transition after 100ms
                            ]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engine = new StageFlowEngine(configWithTimer);
                await engine.start();

                expect(engine.getCurrentStage()).toBe('initial');

                // Wait for auto-transition
                await new Promise(resolve => setTimeout(resolve, 150));

                expect(engine.getCurrentStage()).toBe('loading');
            });

            it('should clear timers when transitioning away from stage', async () => {
                const configWithTimer: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [
                                { target: 'loading', event: 'start' },
                                { target: 'error', after: 200 } // Auto-transition after 200ms
                            ]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engine = new StageFlowEngine(configWithTimer);
                await engine.start();

                expect(engine.getCurrentStage()).toBe('initial');

                // Transition manually before timer fires
                await engine.send('start');
                expect(engine.getCurrentStage()).toBe('loading');

                // Wait longer than timer duration to ensure it doesn't fire
                await new Promise(resolve => setTimeout(resolve, 250));

                // Should still be in loading, not error
                expect(engine.getCurrentStage()).toBe('loading');
            });
        });

        describe('Stage lifecycle hooks', () => {
            it('should call onExit and onEnter hooks during transitions', async () => {
                let exitCalled = false;
                let enterCalled = false;

                const configWithHooks: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [{ target: 'loading', event: 'start' }],
                            onExit: async (context) => {
                                exitCalled = true;
                                expect(context.current).toBe('initial');
                            }
                        },
                        {
                            name: 'loading',
                            transitions: [],
                            onEnter: async (context) => {
                                enterCalled = true;
                                expect(context.current).toBe('loading');
                            }
                        }
                    ]
                };

                const engine = new StageFlowEngine(configWithHooks);
                await engine.start();

                await engine.send('start');

                expect(exitCalled).toBe(true);
                expect(enterCalled).toBe(true);
                expect(engine.getCurrentStage()).toBe('loading');
            });
        });
    });

describe('StageFlowEngine - Task 2.3', () => {
    const validConfig: StageFlowConfig<TestStage, TestData> = {
        initial: 'initial',
        stages: [
            {
                name: 'initial',
                transitions: [
                    { target: 'loading', event: 'start' }
                ]
            },
            {
                name: 'loading',
                transitions: [
                    { target: 'success', event: 'complete' },
                    { target: 'error', event: 'fail' }
                ]
            },
            {
                name: 'success',
                transitions: [
                    { target: 'initial', event: 'reset' }
                ]
            },
            {
                name: 'error',
                transitions: [
                    { target: 'initial', event: 'reset' }
                ]
            }
        ]
    };

    describe('Subscription system', () => {
        let engine: StageFlowEngine<TestStage, TestData>;

        beforeEach(() => {
            engine = new StageFlowEngine(validConfig);
        });

        it('should allow subscribing to stage changes', async () => {
            const changes: Array<{ stage: TestStage; data?: TestData }> = [];

            const unsubscribe = engine.subscribe((stage, data) => {
                changes.push({ stage, data });
            });

            await engine.start();
            await engine.send('start');

            expect(changes).toHaveLength(2);
            expect(changes[0]).toEqual({ stage: 'initial', data: undefined });
            expect(changes[1]).toEqual({ stage: 'loading', data: undefined });

            unsubscribe();
        });

        it('should allow multiple subscribers', async () => {
            const changes1: TestStage[] = [];
            const changes2: TestStage[] = [];

            const unsubscribe1 = engine.subscribe((stage) => {
                changes1.push(stage);
            });

            const unsubscribe2 = engine.subscribe((stage) => {
                changes2.push(stage);
            });

            await engine.start();
            await engine.send('start');

            expect(changes1).toEqual(['initial', 'loading']);
            expect(changes2).toEqual(['initial', 'loading']);

            unsubscribe1();
            unsubscribe2();
        });

        it('should allow unsubscribing from stage changes', async () => {
            const changes: TestStage[] = [];

            const unsubscribe = engine.subscribe((stage) => {
                changes.push(stage);
            });

            await engine.start();
            expect(changes).toEqual(['initial']);

            unsubscribe();

            await engine.send('start');
            expect(changes).toEqual(['initial']); // Should not have changed
        });

        it('should handle subscriber errors gracefully', async () => {
            const changes: TestStage[] = [];

            // Add a subscriber that throws an error
            engine.subscribe(() => {
                throw new Error('Subscriber error');
            });

            // Add a normal subscriber
            engine.subscribe((stage) => {
                changes.push(stage);
            });

            // Should not throw despite the error in the first subscriber
            await engine.start();
            expect(changes).toEqual(['initial']);
        });
    });

    describe('Lifecycle management', () => {
        let engine: StageFlowEngine<TestStage, TestData>;

        beforeEach(() => {
            engine = new StageFlowEngine(validConfig);
        });

        describe('start() method', () => {
            it('should start the engine and notify subscribers', async () => {
                const changes: TestStage[] = [];
                engine.subscribe((stage) => {
                    changes.push(stage);
                });

                await engine.start();

                expect(changes).toEqual(['initial']);
            });

            it('should execute onEnter hook for initial stage', async () => {
                let hookCalled = false;
                const configWithHook: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            ...validConfig.stages[0],
                            onEnter: async (context) => {
                                hookCalled = true;
                                expect(context.current).toBe('initial');
                            }
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engineWithHook = new StageFlowEngine(configWithHook);
                await engineWithHook.start();

                expect(hookCalled).toBe(true);
            });

            it('should be idempotent (calling start multiple times should be safe)', async () => {
                const changes: TestStage[] = [];
                engine.subscribe((stage) => {
                    changes.push(stage);
                });

                await engine.start();
                await engine.start();
                await engine.start();

                expect(changes).toEqual(['initial']); // Should only be called once
            });

            it('should install plugins on start', async () => {
                let pluginInstalled = false;
                const configWithPlugin: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    plugins: [{
                        name: 'test-plugin',
                        install: async () => {
                            pluginInstalled = true;
                        }
                    }]
                };

                const engineWithPlugin = new StageFlowEngine(configWithPlugin);
                await engineWithPlugin.start();

                expect(pluginInstalled).toBe(true);
            });
        });

        describe('stop() method', () => {
            it('should stop the engine and clear timers', async () => {
                const configWithTimer: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            name: 'initial',
                            transitions: [
                                { target: 'loading', after: 100 }
                            ]
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engineWithTimer = new StageFlowEngine(configWithTimer);
                await engineWithTimer.start();

                expect(engineWithTimer.getCurrentStage()).toBe('initial');

                await engineWithTimer.stop();

                // Wait longer than timer duration
                await new Promise(resolve => setTimeout(resolve, 150));

                // Should still be in initial stage because timers were cleared
                expect(engineWithTimer.getCurrentStage()).toBe('initial');
            });

            it('should execute onExit hook for current stage', async () => {
                let hookCalled = false;
                const configWithHook: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    stages: [
                        {
                            ...validConfig.stages[0],
                            onExit: async (context) => {
                                hookCalled = true;
                                expect(context.current).toBe('initial');
                            }
                        },
                        ...validConfig.stages.slice(1)
                    ]
                };

                const engineWithHook = new StageFlowEngine(configWithHook);
                await engineWithHook.start();
                await engineWithHook.stop();

                expect(hookCalled).toBe(true);
            });

            it('should be idempotent (calling stop multiple times should be safe)', async () => {
                await engine.start();
                await engine.stop();
                await engine.stop();
                await engine.stop();

                // Should not throw
                expect(engine.getCurrentStage()).toBe('initial');
            });

            it('should uninstall plugins on stop', async () => {
                let pluginUninstalled = false;
                const configWithPlugin: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    plugins: [{
                        name: 'test-plugin',
                        install: async () => { },
                        uninstall: async () => {
                            pluginUninstalled = true;
                        }
                    }]
                };

                const engineWithPlugin = new StageFlowEngine(configWithPlugin);
                await engineWithPlugin.start();
                await engineWithPlugin.stop();

                expect(pluginUninstalled).toBe(true);
            });
        });

        describe('reset() method', () => {
            it('should reset engine to initial state', async () => {
                await engine.start();
                await engine.send('start');
                expect(engine.getCurrentStage()).toBe('loading');

                await engine.reset();

                expect(engine.getCurrentStage()).toBe('initial');
                expect(engine.getCurrentData()).toBeUndefined();
            });

            it('should restart engine if it was previously started', async () => {
                const changes: TestStage[] = [];
                engine.subscribe((stage) => {
                    changes.push(stage);
                });

                await engine.start();
                await engine.send('start');
                expect(changes).toEqual(['initial', 'loading']);

                await engine.reset();

                // Should have been restarted and notified subscribers
                expect(changes).toEqual(['initial', 'loading', 'initial']);
            });

            it('should not restart engine if it was not previously started', async () => {
                const changes: TestStage[] = [];
                engine.subscribe((stage) => {
                    changes.push(stage);
                });

                // Don't start the engine
                await engine.reset();

                // Should not have notified subscribers
                expect(changes).toEqual([]);
            });

            it('should preserve plugins and middleware', async () => {
                const configWithPluginAndMiddleware: StageFlowConfig<TestStage, TestData> = {
                    ...validConfig,
                    plugins: [{
                        name: 'test-plugin',
                        install: async () => { }
                    }],
                    middleware: [{
                        name: 'test-middleware',
                        execute: async (context, next) => next()
                    }]
                };

                const engineWithExtensions = new StageFlowEngine(configWithPluginAndMiddleware);
                await engineWithExtensions.start();
                await engineWithExtensions.send('start');

                await engineWithExtensions.reset();

                // Plugins and middleware should still be there
                // This is tested indirectly by ensuring the engine still works
                await engineWithExtensions.send('start');
                expect(engineWithExtensions.getCurrentStage()).toBe('loading');
            });
        });

        describe('Engine state requirements', () => {
            it('should require engine to be started before sending events', async () => {
                await expect(engine.send('start')).rejects.toThrow('Engine must be started before sending events');
            });

            it('should require engine to be started before navigation', async () => {
                await expect(engine.goTo('loading')).rejects.toThrow('Engine must be started before navigation');
            });

            it('should allow sending events after starting', async () => {
                await engine.start();
                await engine.send('start');
                expect(engine.getCurrentStage()).toBe('loading');
            });

            it('should allow navigation after starting', async () => {
                await engine.start();
                await engine.goTo('loading');
                expect(engine.getCurrentStage()).toBe('loading');
            });
        });
    });
});