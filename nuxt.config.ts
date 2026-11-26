import { fileURLToPath, URL } from 'node:url';

export default defineNuxtConfig({
  compatibilityDate: '2026-11-04',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  alias: {
    '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
    '@server': fileURLToPath(new URL('./server', import.meta.url)),
    '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    '@test-mocks': fileURLToPath(new URL('./tests/mocks', import.meta.url)),
  },
  runtimeConfig: {
    tmdb: {
      apiReadAccessToken: '', // NUXT_TMDB_API_READ_ACCESS_TOKEN from .env file
      baseUrl: '', // NUXT_TMDB_BASE_URL from .env file
    },
    llm: {
      provider: '', // NUXT_LLM_PROVIDER from .env file
      baseUrl: '', // NUXT_LLM_BASE_URL from .env file
      model: '', // NUXT_LLM_MODEL from .env file
      reasoning: '', // NUXT_LLM_REASONING from .env file; empty sends no reasoning option
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  hooks: {
    'prepare:types'(options) {
      const compilerOptions = options?.tsConfig?.compilerOptions;
      if (compilerOptions && 'libReplacement' in compilerOptions) {
        delete compilerOptions.libReplacement;
      }
    },
  },
});
