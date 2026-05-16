import { config } from "../gulp.config.js";
import gulp from "gulp";
import path from "path";
import fs from "fs";
import plumber from "gulp-plumber";
import flatten from "gulp-flatten";
import filter from "gulp-filter";
import replace from "gulp-replace";
import imagemin from "gulp-imagemin";
import mozjpeg from "imagemin-mozjpeg";
import optipng from "imagemin-optipng";
import svgo from "imagemin-svgo";
import webp from "gulp-webp";
import svgSprite from "gulp-svg-sprite";
import cheerio from "gulp-cheerio";
import favicons from "gulp-favicons";
import newer from "gulp-newer";

import { onError, bs } from "./server.js";

const { src, dest } = gulp;

export function images() {
  return src(
    [
      config.paths.images.src,
      `!${config.srcFolder}/images/src/favicon.png`,
      `${config.srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    { encoding: false },
  )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      newer({
        dest: config.paths.images.dest,
        map: (relative) => path.basename(relative),
      }),
    )
    .pipe(
      imagemin([
        mozjpeg({ quality: config.settings.imagemin.jpeg, progressive: true }),
        optipng({ optimizationLevel: config.settings.imagemin.png }),
        svgo({ plugins: [{ name: "preset-default" }] }),
      ]),
    )
    .pipe(flatten())
    .pipe(dest(config.paths.images.dest))
    .on("end", bs.reload);
}

export function imagesDev() {
  return src(
    [
      config.paths.images.src,
      `!${config.srcFolder}/images/src/favicon.png`,
      `${config.srcFolder}/components/**/img/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    { encoding: false },
  )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      newer({
        dest: config.paths.images.dest,
        map: (relative) => path.basename(relative),
      }),
    )
    .pipe(flatten())
    .pipe(dest(config.paths.images.dest))
    .on("end", bs.reload);
}

export function createWebp() {
  return src(
    [
      `!${config.srcFolder}/images/src/favicon.png`,
      `${config.srcFolder}/images/src/**/*.{png,jpg,jpeg}`,
      `${config.srcFolder}/components/**/img/**/*.{png,jpg,jpeg}`,
    ],
    { encoding: false },
  )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      newer({
        dest: config.paths.images.dest,
        map: (relative) =>
          path.basename(relative, path.extname(relative)) + ".webp",
      }),
    )
    .pipe(webp({ quality: config.settings.webpQuality }))
    .pipe(flatten())
    .pipe(dest(config.paths.images.dest))
    .on("end", bs.reload);
}

export function sprite() {
  return src(config.paths.images.svg, { encoding: false })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(path.join(config.paths.images.dest, "sprite.svg")))
    .pipe(
      cheerio({
        run: function ($) {
          $("[fill]").each(function () {
            if ($(this).attr("fill") !== "none") $(this).removeAttr("fill");
          });
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
          $("[class]").removeAttr("class");
          $("path, circle, rect, ellipse").removeAttr("id");
        },
        parserOptions: { xmlMode: true },
      }),
    )
    .pipe(replace("&gt;", ">"))
    .pipe(
      svgSprite({
        mode: { symbol: { dest: ".", sprite: "sprite.svg" } },
        shape: { id: { generator: (name) => name.split(".").shift() } },
      }),
    )
    .pipe(dest(config.paths.images.dest))
    .on("end", bs.reload);
}

export function favs() {
  return src(`${config.srcFolder}/images/src/favicon.png`, {
    allowEmpty: true,
    encoding: false,
  })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      favicons({
        appName: "My Project",
        path: "images/favicons/",
        html: "favicon-links.html",
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
    .pipe(dest(`${config.buildFolder}/images/favicons/`))
    .pipe(filter("favicon-links.html"))
    .pipe(dest(`${config.srcFolder}/parts/`));
}

export function cleanimg(done) {
  if (fs.existsSync(config.paths.images.dest)) {
    const files = fs.readdirSync(config.paths.images.dest);
    files.forEach((file) => {
      if (file !== "favicons") {
        fs.rmSync(path.join(config.paths.images.dest, file), {
          recursive: true,
          force: true,
        });
      }
    });
    console.log("🧹 Графика очищена, папка favicons сохранена.");
  }
  done();
}
