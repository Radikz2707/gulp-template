import fs from "fs";
import { config } from "./gulp.config.js";

const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export const module = (done) => {
  const name = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!name) {
    console.log("\n❌ Укажите имя модуля!\n");
    return done();
  }

  const camelName = toCamelCase(name);
  const dirPath = `${config.structure.modules}/${name}`;

  // ИЗМЕНЕНО: теперь ищем app.ts
  const appJsPath = `${config.srcFolder}/js/app.ts`;
  const styleScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Модуль "${name}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });

  // ИЗМЕНЕНО: Создаем .ts файл вместо .js
  fs.writeFileSync(
    `${dirPath}/${name}.ts`,
    `export const ${camelName} = (): void => {\n  console.log("Модуль ${name} (TS) инициализирован");\n};\n`,
  );

  fs.writeFileSync(`${dirPath}/${name}.scss`, `.${name} {\n  \n}\n`);

  // ИЗМЕНЕНО: Импорт в app.ts через алиас @ и без расширения .js
  if (fs.existsSync(appJsPath)) {
    fs.appendFileSync(
      appJsPath,
      `\nimport { ${camelName} } from "@/modules/${name}/${name}";\n${camelName}();\n`,
    );
  }

  if (fs.existsSync(styleScssPath)) {
    fs.appendFileSync(
      styleScssPath,
      `\n@use "../js/modules/${name}/${name}" as ${name};\n`,
    );
  }

  console.log(`\n✅ Модуль "${name}" (TS: ${camelName}) успешно создан!\n`);
  done();
};
