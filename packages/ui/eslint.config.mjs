import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...tseslint.configs.recommended,
  prettier,
  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  globalIgnores(['dist/**']),
])
