import { config } from "../gulp.config.js";
import gulp from "gulp";
import browserSync from "browser-sync";
import notify from "gulp-notify";

import { html } from "./html.js";
import { styles } from "./styles.js";
import { scripts } from "./scripts.js";
import { imagesDev, createWebp, sprite } from "./images.js";
import { fonts, fontsStyle } from "./fonts.js";
import { lintCss, lintJs } from "./lint.js";

const { watch, series } = gulp;
export const bs = browserSync.create();

export const isProd = process.argv.includes("build");

export const onError = function (err) {
  notify.onError({
    title: `Gulp Error in ${err.plugin || "Plugin"}`,
    message: "Error: <%= error.message %>",
    sound: isProd,
  })(err);

  // ИСПРАВЛЕНО: Webpack сам управляет своим жизненным циклом при ошибках.
  // Если принудительно вызвать emit('end') на webpack-stream, режим watch упадет навсегда.
  if (err.plugin !== "webpack-stream") {
    this.emit("end");
  }
};

export function browsersync() {
  bs.init({
    server: { baseDir: config.buildFolder },
    notify: false,
    online: true,
  });
}

export function startwatch() {
  // 1. СЛЕЖЕНИЕ ЗА СТИЛЯМИ
  // ИСПРАВЛЕНО: Чтобы избежать бесконечного цикла, сначала запускаем атомарный линтинг
  // изменившегося файла, и только затем — общую сборку styles.
  const styleWatcher = watch(
    [`${config.srcFolder}/**/*.${config.preprocessor}`],
    { delay: 300 },
  );

  styleWatcher.on("change", (filePath) => {
    // Сначала исправляем файл линтером, а по завершении — компилируем CSS
    lintCss(() => {
      series(styles)();
    }, filePath);
  });

  // 2. СЛЕЖЕНИЕ ЗА СКРИПТАМИ
  // ИСПРАВЛЕНО: Аналогично стилям — защищаем Webpack от дерганья файлов во время автофикса линтера
  const scriptWatcher = watch([`${config.srcFolder}/**/*.{js,ts}`], {
    delay: 300,
  });

  scriptWatcher.on("change", (filePath) => {
    lintJs(() => {
      // Так как в таске scripts у нас встроен watch самого вебпака (в dev режиме),
      // нам не нужно вызывать series(scripts)() вручную при каждом сохранении!
      // Webpack сам увидит изменения. Мы просто линтим файл для вывода ошибок в консоль.
      if (isProd) series(scripts)();
    }, filePath);
  });

  // 3. ОСТАЛЬНЫЕ НАБЛЮДАТЕЛИ
  watch(`${config.srcFolder}/**/*.html`, html);
  watch(config.paths.images.svg, sprite);
  watch(`${config.srcFolder}/fonts/src/**/*`, series(fonts, fontsStyle));

  // Оптимизировано: игнорируем возможные системные подпапки сборщика внутри components, если они есть
  watch(
    [
      config.paths.images.src,
      `${config.srcFolder}/components/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    { delay: 500 }, // Чуть увеличиваем задержку для тяжелых картинок
    series(imagesDev, createWebp),
  );
}
