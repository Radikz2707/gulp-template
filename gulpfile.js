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

export const build = series(
  cleandist,
  parallel(lintCss, lintJs, series(fonts, fontsStyle)),
  parallel(styles, scripts, images, createWebp, sprite, favs, html),
  buildcopy,
  cssPurge,
  zipFiles,
  (done) => {
    console.log(
      "\x1b[32m%s\x1b[0m",
      ">>> 🚀 Project successfully assembled and archived! <<<",
    );
    done();
  },
);

export default series(
  help,
  parallel(styles, scripts, html, series(fonts, fontsStyle)),
  buildcopy,
  parallel(browsersync, startwatch),
);

export { create, remove, module, init, help, cleandist, lintJs, lintCss };
