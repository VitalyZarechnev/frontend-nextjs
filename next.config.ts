import path from 'node:path';
import { NextConfig } from 'next';

type WebpackConfiguration = Parameters<NonNullable<NextConfig['webpack']>>[0];

const nextConfig: NextConfig = {
  output: 'standalone',
  sassOptions: {
    // Allow `@use '<dir>/...'` to resolve against `src/` (legacy includePaths).
    includePaths: [path.join(process.cwd(), 'src')],
  },
  // Map `@assets/*` (used by SCSS modules in src/ui/**) to `src/assets/*`.
  // sass-loader falls back to webpack's resolver for unresolved imports,
  // so a webpack alias is the most reliable way to support this prefix.
  webpack(config: WebpackConfiguration) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> | undefined),
      '@assets': path.join(process.cwd(), 'src/assets'),
    };

    return config;
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      '@assets': './src/assets',
    },
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                  'removeDimensions',
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
