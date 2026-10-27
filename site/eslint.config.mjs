// Structure ratchet: complexity 10, 60 lines per function and 500 lines per
// file. The limits are fixed and are never raised. Existing violations are
// recorded in eslint-suppressions.json, which only goes down: after the code
// improves, run `npx eslint . --prune-suppressions`.
//
// The skip options are false so that every line counts. Astro files are parsed
// whole (frontmatter and template) and their client scripts are linted as
// separate TypeScript blocks.

import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

const structure = {
  complexity: ['error', { max: 10 }],
  'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: false, skipComments: false }],
};

export default [
  { ignores: ['dist/', '.astro/', 'public/hydra/hydra-synth.js'] },
  ...astro.configs.base,
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser },
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts}', '**/*.astro'],
    rules: structure,
  },
];
