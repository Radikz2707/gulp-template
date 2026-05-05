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

  const mainJsPath = `${config.srcFolder}/js/app.ts`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Блок "${blockName}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(`${dirPath}/img`, { recursive: true });

  // 1. Определение семантического тега через switch
  let tag;
  switch (blockName) {
    case "header":
      tag = "header"; // Шапка сайта (логотип, меню)
      break;
    case "footer":
      tag = "footer"; // Подвал сайта (контакты, копирайт)
      break;
    case "main":
      tag = "main"; // Основное содержимое страницы (уникальное для каждой страницы)
      break;
    case "nav":
      tag = "nav"; // Навигационные блоки (основное меню, хлебные крошки)
      break;
    case "aside":
      tag = "aside"; // Побочный контент (сайдбар, боковая панель, реклама)
      break;
    case "article":
      tag = "article"; // Независимый контент (пост в блоге, новость, карточка товара)
      break;
    default:
      tag = "section"; // Тематический раздел страницы (преимущества, услуги, контакты)
  }

  // 2. Создаем HTML файл с правильной вложенностью
  fs.writeFileSync(
    `${dirPath}/${blockName}.html`,
    `<${tag} class="${blockName}">\n\t<div class="${blockName}__container container">\n\t\t\n\t</div>\n</${tag}>`,
  );

  // 3. Создаем стили (SCSS)
  fs.writeFileSync(
    `${dirPath}/${blockName}.${config.preprocessor}`,
    `.${blockName} {\n\t\n}`,
  );

  // 4. Создаем .ts файл
  fs.writeFileSync(
    `${dirPath}/${blockName}.ts`,
    `export const ${camelName} = () => {\n\tconsole.log("Блок ${blockName} (TS) инициализирован");\n};\n`,
  );

  // 5. Добавляем импорт в app.ts через алиас @comp и вызов функции
  if (fs.existsSync(mainJsPath)) {
    const jsImport = `import { ${camelName} } from "@comp/${blockName}/${blockName}";\n`;
    const jsCall = `${camelName}();\n`;
    fs.appendFileSync(mainJsPath, `\n${jsImport}${jsCall}`);
  }

  // 6. Умное добавление импорта стилей
  if (fs.existsSync(mainScssPath)) {
    let scssContent = fs.readFileSync(mainScssPath, "utf8");
    const scssImport = `@use "../components/${blockName}/${blockName}";`;
    const zeroImport = '@use "base/zero";';

    // Проверяем: есть ли после zero пустая строка?
    // Регулярка ищет zero + любое количество переносов и пробелов
    const zeroWithSpaceReg = /@use\s+["']base\/zero["'];\s*\n*/;

    if (scssContent.includes(zeroImport)) {
      // Вставляем zero, затем ДВА переноса (создаем ту самую пустую строку),
      // затем новый импорт
      scssContent = scssContent.replace(
        zeroWithSpaceReg,
        `${zeroImport}\n\n${scssImport}\n`,
      );
    } else {
      scssContent = scssImport + "\n" + scssContent;
    }

    // Схлопываем лишние дыры (больше 2-х переносов в 2)
    scssContent = scssContent.replace(/\n{3,}/g, "\n\n");

    fs.writeFileSync(mainScssPath, scssContent.trim() + "\n");
    console.log("🎨 Стили добавлены с учетом пустой строки после zero");
  }

  // 7. Добавляем инклюд в index.html перед скриптом
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
};;;;
