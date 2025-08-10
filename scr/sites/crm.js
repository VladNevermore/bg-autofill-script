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
