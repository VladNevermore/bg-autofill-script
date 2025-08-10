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
