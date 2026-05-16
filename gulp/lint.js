import { config } from "../gulp.config.js";
import { exec } from "child_process";

// Определение режима сборки (Production / Development)
const isProd = process.argv.includes("build");

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СТИЛЕЙ (STYLELINT)
// ==========================================
export const lintCss = (done, filePath = null) => {
  // Если filePath передан, проверяем только его, иначе — сканируем все стили проекта
  const targetPath = filePath
    ? filePath
    : `${config.srcFolder}/**/*.${config.preprocessor}`;

  exec(
    `npx stylelint "${targetPath}" --fix --allow-empty-input --custom-formatter=stylelint-formatter-pretty`,
    (_err, stdout) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      done();
    },
  );
};

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СКРИПТОВ (ESLINT)
// ==========================================
export const lintJs = (done, filePath = null) => {
  // Поддержка точечной проверки файла для ускорения воркеров в startwatch
  const targetPath = filePath
    ? filePath
    : `${config.srcFolder}/js/**/*.{js,ts}`;

  exec(
    `cross-env ESLINT_USE_FLAT_CONFIG=false npx eslint "${targetPath}" --fix`,
    (_err, stdout) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      done();
    },
  );
};
