import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

import {
  formatFrontendConfigDiagnostics,
  validateFrontendEnvRecord,
} from './src/config/validate';

export default defineConfig(({ mode, command }) => {
  const repoRoot = path.resolve(__dirname, '..');
  const rootEnv = loadEnv(mode, repoRoot, '');
  const frontendEnv = loadEnv(mode, __dirname, '');
  const mergedEnv = { ...rootEnv, ...frontendEnv, ...process.env };

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (key.startsWith('VITE_') && typeof value === 'string') {
      process.env[key] = value;
    }
  }

  const diagnostics = validateFrontendEnvRecord(mergedEnv);
  if (!diagnostics.isValid) {
    const message = formatFrontendConfigDiagnostics(diagnostics);
    if (command === 'build') {
      throw new Error(message);
    }
    console.warn(message, diagnostics.raw);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'],
    },
    server: {
      port: 5173,
    },
  };
});
