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
