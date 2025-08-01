import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Stage Flow',
  tagline: 'A type-safe, plugin-based stage flow library for React applications',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://simplecore-inc.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, is often '/<projectName>/'
  baseUrl: '/stage-flow/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'simplecore-inc', // Usually your GitHub org/user name.
  projectName: 'stage-flow', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',



  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  // i18n: {
  //   defaultLocale: 'en',
  //   locales: ['en'],
  // },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/simplecore-inc/stage-flow/tree/main/website/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },

      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-live-codeblock',
  ],

  clientModules: [
    require.resolve('./src/client-modules.js'),
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'SimpleCORE Inc.',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/simplecore-inc/stage-flow',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Core Concepts',
              to: '/docs/guide/core-concepts',
            },
            {
              label: 'API Reference',
              to: '/docs/api/',
            },
          ],
        },
        {
          title: 'Examples',
          items: [
            {
              label: 'Basic Examples',
              to: '/docs/examples/basic/simple-counter',
            },
            {
              label: 'Advanced Examples',
              to: '/docs/examples/advanced/examples-multi-step-form',
            },
            {
              label: 'Animation Examples',
              to: '/docs/examples/animation/animation-effects',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/simplecore-inc/stage-flow',
            },
            {
              label: 'Issues',
              href: 'https://github.com/simplecore-inc/stage-flow/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/simplecore-inc/stage-flow/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Changelog',
              href: 'https://github.com/simplecore-inc/stage-flow/releases',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Stage Flow. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
