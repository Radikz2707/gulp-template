import fs from "fs";
import { config } from "./gulp.config.js";

export function createStructure(done) {
  // Используем значения из конфига
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
body { display: flex; flex-direction: column; } /* Чтобы прижать футер */
nav, footer, header, main, aside, section { display: block; }
input, button, textarea, select { font-family: inherit; font-size: inherit; background-color: transparent; outline: none; }
button { cursor: pointer; color: inherit; -webkit-appearance: none; appearance: none; }
textarea { resize: vertical; }
a { text-decoration: none; color: inherit; }
ul li { list-style: none; }
img, svg, video, canvas { display: block; max-width: 100%; height: auto; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
table { border-collapse: collapse; border-spacing: 0; }
[hidden] { display: none !important; }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}`;

  const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modular Project</title>
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

  const appJsContent = `import { header } from "@/../components/header/header.js";
import { main } from "@/../components/main/main.js";
import { footer } from "@/../components/footer/footer.js";

header();
main();
footer();

console.log("Gulp работает, структура (H-M-F) готова!");`;

  // 2. СПИСОК ПАПОК ДЛЯ СОЗДАНИЯ (на основе конфига)
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

  // 3. СПИСОК ФАЙЛОВ ДЛЯ СОЗДАНИЯ
  const files = [
    { path: `${srcFolder}/index.html`, content: indexHTML },
    { path: `${srcFolder}/js/app.js`, content: appJsContent },
    {
      path: `${srcFolder}/${preprocessor}/style.${preprocessor}`,
      content: styleSCSS,
    },
    {
      path: `${srcFolder}/${preprocessor}/base/_zero.${preprocessor}`,
      content: zeroContent,
    },

    // Header
    {
      path: `${struct.components}/header/header.html`,
      content: `<header class="header">\n  <div class="container">\n    <h1>Header Component</h1>\n  </div>\n</header>`,
    },
    {
      path: `${struct.components}/header/header.${preprocessor}`,
      content: ".header { padding: 20px; background: #f4f4f4; }",
    },
    {
      path: `${struct.components}/header/header.js`,
      content:
        "export const header = () => {\n  console.log('Header JS Loaded');\n};",
    },

    // Main
    {
      path: `${struct.components}/main/main.html`,
      content: `<main class="main">\n  <div class="container">\n    <h2>Главный контент собран из модулей</h2>\n  </div>\n</main>`,
    },
    {
      path: `${struct.components}/main/main.${preprocessor}`,
      content: ".main { flex: 1 1 auto; padding: 40px 0; }",
    },
    {
      path: `${struct.components}/main/main.js`,
      content:
        "export const main = () => {\n  console.log('Main JS Loaded');\n};",
    },

    // Footer
    {
      path: `${struct.components}/footer/footer.html`,
      content: `<footer class="footer">\n  <div class="container">\n    <p>Footer Component</p>\n  </div>\n</footer>`,
    },
    {
      path: `${struct.components}/footer/footer.${preprocessor}`,
      content: ".footer { padding: 20px; background: #333; color: #fff; }",
    },
    {
      path: `${struct.components}/footer/footer.js`,
      content:
        "export const footer = () => {\n  console.log('Footer JS Loaded');\n};",
    },
  ];

  files.forEach((file) => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content);
    }
  });

  console.log("✅ Инициализация модульной структуры (H-M-F) завершена!");
  done();
}
