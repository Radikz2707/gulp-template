import fs from "fs";
import path from "path";
import { config } from "./gulp.config.js";

// ==========================================
// ХЕЛПЕРЫ И УТИЛИТЫ
// ==========================================

/** Конвертация строки из kebab-case в camelCase */
const toCamelCase = (str) =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

/** Безопасная запись обновленного контента в файл */
const updateFileContent = (filePath, modifyCallback) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const updatedContent = modifyCallback(content);
  fs.writeFileSync(filePath, updatedContent.trimEnd() + "\n");
};

// ==========================================
// ЛОГИКА СБОРКИ ФАЙЛОВ
// ==========================================

/** Инъекция импорта и вызова функции в app.ts */
const updateAppTs = (filePath, name, camelName) => {
  updateFileContent(filePath, (content) => {
    const lines = content.split(/\r?\n/);
    const importLine = `import { ${camelName} } from "@/modules/${name}/${name}";`;
    const callLine = `${camelName}();`;

    // Вставка импорта перед разделительной чертой
    const separatorIndex = lines.findIndex((line) => line.includes("// ===="));
    if (separatorIndex !== -1) {
      lines.splice(separatorIndex, 0, importLine);
    } else {
      const lastImportIndex = lines.findLastIndex((line) =>
        line.trim().startsWith("import "),
      );
      lines.splice(
        lastImportIndex !== -1 ? lastImportIndex + 1 : 0,
        0,
        importLine,
      );
    }

    // Вставка вызова функции строго перед первым console.log
    const consoleLogIndex = lines.findIndex((line) =>
      line.includes("console.log"),
    );
    if (consoleLogIndex !== -1) {
      lines.splice(consoleLogIndex, 0, callLine);
    } else {
      lines.push(callLine);
    }

    // Ювелирная чистка и форматирование кода
    return (
      lines
        .join("\n")
        // Убираем лишние пустые строки внутри списков импортов
        .replace(/(import\s+.*?;)\n\s*\n\s*(import\s+.*?;)/gi, "$1\n$2")
        // Прижимаем импорты к заголовкам разделов (любая цифра или её отсутствие)
        .replace(
          /(\/\/ .*?ИМПОРТЫ ДИНАМИЧЕСКИХ JS\/TS МОДУЛЕЙ\r?\n)\s*\r?\n/i,
          "$1",
        )
        .replace(/(\/\/ Интерактивные модули логики\r?\n)\s*\r?\n/i, "$1")
        // Схлопываем пустые строки между вызовами функций
        .replace(/(\(\);\r?\n)\s*\r?\n\s*(\b\w+\(\);)/gi, "$1$2")
        // Оставляем ровно одну пустую строку перед разделителем и перед console.log
        .replace(/([^\n])\n*(\/\/ ====)/, "$1\n\n$2")
        .replace(/(\(\);\r?\n)\s*(\s*console\.log)/i, "$1\n$2")
    );
  });
};

/** Инъекция @use импорта в style.scss */
const updateStyleScss = (filePath, dirPath, name, camelName) => {
  updateFileContent(filePath, (content) => {
    const styleDir = path.dirname(filePath);
    let relativePath = path
      .relative(styleDir, path.join(dirPath, name))
      .replace(/\\/g, "/");
    if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;

    const lines = content.split(/\r?\n/);
    const newImport = `@use "${relativePath}" as ${camelName};`;

    // Ищем начало чистого CSS/SCSS кода (не импорт и не комментарий)
    const firstCodeIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      return (
        trimmed !== "" &&
        !trimmed.startsWith("@use") &&
        !trimmed.startsWith("//")
      );
    });

    if (firstCodeIndex !== -1) {
      lines.splice(firstCodeIndex, 0, newImport);
    } else {
      lines.push(newImport);
    }

    // Форматирование блока стилей
    return lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/(\/\/ ФУНКЦИОНАЛЬНЫЕ JS\/TS МОДУЛИ\r?\n)\s*\r?\n/i, "$1")
      .replace(/(@use\s+.*?;)\n*(?![^]*@use)/i, "$1\n\n");
  });
  console.log("🎨 Стили добавлены в блок модулей style.scss");
};

// ==========================================
// ОСНОВНОЙ ТАСК GULP
// ==========================================

export const createModule = (done) => {
  const name = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!name) {
    console.log(
      "\n❌ Укажите имя модуля! Пример: gulp createModule --my-block\n",
    );
    return done();
  }

  const camelName = toCamelCase(name);
  const dirPath = path.join(config.structure.modules, name);
  const appJsPath = path.join(config.srcFolder, "js", "app.ts");
  const styleScssPath = path.join(
    config.srcFolder,
    config.preprocessor,
    `style.${config.preprocessor}`,
  );

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Модуль "${name}" уже существует!\n`);
    return done();
  }

  // Создание структуры директорий и шаблонов файлов
  fs.mkdirSync(dirPath, { recursive: true });

  const tsTemplate = `export const ${camelName} = (): void => {\n  console.log("Модуль ${name} (TS) инициализирован");\n};\n`;
  const scssTemplate = `.${name} {\n  \n}\n`;

  fs.writeFileSync(path.join(dirPath, `${name}.ts`), tsTemplate);
  fs.writeFileSync(path.join(dirPath, `${name}.scss`), scssTemplate);

  // Инъекция созданного модуля в точки входа проекта
  updateAppTs(appJsPath, name, camelName);
  updateStyleScss(styleScssPath, dirPath, name, camelName);

  console.log(`\n✅ Модуль "${name}" (TS: ${camelName}) успешно создан!\n`);
  done();
};
