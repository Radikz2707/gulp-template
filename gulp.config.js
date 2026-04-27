const preprocessor = "scss";
const srcFolder = "src"; // Меняешь здесь — меняется всё для разработки
const buildFolder = "dist"; // Меняешь здесь — меняется всё для готовой сборки

export const config = {
  preprocessor,
  srcFolder,
  buildFolder,

  paths: {
    styles: {
      src: `${srcFolder}/${preprocessor}/main.{sass,scss,less}`,
      dest: `${buildFolder}/css/`, // Было src, теперь dist
      output: "app.min.css"
    },
    scripts: {
      src: `${srcFolder}/js/app.js`,
      dest: `${buildFolder}/js/`, // Было src, теперь dist
      output: "app.min.js"
    },
    images: {
      src: `${srcFolder}/images/src/**/*`,
      dest: `${buildFolder}/images/`, // Сразу в dist
      svg: `${srcFolder}/images/src/**/*.svg`
    },
    fonts: {
      src: `${srcFolder}/fonts/src/**/*.{ttf,otf}`,
      dest: `${buildFolder}/fonts/` // Сразу в dist
    }
  },

  // ... остальные настройки
  settings: {
    webpQuality: 70,
    imagemin: {
      jpeg: 75,
      png: 5
    },
    autoprefixer: ["last 10 versions"]
  }
};
