import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  knowledgeBase: [
    'home',
    {
      type: 'category',
      label: 'TITAN Enterprise',
      items: ['platform/index'],
    },
    {
      type: 'category',
      label: 'Products',
      items: ['products/index'],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/index'],
    },
    {
      type: 'category',
      label: 'Missions',
      items: ['missions/index'],
    },
    {
      type: 'category',
      label: 'Governance',
      items: ['governance/index'],
    },
    {
      type: 'category',
      label: 'Security and Compliance',
      items: ['security/index'],
    },
    {
      type: 'category',
      label: 'Quality Management',
      items: ['quality/index'],
    },
    {
      type: 'category',
      label: 'Operations',
      items: ['operations/index'],
    },
  ],
};

export default sidebars;
