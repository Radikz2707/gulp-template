import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // 1. ПРАВИЛА ИГНОРИРОВАНИЯ (Ваш перенесенный список)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "archives/**",
      "gulpfile.js",
      "gulp.*.js",
      "gulp/**", // Игнорируем всю папку с тасками сборщика
      "webpack.config.js",
      ".vscode/**",
      ".idea/**",
      "*.log",
    ],
  },

  // 2. Базовые рекомендации ESLint и TypeScript
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,

  // 3. Настройки для проверяемых файлов
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        console: "readonly",
        Image: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
);
