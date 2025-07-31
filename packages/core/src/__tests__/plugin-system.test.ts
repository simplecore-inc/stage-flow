/**
 * Tests for the plugin system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StageFlowEngine } from '../engine';
import { Plugin, StageFlowConfig } from '../types/core';
import { PluginError } from '../types/errors';
import { ConfigurationError } from '../types/errors';

// Test stage types
type TestStage = 'idle' | 'loading' | 'success' | 'error';

// Test plugin implementation
class TestPlugin implements Plugin<TestStage> {
    name: string;
    version?: string;
    private installCalled = false;
    private uninstallCalled = false;
    private hookMocks: {
        beforeTransition: any;
        afterTransition: any;
        onStageEnter: any;
        onStageExit: any;
    };

    constructor(name: string, version?: string) {
        this.name = name;
        this.version = version;
        this.hookMocks = {
            beforeTransition: vi.fn(),
            afterTransition: vi.fn(),
            onStageEnter: vi.fn(),
            onStageExit: vi.fn()
        };
    }

    async install(_engine: unknown): Promise<void> {
        this.installCalled = true;
    }

    async uninstall(_engine: unknown): Promise<void> {
        this.uninstallCalled = true;
    }

    get hooks() {
        return {
            beforeTransition: this.hookMocks.beforeTransition,
            afterTransition: this.hookMocks.afterTransition,
            onStageEnter: this.hookMocks.onStageEnter,
            onStageExit: this.hookMocks.onStageExit
        };
    }

    wasInstalled(): boolean {
        return this.installCalled;
    }

    wasUninstalled(): boolean {
        return this.uninstallCalled;
    }

    getHookCalls() {
        return {
            beforeTransition: this.hookMocks.beforeTransition.mock.calls,
            afterTransition: this.hookMocks.afterTransition.mock.calls,
            onStageEnter: this.hookMocks.onStageEnter.mock.calls,
            onStageExit: this.hookMocks.onStageExit.mock.calls
        };
    }
}

describe('Plugin System', () => {
    let config: StageFlowConfig<TestStage>;
    let engine: StageFlowEngine<TestStage>;

    beforeEach(() => {
        config = {
            initial: 'idle' as TestStage,
            stages: [
                {
                    name: 'idle' as TestStage,
                    transitions: [
                        { target: 'loading' as TestStage, event: 'start' }
                    ]
                },
                {
                    name: 'loading' as TestStage,
                    transitions: [
                        { target: 'success' as TestStage, event: 'complete' },
                        { target: 'error' as TestStage, event: 'fail' }
                    ]
                },
                {
                    name: 'success' as TestStage,
                    transitions: [
                        { target: 'idle' as TestStage, event: 'reset' }
                    ]
                },
                {
                    name: 'error' as TestStage,
                    transitions: [
                        { target: 'idle' as TestStage, event: 'reset' }
                    ]
                }
            ]
        };
        engine = new StageFlowEngine(config);
    });

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
    });

    describe('Plugin Registration', () => {
        it('should install a plugin successfully', async () => {
            const plugin = new TestPlugin('test-plugin', '1.0.0');

            await engine.installPlugin(plugin);

            expect(engine.getInstalledPlugins()).toContain('test-plugin');
            expect(engine.getPlugin('test-plugin')).toBe(plugin);
        });

        it('should throw error when installing plugin without name', async () => {
            const plugin = { install: vi.fn() } as unknown as Plugin<TestStage>;

            await expect(engine.installPlugin(plugin)).rejects.toThrow(PluginError);
            await expect(engine.installPlugin(plugin)).rejects.toThrow('Plugin must have a name');
        });

        it('should throw error when installing duplicate plugin', async () => {
            const plugin1 = new TestPlugin('duplicate-plugin');
            const plugin2 = new TestPlugin('duplicate-plugin');

            await engine.installPlugin(plugin1);

            await expect(engine.installPlugin(plugin2)).rejects.toThrow(PluginError);
            await expect(engine.installPlugin(plugin2)).rejects.toThrow('already installed');
        });

        it('should uninstall a plugin successfully', async () => {
            const plugin = new TestPlugin('test-plugin');

            await engine.installPlugin(plugin);
            expect(engine.getInstalledPlugins()).toContain('test-plugin');

            await engine.uninstallPlugin('test-plugin');
            expect(engine.getInstalledPlugins()).not.toContain('test-plugin');
            expect(engine.getPlugin('test-plugin')).toBeUndefined();
        });

        it('should throw error when uninstalling non-existent plugin', async () => {
            await expect(engine.uninstallPlugin('non-existent')).rejects.toThrow(PluginError);
            await expect(engine.uninstallPlugin('non-existent')).rejects.toThrow('is not installed');
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should call plugin install method when engine starts', async () => {
            const plugin = new TestPlugin('lifecycle-plugin');

            await engine.installPlugin(plugin);
            expect(plugin.wasInstalled()).toBe(false);

            await engine.start();
            expect(plugin.wasInstalled()).toBe(true);
        });

        it('should call plugin uninstall method when engine stops', async () => {
            const plugin = new TestPlugin('lifecycle-plugin');

            await engine.installPlugin(plugin);
            await engine.start();
            expect(plugin.wasUninstalled()).toBe(false);

            await engine.stop();
            expect(plugin.wasUninstalled()).toBe(true);
        });

        it('should install plugin immediately if engine is already started', async () => {
            const plugin = new TestPlugin('immediate-plugin');

            await engine.start();
            await engine.installPlugin(plugin);

            expect(plugin.wasInstalled()).toBe(true);
        });
    });

    describe('Plugin Hooks', () => {
        let plugin: TestPlugin;

        beforeEach(async () => {
            plugin = new TestPlugin('hook-plugin');
            await engine.installPlugin(plugin);
            await engine.start();
        });

        it('should call onStageEnter hook when entering initial stage', () => {
            const calls = plugin.getHookCalls();
            expect(calls.onStageEnter).toHaveLength(1);
            expect(calls.onStageEnter[0][0]).toMatchObject({
                current: 'idle'
            });
        });

        it('should call plugin hooks during stage transitions', async () => {
            await engine.send('start');

            const calls = plugin.getHookCalls();

            // Should have called beforeTransition
            expect(calls.beforeTransition).toHaveLength(1);
            expect(calls.beforeTransition[0][0]).toMatchObject({
                from: 'idle',
                to: 'loading',
                event: 'start'
            });

            // Should have called onStageExit for old stage
            expect(calls.onStageExit).toHaveLength(1);
            expect(calls.onStageExit[0][0]).toMatchObject({
                current: 'idle'
            });

            // Should have called onStageEnter for new stage
            expect(calls.onStageEnter).toHaveLength(2); // Initial + transition
            expect(calls.onStageEnter[1][0]).toMatchObject({
                current: 'loading'
            });

            // Should have called afterTransition
            expect(calls.afterTransition).toHaveLength(1);
            expect(calls.afterTransition[0][0]).toMatchObject({
                from: 'idle',
                to: 'loading',
                event: 'start'
            });
        });

        it('should call onStageExit hook when engine stops', async () => {
            await engine.stop();

            const calls = plugin.getHookCalls();
            expect(calls.onStageExit).toHaveLength(1);
            expect(calls.onStageExit[0][0]).toMatchObject({
                current: 'idle'
            });
        });
    });

    describe('Plugin Error Handling', () => {
        it('should handle plugin installation errors gracefully', async () => {
            await engine.start(); // Start engine so plugin.install is called

            const faultyPlugin: Plugin<TestStage> = {
                name: 'faulty-plugin',
                install: vi.fn().mockRejectedValue(new Error('Installation failed'))
            };

            await expect(engine.installPlugin(faultyPlugin)).rejects.toThrow(PluginError);
            expect(engine.getInstalledPlugins()).not.toContain('faulty-plugin');
        });

        it('should handle plugin hook errors gracefully', async () => {
            const faultyPlugin: Plugin<TestStage> = {
                name: 'faulty-hook-plugin',
                install: vi.fn(),
                hooks: {
                    beforeTransition: vi.fn().mockRejectedValue(new Error('Hook failed'))
                }
            };

            await engine.installPlugin(faultyPlugin);
            await engine.start();

            // Transition should still work despite hook failure
            await expect(engine.send('start')).resolves.not.toThrow();
            expect(engine.getCurrentStage()).toBe('loading');
        });

        it('should continue with other plugins when one plugin hook fails', async () => {
            const faultyPlugin: Plugin<TestStage> = {
                name: 'faulty-plugin',
                install: vi.fn(), // Add the required install method
                hooks: {
                    beforeTransition: vi.fn().mockRejectedValue(new Error('Faulty hook'))
                }
            };

            const workingPlugin = new TestPlugin('working-plugin');

            await engine.installPlugin(faultyPlugin);
            await engine.installPlugin(workingPlugin);
            await engine.start();

            await engine.send('start');

            // Working plugin should still have been called
            const calls = workingPlugin.getHookCalls();
            expect(calls.beforeTransition).toHaveLength(1);
        });
    });

    describe('Plugin Configuration', () => {
        it('should install plugins from initial configuration', () => {
            const plugin = new TestPlugin('config-plugin');
            const configWithPlugins: StageFlowConfig<TestStage> = {
                ...config,
                plugins: [plugin]
            };

            const engineWithPlugins = new StageFlowEngine(configWithPlugins);

            expect(engineWithPlugins.getInstalledPlugins()).toContain('config-plugin');
            expect(engineWithPlugins.getPlugin('config-plugin')).toBe(plugin);
        });
    });

    describe('Plugin Dependencies', () => {
        it('should install plugins with dependencies in correct order', async () => {
            const installOrder: string[] = [];

            const basePlugin: Plugin<TestStage> = {
                name: 'base-plugin',
                install: async () => {
                    installOrder.push('base-plugin');
                }
            };

            const dependentPlugin: Plugin<TestStage> = {
                name: 'dependent-plugin',
                dependencies: ['base-plugin'],
                install: async () => {
                    installOrder.push('dependent-plugin');
                }
            };

            await engine.installPlugin(basePlugin);
            await engine.installPlugin(dependentPlugin);
            await engine.start();

            expect(installOrder).toEqual(['base-plugin', 'dependent-plugin']);
        });

        it('should throw error when installing plugin with missing dependency', async () => {
            const dependentPlugin: Plugin<TestStage> = {
                name: 'dependent-plugin',
                dependencies: ['missing-plugin'],
                install: vi.fn()
            };

            await expect(engine.installPlugin(dependentPlugin)).rejects.toThrow(PluginError);
            await expect(engine.installPlugin(dependentPlugin)).rejects.toThrow('requires dependency "missing-plugin"');
        });

        it('should prevent uninstalling plugin with dependents', async () => {
            const basePlugin: Plugin<TestStage> = {
                name: 'base-plugin',
                install: vi.fn()
            };

            const dependentPlugin: Plugin<TestStage> = {
                name: 'dependent-plugin',
                dependencies: ['base-plugin'],
                install: vi.fn()
            };

            await engine.installPlugin(basePlugin);
            await engine.installPlugin(dependentPlugin);

            await expect(engine.uninstallPlugin('base-plugin')).rejects.toThrow(PluginError);
            await expect(engine.uninstallPlugin('base-plugin')).rejects.toThrow('required by: dependent-plugin');
        });

        it('should detect circular dependencies', async () => {
            const plugin1: Plugin<TestStage> = {
                name: 'plugin1',
                dependencies: ['plugin2'],
                install: vi.fn()
            };

            const plugin2: Plugin<TestStage> = {
                name: 'plugin2',
                dependencies: ['plugin1'],
                install: vi.fn()
            };

            // Create engine with circular dependency plugins in config
            const configWithCircularDeps: StageFlowConfig<TestStage> = {
                ...config,
                plugins: [plugin1, plugin2]
            };

            // The circular dependency should be detected during engine construction
            expect(() => new StageFlowEngine(configWithCircularDeps)).toThrow(ConfigurationError);
            expect(() => new StageFlowEngine(configWithCircularDeps)).toThrow('Circular dependency detected');
        });

        it('should execute plugin hooks in dependency order', async () => {
            const hookOrder: string[] = [];

            const basePlugin: Plugin<TestStage> = {
                name: 'base-plugin',
                install: vi.fn(), // Add required install method
                hooks: {
                    beforeTransition: async () => {
                        hookOrder.push('base-plugin');
                    }
                }
            };

            const dependentPlugin: Plugin<TestStage> = {
                name: 'dependent-plugin',
                dependencies: ['base-plugin'],
                install: vi.fn(), // Add required install method
                hooks: {
                    beforeTransition: async () => {
                        hookOrder.push('dependent-plugin');
                    }
                }
            };

            await engine.installPlugin(basePlugin);
            await engine.installPlugin(dependentPlugin);
            await engine.start();

            await engine.send('start');

            expect(hookOrder).toEqual(['base-plugin', 'dependent-plugin']);
        });
    });

    describe('Plugin State Management', () => {
        it('should initialize plugin state', async () => {
            const plugin: Plugin<TestStage> = {
                name: 'stateful-plugin',
                install: vi.fn(),
                state: { initialized: true }
            };

            await engine.installPlugin(plugin);

            const state = engine.getPluginState('stateful-plugin');
            expect(state).toEqual({ initialized: true });
        });

        it('should allow setting and getting plugin state', async () => {
            const plugin: Plugin<TestStage> = {
                name: 'stateful-plugin',
                install: vi.fn()
            };

            await engine.installPlugin(plugin);

            engine.setPluginState('stateful-plugin', { counter: 1 });

            const state = engine.getPluginState('stateful-plugin');
            expect(state).toEqual({ counter: 1 });
        });

        it('should merge plugin state when setting', async () => {
            const plugin: Plugin<TestStage> = {
                name: 'stateful-plugin',
                install: vi.fn(),
                state: { initial: true }
            };

            await engine.installPlugin(plugin);

            engine.setPluginState('stateful-plugin', { counter: 1 });

            const state = engine.getPluginState('stateful-plugin');
            expect(state).toEqual({ initial: true, counter: 1 });
        });

        it('should throw error when setting state for non-existent plugin', () => {
            expect(() => engine.setPluginState('non-existent', { test: true })).toThrow(PluginError);
            expect(() => engine.setPluginState('non-existent', { test: true })).toThrow('is not installed');
        });

        it('should clear plugin state on uninstall', async () => {
            const plugin: Plugin<TestStage> = {
                name: 'stateful-plugin',
                install: vi.fn(),
                state: { data: 'test' }
            };

            await engine.installPlugin(plugin);
            engine.setPluginState('stateful-plugin', { counter: 1 });

            await engine.uninstallPlugin('stateful-plugin');

            // Plugin should be removed, so state should be undefined
            expect(engine.getPluginState('stateful-plugin')).toBeUndefined();
        });
    });
});