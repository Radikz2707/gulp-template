import { config } from "./gulp.config.js";
import gulp from "gulp";

// Импорты инфраструктуры сервера
import { browsersync, startwatch } from "./gulp/server.js";
import { lintCss, lintJs } from "./gulp/lint.js";

// Импорты изолированных тасков сборщика
import { html } from "./gulp/html.js";
import { styles, cssPurge } from "./gulp/styles.js";
import { scripts } from "./gulp/scripts.js";
import { images, imagesDev, createWebp, sprite, favs } from "./gulp/images.js";
import { fonts, fontsStyle } from "./gulp/fonts.js";
import { cleandist, buildcopy, zipFiles } from "./gulp/utils.js";

// Импорты утилит конструктора компонентов
import { create } from "./gulp.create.js";
import { createModule as module } from "./gulp.module.js";
import { remove } from "./gulp.remove.js";
import { createStructure as init } from "./gulp.init.js";
import { help } from "./gulp.help.js";

const { parallel, series } = gulp;

// ПОЛНЫЙ ЦИКЛ СБОРКИ ДЛЯ ПРОДАКШЕНА
export const build = gulp.series(
  cleandist,
  gulp.parallel(lintCss, lintJs, fonts, fontsStyle),
  gulp.parallel(styles, scripts, images, createWebp, sprite, favs),
  html, // 1. Сначала полностью собираем HTML (с вашими новыми <picture>)
  buildcopy, // 2. Копируем остальные файлы
  cssPurge, // 3. Чистим CSS на основе готового HTML (строго ПОСЛЕ html)
  zipFiles, // 4. Архивируем результат (строго ПОСЛЕ очистки стилей)
  (done) => {
    console.log(">>> 🚀 Project successfully assembled and archived! <<<");
    done();
  },
);

// СТАРТОВЫЙ ТАСК ДЛЯ РАЗРАБОТКИ
export default series(
  help,
  series(fonts, fontsStyle),
  parallel(styles, scripts, html, imagesDev, createWebp, sprite),
  buildcopy,
  parallel(browsersync, startwatch),
);

export { create, remove, module, init, help, cleandist, lintJs, lintCss };
