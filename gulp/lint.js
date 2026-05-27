import { config } from "../gulp.config.js";
import { exec } from "child_process";

// Проверяем, запущена ли команда в режиме слежения (watch)
const isWatch =
  process.argv.includes("default") || process.argv.includes("startwatch");

// Универсальный обработчик завершения таски
const handleLintResult = (err, stdout, stderr, done) => {
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  // Если есть ошибка и мы НЕ в режиме бесконечного слежения — роняем процесс
  if (err && !isWatch) {
    return done(new Error("Linter found unfixable errors or syntax defects."));
  }

  done();
};

// Опции для сохранения цветного вывода в терминале exec
const execOptions = {
  env: { ...process.env, FORCE_COLOR: "1" },
};

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СТИЛЕЙ (STYLELINT)
// ==========================================
export const lintCss = (done, filePath = null) => {
  // ИСПРАВЛЕНО: Двойные кавычки внутри косых для стабильной работы glob в Windows/Linux
  const targetPath = filePath
    ? `"${filePath}"`
    : `"${config.srcFolder}/**/*.${config.preprocessor}"`;

  exec(
    `npx stylelint ${targetPath} --fix --allow-empty-input --custom-formatter=stylelint-formatter-pretty`,
    execOptions,
    (err, stdout, stderr) => handleLintResult(err, stdout, stderr, done),
  );
};

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СКРИПТОВ (ESLINT)
// ==========================================
export const lintJs = (done, filePath = null) => {
  // ИСПРАВЛЕНО: Двойные кавычки спасают раскрытие маски {js,ts} в cmd.exe
  const targetPath = filePath 
    ? `"${filePath}"` 
    : `"${config.srcFolder}/**/*.{js,ts}"`;

  exec(
    `npx eslint ${targetPath} --fix`, 
    execOptions,
    (err, stdout, stderr) => handleLintResult(err, stdout, stderr, done),
  );
};
