import fs from "fs";
import { config } from "./gulp.config.js";

export const module = (done) => {
  const name = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!name) {
    console.log("\n❌ Укажите имя модуля! Пример: gulp module --slider\n");
    return done();
  }

  const dirPath = `${config.srcFolder}/js/modules/${name}`;
  const appJsPath = `${config.srcFolder}/js/app.js`;
  const styleScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Модуль "${name}" уже существует!\n`);
    return done();
  }

  // 1. Создаем папку модуля
  fs.mkdirSync(dirPath, { recursive: true });

  // 2. Создаем JS файл
  const jsContent = `export const ${name} = () => {\n  console.log("Модуль ${name} инициализирован");\n};\n`;
  fs.writeFileSync(`${dirPath}/${name}.js`, jsContent);

  // 3. Создаем SCSS файл
  fs.writeFileSync(`${dirPath}/${name}.scss`, `.${name} {\n  \n}\n`);

  // 4. Подключаем в app.js
  if (fs.existsSync(appJsPath)) {
    const importStr = `import { ${name} } from "@/modules/${name}/${name}.js";\n`;
    const callStr = `${name}();\n`;
    fs.appendFileSync(appJsPath, `\n${importStr}${callStr}`);
    console.log(`🔗 Модуль "${name}" подключен к app.js`);
  }

  // 5. Подключаем в style.scss
  if (fs.existsSync(styleScssPath)) {
    const scssImport = `@use "../js/modules/${name}/${name}" as ${name};\n`;
    fs.appendFileSync(styleScssPath, `\n${scssImport}`);
    console.log(`🎨 Стили модуля подключены к style.scss`);
  }

  console.log(`\n✅ Модуль "${name}" успешно создан в ${dirPath}\n`);
  done();
};
