import { header } from "@comp/header/header";
import { main } from "@comp/main/main";
import { footer } from "@comp/footer/footer";
import { isWebp } from "@/modules/isWebp";

isWebp();
header();
main();
footer();

console.log("TypeScript успешно запущен!");
