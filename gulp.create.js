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
  const mainJsPath = `${config.srcFolder}/js/app.js`;
  const mainScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;
  const indexHtmlPath = `${config.srcFolder}/index.html`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Блок "${blockName}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(`${dirPath}/img`, { recursive: true });

  // Файлы
  fs.writeFileSync(
    `${dirPath}/${blockName}.html`,
    `<section class="${blockName}">\n\t<div class="${blockName}__container container">\n\t\t\n\t</div>\n</section>`,
  );
  fs.writeFileSync(
    `${dirPath}/${blockName}.${config.preprocessor}`,
    `.${blockName} {\n\t\n}`,
  );

  // JS с CamelCase именем функции
  fs.writeFileSync(
    `${dirPath}/${blockName}.js`,
    `export const ${camelName} = () => {\n\tconsole.log("Блок ${blockName} инициализирован");\n};\n`,
  );

  if (fs.existsSync(mainJsPath)) {
    const jsImport = `import { ${camelName} } from "@/../components/${blockName}/${blockName}.js";\n`;
    const jsCall = `${camelName}();\n`;
    fs.appendFileSync(mainJsPath, `\n${jsImport}${jsCall}`);
  }

  if (fs.existsSync(mainScssPath)) {
    fs.appendFileSync(
      mainScssPath,
      `\n@use "../components/${blockName}/${blockName}";\n`,
    );
  }

  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, "utf8");
    const includeString = `@@include("components/${blockName}/${blockName}.html")\n`;
    htmlContent = htmlContent.replace("</body>", `${includeString}</body>`);
    fs.writeFileSync(indexHtmlPath, htmlContent);
  }

  console.log(`\n✅ Блок "${blockName}" (JS: ${camelName}) создан!\n`);
  done();
};
