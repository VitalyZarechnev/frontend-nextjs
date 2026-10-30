/**
 * App Router screens compose Views — `page.tsx` and the files that stand in for it
 * (`error.tsx`, `global-error.tsx`, `not-found.tsx`). Such a file may still pull in a
 * chrome-ish feature (a footer, a header, a banner) next to its View, but one that imports
 * features *without* a View has become a view of its own — that composition belongs in `@views`.
 *
 * Layouts and templates are not covered by this rule: they legitimately consist of nothing but
 * shell features, so they are exempted through the flat config.
 */

const FEATURE_SOURCE = /^@features\//;
const VIEW_SOURCE = /^@views\//;
const RELATIVE_FEATURE_SOURCE = /(^|\/)src\/features\//;
const RELATIVE_VIEW_SOURCE = /(^|\/)src\/views\//;

const isFeatureSource = (source) => FEATURE_SOURCE.test(source) || RELATIVE_FEATURE_SOURCE.test(source);
const isViewSource = (source) => VIEW_SOURCE.test(source) || RELATIVE_VIEW_SOURCE.test(source);

/** @type {import('eslint').Rule.RuleModule} */
export const appPageFeatureRequiresView = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow App Router pages to import a feature only when they also import the route’s View.',
    },
    schema: [],
    messages: {
      featureWithoutView: [
        'App screens compose Views: the feature "{{source}}" may only be imported here alongside a View.',
        'Move this composition into a view in @views, or import the route’s View here as well.',
      ].join(' '),
    },
  },

  create(context) {
    /** @type {{ node: import('estree').Node, source: string }[]} */
    const featureImports = [];
    let importsView = false;

    const track = (node, source) => {
      if (typeof source !== 'string') return;
      if (isViewSource(source)) importsView = true;
      else if (isFeatureSource(source)) featureImports.push({ node, source });
    };

    const trackSourceNode = (node) => {
      if (node.source?.type === 'Literal') track(node.source, node.source.value);
    };

    return {
      ImportDeclaration: trackSourceNode,
      ExportNamedDeclaration: trackSourceNode,
      ExportAllDeclaration: trackSourceNode,
      ImportExpression: trackSourceNode,

      'Program:exit'() {
        if (importsView) return;

        for (const { node, source } of featureImports) {
          context.report({ node, messageId: 'featureWithoutView', data: { source } });
        }
      },
    };
  },
};

/** @type {import('eslint').ESLint.Plugin} */
export const layerBoundariesPlugin = {
  rules: {
    'app-page-feature-requires-view': appPageFeatureRequiresView,
  },
};
