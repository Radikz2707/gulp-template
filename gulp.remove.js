import fs from "fs";
import { config } from "./gulp.config.js";

export const remove = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log(
      "\n❌ Ошибка: Укажите имя блока! Пример: gulp remove --header\n"
    );
    return done();
  }

  const dirPath = `${config.srcFolder}/components/${blockName}`;
  const mainJsPath = `${config.srcFolder}/js/app.js`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/main.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  // 1. Удаление папки компонента
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`\n🗑️ Папка компонента ${blockName} удалена.`);
  }

  // 2. Чистка JS (вырезаем импорт и вызов)
  if (fs.existsSync(mainJsPath)) {
    let jsContent = fs.readFileSync(mainJsPath, "utf8");
    const jsImportReg = new RegExp(
      `import { ${blockName} } from "../components/${blockName}/${blockName}.js";\\n?`,
      "g"
    );
    const jsCallReg = new RegExp(`${blockName}\\(\\);\\n?`, "g");

    jsContent = jsContent.replace(jsImportReg, "").replace(jsCallReg, "");
    fs.writeFileSync(mainJsPath, jsContent);
    console.log("✂️ Импорты удалены из app.js");
  }

  // 3. Чистка SCSS (вырезаем @use)
  if (fs.existsSync(mainScssPath)) {
    let scssContent = fs.readFileSync(mainScssPath, "utf8");
    const scssImportReg = new RegExp(
      `@use "../components/${blockName}/${blockName}";\\n?`,
      "g"
    );

    scssContent = scssContent.replace(scssImportReg, "");
    fs.writeFileSync(mainScssPath, scssContent);
    console.log(`✂️ Стили удалены из main.${config.preprocessor}`);
  }

  // 4. Чистка HTML (вырезаем @@include)
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    // Регулярка ищет инклуд и может захватить лишний перенос строки для чистоты
    const htmlIncludeReg = new RegExp(
      `@@include\\("components/${blockName}/${blockName}.html"\\)\\n?`,
      "g"
    );

    htmlContent = htmlContent.replace(htmlIncludeReg, "");

    // Убираем возможные тройные переносы строк, если они образовались
    htmlContent = htmlContent.replace(/\n\s*\n\n/g, "\n\n");

    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log("✂️ Инклуд удален из index.html");
  }

  console.log(`\n✅ Блок "${blockName}" полностью удален.\n`);
  done();
};
