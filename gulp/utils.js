import { config } from "../gulp.config.js";
import gulp from "gulp";
import path from "path";
import fs from "fs";
import plumber from "gulp-plumber";
import zip from "gulp-zip";

import { onError } from "./server.js";

const { src, dest } = gulp;

export function cleandist(done) {
  if (fs.existsSync(config.buildFolder)) {
    fs.rmSync(config.buildFolder, { recursive: true, force: true });
  }
  done();
}

export function buildcopy(done) {
  if (!fs.existsSync(config.paths.fonts.dest)) return done();

  return src(path.join(config.paths.fonts.dest, "**", "*"), {
    base: config.srcFolder,
    allowEmpty: true,
    encoding: false,
  })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(dest(config.buildFolder));
}

export function zipFiles() {
  const now = new Date();
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
