import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const siteRoot = path.resolve(import.meta.dirname, '..');
const eslintBin = path.join(siteRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');

test('the structure ratchet passes with the recorded suppressions', () => {
  const run = spawnSync(process.execPath, [eslintBin, '.'], { cwd: siteRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
});
