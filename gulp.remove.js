import fs from "fs";
import path from "path";
import { config } from "./gulp.config.js";

const PROTECTED_NAMES = [
  "js",
  "scss",
  "html",
  "img",
  "fonts",
  "components",
  "modules",
  "src",
  "dist",
];

const toCamelCase = (str) =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const updateFileContent = (filePath, modifyCallback) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  const updatedContent = modifyCallback(content);
  fs.writeFileSync(filePath, updatedContent.trimEnd() + "\n");
};

const cleanAppTs = (filePath, blockName, camelName) => {
  updateFileContent(filePath, (content) => {
    const lines = content.split(/\r?\n/);
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      const isTargetImport =
        trimmed.startsWith("import ") && trimmed.includes(`/${blockName}/`);
      const isTargetCall = trimmed === `${camelName}();`;
      return !isTargetImport && !isTargetCall;
    });
    return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n");
  });
  console.log("✂️ Импорты и вызовы TS удалены.");
};

const cleanStyleScss = (filePath, blockName) => {
  updateFileContent(filePath, (content) => {
    const lines = content.split(/\r?\n/);
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        !trimmed.includes(`/${blockName}/`) &&
        !trimmed.includes(`/${blockName}"`)
      );
    });
    return filteredLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/(@use\s+.*?;)\n*(?![^]*@use)/i, "$1\n\n");
  });
  console.log(`✂️ Стили удалены из style.${config.preprocessor}`);
};

const cleanIndexHtml = (filePath, blockName) => {
  updateFileContent(filePath, (content) => {
    const htmlIncludeReg = new RegExp(
      `@@include\\(['"].*?${blockName}/${blockName}.html['"]\\)\\n?`,
      "g",
    );
    return content.replace(htmlIncludeReg, "").replace(/\n{3,}/g, "\n\n");
  });
  console.log("✂️ Инклуд удален из HTML.");
};

export const remove = (done) => {
  const blockName = process.argv
    .find((arg) => arg.startsWith("--"))
    ?.replace("--", "");

  if (!blockName) {
    console.log("\n❌ Ошибка: Укажите имя! Пример: gulp remove --header\n");
    return done();
  }

  if (PROTECTED_NAMES.includes(blockName.toLowerCase())) {
    console.log(
      `\n❌ Ошибка: Удаление системной папки "${blockName}" запрещено!\n`,
    );
    return done();
  }

  const camelName = toCamelCase(blockName);
  const possibleDirs = [
    path.join(config.structure.components, blockName),
    path.join(config.structure.modules, blockName),
    path.join(config.structure.plugins, blockName),
  ];

  const mainJsPath = path.join(config.srcFolder, "js", "app.ts");
  const mainScssPath = path.join(
    config.srcFolder,
    config.preprocessor,
    `style.${config.preprocessor}`,
  );
  const indexHtmlPath = path.join(config.srcFolder, "index.html");

  let dirDeleted = false;
  possibleDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️ Папка удалена: ${dir}`);
      dirDeleted = true;
    }
  });

  if (!dirDeleted) console.log(`⚠️ Папка для "${blockName}" не найдена.`);

  cleanAppTs(mainJsPath, blockName, camelName);
  cleanStyleScss(mainScssPath, blockName);
  cleanIndexHtml(indexHtmlPath, blockName);

  console.log(`\n✅ "${blockName}" успешно удален из проекта.\n`);
  done();
};
