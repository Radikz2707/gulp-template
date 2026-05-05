import fs from "fs";
import { config } from "./gulp.config.js";

// Функция для превращения блока-имени в блокИмя
const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export const create = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log("\n❌ Ошибка: Укажите имя блока!\n");
    return done();
  }

  const camelName = toCamelCase(blockName);
  const dirPath = `${config.structure.components}/${blockName}`;

  // ИЗМЕНЕНО: Теперь ищем app.ts
  const mainJsPath = `${config.srcFolder}/js/app.ts`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Блок "${blockName}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(`${dirPath}/img`, { recursive: true });

  // 1. Создаем HTML
  fs.writeFileSync(
    `${dirPath}/${blockName}.html`,
    `<section class="${blockName}">\n\t<div class="${blockName}__container container">\n\t\t\n\t</div>\n</section>`,
  );

  // 2. Создаем стили (SCSS)
  fs.writeFileSync(
    `${dirPath}/${blockName}.${config.preprocessor}`,
    `.${blockName} {\n\t\n}`,
  );

  // 3. ИЗМЕНЕНО: Создаем .ts файл вместо .js
  fs.writeFileSync(
    `${dirPath}/${blockName}.ts`,
    `export const ${camelName} = () => {\n\tconsole.log("Блок ${blockName} (TS) инициализирован");\n};\n`,
  );

  // 4. ИЗМЕНЕНО: Добавляем импорт в app.ts через алиас @comp
  if (fs.existsSync(mainJsPath)) {
    const jsImport = `import { ${camelName} } from "@comp/${blockName}/${blockName}";\n`;
    const jsCall = `${camelName}();\n`;
    fs.appendFileSync(mainJsPath, `\n${jsImport}${jsCall}`);
  }

  // 5. Добавляем импорт в основной файл стилей
  if (fs.existsSync(mainScssPath)) {
    fs.appendFileSync(
      mainScssPath,
      `\n@use "../components/${blockName}/${blockName}";\n`,
    );
  }

  // 6. Добавляем инклюд в index.html
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    const includeString = `@@include("components/${blockName}/${blockName}.html")\n`;
    const scriptTag = '<script src="js/app.min.js"></script>';

    if (htmlContent.includes(scriptTag)) {
      htmlContent = htmlContent.replace(
        scriptTag,
        `${includeString}${scriptTag}`,
      );
    } else {
      htmlContent = htmlContent.replace("</body>", `${includeString}</body>`);
    }
    fs.writeFileSync(indexHtmlPath, htmlContent);
  }

  console.log(`\n✅ Блок "${blockName}" (TS: ${camelName}) успешно создан!\n`);
  done();
};
