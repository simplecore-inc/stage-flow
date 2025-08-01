import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: ["intro", "guide/getting-started", "guide/core-concepts"],
    },
    {
      type: "category",
      label: "Guides",
      items: ["guide/basic-usage", "guide/typescript-usage", "guide/plugin-system", "guide/middleware", "guide/testing"],
    },
    {
      type: "category",
      label: "React Integration",
      items: ["react/index", "react/components", "react/hooks", "react/react-patterns", "react/performance", "react/integration", "react/best-practices"],
    },
    {
      type: "category",
      label: "API Reference",
      items: ["api/api", "api/api-core", "api/api-react", "api/api-plugins", "api/api-testing"],
    },
    {
      type: "category",
      label: "Examples",
      items: [
        {
          type: "category",
          label: "Basic Examples",
          items: ["examples/basic/simple-counter", "examples/basic/todo-list", "examples/basic/toggle-switch"],
        },
        {
          type: "category",
          label: "Advanced Examples",
          items: [
            "examples/advanced/examples-multi-step-form",
            "examples/advanced/examples-authentication-flow",
            "examples/advanced/examples-shopping-cart",
            "examples/advanced/setup-wizard",
            "examples/advanced/mbti-test",
          ],
        },
        {
          type: "category",
          label: "Animation Examples",
          items: ["examples/animation/animation-effects"],
        },
        {
          type: "category",
          label: "Performance Examples",
          items: ["examples/performance/lazy-loading"],
        },
      ],
    },
  ],
};

export default sidebars;
