// ==UserScript==
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

import { logger } from "./logger.js";

export function compareData(saved, current) {
  const diffs = [];
  for (const key in saved) {
    if (saved[key] != current[key]) {
      diffs.push({
        field: key,
        saved: saved[key],
        current: current[key],
      });
    }
  }
  logger.info("Differences found:", diffs);
  return diffs;
}


export const logger = {
  info: (...args) => console.log("[BG Autofill]", ...args),
  warn: (...args) => console.warn("[BG Autofill]", ...args),
  error: (...args) => console.error("[BG Autofill]", ...args),
};


import { initCrmFinleo } from "./sites/crm.js";
import { initIngoBank } from "./sites/ingobank.js";

(function() {
  "use strict";

  const url = window.location.href;

  if (url.includes("crm.finleo.ru/orders/")) {
    initCrmFinleo();
  }
  if (url.includes("market.bg.ingobank.ru/tasks")) {
    initIngoBank();
  }
})();


import { logger } from "../logger.js";
import { $, $all, createButton } from "../utils/dom.js";
import { styles } from "../styles.js";
import { cleanText, extractNumber } from "../utils/parse.js";
import { saveData } from "../storage.js";

export function initCrmFinleo() {
  logger.info("CRM Finleo detected");

  const panel = document.createElement("div");
  panel.style.margin = "10px";
  const saveBtn = createButton("💾 Сохранить данные", () => {
    const data = {
      inn: cleanText($("input[name='inn']")?.value),
      need: cleanText($("input[name='need']")?.value),
      notice: cleanText($("input[name='notice']")?.value),
      price: extractNumber($("input[name='price']")?.value),
      sum: extractNumber($("input[name='sum']")?.value),
      term: cleanText($("input[name='term']")?.value),
    };
    saveData(data);
    logger.info("Данные сохранены", data);
    alert("✅ Данные сохранены!");
  });

  panel.appendChild(saveBtn);
  document.body.appendChild(panel);

  GM_addStyle(styles);
}


import { logger } from "../logger.js";
import { $, createButton } from "../utils/dom.js";
import { styles } from "../styles.js";
import { loadData } from "../storage.js";

export function initIngoBank() {
  logger.info("IngoBank detected");

  const panel = document.createElement("div");
  panel.style.margin = "10px";
  const fillBtn = createButton("⚡ Заполнить форму", () => {
    const data = loadData();
    if (!data) {
      alert("❌ Нет сохранённых данных");
      return;
    }
    $("input[name='inn']").value = data.inn;
    $("input[name='need']").value = data.need;
    $("input[name='notice']").value = data.notice;
    $("input[name='price']").value = data.price;
    $("input[name='sum']").value = data.sum;
    $("input[name='term']").value = data.term;

    logger.info("Форма заполнена", data);
  });

  panel.appendChild(fillBtn);
  document.body.appendChild(panel);

  GM_addStyle(styles);
}





export function saveData(data) {
  GM_setValue("bg_data", data);
}

export function loadData() {
  return GM_getValue("bg_data", null);
}


export const styles = `
  .bg-autofill-btn {
    background: #4cafef;
    border: none;
    padding: 6px 12px;
    margin: 4px;
    cursor: pointer;
    border-radius: 4px;
    color: #fff;
    font-size: 14px;
  }
  .bg-autofill-btn:hover {
    background: #3b8bd7;
  }
`;


export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function createButton(text, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.className = "bg-autofill-btn";
  btn.addEventListener("click", onClick);
  return btn;
}


export function extractNumber(text) {
  if (!text) return 0;
  const match = text.replace(/\s/g, "").match(/[\d.,]+/);
  return match ? parseFloat(match[0].replace(",", ".")) : 0;
}

export function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, " ") : "";
}


