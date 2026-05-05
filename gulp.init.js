import fs from "fs";
import { config } from "./gulp.config.js";

export function createStructure(done) {
  const srcFolder = config.srcFolder || "src";
  const preprocessor = config.preprocessor || "scss";
  const struct = config.structure;

  // 1. КОНТЕНТ ФАЙЛОВ
  const zeroContent = `/* Обнуление (Zero Styles) */
* { padding: 0; margin: 0; border: 0; }
*, *:before, *:after { -webkit-box-sizing: border-box; box-sizing: border-box; }
:focus { outline: none; }
:focus-visible { outline: 2px solid #2196f3; outline-offset: 2px; }
html, body { height: 100%; width: 100%; min-width: 320px; font-size: 100%; line-height: 1; -webkit-font-smoothing: antialiased; }
html { scroll-behavior: smooth; scrollbar-gutter: stable; }
body { display: flex; flex-direction: column; }
nav, footer, header, main, aside, section { display: block; }
input, button, textarea, select { font-family: inherit; font-size: inherit; background-color: transparent; outline: none; }
button { cursor: pointer; color: inherit; -webkit-appearance: none; appearance: none; }
textarea { resize: vertical; }
a { text-decoration: none; color: inherit; }
ul li { list-style: none; }
img, svg, video, canvas { display: block; max-width: 100%; height: auto; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
table { border-collapse: collapse; border-spacing: 0; }
[hidden] { display: none !important; }`;

  const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Gulp Project</title>
  <link rel="stylesheet" href="css/app.min.css">
</head>
<body>

@@include('components/header/header.html')
@@include('components/main/main.html')
@@include('components/footer/footer.html')

<script src="js/app.min.js"></script>
</body>
</html>`;

  const styleSCSS = `@use "base/zero";
@use "../components/header/header";
@use "../components/main/main";
@use "../components/footer/footer";`;

  // ИЗМЕНЕНО: Содержимое для app.ts (используем алиас @comp и TS синтаксис)
  const appJsContent = `import { header } from "@comp/header/header";
import { main } from "@comp/main/main";
import { footer } from "@comp/footer/footer";

header();
main();
footer();

console.log("Gulp + TypeScript работает!");`;

  // 2. СПИСОК ПАПОК
  const folders = [
    srcFolder,
    `${srcFolder}/${preprocessor}/base`,
    struct.components,
    struct.modules,
    struct.plugins,
    `${srcFolder}/images/src`,
    `${srcFolder}/fonts/src`,
    `${struct.components}/header`,
    `${struct.components}/main`,
    `${struct.components}/footer`,
  ];

  folders.forEach((dir) => {
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 3. СПИСОК ФАЙЛОВ
  const files = [
    { path: `${srcFolder}/index.html`, content: indexHTML },
    // ИЗМЕНЕНО: Создаем app.ts
    { path: `${srcFolder}/js/app.ts`, content: appJsContent },
    {
      path: `${srcFolder}/${preprocessor}/style.${preprocessor}`,
      content: styleSCSS,
    },
    {
      path: `${srcFolder}/${preprocessor}/base/_zero.${preprocessor}`,
      content: zeroContent,
    },

    // Header (ИЗМЕНЕНО на .ts)
    {
      path: `${struct.components}/header/header.html`,
      content: `<header class="header">\n  <div class="container">\n    <h1>Header Component</h1>\n  </div>\n</header>`,
    },
    {
      path: `${struct.components}/header/header.${preprocessor}`,
      content: ".header { padding: 20px; background: #f4f4f4; }",
    },
    {
      path: `${struct.components}/header/header.ts`,
      content:
        "export const header = (): void => {\n  console.log('Header TS Loaded');\n};",
    },

    // Main (ИЗМЕНЕНО на .ts)
    {
      path: `${struct.components}/main/main.html`,
      content: `<main class="main">\n  <div class="container">\n    <h2>Main Content</h2>\n  </div>\n</main>`,
    },
    {
      path: `${struct.components}/main/main.${preprocessor}`,
      content: ".main { flex: 1 1 auto; padding: 40px 0; }",
    },
    {
      path: `${struct.components}/main/main.ts`,
      content:
        "export const main = (): void => {\n  console.log('Main TS Loaded');\n};",
    },

    // Footer (ИЗМЕНЕНО на .ts)
    {
      path: `${struct.components}/footer/footer.html`,
      content: `<footer class="footer">\n  <div class="container">\n    <p>Footer Component</p>\n  </div>\n</footer>`,
    },
    {
      path: `${struct.components}/footer/footer.${preprocessor}`,
      content: ".footer { padding: 20px; background: #333; color: #fff; }",
    },
    {
      path: `${struct.components}/footer/footer.ts`,
      content:
        "export const footer = (): void => {\n  console.log('Footer TS Loaded');\n};",
    },
  ];

  files.forEach((file) => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content);
    }
  });

  console.log("✅ Модульная структура на TypeScript (H-M-F) создана!");
  done();
}
