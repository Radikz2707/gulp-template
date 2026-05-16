import { config } from "../gulp.config.js";
import gulp from "gulp";
import path from "path";
import plumber from "gulp-plumber";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sourcemaps = require("gulp-sourcemaps");
const gcmq = require("gulp-group-css-media-queries");
const cleancss = require("gulp-clean-css");
const rename = require("gulp-rename");
const purgecss = require("gulp-purgecss");
const gulpSass = require("gulp-sass");

import * as dartSass from "sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";

import webpInCssModule from "webp-in-css/plugin.js";
const webpInCss = webpInCssModule.default || webpInCssModule;

import { onError, isProd, bs } from "./server.js";

const { src, dest } = gulp;
const sass = gulpSass(dartSass);

export function styles() {
  const pipeline = [
    src(config.paths.styles.src),
    plumber({ errorHandler: onError }),
  ];

  if (!isProd) {
    pipeline.push(sourcemaps.init());
  }

  pipeline.push(
    sass({ silenceDeprecations: ["import"] }).on("error", sass.logError),
    gcmq(),
    postcss([
      webpInCss,
      autoprefixer({
        overrideBrowserslist: config.settings.autoprefixer,
        grid: false,
      }),
    ]),
    cleancss({ level: { 2: { mergeMedia: true } } }),
    rename({
      basename: path
        .basename(config.paths.styles.output, ".css")
        .replace(".min", ""),
      suffix: ".min",
    }),
  );

  if (!isProd) {
    pipeline.push(
      sourcemaps.write(".", {
        includeContent: false,
        sourceRoot: "../../src/scss",
      }),
    );
  }

  pipeline.push(dest(config.paths.styles.dest), bs.stream());

  return pipeline.reduce((stream, plugin) => stream.pipe(plugin));
}

export function cssPurge(done) {
  if (!isProd) return done();

  return src(path.join(config.paths.styles.dest, "*.min.css"))
    .pipe(plumber({ errorHandler: onError }))
    .pipe(
      purgecss({
        content: [
          path.join(config.buildFolder, "**", "*.html"),
          path.join(config.buildFolder, "js", "**", "*.js"),
        ],
        safelist: ["webp", "no-webp"],
      }),
    )
    .pipe(dest(config.paths.styles.dest))
    .pipe(bs.stream());
}
