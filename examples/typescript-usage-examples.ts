/**
 * TypeScript usage examples demonstrating different stage types and advanced type safety
 */

import {
  StageFlowEngine,
  StageFlowConfig,
  StageContext,
  TransitionContext,
  Plugin,
  Middleware
} from '@stage-flow/core';

// Example 1: Simple string literal types
type SimpleStages = 'start' | 'middle' | 'end';

interface SimpleData {
  message: string;
  count: number;
}

const simpleConfig: StageFlowConfig<SimpleStages, SimpleData> = {
  initial: 'start',
  stages: [
    {
      name: 'start',
      transitions: [
        { target: 'middle', event: 'next' }
      ]
    },
    {
      name: 'middle',
      transitions: [
        { target: 'end', event: 'finish' },
        { target: 'start', event: 'back' }
      ]
    },
    {
      name: 'end',
      transitions: [
        { target: 'start', event: 'restart' }
      ]
    }
  ]
};

// Example 2: Enum-based stage types
enum GameStage {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
  HIGH_SCORES = 'highScores'
}

interface GameData {
  score: number;
  level: number;
  lives: number;
  playerName?: string;
  highScores?: Array<{ name: string; score: number }>;
}

const gameConfig: StageFlowConfig<GameStage, GameData> = {
  initial: GameStage.MENU,
  stages: [
    {
      name: GameStage.MENU,
      transitions: [
        { target: GameStage.PLAYING, event: 'startGame' },
        { target: GameStage.HIGH_SCORES, event: 'viewScores' }
      ]
    },
    {
      name: GameStage.PLAYING,
      transitions: [
        { target: GameStage.PAUSED, event: 'pause' },
        { target: GameStage.GAME_OVER, event: 'gameOver' }
      ]
    },
    {
      name: GameStage.PAUSED,
      transitions: [
        { target: GameStage.PLAYING, event: 'resume' },
        { target: GameStage.MENU, event: 'quit' }
      ]
    },
    {
      name: GameStage.GAME_OVER,
      transitions: [
        { target: GameStage.MENU, event: 'backToMenu' },
        { target: GameStage.PLAYING, event: 'playAgain' },
        { target: GameStage.HIGH_SCORES, event: 'viewScores' }
      ]
    },
    {
      name: GameStage.HIGH_SCORES,
      transitions: [
        { target: GameStage.MENU, event: 'back' }
      ]
    }
  ]
};

// Example 3: Complex nested data types
interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
      language: string;
    };
  };
}

interface AuthData {
  user?: User;
  token?: string;
  refreshToken?: string;
  loginAttempts: number;
  errors?: {
    field: string;
    message: string;
  }[];
  isLoading: boolean;
}

type AuthStage = 
  | 'unauthenticated'
  | 'loggingIn'
  | 'authenticated'
  | 'refreshingToken'
  | 'error'
  | 'lockedOut';

const authConfig: StageFlowConfig<AuthStage, AuthData> = {
  initial: 'unauthenticated',
  stages: [
    {
      name: 'unauthenticated',
      data: { loginAttempts: 0, isLoading: false },
      transitions: [
        { target: 'loggingIn', event: 'login' }
      ]
    },
    {
      name: 'loggingIn',
      data: { loginAttempts: 0, isLoading: true },
      transitions: [
        { target: 'authenticated', event: 'loginSuccess' },
        { target: 'error', event: 'loginFailed' },
        { target: 'lockedOut', event: 'tooManyAttempts' }
      ]
    },
    {
      name: 'authenticated',
      data: { loginAttempts: 0, isLoading: false },
      transitions: [
        { target: 'refreshingToken', event: 'tokenExpired' },
        { target: 'unauthenticated', event: 'logout' }
      ]
    },
    {
      name: 'refreshingToken',
      data: { loginAttempts: 0, isLoading: true },
      transitions: [
        { target: 'authenticated', event: 'refreshSuccess' },
        { target: 'unauthenticated', event: 'refreshFailed' }
      ]
    },
    {
      name: 'error',
      data: { loginAttempts: 0, isLoading: false },
      transitions: [
        { target: 'unauthenticated', event: 'retry' },
        { target: 'loggingIn', event: 'login' }
      ]
    },
    {
      name: 'lockedOut',
      data: { loginAttempts: 0, isLoading: false },
      transitions: [
        { target: 'unauthenticated', event: 'unlocked', after: 300000 } // 5 minutes
      ]
    }
  ]
};

// Example 4: Generic utility types for stage flows
type StageNames<T extends StageFlowConfig<any, any>> = 
  T extends StageFlowConfig<infer S, any> ? S : never;

type StageData<T extends StageFlowConfig<any, any>> = 
  T extends StageFlowConfig<any, infer D> ? D : never;

// Usage of utility types
type GameStageNames = StageNames<typeof gameConfig>; // GameStage
type GameStageData = StageData<typeof gameConfig>;   // GameData

// Example 5: Type-safe plugin creation
class TypedLoggingPlugin<TStage extends string, TData> implements Plugin<TStage, TData> {
  name = 'typed-logging';
  version = '1.0.0';

  constructor(
    private options: {
      logStages?: TStage[];
      logData?: boolean;
      customFormatter?: (stage: TStage, data?: TData) => string;
    } = {}
  ) {}

  async install(engine: any): Promise<void> {
    console.log(`Installing typed logging plugin for stages: ${this.options.logStages?.join(', ') || 'all'}`);
  }

  hooks = {
    onStageEnter: async (context: StageContext<TStage, TData>) => {
      if (!this.options.logStages || this.options.logStages.includes(context.current)) {
        const message = this.options.customFormatter
          ? this.options.customFormatter(context.current, context.data)
          : `Entered stage: ${context.current}`;
        
        console.log(message);
        
        if (this.options.logData && context.data) {
          console.log('Stage data:', context.data);
        }
      }
    }
  };
}

// Type-safe plugin usage
const gameLoggingPlugin = new TypedLoggingPlugin<GameStage, GameData>({
  logStages: [GameStage.PLAYING, GameStage.GAME_OVER],
  logData: true,
  customFormatter: (stage, data) => 
    `Game stage: ${stage}, Score: ${data?.score || 0}, Level: ${data?.level || 1}`
});

// Example 6: Type-safe middleware creation
class TypedValidationMiddleware<TStage extends string, TData> implements Middleware<TStage, TData> {
  name = 'typed-validation';

  constructor(
    private validators: Partial<Record<TStage, (data?: TData) => boolean | Promise<boolean>>>
  ) {}

  async execute(context: TransitionContext<TStage, TData>, next: () => Promise<void>): Promise<void> {
    const validator = this.validators[context.to];
    
    if (validator) {
      const isValid = await validator(context.data);
      if (!isValid) {
        console.log(`Validation failed for stage: ${context.to}`);
        context.cancel();
        return;
      }
    }
    
    await next();
  }
}

// Type-safe middleware usage
const authValidationMiddleware = new TypedValidationMiddleware<AuthStage, AuthData>({
  authenticated: (data) => !!(data?.user && data?.token),
  loggingIn: (data) => data?.loginAttempts !== undefined && data.loginAttempts < 5
});

// Example 7: Advanced type constraints and conditional types
type RequiredStageData<TStage extends string, TData> = {
  [K in TStage]: TData extends undefined ? never : TData;
};

type OptionalStageData<TStage extends string, TData> = {
  [K in TStage]?: TData;
};

// Example 8: Type-safe stage flow builder
class StageFlowBuilder<TStage extends string, TData = undefined> {
  private config: Partial<StageFlowConfig<TStage, TData>> = {
    stages: []
  };

  initial(stage: TStage): this {
    this.config.initial = stage;
    return this;
  }

  addStage(
    name: TStage,
    transitions: Array<{
      target: TStage;
      event?: string;
      condition?: (context: StageContext<TStage, TData>) => boolean | Promise<boolean>;
      after?: number;
    }>,
    data?: TData
  ): this {
    this.config.stages!.push({
      name,
      transitions,
      data
    });
    return this;
  }

  addPlugin(plugin: Plugin<TStage, TData>): this {
    if (!this.config.plugins) {
      this.config.plugins = [];
    }
    this.config.plugins.push(plugin);
    return this;
  }

  addMiddleware(middleware: Middleware<TStage, TData>): this {
    if (!this.config.middleware) {
      this.config.middleware = [];
    }
    this.config.middleware.push(middleware);
    return this;
  }

  build(): StageFlowConfig<TStage, TData> {
    if (!this.config.initial || !this.config.stages?.length) {
      throw new Error('Stage flow must have an initial stage and at least one stage definition');
    }
    return this.config as StageFlowConfig<TStage, TData>;
  }
}

// Example usage of builder
const builtConfig = new StageFlowBuilder<'loading' | 'ready' | 'error', { message: string }>()
  .initial('loading')
  .addStage('loading', [
    { target: 'ready', event: 'loaded' },
    { target: 'error', event: 'failed' }
  ], { message: 'Loading...' })
  .addStage('ready', [
    { target: 'loading', event: 'reload' }
  ], { message: 'Ready!' })
  .addStage('error', [
    { target: 'loading', event: 'retry' }
  ], { message: 'Error occurred' })
  .build();

// Example 9: Type-safe event system
interface TypedEvents<TStage extends string> {
  stageEnter: { stage: TStage; timestamp: number };
  stageExit: { stage: TStage; duration: number };
  transition: { from: TStage; to: TStage; event?: string };
  error: { stage: TStage; error: Error };
}

class TypedEventEmitter<TStage extends string> {
  private listeners: Map<keyof TypedEvents<TStage>, Function[]> = new Map();

  on<K extends keyof TypedEvents<TStage>>(
    event: K,
    listener: (data: TypedEvents<TStage>[K]) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit<K extends keyof TypedEvents<TStage>>(
    event: K,
    data: TypedEvents<TStage>[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

// Example 10: Type-safe testing utilities
class TypedStageFlowTester<TStage extends string, TData> {
  constructor(private engine: StageFlowEngine<TStage, TData>) {}

  async expectStage(expectedStage: TStage): Promise<void> {
    const currentStage = this.engine.getCurrentStage();
    if (currentStage !== expectedStage) {
      throw new Error(`Expected stage ${expectedStage}, but got ${currentStage}`);
    }
  }

  async expectTransition(
    event: string,
    fromStage: TStage,
    toStage: TStage,
    data?: TData
  ): Promise<void> {
    await this.expectStage(fromStage);
    await this.engine.send(event, data);
    await this.expectStage(toStage);
  }

  async testFlow(
    steps: Array<{
      event: string;
      expectedStage: TStage;
      data?: TData;
    }>
  ): Promise<void> {
    for (const step of steps) {
      await this.engine.send(step.event, step.data);
      await this.expectStage(step.expectedStage);
    }
  }
}

// Example usage of typed tester
async function testGameFlow() {
  const engine = new StageFlowEngine(gameConfig);
  const tester = new TypedStageFlowTester(engine);
  
  await engine.start();
  
  await tester.testFlow([
    { event: 'startGame', expectedStage: GameStage.PLAYING },
    { event: 'pause', expectedStage: GameStage.PAUSED },
    { event: 'resume', expectedStage: GameStage.PLAYING },
    { event: 'gameOver', expectedStage: GameStage.GAME_OVER }
  ]);
  
  console.log('✅ All tests passed!');
}

// Export all examples
export {
  // Configs
  simpleConfig,
  gameConfig,
  authConfig,
  builtConfig,
  
  // Types
  SimpleStages,
  SimpleData,
  GameStage,
  GameData,
  AuthStage,
  AuthData,
  User,
  
  // Utility types
  StageNames,
  StageData,
  RequiredStageData,
  OptionalStageData,
  
  // Classes
  TypedLoggingPlugin,
  TypedValidationMiddleware,
  StageFlowBuilder,
  TypedEventEmitter,
  TypedStageFlowTester,
  
  // Instances
  gameLoggingPlugin,
  authValidationMiddleware,
  
  // Functions
  testGameFlow
};

// Example React component with full type safety:
/*
import React from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { useStageFlow } from '@stage-flow/react';
import { gameConfig, GameStage, GameData } from './typescript-usage-examples';

const GameComponent: React.FC = () => {
  const [engine] = React.useState(() => new StageFlowEngine(gameConfig));
  const { currentStage, data, send } = useStageFlow<GameStage, GameData>(engine);

  React.useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);

  const handleStartGame = () => {
    send('startGame', { score: 0, level: 1, lives: 3 });
  };

  const handlePause = () => {
    send('pause');
  };

  // TypeScript ensures we can only use valid stages and events
  return (
    <div>
      {currentStage === GameStage.MENU && (
        <button onClick={handleStartGame}>Start Game</button>
      )}
      {currentStage === GameStage.PLAYING && (
        <div>
          <p>Score: {data?.score}</p>
          <p>Level: {data?.level}</p>
          <p>Lives: {data?.lives}</p>
          <button onClick={handlePause}>Pause</button>
        </div>
      )}
    </div>
  );
};
*/

// Run examples if this file is executed directly
// Check if we're running directly (not imported)
const isDirectExecution = process.argv[1] && process.argv[1].includes('typescript-usage-examples.ts');

if (isDirectExecution) {
  (async () => {
    console.log('🔒 Running TypeScript usage examples...\n');
    
    console.log('1. Simple string literal types example');
    const simpleEngine = new StageFlowEngine(simpleConfig);
    await simpleEngine.start();
    console.log(`✅ Simple engine started at stage: ${simpleEngine.getCurrentStage()}`);
    await simpleEngine.stop();
    
    console.log('\n2. Enum-based stage types example');
    const gameEngine = new StageFlowEngine(gameConfig);
    await gameEngine.start();
    console.log(`✅ Game engine started at stage: ${gameEngine.getCurrentStage()}`);
    await gameEngine.stop();
    
    console.log('\n3. Complex nested data types example');
    const authEngine = new StageFlowEngine(authConfig);
    await authEngine.start();
    console.log(`✅ Auth engine started at stage: ${authEngine.getCurrentStage()}`);
    await authEngine.stop();
    
    console.log('\n4. Type-safe plugin usage');
    const gameEngineWithPlugin = new StageFlowEngine(gameConfig);
    await gameEngineWithPlugin.installPlugin(gameLoggingPlugin);
    await gameEngineWithPlugin.start();
    console.log(`✅ Game engine with typed plugin started`);
    await gameEngineWithPlugin.stop();
    
    console.log('\n5. Stage flow builder pattern');
    const builtEngine = new StageFlowEngine(builtConfig);
    await builtEngine.start();
    console.log(`✅ Built engine started at stage: ${builtEngine.getCurrentStage()}`);
    await builtEngine.stop();
    
    console.log('\n6. Testing game flow');
    await testGameFlow();
    
    console.log('\n🎉 All TypeScript examples completed successfully!');
  })().catch(console.error);
}