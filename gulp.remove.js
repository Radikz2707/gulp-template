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

export const remove = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log("\n❌ Ошибка: Укажите имя! Пример: gulp remove --header\n");
    return done();
  }

  // ЗАЩИТА: Проверка должна быть здесь, когда blockName уже известен
  if (protectedNames.includes(blockName.toLowerCase())) {
    console.log(
      `\n❌ Ошибка: Удаление системной папки "${blockName}" запрещено!\n`,
    );
    return done();
  }

  // Список всех мест, где может лежать папка
    const possibleDirs = [
      `${config.structure.components}/${blockName}`,
      `${config.structure.modules}/${blockName}`,
      `${config.structure.plugins}/${blockName}`,
    ];

  const mainJsPath = `${config.srcFolder}/js/app.js`;
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
    console.log(
      `⚠️ Папка для "${blockName}" не найдена в компонентах или модулях.`,
    );
  }

  // 2. Чистка JS
  if (fs.existsSync(mainJsPath)) {
    let jsContent = fs.readFileSync(mainJsPath, "utf8");
    const jsImportReg = new RegExp(
      `import\\s+{[^}]*${blockName}[^}]*}\\s+from\\s+['"].*?${blockName}/${blockName}\\.js['"];?\\n?`,
      "g",
    );
    const jsCallReg = new RegExp(`${blockName}\\(\\);?\\n?`, "g");

    jsContent = jsContent.replace(jsImportReg, "").replace(jsCallReg, "");
    fs.writeFileSync(mainJsPath, jsContent);
    console.log("✂️ Импорты JS удалены.");
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

  console.log(`\n✅ "${blockName}" полностью вырезан из проекта.\n`);
  done();
};
