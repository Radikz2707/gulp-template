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
  const appJsPath = `${config.srcFolder}/js/app.js`;
  const styleScssPath = `${config.srcFolder}/${config.preprocessor}/style.${config.preprocessor}`;

  if (fs.existsSync(dirPath)) {
    console.log(`\n⚠️ Модуль "${name}" уже существует!\n`);
    return done();
  }

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(
    `${dirPath}/${name}.js`,
    `export const ${camelName} = () => {\n  console.log("Модуль ${name} инициализирован");\n};\n`,
  );
  fs.writeFileSync(`${dirPath}/${name}.scss`, `.${name} {\n  \n}\n`);

  if (fs.existsSync(appJsPath)) {
    fs.appendFileSync(
      appJsPath,
      `\nimport { ${camelName} } from "@/modules/${name}/${name}.js";\n${camelName}();\n`,
    );
  }

  if (fs.existsSync(styleScssPath)) {
    fs.appendFileSync(
      styleScssPath,
      `\n@use "../js/modules/${name}/${name}" as ${name};\n`,
    );
  }

  console.log(`\n✅ Модуль "${name}" (JS: ${camelName}) создан!\n`);
  done();
};
