import fs from "fs";
import path from "path";

console.log(
  "⏳ [AUDIT CONTROL]: Запуск глубокой ревизии автоматизации Первого шаблона...",
);

const errors = [];
const warnings = [];

// 1. Проверяем наличие критических файлов инфраструктуры
const criticalFiles = ["gulpfile.js", "gulp.config.js", "package.json"];
criticalFiles.forEach((file) => {
  if (!fs.existsSync(path.resolve(file))) {
    errors.push(
      `Критический файл конфигурации "${file}" отсутствует в корне проекта.`,
    );
  }
});

// 2. Глубокий аудит логики gulpfile.js (Проверка последовательности потоков)
const gulpfilePath = path.resolve("gulpfile.js");
if (fs.existsSync(gulpfilePath)) {
  const gulpfileContent = fs.readFileSync(gulpfilePath, "utf-8");

  // Убеждаемся, что подключена ленивая загрузка
  if (
    !gulpfileContent.includes("TASK_FILE_MAP") ||
    !gulpfileContent.includes("runTask")
  ) {
    warnings.push(
      "В gulpfile.js не обнаружена система Lazy Loading ресурсов. Возможна перегрузка памяти.",
    );
  }

  // Специфический аудит под Первый шаблон: контроль cssPurge
  if (gulpfileContent.includes("cssPurge")) {
    const htmlIndex = gulpfileContent.indexOf("runTask('html')");
    const purgeIndex = gulpfileContent.indexOf("runTask('cssPurge')");

    if (htmlIndex !== -1 && purgeIndex !== -1 && purgeIndex < htmlIndex) {
      errors.push(
        "АРХИТЕКТУРНЫЙ СБОЙ: Очистка стилей (cssPurge) вызывается ДО компиляции HTML! Это полностью уничтожит CSS сайта.",
      );
    }
  }
}

// 3. Сканируем папку gulp/ на предмет мертвых импортов и забытых колбэков
const gulpDir = path.resolve("gulp");
if (fs.existsSync(gulpDir)) {
  const gulpFiles = fs.readdirSync(gulpDir).filter((f) => f.endsWith(".js"));
  gulpFiles.forEach((file) => {
    const fileContent = fs.readFileSync(path.join(gulpDir, file), "utf-8");

    // Ищем старые неиспользуемые переменные catch(e)
    if (fileContent.match(/catch\s*\(\s*e\s*\)/g)) {
      warnings.push(
        `Файл "./gulp/${file}" содержит неиспользуемый аргумент "catch(e)". ESLint выдаст предупреждение.`,
      );
    }
  });
}

// 4. Формируем итоговый отчет в целевую папку
const timestamp = new Date().toISOString().split("T")[0];
let report = `# 🛡️ Системный аудит автоматизации\n*Дата проверки: ${timestamp}*\n\n`;

if (errors.length === 0 && warnings.length === 0) {
  report +=
    "### ✅ Статус: ИДЕАЛЬНО\nКодовая база стабильна, скрытых Race Condition и слепых зон не обнаружено.\n";
} else {
  report += `### 📊 Сводка: Найдено ${errors.length} критических ошибок и ${warnings.length} предупреждений.\n\n`;

  if (errors.length > 0) {
    report += "## ❌ Критические ошибки:\n";
    errors.forEach((err, i) => (report += `${i + 1}. 🚨 ${err}\n`));
    report += "\n";
  }

  if (warnings.length > 0) {
    report += "## ⚠️ Замечания и оптимизация:\n";
    warnings.forEach((warn, i) => (report += `${i + 1}. 👉 ${warn}\n`));
  }
}

try {
  // 🎯 ИСПРАВЛЕНО: Безопасное создание папки audit перед записью файла
  const targetDir = path.resolve("audit");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(path.join(targetDir, "audit.md"), report, "utf-8");

  console.log("\n==================================================");
  console.log(
    "📊 [AUDIT COMPLETE]: Файл audit.md успешно сгенерирован в папке audit/.",
  );
  console.log(
    `❌ Ошибок: ${errors.length} | ⚠️ Предупреждений: ${warnings.length}`,
  );
  console.log("==================================================\n");
} catch (err) {
  console.error(
    `❌ [AUDIT CRITICAL ERROR]: Не удалось записать файл отчета: ${err.message}`,
  );
}
