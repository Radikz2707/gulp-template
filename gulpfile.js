// ==========================================
// КОНФИГУРАЦИЯ И ИНИЦИАЛИЗАЦИЯ ПРОЕКТА
// ==========================================
import { config } from "./gulp.config.js";
import { createStructure } from "./gulp.init.js";
import { help } from "./gulp.help.js";
import { create } from "./gulp.create.js";
import { remove } from "./gulp.remove.js";
import { createModule as module } from "./gulp.module.js";

// ==========================================
// ЯДРО GULP И СИСТЕМНЫЕ МОДУЛИ NODE.JS
// ==========================================
import gulp from "gulp";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// ==========================================
// СЕРВЕР И УВЕДОМЛЕНИЯ
// ==========================================
import browserSync from "browser-sync";
import notify from "gulp-notify";
import plumber from "gulp-plumber";

// ==========================================
// РАБОТА С HTML
// ==========================================
import fileInclude from "gulp-file-include";
import webphtml from "gulp-webp-html-nosvg";
import htmlhint from "gulp-htmlhint";
import htmlBeautify from "gulp-html-beautify";

// ==========================================
// СТИЛИ (CSS/SCSS) И POSTCSS
// ==========================================
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "autoprefixer";
import cleancss from "gulp-clean-css";
import gcmq from "gulp-group-css-media-queries";
import postcss from "gulp-postcss";
import cssDeclarationSorter from "css-declaration-sorter";
import webpInCss from "webp-in-css/plugin.js";
import purgecss from "gulp-purgecss";
import sourcemaps from "gulp-sourcemaps";

// ==========================================
// СКРИПТЫ (JS/WEBPACK)
// ==========================================
import webpackStream from "webpack-stream";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";

// ==========================================
// ГРАФИКА И ИКОНКИ
// ==========================================
import imagemin from "gulp-imagemin";
import mozjpeg from "imagemin-mozjpeg";
import optipng from "imagemin-optipng";
import svgo from "imagemin-svgo";
import webp from "gulp-webp";
import svgSprite from "gulp-svg-sprite";
import cheerio from "gulp-cheerio";
import favicons from "gulp-favicons";
import flatten from "gulp-flatten";

// ==========================================
// ШРИФТЫ
// ==========================================
import fonter from "gulp-fonter";
import ttf2woff2 from "gulp-ttf2woff2";

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ
// ==========================================
import changed from "gulp-changed";
import newer from "gulp-newer";
import rename from "gulp-rename";
import zip from "gulp-zip";
import replace from "gulp-replace";
import filter from "gulp-filter";

// ==========================================
// ОБЪЯВЛЕНИЕ КОНСТАНТ
// ==========================================
const { paths, preprocessor, srcFolder, buildFolder } = config;
const { src, dest, parallel, series, watch } = gulp;
const sass = gulpSass(dartSass);
const bs = browserSync.create();

// Определение режима сборки (Production / Development)
const isProd = process.argv.includes("build");

// ==========================================
// ПЕРЕХВАТ ОШИБОК И СИСТЕМНЫЕ УВЕДОМЛЕНИЯ
// ==========================================
const onError = function (err) {
  notify.onError({
    title: `Gulp Error in ${err.plugin}`,
    message: "Error: <%= error.message %>",
    
    // Звуковой сигнал сработает только при финальной сборке
    sound: isProd,
  })(err);
  
  // Предотвращает падение и остановку тасков Gulp при ошибках в коде
  this.emit("end");
};

// Наш собственный, независимый от npm плагин ветвления для webphtml
const conditionalWebp = () => {
  return new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      if (isProd) {
        // Если это продакшн сборка — инициализируем и запускаем webphtml вручную
        const stream = webphtml();
        stream.on("data", (updatedFile) => callback(null, updatedFile));
        stream.on("error", (err) => callback(err));
        stream.write(file);
        stream.end();
      } else {
        // В режиме разработки (dev) просто передаем файл дальше, полностью игнорируя код webphtml
        callback(null, file);
      }
    }
  });
};

// --- ТАСКИ ---

// ==========================================
// ЗАПУСК ЛОКАЛЬНОГО СЕРВЕРА (BROWSER SYNC)
// ==========================================
export function browsersync() {
  bs.init({
    server: { 
      baseDir: config.buildFolder 
    },
    notify: false,
    online: true,
  });
}


// ==========================================
// ПОЛНАЯ ОЧИСТКА ДИРЕКТОРИИ СБОРКИ (DIST)
// ==========================================
export function cleandist(done) {
  if (fs.existsSync(config.buildFolder)) {
    fs.rmSync(config.buildFolder, { recursive: true, force: true });
  }
  done();
}

// ==========================================
// ОЧИСТКА ГРАФИКИ С СОХРАНЕНИЕМ ФАВИКОНОК
// ==========================================
export function cleanimg(done) {
  if (fs.existsSync(config.paths.images.dest)) {
    const files = fs.readdirSync(config.paths.images.dest);
    
    files.forEach((file) => {
      // Удаляем всё, кроме системной папки с иконками favicons
      if (file !== "favicons") {
        const curPath = path.join(config.paths.images.dest, file);
        fs.rmSync(curPath, { recursive: true, force: true });
      }
    });
    
    console.log("🧹 Графика очищена, папка favicons сохранена.");
  }
  done();
}

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СТИЛЕЙ (STYLELINT)
// ==========================================
export const lintCss = (done, filePath = null) => {
  // Если filePath передан, проверяем только его, иначе — сканируем все стили проекта
  const targetPath = filePath ? filePath : `${config.srcFolder}/**/*.${config.preprocessor}`;

  exec(
    `npx stylelint "${targetPath}" --fix --allow-empty-input --custom-formatter=stylelint-formatter-pretty`,
    (_err, stdout) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      done();
    },
  );
};

// ==========================================
// ПРОВЕРКА И АВТОИСПРАВЛЕНИЕ СКРИПТОВ (ESLINT)
// ==========================================
export const lintJs = (done, filePath = null) => {
  // Добавлена поддержка точечной проверки файла для ускорения воркеров в startwatch
  const targetPath = filePath ? filePath : `${config.srcFolder}/js/**/*.{js,ts}`;

  exec(
    `cross-env ESLINT_USE_FLAT_CONFIG=false npx eslint "${targetPath}" --fix`,
    (_err, stdout) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      done();
    },
  );
};

// ==========================================
// КОМПИЛЯЦИЯ И ОПТИМИЗАЦИЯ СТИЛЕЙ
// ==========================================
export function styles() {
  const pipeline = [
    src(config.paths.styles.src),
    plumber({ errorHandler: onError }),
  ];

  // Добавляем инициализацию карт кода только если это НЕ продакшн
  if (!isProd) {
    pipeline.push(sourcemaps.init());
  }

  // Основная цепочка компиляции стилей
  pipeline.push(
    sass({
      silenceDeprecations: ["import"],
    }).on("error", sass.logError),
    gcmq(),
    postcss([
      webpInCss,
      autoprefixer({
        overrideBrowserslist: config.settings.autoprefixer,
        grid: false,
      }),
    ]),
    cleancss({
      level: { 2: { mergeMedia: true } },
    }),
    rename({
      basename: path
        .basename(config.paths.styles.output, ".css")
        .replace(".min", ""),
      suffix: ".min",
    }),
  );

  // Добавляем запись карт кода только если это НЕ продакшн
  if (!isProd) {
    pipeline.push(
      sourcemaps.write(".", {
        includeContent: false,
        sourceRoot: "../../src/scss",
      }),
    );
  }

  // Финальная выгрузка и обновление браузера
  pipeline.push(dest(config.paths.styles.dest), bs.stream());

  // Собираем весь конвейер динамически через reduce
  return pipeline.reduce((stream, plugin) => stream.pipe(plugin));
}

// ==========================================
// СБОРКА, ВАЛИДАЦИЯ И ФОРМАТИРОВАНИЕ HTML
// ==========================================
export function html() {
  const pipeline = [
    src([
      `${config.srcFolder}/**/*.html`,
      `!${config.srcFolder}/components/**/*.html`,
      `!${config.srcFolder}/parts/**/*.html`,
    ]),
    plumber({ errorHandler: onError }),
    fileInclude({
      prefix: "@@",
      basepath: "@file",
      indent: false,
    }),
    htmlhint({
      "doctype-first": false,
      "tagname-lowercase": true,
      "attr-lowercase": true,
      "attr-value-double-quotes": true,
      "attr-no-duplication": true,
      "id-unique": true,
      "src-not-empty": true,
      "alt-require": true,
      "img-alt-require": true,
      "tag-pair": true,
      "spec-char-escape": true,
    }),
    htmlhint.reporter("htmlhint-stylish", { failReporter: false }),
  ];

  // Подключаем автогенерацию WebP в разметку строго на продакшене
  if (isProd) {
    pipeline.push(webphtml());
  }

  // Завершающее форматирование и выгрузка
  pipeline.push(
    htmlBeautify({
      indent_size: 2,
      indent_char: " ",
      eol: "\n",
      preserve_newlines: true,
      max_preserve_newlines: 1,
      indent_inner_html: true,
      extra_liners: [],
    }),
    dest(config.buildFolder),
  );

  return pipeline
    .reduce((stream, plugin) => stream.pipe(plugin))
    .on("end", bs.reload);
}

// ==========================================
// СБОРКА И ОПТИМИЗАЦИЯ СКРИПТОВ (WEBPACK)
// ==========================================
export function scripts(done) {
  let isFirstBuild = true;

  // Формируем правила для лоадеров в зависимости от режима сборки
  const jsRules = {
    test: /\.m?js$/,
    exclude: /node_modules/,
  };

  // Применяем Babel только на продакшене, в dev-режиме просто пропускаем файлы через конвейер
  if (isProd) {
    jsRules.use = {
      loader: "babel-loader",
      options: { presets: ["@babel/preset-env"] },
    };
  }

  return src(config.paths.scripts.src)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      webpackStream(
        {
          mode: isProd ? "production" : "development",
          watch: !isProd,
          
          // Кэширование на диск: сокращает повторные запуски до долей секунды
          cache: isProd ? false : { type: "filesystem" },
          performance: { hints: false },
          
          // Динамические пути на основе конфигурации проекта
          entry: { app: `./${config.paths.scripts.src}` },
          output: { filename: config.paths.scripts.output },
          
          // Динамические алиасы из глобального config
          resolve: {
            alias: {
              "@": path.resolve(config.aliasPath),
              "@comp": path.resolve(config.structure.components),
              "@modules": path.resolve(config.structure.modules),
            },
            extensions: [".ts", ".js", ".json"],
          },
          
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                  {
                    loader: "ts-loader",
                    options: {
                      // Ускорение dev-режима за счет отключения проверки типов на лету
                      transpileOnly: !isProd,
                    },
                  },
                ],
              },
              // Применяем сформированное выше правило для JS-файлов
              ...(isProd ? [jsRules] : []),
            ],
          },
          
          optimization: {
            minimize: isProd,
            minimizer: [new TerserPlugin({ extractComments: false })],
          },
          
          // Оптимальные карты кода для каждого режима
          devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
        },
        webpack,
        (err, stats) => {
          if (err) return;
          if (!isProd) {
            if (isFirstBuild) {
              isFirstBuild = false;
              done();
            }
            bs.reload();
          }
        },
      ),
    )
    .pipe(dest(config.paths.scripts.dest))
    .on("end", () => {
      if (isProd) done();
    });
}

// ==========================================
// ОБРАБОТКА ИЗОБРАЖЕНИЙ (ПРОДАКШН)
// ==========================================
export function images() {
  return (
    src(
      [
        paths.images.src,
        `!${srcFolder}/images/src/favicon.png`, // Исключаем исходник фавиконки
        `${srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
      ],
      { encoding: false },
    )
      .pipe(plumber({ errorHandler: onError }))

      // Умное сопоставление путей с учетом flatten
      .pipe(
        newer({
          dest: paths.images.dest,
          map: (relative) => path.basename(relative),
        }),
      )

      // Оптимизация изображений по настройкам из config
      .pipe(
        imagemin([
          mozjpeg({
            quality: config.settings.imagemin.jpeg,
            progressive: true,
          }),
          optipng({ optimizationLevel: config.settings.imagemin.png }),
          svgo({ plugins: [{ name: "preset-default" }] }),
        ]),
      )

      // Сплющивание структуры (убирает вложенность /components/block/img/)
      .pipe(flatten())
      .pipe(dest(paths.images.dest))
      .on("end", bs.reload)
  );
}

// ==========================================
// БЫСТРЫЙ ПЕРЕНОС КАРТИНОК (РАЗРАБОТКА)
// ==========================================
export function imagesDev() {
  return (
    src(
      [
        paths.images.src,
        `!${srcFolder}/images/src/favicon.png`, // Исключаем исходник фавиконки
        `${srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
      ],
      { encoding: false },
    )
      .pipe(plumber({ errorHandler: onError }))

      // Заменяем сломанный changed на правильно настроенный newer
      .pipe(
        newer({
          dest: paths.images.dest,
          map: (relative) => path.basename(relative),
        }),
      )
      .pipe(flatten())
      .pipe(dest(paths.images.dest))
      .on("end", bs.reload)
  );
}

// ==========================================
// ГЕНЕРАЦИЯ ФОРМАТА WEBP (РАЗРАБОТКА И ПРОД)
// ==========================================
export function createWebp() {
  return (
    src(
      [
        `!${srcFolder}/images/src/favicon.png`, // Исключаем исходник фавиконки
        `${srcFolder}/images/src/**/*.{png,jpg,jpeg}`,
        `${srcFolder}/components/**/img/**/*.{png,jpg,jpeg}`,
      ],
      { encoding: false },
    )
      .pipe(plumber({ errorHandler: onError }))

      // Исправляем кэширование для WebP, проверяя наличие .webp файла в dist
      .pipe(
        newer({
          dest: paths.images.dest,
          map: (relative) => {
            const ext = path.extname(relative);
            return path.basename(relative, ext) + ".webp";
          },
        }),
      )
      .pipe(webp({ quality: config.settings.webpQuality }))
      .pipe(flatten())
      .pipe(dest(paths.images.dest))
      .on("end", bs.reload)
  );
}

// ==========================================
// СБОРКА SVG СПРАЙТА
// ==========================================
export function sprite() {
  return (
    src(paths.images.svg, { encoding: false })
      .pipe(plumber({ errorHandler: onError }))

      // Проверяем, изменились ли исходные SVG по сравнению с готовым sprite.svg
      .pipe(newer(path.join(paths.images.dest, "sprite.svg")))
      .pipe(
        cheerio({
          run: function ($) {
            // Очистка атрибутов для управления цветом через CSS
            $("[fill]").each(function () {
              if ($(this).attr("fill") !== "none") {
                $(this).removeAttr("fill");
              }
            });
            $("[stroke]").removeAttr("stroke");
            $("[style]").removeAttr("style");
            $("[class]").removeAttr("class");
            // Предотвращаем дублирование ID в DOM дереве
            $("path, circle, rect, ellipse").removeAttr("id");
          },
          parserOptions: { xmlMode: true },
        }),
      )
      .pipe(replace("&gt;", ">"))
      .pipe(
        svgSprite({
          mode: {
            symbol: {
              dest: ".",
              sprite: "sprite.svg",
            },
          },
          shape: {
            id: {
              generator: (name) => name.split(".").shift(),
            },
          },
        }),
      )
      .pipe(dest(paths.images.dest))
      .on("end", bs.reload)
  );
}

// ==========================================
// ГЕНЕРАЦИЯ ФАВИКОНОК (ИКОНОК САЙТА)
// ==========================================
export function favs() {
  return (
    src(`${srcFolder}/images/src/favicon.png`, {
      allowEmpty: true,
      encoding: false,
    })
      .pipe(plumber({ errorHandler: onError }))
      .pipe(
        favicons({
          appName: "My Project",
          path: "images/favicons/",
          html: "favicon-links.html", // Генерируемый HTML файл с линками
          pipeHTML: true,
          icons: {
            appleIcon: true,
            favicons: true,
            android: true,
            windows: false,
            yandex: false,
          },
        }),
      )
      // Выгрузка сгенерированных иконок и html в dist
      .pipe(dest(`${buildFolder}/images/favicons/`))

      // Фильтрация и перенос только HTML-файла в заготовки src/parts
      .pipe(filter("favicon-links.html"))
      .pipe(dest(`${srcFolder}/parts/`))
  );
}

// ==========================================
// КОНВЕРТАЦИЯ И ПЕРЕНОС ШРИФТОВ
// ==========================================
export function fonts(done) {
  // Если папка исходников шрифтов пуста или отсутствует, сразу выходим
  const sourceDir = path.dirname(config.paths.fonts.src).replace(/\*\*$/, "");
  if (!fs.existsSync(sourceDir) || fs.readdirSync(sourceDir).length === 0) {
    return done();
  }

  return src(config.paths.fonts.src, { encoding: false, allowEmpty: true })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(fonter({ formats: ["woff"] }))
    .pipe(dest(config.paths.fonts.dest))
    
    // Повторно берем исходные TTF файлы для генерации WOFF2
    .pipe(
      src(`${config.srcFolder}/fonts/src/**/*.ttf`, {
        encoding: false,
        allowEmpty: true,
      }),
    )
    .pipe(ttf2woff2())
    .pipe(dest(config.paths.fonts.dest))
    .on("end", () => {
      bs.reload();
      done(); // Сигнализируем Gulp о завершении таска
    })
    .on("error", done);
}

// ==========================================
// АВТОГЕНЕРАЦИЯ ФАЙЛА СТИЛЕЙ ПОДКЛЮЧЕНИЯ ШРИФТОВ
// ==========================================
export function fontsStyle(done) {
  const extension = config.preprocessor === "sass" ? "sass" : "scss";
  const fontsFile = path.join(config.srcFolder, config.preprocessor, "base", `_fonts.${extension}`);

  // Если файл стилей уже создан или папка назначения пуста — выходим, чтобы не затереть ручные правки
  if (fs.existsSync(fontsFile) || !fs.existsSync(config.paths.fonts.dest)) {
    return done();
  }

  const files = fs.readdirSync(config.paths.fonts.dest);
  if (files.length === 0) return done();

  fs.writeFileSync(fontsFile, "");
  let lastProcessedFont;

  files.forEach((file) => {
    const fontFileName = path.basename(file, path.extname(file));
    
    if (lastProcessedFont !== fontFileName) {
      const fontName = fontFileName.split("-")[0] || fontFileName;
      const fontInfo = fontFileName.toLowerCase();

      // Автоматическое определение жирности (font-weight)
      let fontWeight = 400;
      if (fontInfo.includes("thin")) fontWeight = 100;
      else if (fontInfo.includes("extralight")) fontWeight = 200;
      else if (fontInfo.includes("light")) fontWeight = 300;
      else if (fontInfo.includes("medium")) fontWeight = 500;
      else if (fontInfo.includes("semibold")) fontWeight = 600;
      else if (fontInfo.includes("bold")) fontWeight = 700;
      else if (fontInfo.includes("extrabold") || fontInfo.includes("heavy")) fontWeight = 800;
      else if (fontInfo.includes("black")) fontWeight = 900;

      // Автоматическое определение начертания (font-style)
      const fontStyle = fontInfo.includes("italic") ? "italic" : "normal";

      // Формирование CSS-записи @font-face
      const fontRecord = `@font-face {\n\tfont-family: "${fontName}";\n\tfont-display: swap;\n\tsrc: url("../fonts/${fontFileName}.woff2") format("woff2");\n\tfont-weight: ${fontWeight};\n\tfont-style: ${fontStyle};\n}\n\n`;

      fs.appendFileSync(fontsFile, fontRecord);
      lastProcessedFont = fontFileName;
    }
  });

  done();
}

// ==========================================
// ОЧИСТКА НЕИСПОЛЬЗУЕМОГО CSS (PURGE CSS)
// ==========================================
export function cssPurge(done) {
  // Запускаем очистку только для продакшн-сборки, в dev-режиме сразу выходим
  if (!isProd) return done();

  return src(path.join(config.paths.styles.dest, "*.min.css"))
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      purgecss({
        content: [
          path.join(config.buildFolder, "**", "*.html"),
          path.join(config.buildFolder, "js", "**", "*.js")
        ],
        // Исключаем из удаления системные классы поддержки WebP
        safelist: ["webp", "no-webp"],
      }),
    )
    .pipe(dest(config.paths.styles.dest))
    .pipe(bs.stream());
}

// КОПИРОВАНИЕ ВСПОМОГАТЕЛЬНЫХ РЕСУРСОВ В DIST
// ==========================================
export function buildcopy(done) {
  // Если папки со шрифтами в dist еще нет (например, после npm run clean), 
  // мы просто выходим из таска, чтобы не вызывать ошибку ENOENT
  if (!fs.existsSync(config.paths.fonts.dest)) {
    return done();
  }

  return src(path.join(config.paths.fonts.dest, "**", "*"), {
    base: config.srcFolder,
    allowEmpty: true,
    encoding: false,
  })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(dest(config.buildFolder));
}

// ==========================================
// АРХИВАЦИЯ ГОТОВОЙ СБОРКИ В ZIP
// ==========================================
export function zipFiles() {
  const now = new Date();
  
  // Корректное формирование локальной даты и времени: ГГГГ-ММ-ДД_ЧЧ-ММ
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  
  const fileName = `dist_${year}-${month}-${day}_${hours}-${minutes}.zip`;

  return src(path.join(config.buildFolder, "**", "*"))
    .pipe(plumber({ errorHandler: onError }))
    .pipe(zip(fileName))
    .pipe(dest("archives/"))
    .on("end", () => {
      console.log(`\n📦 Архив успешно создан: archives/${fileName}\n`);
    });
}

// Добавьте эту переменную-флаг в самый верх gulpfile.js или прямо перед функцией startwatch
let isLinting = false;

// ==========================================
// НАБЛЮДЕНИЕ ЗА ИЗМЕНЕНИЯМИ (WATCHERS)
// ==========================================
function startwatch() {
  // Стили (С полной защитой от цикличных перезапусков линтера)
  const scssWatcher = watch(
    `${srcFolder}/**/*.${preprocessor}`,
    { delay: 300 },
    series(styles),
  );

  scssWatcher.on("change", (filePath) => {
    if (isLinting) {
      isLinting = false;
      return;
    }

    isLinting = true;
    lintCss(
      () => {
        setTimeout(() => {
          isLinting = false;
        }, 400);
      },
      filePath.replace(/\\/g, "/"),
    );
  });

  // Скрипты (С аналогичной защитой от цикличных перезапусков)
  const jsWatcher = watch(
    `${srcFolder}/js/**/*.js`,
    { delay: 300 },
    series(scripts),
  );

  jsWatcher.on("change", (filePath) => {
    if (isLinting) {
      isLinting = false;
      return;
    }

    isLinting = true;
    const normalizedPath = filePath.replace(/\\/g, "/");
    const doneCallback = () => {
      setTimeout(() => {
        isLinting = false;
      }, 400);
    };

    if (typeof lintJsWithFile === "function") {
      lintJsWithFile(doneCallback, normalizedPath);
    } else {
      lintJs(doneCallback, normalizedPath);
    }
  });

  // Разметка, шрифты и медиа-ресурсы
  watch(`${srcFolder}/**/*.html`, html);
  watch(paths.images.svg, sprite);
  watch(`${srcFolder}/fonts/src/**/*`, series(fonts, fontsStyle));

  // Наблюдение за картинками (срабатывает только при добавлении/изменении)
  watch(
    [
      paths.images.src,
      `${srcFolder}/components/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    series(imagesDev, createWebp),
  );
}

// ==========================================
// ЭКСПОРТ КОМАНД СБОРКИ (ПРОДАКШН)
// ==========================================
export const build = series(
  cleandist,
  // Линтинг запускается параллельно с подготовкой шрифтов
  parallel(lintCss, lintJs, series(fonts, fontsStyle)),

  // Полная оптимизация и сборка всех ресурсов
  parallel(styles, scripts, images, createWebp, sprite, favs, html),

  // Финальные штрихи сборки дистрибутива
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

// ==========================================
// РЕЖИМ РАЗРАБОТКИ (DEFAULT TASK)
// ==========================================
export default series(
  // Мгновенный вывод шпаргалки в консоль
  help,

  // Быстрая компиляция критической базы (без тяжелых favs и линтеров)
  parallel(styles, scripts, html, series(fonts, fontsStyle)),

  // Перенос файлов в dist и параллельный запуск сервера с вотчерами
  buildcopy,
  parallel(browsersync, startwatch),
);

// Конструктор и инициализация проекта
export { create, remove, module, createStructure as init, help };
