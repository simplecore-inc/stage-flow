/**
 * Plugin management system for StageFlow
 * 
 * This module handles all plugin-related functionality including:
 * - Plugin installation and uninstallation
 * - Dependency management and topological sorting
 * - Plugin hook execution
 * - Plugin state management
 */

import {
  Plugin,
  StageFlowEngine,
  StageContext,
  TransitionContext
} from './types/core';
import { PluginError } from './types/errors';

/**
 * Plugin manager class that handles all plugin operations for StageFlow
 */
export class PluginManager<TStage extends string, TData = unknown> {
  private plugins: Map<string, Plugin<TStage, TData>>;
  private engine: StageFlowEngine<TStage, TData> | null = null;

  constructor() {
    this.plugins = new Map();
  }

  /**
   * Sets the engine reference for the plugin manager
   */
  setEngine(engine: StageFlowEngine<TStage, TData>): void {
    this.engine = engine;
  }

  /**
   * Installs a plugin into the stage flow engine
   */
  async installPlugin(plugin: Plugin<TStage, TData>): Promise<void> {
    if (!plugin.name) {
      throw new PluginError('Plugin must have a name');
    }

    if (this.plugins.has(plugin.name)) {
      throw new PluginError(`Plugin "${plugin.name}" is already installed`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.plugins.has(dependency)) {
          throw new PluginError(
            `Plugin "${plugin.name}" requires dependency "${dependency}" which is not installed`
          );
        }
      }
    }

    try {
      // Add plugin to registry
      this.plugins.set(plugin.name, plugin);

      // Initialize plugin state in StateManager if plugin has initial state
      if (this.engine && plugin.state) {
        (this.engine as any).setPluginState(plugin.name, plugin.state);
      }

      // Install plugin if engine is started (only call install() if engine is actually started)
      if (this.engine && plugin.install) {
        // Check if engine is started using lifecycle manager
        const engineState = this.engine as any;
        if (engineState.lifecycleManager && engineState.lifecycleManager.isEngineStarted()) {
          await plugin.install(this.engine);
        }
      }
    } catch (error) {
      // Remove plugin from registry if installation failed
      this.plugins.delete(plugin.name);

      throw new PluginError(
        `Failed to install plugin "${plugin.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        { plugin, error }
      );
    }
  }

  /**
   * Uninstalls a plugin from the stage flow engine
   */
  async uninstallPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginError(`Plugin "${name}" is not installed`);
    }

    // Check if other plugins depend on this one
    const dependentPlugins = this._findDependentPlugins(name);
    if (dependentPlugins.length > 0) {
      throw new PluginError(
        `Cannot uninstall plugin "${name}" because it is required by: ${dependentPlugins.join(', ')}`
      );
    }

    try {
      // Uninstall plugin if engine is started and plugin has uninstall method
      if (this.engine && plugin.uninstall) {
        await plugin.uninstall(this.engine);
      }

      // Clear plugin state in StateManager
      if (this.engine) {
        (this.engine as any).setPluginState(name, undefined);
      }

      // Remove plugin from registry
      this.plugins.delete(name);
    } catch (error) {
      throw new PluginError(
        `Failed to uninstall plugin "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        { plugin, error }
      );
    }
  }

  /**
   * Gets a list of installed plugin names
   */
  getInstalledPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Gets a specific plugin by name
   */
  getPlugin(name: string): Plugin<TStage, TData> | undefined {
    return this.plugins.get(name);
  }

  /**
   * Gets plugin state for a specific plugin
   */
  getPluginState(name: string): Record<string, unknown> | undefined {
    if (!this.engine) {
      throw new PluginError('Engine not set');
    }
    return (this.engine as any).getPluginState(name);
  }

  /**
   * Sets plugin state for a specific plugin
   */
  setPluginState(name: string, state: Record<string, unknown>): void {
    if (!this.engine) {
      throw new PluginError('Engine not set');
    }
    (this.engine as any).setPluginState(name, state);
  }

  /**
   * Finds plugins that depend on the given plugin
   */
  private _findDependentPlugins(pluginName: string): string[] {
    const dependentPlugins: string[] = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.dependencies && plugin.dependencies.includes(pluginName)) {
        dependentPlugins.push(plugin.name);
      }
    }

    return dependentPlugins;
  }

  /**
   * Sorts plugins by their dependencies (topological sort)
   */
  private _sortPluginsByDependencies(plugins: Plugin<TStage, TData>[]): Plugin<TStage, TData>[] {
    const sorted: Plugin<TStage, TData>[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (plugin: Plugin<TStage, TData>): void => {
      if (visiting.has(plugin.name)) {
        throw new PluginError(`Circular dependency detected involving plugin "${plugin.name}"`);
      }

      if (visited.has(plugin.name)) {
        return;
      }

      visiting.add(plugin.name);

      // Visit dependencies first
      if (plugin.dependencies) {
        for (const depName of plugin.dependencies) {
          const depPlugin = plugins.find(p => p.name === depName);
          if (depPlugin) {
            visit(depPlugin);
          }
        }
      }

      visiting.delete(plugin.name);
      visited.add(plugin.name);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      if (!visited.has(plugin.name)) {
        visit(plugin);
      }
    }

    return sorted;
  }

  /**
   * Executes plugin hooks of a specific type in dependency order
   */
  async executePluginHooks(
    hookType: keyof NonNullable<Plugin<TStage, TData>['hooks']>,
    context: StageContext<TStage, TData> | TransitionContext<TStage, TData>
  ): Promise<void> {
    const plugins = Array.from(this.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);

    for (const plugin of sortedPlugins) {
      if (!plugin.hooks || !plugin.hooks[hookType]) {
        continue;
      }

      try {
        const hook = plugin.hooks[hookType];
        if (hook) {
          await hook(context as StageContext<TStage, TData> & TransitionContext<TStage, TData>); // Type assertion needed due to union type
        }
      } catch (error) {
        // Plugin errors should not break the entire flow
        // Log the error and continue with other plugins
        const pluginError = new PluginError(
          `Plugin "${plugin.name}" hook "${hookType}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, hookType, context, error }
        );

        // Only log errors in non-test environments
        if (process.env.NODE_ENV !== 'test') {
          console.error(pluginError.message, pluginError.context);
        }

        // If this is a critical hook, we might want to handle it differently
        // For now, we continue execution to maintain flow stability
      }
    }
  }

  /**
   * Installs all plugins in dependency order
   */
  async installAllPlugins(): Promise<void> {
    const plugins = Array.from(this.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);

    for (const plugin of sortedPlugins) {
      try {
        if (plugin.install && this.engine) {
          await plugin.install(this.engine);
        }
      } catch (error) {
        const pluginError = new PluginError(
          `Failed to install plugin "${plugin.name}" during engine start: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, error }
        );
        console.error(pluginError.message, pluginError.context);
      }
    }
  }

  /**
   * Uninstalls all plugins in reverse dependency order
   */
  async uninstallAllPlugins(): Promise<void> {
    const plugins = Array.from(this.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);

    for (const plugin of sortedPlugins.reverse()) {
      try {
        if (plugin.uninstall && this.engine) {
          await plugin.uninstall(this.engine);
        }
      } catch (error) {
        const pluginError = new PluginError(
          `Failed to uninstall plugin "${plugin.name}" during engine stop: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, error }
        );
        console.error(pluginError.message, pluginError.context);
      }
    }
  }

  /**
   * Gets all plugins as an array
   */
  getAllPlugins(): Plugin<TStage, TData>[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Checks if a plugin is installed
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Gets the number of installed plugins
   */
  getPluginCount(): number {
    return this.plugins.size;
  }
} 