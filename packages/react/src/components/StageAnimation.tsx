/**
 * StageAnimation - Component for animating stage transitions with Framer Motion
 */

import React, { ReactNode } from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import { EffectConfig, DEFAULT_EFFECTS } from '@stage-flow/core';

/**
 * Props for StageAnimation component
 */
export interface StageAnimationProps {
  /** Child components to animate */
  children: ReactNode;
  /** Effect configuration for the animation */
  effect?: EffectConfig;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * Built-in animation variants compatible with Framer Motion
 */
const builtInVariants: Record<string, Variants> = {
  none: {
    initial: {},
    animate: {},
    exit: {}
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  },
  scaleUp: {
    initial: { scale: 1.2, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  },
  scaleDown: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  flip: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 }
  },
  flipX: {
    initial: { rotateX: -90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: 90, opacity: 0 }
  },
  flipY: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 }
  },
  zoom: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 }
  },
  rotate: {
    initial: { rotate: -180, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 180, opacity: 0 }
  }
};

/**
 * Default effect configuration
 */
const defaultEffect: EffectConfig = DEFAULT_EFFECTS.fade;

/**
 * Convert easing string to Framer Motion transition
 */
const getAnimationConfig = (effect: EffectConfig): Transition => {
  const duration = (effect.duration || defaultEffect.duration!) / 1000; // Convert to seconds
  const delay = effect.delay ? effect.delay / 1000 : 0; // Convert to seconds

  const easingMap: Record<string, unknown> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    easeInQuad: [0.55, 0.085, 0.68, 0.53],
    easeOutQuad: [0.25, 0.46, 0.45, 0.94],
    easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
    easeInCubic: [0.55, 0.055, 0.675, 0.19],
    easeOutCubic: [0.215, 0.61, 0.355, 1],
    easeInOutCubic: [0.645, 0.045, 0.355, 1],
    easeInBack: [0.6, -0.28, 0.735, 0.045],
    easeOutBack: [0.175, 0.885, 0.32, 1.275],
    easeInOutBack: [0.68, -0.55, 0.265, 1.55]
  };

  const config: Transition = {
    duration,
    ease: easingMap[effect.easing || 'easeInOut'] || easingMap.easeInOut,
    ...effect.options
  };

  if (delay > 0) {
    config.delay = delay;
  }

  return config;
};

/**
 * Get variants for an effect, supporting custom effects from the registry
 */
const getEffectVariants = (effect: EffectConfig): Variants => {
  // Check built-in variants first
  if (builtInVariants[effect.type]) {
    return builtInVariants[effect.type];
  }

  // Check if it's a custom effect with variants in options
  if (effect.options?.variants) {
    return effect.options.variants as Variants;
  }

  // Fallback to fade if effect type is not found
  return builtInVariants.fade;
};

/**
 * Component that wraps children with Framer Motion animations
 * 
 * @param props - Animation props
 * @returns Animated JSX element
 */
export function StageAnimation({
  children,
  effect = defaultEffect,
  className,
  style,
  onAnimationStart,
  onAnimationComplete
}: StageAnimationProps): React.JSX.Element {
  // Always call useEffect to handle callbacks consistently
  React.useEffect(() => {
    if (effect.type === 'none') {
      onAnimationStart?.();
      onAnimationComplete?.();
    }
  }, [effect.type, onAnimationStart, onAnimationComplete]);

  // Handle 'none' effect type - no animation
  if (effect.type === 'none') {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // Get the animation variants
  const variants = getEffectVariants(effect);

  // Get the animation configuration
  const animationConfig = getAnimationConfig(effect);

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={animationConfig}
      onAnimationStart={() => {
        onAnimationStart?.();
      }}
      onAnimationComplete={() => {
        onAnimationComplete?.();
      }}
    >
      {children}
    </motion.div>
  );
}