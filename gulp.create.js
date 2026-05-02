import fs from "fs";
import { config } from "./gulp.config.js";

export const create = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log(
      "\n❌ Ошибка: Укажите имя блока! Пример: gulp create --header\n",
    );
    return done();
  }

  const dirPath = `${config.srcFolder}/components/${blockName}`;
  const mainJsPath = `${config.srcFolder}/js/app.js`;
  // ИСПРАВЛЕНО: Теперь ищем style.scss, а не main.scss
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Блок "${blockName}" уже существует!\n`);
    return done();
  }

  // 1. Создаем структуру папок компонента
  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(`${dirPath}/img`, { recursive: true });

  // 2. Генерируем файлы (HTML, SCSS, JS)
  fs.writeFileSync(
    `${dirPath}/${blockName}.html`,
    `<section class="${blockName}">\n\t<div class="${blockName}__container container">\n\t\t\n\t</div>\n</section>`,
  );

  fs.writeFileSync(
    `${dirPath}/${blockName}.${config.preprocessor}`,
    `.${blockName} {\n\t\n}`,
  );

  fs.writeFileSync(
    `${dirPath}/${blockName}.js`,
    `export const ${blockName} = () => {\n\tconsole.log("Блок ${blockName} инициализирован");\n};\n`,
  );

  // 3. Авто-подключение JS (через алиас @)
  if (fs.existsSync(mainJsPath)) {
    const jsImport = `import { ${blockName} } from "@/../components/${blockName}/${blockName}.js";\n`;
    const jsCall = `${blockName}();\n`;
    fs.appendFileSync(mainJsPath, `\n${jsImport}${jsCall}`);
    console.log("🔗 Блок подключен к app.js через алиас @");
  }

  // 4. Авто-подключение SCSS (к новому файлу style.scss)
  if (fs.existsSync(mainScssPath)) {
    const scssImport = `@use "../components/${blockName}/${blockName}";\n`;
    fs.appendFileSync(mainScssPath, `\n${scssImport}`);
    console.log(`🎨 Стили подключены к style.${config.preprocessor}`);
  }

  // 5. Подключение HTML в index.html (перед скриптами)
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    const includeString = `@@include("components/${blockName}/${blockName}.html")\n`;

    if (htmlContent.includes("<script")) {
      htmlContent = htmlContent.replace("<script", `${includeString}\n<script`);
    } else if (htmlContent.includes("</body>")) {
      htmlContent = htmlContent.replace("</body>", `${includeString}</body>`);
    } else {
      htmlContent = htmlContent.trimEnd() + `\n${includeString}`;
    }
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log("📄 Блок подключен в index.html");
  }

  console.log(`\n✅ Блок "${blockName}" успешно создан в ${dirPath}\n`);
  done();
};
