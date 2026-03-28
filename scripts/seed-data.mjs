#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const result = spawnSync('pnpm', ['-C', 'indexer', 'db:seed'], {
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
