/** @typedef {import('eslint').Linter.Config} ESLintConfig */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tsResolver from 'eslint-import-resolver-typescript';

import { layerBoundariesPlugin } from './rules/app-page-feature-requires-view.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function listSubdirNames(relDir) {
  const abs = path.join(REPO_ROOT, relDir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

const DATA_LAYER = './src/data';
const DOMAIN_LAYER = './src/domain';
const APPLICATION_LAYER = './src/application';
const UTILS_LAYER = './src/utils';
const UI_LAYER = './src/ui';
const FEATURES_LAYER = './src/features';
const VIEWS_LAYER = './src/views';
const ERRORS_LAYER = './src/errors';
const APP_ROUTES = './app';

/**
 * Next.js files that make up the app shell rather than a screen: they only wrap their
 * children, so they may compose shell features (header, footer, nav) with no view in between.
 */
const APP_SHELL_FILES = ['app/**/layout.tsx', 'app/**/template.tsx'];

/**
 * Next.js files that *are* a screen — the route's own page plus the pages that stand in for it.
 * Each one renders a view, so a feature is only allowed here next to that view.
 */
const APP_PAGE_FILES = ['app/**/page.tsx', 'app/**/error.tsx', 'app/**/global-error.tsx', 'app/**/not-found.tsx'];

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones'][number]} */
const appRoutesFeatureZone = {
  target: APP_ROUTES,
  from: [FEATURES_LAYER],
  message: 'App routes must compose Views, not Features directly.',
};

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']} */
export const sharedLayerBoundaryZones = [
  {
    target: DOMAIN_LAYER,
    from: [DATA_LAYER, APPLICATION_LAYER, UI_LAYER, FEATURES_LAYER, VIEWS_LAYER],
    message: 'Domain must not import outer layers (@errors and @utils are allowed).',
  },
  {
    target: DATA_LAYER,
    from: [APPLICATION_LAYER, UI_LAYER, FEATURES_LAYER, VIEWS_LAYER],
    message: 'Data layer may only import Domain, Errors, Utils, and other Data modules.',
  },
  {
    target: UTILS_LAYER,
    from: [DOMAIN_LAYER, DATA_LAYER, APPLICATION_LAYER, UI_LAYER, FEATURES_LAYER, VIEWS_LAYER],
    message: 'Utils must not import any other layer (@errors is allowed).',
  },
  {
    target: UI_LAYER,
    from: [DATA_LAYER, APPLICATION_LAYER, FEATURES_LAYER, VIEWS_LAYER, ERRORS_LAYER],
    message: 'UI may only import Utils (and rarely Domain enums/models).',
  },
  {
    target: VIEWS_LAYER,
    from: [DATA_LAYER, DOMAIN_LAYER],
    message: 'Views must delegate Domain/Data access to Features.',
  },
  appRoutesFeatureZone,
  {
    target: [DOMAIN_LAYER, UTILS_LAYER, UI_LAYER, VIEWS_LAYER, ERRORS_LAYER, APP_ROUTES],
    from: DATA_LAYER,
    message: 'Only Data and Application layers may import from @data.',
  },
  {
    target: APPLICATION_LAYER,
    from: [FEATURES_LAYER, VIEWS_LAYER],
    message: 'Application must not import Features or Views.',
  },
  {
    target: UI_LAYER,
    from: ERRORS_LAYER,
    message: 'Errors layer must not be imported by UI.',
  },
  {
    target: ERRORS_LAYER,
    from: [DOMAIN_LAYER, DATA_LAYER, APPLICATION_LAYER, UTILS_LAYER, UI_LAYER, FEATURES_LAYER, VIEWS_LAYER],
    message: 'Errors layer must not import from other layers.',
  },
  {
    target: [DOMAIN_LAYER, DATA_LAYER, APPLICATION_LAYER, UTILS_LAYER, UI_LAYER, FEATURES_LAYER, VIEWS_LAYER, ERRORS_LAYER],
    from: APP_ROUTES,
    message: 'Route files are Next.js entry points, not a public API. Nothing under src may import from @app.',
  },
];

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']} */
const featureProductionZones = [
  {
    target: FEATURES_LAYER,
    from: [DATA_LAYER, VIEWS_LAYER],
    message: 'Features must not import Data or Views (use registry and use-cases instead).',
  },
];

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']} */
const featureTestZones = [
  {
    target: FEATURES_LAYER,
    from: VIEWS_LAYER,
    message: 'Features must not import Views.',
  },
];

const OTHER_TOP_LEVEL_AREAS = [APP_ROUTES, APPLICATION_LAYER, DATA_LAYER, DOMAIN_LAYER, ERRORS_LAYER, UTILS_LAYER, VIEWS_LAYER];

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']} */
const featureEncapsulationZones = listSubdirNames('src/features').map((name) => {
  const featureDir = `${FEATURES_LAYER}/${name}`;
  const siblingFeatureDirs = listSubdirNames('src/features')
    .filter((sibling) => sibling !== name)
    .map((sibling) => `${FEATURES_LAYER}/${sibling}`);

  return {
    target: [...OTHER_TOP_LEVEL_AREAS, UI_LAYER, ...siblingFeatureDirs],
    from: `${featureDir}/*/**`,
    message: `"${featureDir}" internals are private. Structure your code so it doesn't depend on this feature's internal implementation details.`,
  };
});

/** @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']} */
const uiComponentEncapsulationZones = (() => {
  const allComponentDirs = listSubdirNames('src/ui').flatMap((category) =>
    listSubdirNames(`src/ui/${category}`).map((component) => `${UI_LAYER}/${category}/${component}`),
  );

  return allComponentDirs.map((componentDir) => ({
    target: [...OTHER_TOP_LEVEL_AREAS, FEATURES_LAYER, ...allComponentDirs.filter((dir) => dir !== componentDir)],
    from: `${componentDir}/*/**`,
    message: `"${componentDir}" internals are private. Structure your code so it doesn't depend on this UI component's internal implementation details.`,
  }));
})();

/**
 * @type {import('eslint-plugin-import-x').Rules['no-restricted-paths'][1]['zones']}
 */
const applicationEncapsulationZones = (() => {
  const sliceDirs = listSubdirNames('src/application').map((name) => `${APPLICATION_LAYER}/${name}`);

  return sliceDirs.map((sliceDir) => ({
    target: [
      APP_ROUTES,
      DATA_LAYER,
      DOMAIN_LAYER,
      ERRORS_LAYER,
      UTILS_LAYER,
      UI_LAYER,
      FEATURES_LAYER,
      VIEWS_LAYER,
      ...sliceDirs.filter((dir) => dir !== sliceDir),
    ],
    from: `${sliceDir}/*/**`,
    message: `"${sliceDir}" internals are private. Import from the application root or a slice root, not its inner segments.`,
  }));
})();

/** @type {ESLintConfig} */
export const layerBoundariesConfig = {
  settings: {
    'import-x/resolver': {
      name: 'tsResolver',
      resolver: tsResolver,
    },
  },
  rules: {
    'import-x/no-restricted-paths': [
      'error',
      {
        zones: [
          ...sharedLayerBoundaryZones,
          ...featureProductionZones,
          ...featureEncapsulationZones,
          ...uiComponentEncapsulationZones,
          ...applicationEncapsulationZones,
        ],
      },
    ],
  },
};

/**
 * Every cross-layer zone except the app-routes/features one, so the app-shell and page
 * configs below can lift that single restriction without loosening anything else.
 */
const layerZonesWithoutAppFeatureRestriction = [
  ...sharedLayerBoundaryZones.filter((zone) => zone !== appRoutesFeatureZone),
  ...featureProductionZones,
  ...featureEncapsulationZones,
  ...uiComponentEncapsulationZones,
  ...applicationEncapsulationZones,
];

/** @type {ESLintConfig} */
export const appShellBoundariesConfig = {
  files: APP_SHELL_FILES,
  rules: {
    'import-x/no-restricted-paths': ['error', { zones: layerZonesWithoutAppFeatureRestriction }],
  },
};

/** @type {ESLintConfig} */
export const appPageBoundariesConfig = {
  files: APP_PAGE_FILES,
  plugins: {
    'layer-boundaries': layerBoundariesPlugin,
  },
  rules: {
    // Features are unblocked here, then re-restricted by the rule below: a page may import a
    // feature only when it also imports the View it belongs to.
    'import-x/no-restricted-paths': ['error', { zones: layerZonesWithoutAppFeatureRestriction }],
    'layer-boundaries/app-page-feature-requires-view': 'error',
  },
};

/** @type {ESLintConfig} */
export const featureTestBoundariesConfig = {
  files: ['src/features/**/*.{test,spec}.{ts,tsx}'],
  rules: {
    'import-x/no-restricted-paths': [
      'error',
      {
        zones: [
          ...sharedLayerBoundaryZones,
          ...featureTestZones,
          ...featureEncapsulationZones,
          ...uiComponentEncapsulationZones,
          ...applicationEncapsulationZones,
        ],
      },
    ],
  },
};

/** @type {ESLintConfig} */
export const pixelPerfectBoundariesConfig = {
  files: ['**/*.pixel.ts'],
  rules: {
    // A pixel spec sits next to its view but needs the Data layer's mock factories, so the
    // cross-layer zones do not apply to it. Slice encapsulation still does.
    'import-x/no-restricted-paths': [
      'error',
      {
        zones: [...featureEncapsulationZones, ...uiComponentEncapsulationZones, ...applicationEncapsulationZones],
      },
    ],
  },
};

/** @type {ESLintConfig} */
export const reactQueryBoundariesConfig = {
  files: ['**/*.{ts,tsx}'],
  ignores: ['src/utils/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@tanstack/react-query',
            importNames: ['useQuery', 'useMutation', 'useSuspenseQuery', 'useInfiniteQuery'],
            message: 'Use createDatasource / createUsecase from @utils instead of direct react-query hooks.',
          },
        ],
      },
    ],
  },
};
