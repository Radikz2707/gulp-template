const preprocessor = "scss";
const srcFolder = "src"; // Исходники
const buildFolder = "dist"; // Готовая сборка

export const config = {
  preprocessor,
  srcFolder,
  buildFolder,

  // Пути для конструктора (создание/удаление)
  structure: {
    components: `${srcFolder}/components`,
    modules: `${srcFolder}/js/modules`,
    lessons: `${srcFolder}/js/modules/lessons`,
    plugins: `${srcFolder}/js/plugins`,
  },

  // Корень для JS алиасов (используется в webpack и jsconfig)
  aliasPath: `${srcFolder}/js`,

  paths: {
    styles: {
      src: `${srcFolder}/${preprocessor}/style.{sass,scss,less}`,
      dest: `${buildFolder}/css/`,
      output: "app.min.css",
    },
    scripts: {
      src: `${srcFolder}/js/app.js`,
      dest: `${buildFolder}/js/`,
      output: "app.min.js",
    },
    images: {
      src: `${srcFolder}/images/src/**/*`,
      dest: `${buildFolder}/images/`,
      svg: `${srcFolder}/images/src/**/*.svg`,
    },
    fonts: {
      src: `${srcFolder}/fonts/src/**/*.{ttf,otf}`,
      dest: `${buildFolder}/fonts/`,
    },
  },

  settings: {
    webpQuality: 70,
    imagemin: {
      jpeg: 75,
      png: 5,
    },
    autoprefixer: ["last 10 versions"],
  },
};
