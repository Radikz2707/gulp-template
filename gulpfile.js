// --- 1. Конфигурация и инициализация проекта ---
import { config } from "./gulp.config.js";
import { createStructure } from "./gulp.init.js";
import { help } from "./gulp.help.js";
import { create } from "./gulp.create.js";
import { remove } from "./gulp.remove.js";
import { module } from "./gulp.module.js";

// --- 2. Ядро Gulp и системные модули Node.js ---
import gulp from "gulp";
import { exec } from "child_process";
import fs from "fs";

// --- 3. Сервер и уведомления ---
import browserSync from "browser-sync";
import notify from "gulp-notify";
import plumber from "gulp-plumber";

// --- 4. Работа с HTML ---
import fileInclude from "gulp-file-include";
import webphtml from "gulp-webp-html-nosvg";
import htmlhint from "gulp-htmlhint";
import htmlBeautify from "gulp-html-beautify";

// --- 5. Стили (CSS/SCSS) и PostCSS ---
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

// --- 6. Скрипты (JS/Webpack) ---
import webpackStream from "webpack-stream";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";

// --- 7. Графика и иконки ---
import imagemin from "gulp-imagemin";
import mozjpeg from "imagemin-mozjpeg";
import optipng from "imagemin-optipng";
import svgo from "imagemin-svgo";
import webp from "gulp-webp";
import svgSprite from "gulp-svg-sprite";
import cheerio from "gulp-cheerio";
import favicons from "gulp-favicons";
import flatten from "gulp-flatten";

// --- 8. Шрифты ---
import fonter from "gulp-fonter";
import ttf2woff2 from "gulp-ttf2woff2";

// --- 9. Вспомогательные утилиты ---
import changed from "gulp-changed";
import newer from "gulp-newer";
import rename from "gulp-rename";
import zip from "gulp-zip";
import replace from "gulp-replace";
import filter from "gulp-filter";


// --- ОБЪЯВЛЕНИЕ КОНСТАНТ (Строго после всех импортов) ---
const { paths, preprocessor, srcFolder, buildFolder } = config;
const { src, dest, parallel, series, watch } = gulp;
const sass = gulpSass(dartSass);
const bs = browserSync.create();

// --- ОБРАБОТКА ОШИБОК ---
const onError = function (err) {
  notify.onError({
    title: "Gulp Error in " + err.plugin,
    message: "Error: <%= error.message %>",
    sound: true,
  })(err);
  this.emit("end");
};

// --- ТАСКИ ---

export function browsersync() {
  bs.init({
    server: { baseDir: buildFolder },
    notify: false,
    online: true,
  });
}

export function cleandist(done) {
  if (fs.existsSync(buildFolder)) {
    fs.rmSync(buildFolder, { recursive: true, force: true });
  }
  done();
}

export function cleanimg(done) {
  if (fs.existsSync(paths.images.dest)) {
    const files = fs.readdirSync(paths.images.dest);
    files.forEach((file) => {
      // Удаляем всё, что НЕ является папкой favicons
      if (file !== "favicons") {
        const curPath = `${paths.images.dest}/${file}`;
        fs.rmSync(curPath, { recursive: true, force: true });
      }
    });
    console.log("🧹 Дубликаты удалены, папка favicons сохранена.");
  }
  done();
}

export const lintCss = (done) => {
  exec(
    // Добавили флаг --allow-empty-input
    `npx stylelint "${srcFolder}/**/*.scss" --fix --allow-empty-input --custom-formatter=stylelint-formatter-pretty`,
    (_err, stdout) => {
      if (stdout) {
        process.stdout.write(stdout);
      }
      done();
    },
  );
};

export const lintJs = (done) => {
  exec(
    `cross-env ESLINT_USE_FLAT_CONFIG=false npx eslint "${srcFolder}/js/**/*.js" --fix`,
    (_err, stdout) => {
      if (stdout) process.stdout.write(stdout);
      done();
    },
  );
};

export function scripts() {
  return src(paths.scripts.src)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      webpackStream(
        {
          mode: "production",
          performance: { hints: false },
          entry: {
            app: `./${srcFolder}/js/app.js`,
          },
          output: {
            filename: "app.min.js",
          },
          // --- ДОБАВЬТЕ ЭТОТ БЛОК ---
          resolve: {
            alias: {
              // Указываем Webpack, что @ означает папку src/js
              "@": Buffer.from(process.cwd() + `/${srcFolder}/js`).toString(),
            },
            extensions: [".js", ".json"],
          },
          // --------------------------
          module: {
            rules: [
              {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                  loader: "babel-loader",
                  options: { presets: ["@babel/preset-env"] },
                },
              },
            ],
          },
          optimization: {
            minimize: true,
            minimizer: [new TerserPlugin({ extractComments: false })],
          },
          devtool: "source-map",
        },
        webpack,
      ),
    )
    .pipe(dest(paths.scripts.dest))
    .on("end", bs.reload);
}

export function styles() {
  return src(paths.styles.src)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        silenceDeprecations: ["import"],
      }).on("error", sass.logError),
    )
    .pipe(gcmq())
    .pipe(
      postcss([
        webpInCss,
        // cssDeclarationSorter УДАЛЕН, так как за порядок теперь отвечает Stylelint
        autoprefixer({
          overrideBrowserslist: config.settings.autoprefixer,
          grid: false,
        }),
      ]),
    )
    .pipe(
      cleancss({
        level: { 2: { mergeMedia: true } },
      }),
    )
    .pipe(rename({ basename: "app", suffix: ".min" }))
    .pipe(
      sourcemaps.write(".", {
        includeContent: false,
        sourceRoot: "../../src/scss",
      }),
    )
    .pipe(dest(paths.styles.dest))
    .pipe(bs.stream());
}

export function html() {
  return (
    src([
      `${srcFolder}/**/*.html`,
      `!${srcFolder}/components/**/*.html`,
      `!${srcFolder}/parts/**/*.html`,
    ])
      .pipe(plumber({ errorHandler: onError }))
      // 1. Собираем части в один файл
      .pipe(
        fileInclude({
          prefix: "@@",
          basepath: "@file",
          indent: false,
        }),
      )
      // 2. Продвинутая валидация (Accessibility + Качество)
      .pipe(
        htmlhint({
          "doctype-first": false, // Для фрагментов отключаем
          "tagname-lowercase": true, // Теги в нижнем регистре
          "attr-lowercase": true, // Атрибуты в нижнем регистре
          "attr-value-double-quotes": true, // Только двойные кавычки
          "attr-no-duplication": true, // Никаких дублей атрибутов
          "id-unique": true, // Уникальные ID (важно для JS и доступности)
          "src-not-empty": true, // Картинки не должны быть без адреса
          "alt-require": true, // ОБЯЗАТЕЛЬНЫЙ alt (Accessibility)
          "img-alt-require": true, // Дублирующая проверка для изображений
          "tag-pair": true, // Проверка на закрытые теги
          "spec-char-escape": true, // Проверка на спецсимволы
        }),
      )
      .pipe(htmlhint.reporter("htmlhint-stylish")) // Красивый вывод ошибок в консоль
      // 3. Добавляем поддержку WebP в разметку
      .pipe(webphtml())
      // 4. Финальное форматирование (Beautify)
      .pipe(
        htmlBeautify({
          indent_size: 2,
          indent_char: " ",
          eol: "\n",
          preserve_newlines: true,
          max_preserve_newlines: 1,
          indent_inner_html: true,
          extra_liners: [],
        }),
      )
      // 5. Выгрузка в dist
      .pipe(dest(buildFolder))
      .on("end", bs.reload)
  );
}

export function images() {
  return (
    src(
      [
        paths.images.src,
        `!${srcFolder}/images/src/favicon.png`, // <-- ИСКЛЮЧАЕМ ИСХОДНИК
        `${srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
      ],
      { encoding: false },
    )
      .pipe(plumber({ errorHandler: onError }))
      .pipe(newer(paths.images.dest))
      // 1. Оптимизация изображений
      .pipe(
        imagemin([
          mozjpeg({ quality: 75, progressive: true }),
          optipng({ optimizationLevel: 5 }),
          svgo({ plugins: [{ name: "preset-default" }] }),
        ]),
      )
      // 2. Сплющивание структуры (убирает вложенность /components/block/img/)
      .pipe(flatten())
      // 3. Выгрузка в dist/images
      .pipe(dest(paths.images.dest))
      .on("end", bs.reload)
  );
}

export function imagesDev() {
  return src(
    [
      paths.images.src,
      `!${srcFolder}/images/src/favicon.png`, // <-- ИСКЛЮЧАЕМ ИСХОДНИК
      `${srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    { encoding: false },
  )
    .pipe(changed(paths.images.dest))
    .pipe(flatten()) // <--- Убирает вложенность папок
    .pipe(dest(paths.images.dest))
    .on("end", bs.reload);
}

export function createWebp() {
  return src(
    [
      `!${srcFolder}/images/src/favicon.png`, // <-- ИСКЛЮЧАЕМ ИСХОДНИК
      `${srcFolder}/images/src/**/*.{png,jpg,jpeg}`,
      `${srcFolder}/components/**/img/**/*.{png,jpg,jpeg}`,
    ],
    { encoding: false },
  )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(paths.images.dest))
    .pipe(webp({ quality: config.settings.webpQuality }))
    .pipe(flatten()) // <--- Убирает вложенность папок
    .pipe(dest(paths.images.dest))
    .on("end", bs.reload);
}

export function sprite() {
  return src(paths.images.svg, { encoding: false })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      cheerio({
        run: function ($) {
          // Очистка атрибутов для управления цветом через CSS
          $("[fill]").each(function () {
            // Удаляем fill только если это не 'none'
            if ($(this).attr("fill") !== "none") {
              $(this).removeAttr("fill");
            }
          });
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
          $("[class]").removeAttr("class");
          // Удаляем id у внутренних элементов, чтобы не дублировались в DOM
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
            // Имя иконки будет равно имени файла без расширения
            generator: (name) => name.split(".").shift(),
          },
        },
      }),
    )
    .pipe(dest(paths.images.dest))
    .on("end", bs.reload);
}

export function favs() {
  return (
    src(`${srcFolder}/images/src/favicon.png`, {
      allowEmpty: true,
      encoding: false, // Обязательно для Gulp 5
    })
      .pipe(plumber({ errorHandler: onError }))
      .pipe(
        favicons({
          appName: "My Project",
          path: "images/favicons/",
          // ПАРАМЕТРЫ ДЛЯ HTML:
          html: "favicon-links.html", // Имя файла, который создастся в потоке
          pipeHTML: true, // ПРИНУДИТЕЛЬНО выдавать HTML в поток
          icons: {
            appleIcon: true,
            favicons: true,
            android: true,
            windows: false,
            yandex: false,
          },
        }),
      )
      // 1. Сначала выгружаем всё (картинки + html) в dist
      .pipe(dest(`${buildFolder}/images/favicons/`))

      // 2. Теперь фильтруем только HTML-файл и сохраняем его в src/parts
      .pipe(filter("favicon-links.html"))
      .pipe(dest(`${srcFolder}/parts/`))
  );
}

export function fonts(done) {
  // 1. Добавили done
  return src(paths.fonts.src, { encoding: false, allowEmpty: true }) // 2. Добавили allowEmpty
    .pipe(fonter({ formats: ["woff"] }))
    .pipe(dest(paths.fonts.dest))
    .pipe(
      src(`${srcFolder}/fonts/src/**/*.ttf`, {
        encoding: false,
        allowEmpty: true,
      }),
    )
    .pipe(ttf2woff2())
    .pipe(dest(paths.fonts.dest))
    .on("end", () => {
      bs.reload();
      done(); // 3. Сигнализируем о завершении
    })
    .on("error", done); // 4. В случае ошибки тоже завершаем
}

export function fontsStyle(done) {
  const extension = preprocessor === "sass" ? "sass" : "scss";
  const fontsFile = `${srcFolder}/${preprocessor}/base/_fonts.${extension}`;
  if (fs.existsSync(fontsFile)) return done();
  if (!fs.existsSync(paths.fonts.dest)) return done();
  const files = fs.readdirSync(paths.fonts.dest);
  if (files.length > 0) {
    fs.writeFileSync(fontsFile, "");
    let newFileOnly;
    files.forEach((file) => {
      const fontFileName = file.split(".")[0];
      if (newFileOnly !== fontFileName) {
        const fontName = fontFileName.split("-")[0] || fontFileName;
        const fontRecord = `@font-face {\n\tfont-family: "${fontName}";\n\tfont-display: swap;\n\tsrc: url("../fonts/${fontFileName}.woff2") format("woff2");\n\tfont-weight: 400;\n\tfont-style: normal;\n}\n\n`;
        fs.appendFileSync(fontsFile, fontRecord);
        newFileOnly = fontFileName;
      }
    });
  }
  done();
}

export function cssPurge() {
  return src(paths.styles.dest + "/*.min.css")
    .pipe(
      purgecss({
        content: [`${buildFolder}/**/*.html`, `${buildFolder}/js/**/*.js`],
        safelist: ["webp", "no-webp"],
      }),
    )
    .pipe(dest(paths.styles.dest))
    .pipe(bs.stream());
}

export function buildcopy() {
  return src([`${srcFolder}/fonts/dest/**/*`], {
    base: srcFolder,
    allowEmpty: true,
    encoding: false,
  })
    .pipe(
      rename((path) => {
        if (path.dirname.includes("dest")) {
          path.dirname = path.dirname.replace("dest", "");
        }
      }),
    )
    .pipe(dest(buildFolder));
}

export function zipFiles() {
  // Формируем дату и время: ГГГГ-ММ-ДД_ЧЧ-ММ
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
  const fileName = `dist_${date}_${time}.zip`;

  return src(`${buildFolder}/**/*`)
    .pipe(zip(fileName))
    .pipe(dest("archives/"))
    .on("end", () => {
      console.log(`\n📦 Архив готов: archives/${fileName}\n`);
    });
}

function startwatch() {
  // 1. Стили
  watch(`${srcFolder}/**/*.${preprocessor}`, series(lintCss, styles));

  // 2. Скрипты
  watch(`${srcFolder}/js/**/*.js`, series(lintJs, scripts));

  // 3. HTML
  watch(`${srcFolder}/**/*.html`, html);

  // 4. Картинки и WebP
  watch(
    [
      paths.images.src,
      `${srcFolder}/components/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    series(imagesDev, createWebp),
  );

  // 5. НОВОЕ: SVG-спрайты
  watch(paths.images.svg, sprite);

  // 6. НОВОЕ: Шрифты (запуск конвертации и генерации стилей)
  watch(`${srcFolder}/fonts/src/**/*`, series(fonts, fontsStyle));
}

// --- ЭКСПОРТ КОМАНД ---

export const build = series(
  cleandist,
  parallel(lintCss, lintJs),
  parallel(
    styles,
    scripts,
    series(fonts, fontsStyle),
    images,
    createWebp,
    sprite,
    favs,
    html,
  ),
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

// Финальный экспорт для разработки (запуск через gulp или npm run dev)
// Для разработки
export default series(
  help,
  cleandist,
  favs, // Генерируем один раз при запуске npm run dev
  series(fonts, fontsStyle),
  parallel(lintCss, lintJs),
  parallel(styles, scripts, imagesDev, createWebp, sprite, html),
  buildcopy,
  parallel(browsersync, startwatch)
);

export {
  create,
  remove,
  module,
  createStructure as init, 
  help,
};
