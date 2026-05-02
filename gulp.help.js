export const help = (done) => {
  const c = {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
  };

  console.log(`
${c.cyan}${c.bold}==========================================
🚀  GULP TEMPLATE — ШПАРГАЛКА
==========================================${c.reset}
${c.green}${c.bold}npm run dev${c.reset}          — запуск разработки и сервера
${c.green}${c.bold}npm run build${c.reset}        — финальная сборка проекта
${c.green}${c.bold}npm run lint${c.reset}         — проверка JS и SCSS на ошибки
${c.green}${c.bold}npm run clean${c.reset}        — полная очистка папки dist

${c.yellow}${c.bold}gulp create --имя_блока${c.reset} — создать новый блок (пример: gulp create --header)
${c.yellow}${c.bold}gulp remove --имя_блока${c.reset} — удалить блок (пример: gulp remove --header)

${c.cyan}------------------------------------------
Пути и настройки меняются в: ${c.bold}gulp.config.js${c.reset}
${c.cyan}==========================================${c.reset}
  `);
  done();
};
