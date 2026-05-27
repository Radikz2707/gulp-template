// 1. ИМПОРТЫ СИСТЕМНЫХ МОДУЛЕЙ И ХЕЛПЕРОВ
import { isWebp } from "@/modules/isWebp";

// 2. ИМПОРТЫ СТАТИЧЕСКИХ КОМПОНЕНТОВ

// 3. ИМПОРТЫ ДИНАМИЧЕСКИХ JS/TS МОДУЛЕЙ

// ==========================================
// ВЫЗОВЫ ФУНКЦИЙ (В порядке их инициализации)
// ==========================================

// Сервисные утилиты
isWebp();

// Компоненты структуры сайта

// Интерактивные модули логики

// Ленивая загрузка модуля lazy-gallery
if (document.querySelector(".lazy-gallery")) {
  import(/* webpackChunkName: "lazy-gallery" */ "@modules/lazy-gallery/lazy-gallery").then(({ lazyGallery }) => {
  });
}

console.log("TypeScript успешно запущен!");
