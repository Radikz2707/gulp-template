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

  // Используем пути из config.structure
  const dirPath = `${config.structure.components}/${blockName}`;
  const mainJsPath = `${config.srcFolder}/js/app.js`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Блок "${blockName}" уже существует!\n`);
    return done();
  }

  // 1. Создаем структуру папок
  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(`${dirPath}/img`, { recursive: true });

  // 2. Генерируем файлы
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

  // 3. Авто-подключение JS (используем алиас @ корректно)
  if (fs.existsSync(mainJsPath)) {
    // Поскольку alias @ указывает на src/js, а компоненты в src/components, выходим на уровень выше через ..
    const jsImport = `import { ${blockName} } from "@/../components/${blockName}/${blockName}.js";\n`;
    const jsCall = `${blockName}();\n`;
    fs.appendFileSync(mainJsPath, `\n${jsImport}${jsCall}`);
    console.log("🔗 Блок подключен к app.js через алиас @");
  }

  // 4. Авто-подключение SCSS
  if (fs.existsSync(mainScssPath)) {
    const scssImport = `@use "../components/${blockName}/${blockName}";\n`;
    fs.appendFileSync(mainScssPath, `\n${scssImport}`);
    console.log(`🎨 Стили подключены к style.${config.preprocessor}`);
  }

  // 5. Подключение HTML в index.html (умная вставка)
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    const includeString = `@@include("components/${blockName}/${blockName}.html")\n`;

    if (htmlContent.includes("<script")) {
      htmlContent = htmlContent.replace("<script", `${includeString}\n<script`);
    } else {
      htmlContent = htmlContent.replace("</body>", `${includeString}</body>`);
    }
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log("📄 Блок подключен в index.html");
  }

  console.log(`\n✅ Блок "${blockName}" успешно создан в ${dirPath}\n`);
  done();
};
