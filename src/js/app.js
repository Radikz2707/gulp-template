import { header } from "@/../components/header/header.js";
import { main } from "@/../components/main/main.js";
import { footer } from "@/../components/footer/footer.js";
import { isWebp } from "@/modules/isWebp.js"; // Намного чище!

isWebp();
header();
main();
footer();

console.log("Gulp работает, алиасы настроены!");
