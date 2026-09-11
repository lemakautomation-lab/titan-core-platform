import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TITAN Knowledge Base',
  tagline: 'Controlled knowledge for the TITAN Enterprise Platform',
  favicon: 'img/favicon.ico',

  url: 'https://knowledge.titan-technologies.co.za',
  baseUrl: '/',

  organizationName: 'TITAN Technologies',
  projectName: 'titan-core-platform',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'TITAN',
      items: [
        {to: '/docs', label: 'Knowledge Base', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: 'TITAN Technologies - Controlled Knowledge Base',
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
