import fs from "fs";
import path from "path";

const IGNORED_FOLDERS = [
  "node_modules",
  "dist",
  ".git",
  ".cache",
  "archives",
  "audit",
];

/**
 * Рекурсивно сканирует дерево каталогов проекта
 */
function buildTree(currentPath, prefix = "") {
  let result = "";
  try {
    const items = fs.readdirSync(currentPath);

    // Сортируем: сначала папки, потом файлы
    const sortedItems = items
      .filter((item) => !item.startsWith("."))
      .sort((a, b) => {
        const aStat = fs.statSync(path.join(currentPath, a));
        const bStat = fs.statSync(path.join(currentPath, b));
        return bStat.isDirectory() - aStat.isDirectory();
      });

    sortedItems.forEach((item, index) => {
      if (IGNORED_FOLDERS.includes(item)) return;

      const isLast = index === sortedItems.length - 1;
      const itemPath = path.join(currentPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();

      result += `${prefix}${isLast ? "└─ " : "├─ "}${item}${isDirectory ? "/" : ""}\n`;

      if (isDirectory) {
        result += buildTree(itemPath, prefix + (isLast ? "   " : "│  "));
      }
    });
  } catch (err) {
    result += `${prefix}⚠️ [Blueprint Error]: ${err.message}\n`;
  }
  return result;
}

console.log("⏳ [BLUEPRINT]: Генерация архитектурного чертежа структуры...");

const timestamp = new Date().toISOString().split("T")[0];
const projectRoot = process.cwd();
const treeOutput = buildTree(projectRoot);

const blueprintContent = `# 🗺️ Архитектурный чертеж Первого шаблона\n*Дата генерации: ${timestamp}*\n\n\`\`\`text\n. (root)\n${treeOutput}\`\`\`\n`;

try {
  // 🎯 ИСПРАВЛЕНО: Безопасное создание папки audit перед записью чертежа структуры
  const targetDir = path.resolve("audit");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(targetDir, "structure.md"),
    blueprintContent,
    "utf-8",
  );
  console.log(
    "✅ [BLUEPRINT SUCCESS]: Файл structure.md успешно сгенерирован в папке audit/.",
  );
} catch (err) {
  console.error(
    `❌ [BLUEPRINT CRITICAL ERROR]: Не удалось записать чертеж: ${err.message}`,
  );
}
