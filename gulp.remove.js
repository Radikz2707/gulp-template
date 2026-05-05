import fs from "fs";
import { config } from "./gulp.config.js";

const protectedNames = [
  "js",
  "scss",
  "html",
  "img",
  "fonts",
  "components",
  "modules",
  "src",
  "dist",
];

// Функция для превращения блока-имени в блокИмя (для поиска вызова функции в TS)
const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export const remove = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log("\n❌ Ошибка: Укажите имя! Пример: gulp remove --header\n");
    return done();
  }

  if (protectedNames.includes(blockName.toLowerCase())) {
    console.log(
      `\n❌ Ошибка: Удаление системной папки "${blockName}" запрещено!\n`,
    );
    return done();
  }

  const possibleDirs = [
    `${config.structure.components}/${blockName}`,
    `${config.structure.modules}/${blockName}`,
    `${config.structure.plugins}/${blockName}`,
  ];

  // ИЗМЕНЕНО: теперь ищем app.ts
  const mainJsPath = `${config.srcFolder}/js/app.ts`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  // 1. Удаление физической папки
  let dirDeleted = false;
  possibleDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️ Папка удалена: ${dir}`);
      dirDeleted = true;
    }
  });

  if (!dirDeleted) {
    console.log(`⚠️ Папка для "${blockName}" не найдена.`);
  }

  // 2. Чистка TS (Обновленные регулярные выражения для алиасов)
  if (fs.existsSync(mainJsPath)) {
    let jsContent = fs.readFileSync(mainJsPath, "utf8");
    const camelName = toCamelCase(blockName);

    // Регулярка ищет импорты через @, @comp или ../ (без учета расширения .js/.ts)
    const jsImportReg = new RegExp(
      `import\\s+{[^}]*${camelName}[^}]*}\\s+from\\s+['"](@|@comp|\\.\\.\\/|\\.\\/).*?${blockName}\\/?${blockName}?['"];?\\n?`,
      "g",
    );
    const jsCallReg = new RegExp(`${camelName}\\(\\);?\\n?`, "g");

    jsContent = jsContent.replace(jsImportReg, "").replace(jsCallReg, "");
    fs.writeFileSync(mainJsPath, jsContent);
    console.log("✂️ Импорты и вызовы TS удалены.");
  }

  // 3. Чистка SCSS
  if (fs.existsSync(mainScssPath)) {
    let scssContent = fs.readFileSync(mainScssPath, "utf8");
    const scssImportReg = new RegExp(
      `@use\\s+['"].*?${blockName}['"](\\s+as\\s+\\w+)?\\s*;?\\n?`,
      "g",
    );

    scssContent = scssContent.replace(scssImportReg, "");
    fs.writeFileSync(mainScssPath, scssContent);
    console.log(`✂️ Стили удалены из style.${config.preprocessor}`);
  }

  // 4. Чистка HTML
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    const htmlIncludeReg = new RegExp(
      `@@include\\(['"].*?${blockName}/${blockName}.html['"]\\)\\n?`,
      "g",
    );

    htmlContent = htmlContent
      .replace(htmlIncludeReg, "")
      .replace(/\n\s*\n\n/g, "\n\n");
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log("✂️ Инклуд удален из HTML.");
  }

  console.log(`\n✅ "${blockName}" успешно удален из проекта.\n`);
  done();
};
