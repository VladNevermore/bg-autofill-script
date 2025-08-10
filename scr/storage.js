export function saveData(data) {
  GM_setValue("bg_data", data);
}

export function loadData() {
  return GM_getValue("bg_data", null);
}
