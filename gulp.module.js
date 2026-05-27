import fs from "fs";
import path from "path";
import { config } from "./gulp.config.js";

const toCamelCase = (str) =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const updateFileContent = (filePath, modifyCallback) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const updatedContent = modifyCallback(content);
  fs.writeFileSync(filePath, updatedContent.trimEnd() + "\n");
};

const updateAppTs = (filePath, name, camelName) => {
  updateFileContent(filePath, (content) => {
    const lines = content.split(/\r?\n/);

    // ИСПРАВЛЕНО: Вместо статического импорта формируем блок динамического (ленивого) импорта
    const lazyCallBlock = `
// Ленивая загрузка модуля ${name}
if (document.querySelector(".${name}")) {
  import(/* webpackChunkName: "${name}" */ "@modules/${name}/${name}").then(({ ${camelName} }) => {
    ${camelName}();
  });
}`;

    // Ищем маркер интерактивной логики
    const interactiveIndex = lines.findIndex((line) =>
      line.includes("Интерактивные модули логики"),
    );
    if (interactiveIndex !== -1) {
      lines.splice(interactiveIndex + 1, 0, lazyCallBlock);
    } else {
      lines.push(lazyCallBlock);
    }

    return lines.join("\n");
  });
  console.log("📝 Ленивый модуль успешно добавлен в блоки app.ts");
};

const updateStyleScss = (filePath, dirPath, name) => {
  updateFileContent(filePath, (content) => {
    const styleDir = path.dirname(filePath);
    let relativePath = path
      .relative(styleDir, path.join(dirPath, name))
      .replace(/\\/g, "/");
    if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;

    const lines = content.split(/\r?\n/);
    const newImport = `@use "${relativePath}";`;

    const modulesIndex = lines.findIndex((line) =>
      line.includes("ФУНКЦИОНАЛЬНЫЕ JS/TS МОДУЛИ"),
    );

    if (modulesIndex !== -1) {
      lines.splice(modulesIndex + 1, 0, newImport);
    } else {
      lines.push(newImport);
    }

    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  });
  console.log("🎨 Стили добавлены в блок модулей style.scss");
};

export const createModule = (done) => {
  const name = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!name) {
    console.log("\n❌ Укажите имя модуля! Пример: gulp module --my-slider\n");
    return done();
  }

  const camelName = toCamelCase(name);
  const dirPath = path.join(config.structure.modules, name);
  const appJsPath = config.paths.scripts.src;
  const styleScssPath = path.join(
    config.srcFolder,
    config.preprocessor,
    `style.${config.preprocessor}`,
  );

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Модуль "${name}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });

  const tsTemplate = `export const ${camelName} = (): void => {\n  console.log("Модуль ${name} (TS) инициализирован");\n};\n`;
  const scssTemplate = `.${name} {\n  \n}\n`;

  fs.writeFileSync(path.join(dirPath, `${name}.ts`), tsTemplate);
  fs.writeFileSync(
    path.join(dirPath, `${name}.${config.preprocessor}`),
    scssTemplate,
  );

  updateAppTs(appJsPath, name, camelName);
  updateStyleScss(styleScssPath, dirPath, name);

  console.log(
    `\n✅ Модуль "${name}" (TS: ${camelName}) успешно создан в ленивом режиме!\n`,
  );
  done();
};
