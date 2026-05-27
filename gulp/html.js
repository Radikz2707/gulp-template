import { config } from "../gulp.config.js";
import gulp from "gulp";
import plumber from "gulp-plumber";
import fileInclude from "gulp-file-include";
import htmlhint from "gulp-htmlhint";
import imgToPicture from "gulp-html-img-to-picture"; // Импортируем правильный плагин
import htmlBeautify from "gulp-html-beautify";

import { onError, isProd, bs } from "./server.js";

const { src, dest } = gulp;

export function html() {
  const pipeline = [
    src([
      `${config.srcFolder}/**/*.html`,
      `!${config.srcFolder}/components/**/*.html`,
      `!${config.srcFolder}/parts/**/*.html`,
    ]),
    plumber({ errorHandler: onError }),
    fileInclude({ prefix: "@@", basepath: "@file" }),
  ];

  // В продакшене безопасно оборачиваем картинки в <picture>
  if (isProd) {
    pipeline.push(
      imgToPicture({
        imgFolder: config.buildFolder, // Указываем, куда сборщик смотрит на картинки
      }),
    );
  }

  // Сначала форматируем в идеал
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
  );

  // Валидируем уже чистый отформатированный код
  pipeline.push(
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
  );

  pipeline.push(dest(config.buildFolder));

  return pipeline
    .reduce((stream, plugin) => stream.pipe(plugin))
    .on("end", bs.reload);
}
