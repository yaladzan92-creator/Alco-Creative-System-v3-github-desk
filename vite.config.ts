import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isGithubPagesBuild =
    env.VITE_BASE_PATH === 'github-pages' || process.env.GITHUB_ACTIONS === 'true';
  const base = isGithubPagesBuild ? './' : '/';
  return {
    base,
    plugins: [react(), tailwindcss()],
    build: {
      emptyOutDir: false,
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Keep file watching configurable to avoid noisy refresh loops during local editing.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
