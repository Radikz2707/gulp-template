import { config } from "../gulp.config.js";
import gulp from "gulp";
import path from "path";
import plumber from "gulp-plumber";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const webpackStream = require("webpack-stream");

import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";

import { onError, isProd, bs } from "./server.js";

const { src, dest } = gulp;

export function scripts(done) {
  let isFirstBuild = true;

  const jsRules = {
    test: /\.m?js$/,
    exclude: /node_modules/,
  };

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
          cache: isProd ? false : { type: "filesystem" },
          performance: { hints: false },
          entry: { app: `./${config.paths.scripts.src}` },
          output: { filename: config.paths.scripts.output },
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
                  { loader: "ts-loader", options: { transpileOnly: !isProd } },
                ],
              },
              ...(isProd ? [jsRules] : []),
            ],
          },
          optimization: {
            minimize: isProd,
            minimizer: [new TerserPlugin({ extractComments: false })],
          },
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
