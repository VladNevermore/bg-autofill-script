import esbuild from "esbuild";

const header = `// ==UserScript==
// @name         Автозаполнение и проверка параметров
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Автозаполнение и сравнение параметров
// @match        https://crm.finleo.ru/orders/*
// @match        https://market.bg.ingobank.ru/tasks*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.user.js
// ==/UserScript==`;

(async () => {
  try {
    await esbuild.build({
      entryPoints: ["src/main.js"],
      bundle: true,
      outfile: "script.user.js",
      format: "iife",
      banner: { js: header }, 
      target: ["es2020"],
      charset: "utf8",
      minify: false, 
    });

    console.log("✅ script.user.js успешно создан!");
  } catch (e) {
    console.error("❌ Ошибка сборки:", e);
    process.exit(1);
  }
})();
