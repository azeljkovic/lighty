import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

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
  lightySidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'Request API',
      items: [
        'request-api/configuration',
        'request-api/client',
        'request-api/params-and-body',
        'request-api/responses',
        'request-api/errors-and-logging',
        'request-api/type-reference',
      ],
    },
    {
      type: 'category',
      label: 'Assertions',
      items: [
        'assertions/overview',
        'assertions/responses',
        'assertions/headers',
        'assertions/bodies',
      ],
    },
  ],
};

export default sidebars;
