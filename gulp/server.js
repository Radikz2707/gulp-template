import { config } from "../gulp.config.js";
import gulp from "gulp";
import browserSync from "browser-sync";
import notify from "gulp-notify";

import { html } from "./html.js";
import { styles } from "./styles.js";
import { scripts } from "./scripts.js";
import { imagesDev, createWebp, sprite } from "./images.js";
import { fonts, fontsStyle } from "./fonts.js";

const { watch, series } = gulp;
export const bs = browserSync.create();

export const isProd = process.argv.includes("build");

export const onError = function (err) {
  notify.onError({
    title: `Gulp Error in ${err.plugin || "Plugin"}`,
    message: "Error: <%= error.message %>",
    sound: isProd,
  })(err);
  this.emit("end");
};

export function browsersync() {
  bs.init({
    server: { baseDir: config.buildFolder },
    notify: false,
    online: true,
  });
}

export function startwatch() {
  watch(
    `${config.srcFolder}/**/*.${config.preprocessor}`,
    { delay: 300 },
    series(styles),
  );
  watch(`${config.srcFolder}/js/**/*.ts`, { delay: 300 }, series(scripts));
  watch(`${config.srcFolder}/**/*.html`, html);
  watch(config.paths.images.svg, sprite);
  watch(`${config.srcFolder}/fonts/src/**/*`, series(fonts, fontsStyle));

  watch(
    [
      config.paths.images.src,
      `${config.srcFolder}/components/**/*.{jpg,jpeg,png,svg,webp,gif}`,
    ],
    series(imagesDev, createWebp),
  );
}
