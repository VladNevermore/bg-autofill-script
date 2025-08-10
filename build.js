import fs from "fs";
import path from "path";

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
// ==/UserScript==

`;

function readDirRecursive(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(readDirRecursive(fullPath));
    } else if (fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.resolve("src");
const files = readDirRecursive(srcDir).sort();
let content = "";
for (const file of files) {
  content += fs.readFileSync(file, "utf-8") + "\n\n";
}

fs.writeFileSync("script.user.js", header + content);
console.log("✅ script.user.js создан!");
