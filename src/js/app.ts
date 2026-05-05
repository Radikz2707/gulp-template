import { header } from "@comp/header/header";

import { footer } from "@comp/footer/footer";
import { isWebp } from "@/modules/isWebp";

isWebp();
header();

footer();

console.log("TypeScript успешно запущен!");

import { main } from "@comp/main/main";
main();

import { nav } from "@comp/nav/nav";
nav();
