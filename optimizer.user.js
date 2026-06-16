// ==UserScript==
// @name         Optimizer Fixed
// @namespace    http://tampermonkey.net
// @version      4.2
// @description  Ширина колонок + реорганизация вкладки «Информация»
// @author       Vladnevermore
// @match        https://crm.finleo.ru/crm/orders*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/optimizer.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/optimizer.user.js
// ==/UserScript==

(function() {
    'use strict';

    // true | false
    const ENABLE_INFO_OPTIMIZATION = false;

    const globalStyle = document.createElement('style');
    globalStyle.innerHTML = `
        .tableCell {
            padding: 4px 8px !important;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .MuiTypography-noWrap {
            white-space: normal !important;
            word-break: break-word !important;
        }
    `;
    document.head.appendChild(globalStyle);

    if (ENABLE_INFO_OPTIMIZATION) {
        const compactStyle = document.createElement('style');
        compactStyle.innerHTML = `
            #tabpanel-info .dDLOXv {
                padding-top: 2px !important;
                padding-bottom: 2px !important;
                margin: 0 !important;
                line-height: 1.3 !important;
            }
            #tabpanel-info .fSMIHc, #tabpanel-info .T6Ajj {
                padding-top: 1px !important;
                padding-bottom: 1px !important;
            }
            #tabpanel-info .lLKwF {
                line-height: 1.2 !important;
            }
            #tabpanel-info .ibrElz {
                line-height: 1.3 !important;
            }
            #tabpanel-info .sc-b2b62017-0 {
                margin-bottom: 4px !important;
            }
            #tabpanel-info .sc-b2b62017-1 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
            }
            #tabpanel-info .dvHpGG {
                margin-bottom: 2px !important;
            }
            #tabpanel-info .dywka-D {
                padding: 0 !important;
            }
        `;
        document.head.appendChild(compactStyle);
    }

    const defaultWidths = {
        "Действия": "185px",
        "Наименование": "250px",
        "Чат": "60px",
        "К.": "60px",
        "Выбран": "80px",
        "Статус": "225px",
        "Комментарий": "150px",
        "Отработка КС": "200px",
        "Статус банка": "235px",
        "Номер в банке": "150px"
    };
    let currentWidths = {};

    function loadWidths() {
        const saved = localStorage.getItem('optimizerFixedWidths');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                currentWidths = { ...defaultWidths, ...parsed };
            } catch(e) { currentWidths = { ...defaultWidths }; }
        } else {
            currentWidths = { ...defaultWidths };
        }
    }

    function applyWidthsToTable() {
        const table = document.querySelector('table');
        if (!table) return;
        const headers = table.querySelectorAll('thead td.tableCell');
        headers.forEach((header, idx) => {
            const headerText = header.textContent.trim();
            if (currentWidths.hasOwnProperty(headerText)) {
                const width = currentWidths[headerText];
                header.style.setProperty('width', width, 'important');
                header.style.setProperty('min-width', width, 'important');
                const cells = table.querySelectorAll(`tbody tr td:nth-child(${idx + 1})`);
                cells.forEach(cell => {
                    cell.style.setProperty('width', width, 'important');
                    cell.style.setProperty('min-width', width, 'important');
                });
            }
        });
    }

    function createInfoRow(label, value) {
        const row = document.createElement('div');
        row.className = 'sc-ccd2f869-0 dDLOXv';
        row.innerHTML = `
            <div class="sc-ccd2f869-1 fSMIHc">
                <div class="sc-ccd2f869-2 lLKwF">${label}</div>
            </div>
            <div class="T6Ajj">
                <div class="sc-ccd2f869-3 ibrElz">${value}</div>
                <button class="sc-eqUAAB fYgeZz MuiButtonBase-root sc-jsJBEQ fYMrDR MuiIconButton-root MuiIconButton-sizeMedium sc-6a870b45-0 dkWFUP" tabindex="0" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,34H88a6,6,0,0,0-6,6V82H40a6,6,0,0,0-6,6V216a6,6,0,0,0,6,6H168a6,6,0,0,0,6-6V174h42a6,6,0,0,0,6-6V40A6,6,0,0,0,216,34ZM162,210H46V94H162Zm48-48H174V88a6,6,0,0,0-6-6H94V46H210Z"></path>
                    </svg>
                </button>
            </div>
        `;
        return row;
    }

    function moveCommentInside(tabPanel) {
        const rowsContainer = tabPanel.querySelector('[rowscount]');
        if (!rowsContainer) return;
        const commentBlock = tabPanel.querySelector('.dDLOXv.feYFT');
        if (!commentBlock || rowsContainer.contains(commentBlock)) return;
        rowsContainer.appendChild(commentBlock);
    }

    function optimizeInfoTab() {
        if (!ENABLE_INFO_OPTIMIZATION) return;

        const tabPanel = document.getElementById('tabpanel-info');
        if (!tabPanel || tabPanel.dataset.infoOptimized === 'true') return;
        const targetField = Array.from(tabPanel.querySelectorAll('.lLKwF'))
            .find(el => el.textContent.trim() === 'Срок c');
        if (!targetField) return;

        const switchLabels = tabPanel.querySelectorAll('.MuiFormControlLabel-label');
        switchLabels.forEach(label => {
            if (label.textContent.trim() === 'ГО') {
                const container = label.closest('.dywka-D');
                if (container) container.remove();
            }
        });

        const allRows = Array.from(tabPanel.querySelectorAll('.dDLOXv:not(.feYFT)'));
        const fieldsToRemove = ['Иностранный заказчик', 'Требуется ГО', 'Дата создания'];
        const rowsToRemove = [];
        let dateFromValue = null, dateToValue = null, dateFromRow = null, dateToRow = null;
        let advanceValue = null, advancePercentValue = null, advanceSumValue = null;
        let advanceRow = null, advancePercentRow = null, advanceSumRow = null;
        let needValue = null, closedValue = null, lawValue = null;
        let needRow = null, closedRow = null, lawRow = null;
        let innValue = null, custValue = null;
        let innRow = null, custRow = null;

        allRows.forEach(row => {
            const labelEl = row.querySelector('.lLKwF');
            if (!labelEl) return;
            const labelText = labelEl.textContent.trim();

            if (fieldsToRemove.includes(labelText)) {
                rowsToRemove.push(row);
            } else if (labelText === 'Потребность') {
                needValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                needRow = row;
            } else if (labelText === 'Закрытый конкурс') {
                closedValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                closedRow = row;
            } else if (labelText === 'Закон') {
                lawValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                lawRow = row;
            } else if (labelText === 'ИНН заказчика') {
                innValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                innRow = row;
            } else if (labelText === 'Заказчик') {
                custValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                custRow = row;
            } else if (labelText === 'Срок c') {
                dateFromValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                dateFromRow = row;
            } else if (labelText === 'Срок до') {
                dateToValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                dateToRow = row;
            } else if (labelText === 'Аванс') {
                advanceValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                advanceRow = row;
            } else if (labelText === '% аванса') {
                advancePercentValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                advancePercentRow = row;
            } else if (labelText === 'Сумма аванса') {
                advanceSumValue = row.querySelector('.ibrElz')?.textContent.trim() || '';
                advanceSumRow = row;
            }
        });

        rowsToRemove.forEach(row => row.remove());

        if (needValue !== null && closedValue !== null && lawValue !== null) {
            const competition = (closedValue === 'Нет' || closedValue === 'Нет') ? 'Открытый' : 'Закрытый';
            const combined = `${needValue}, ${competition} конкурс, ${lawValue}`;
            const newRow = createInfoRow('Потребность', combined);
            if (needRow) {
                needRow.parentNode.insertBefore(newRow, needRow);
                needRow.remove();
            }
            if (closedRow) closedRow.remove();
            if (lawRow) lawRow.remove();
        }

        if (innValue !== null && custValue !== null) {
            const combined = `${innValue}, ${custValue}`;
            const newRow = createInfoRow('ИНН заказчика', combined);
            if (innRow) {
                innRow.parentNode.insertBefore(newRow, innRow);
                innRow.remove();
            }
            if (custRow) custRow.remove();
        }

        if (dateFromValue !== null && dateToValue !== null && dateFromRow) {
            const newRow = createInfoRow('Срок', `${dateFromValue} по ${dateToValue}`);
            dateFromRow.parentNode.insertBefore(newRow, dateFromRow);
            dateFromRow.remove();
            if (dateToRow) dateToRow.remove();
        }

        if (advanceValue !== null && advancePercentValue !== null && advanceSumValue !== null) {
            const combined = `${advanceValue}, ${advancePercentValue}, ${advanceSumValue}`;
            const newRow = createInfoRow('Аванс', combined);
            if (advanceRow) {
                advanceRow.parentNode.insertBefore(newRow, advanceRow);
                advanceRow.remove();
            }
            if (advancePercentRow) advancePercentRow.remove();
            if (advanceSumRow) advanceSumRow.remove();
        }

        moveCommentInside(tabPanel);
        tabPanel.dataset.infoOptimized = 'true';
    }

    const observer = new MutationObserver(() => {
        applyWidthsToTable();
        if (!ENABLE_INFO_OPTIMIZATION) return;
        const tabPanel = document.getElementById('tabpanel-info');
        if (tabPanel && tabPanel.dataset.infoOptimized !== 'true') {
            optimizeInfoTab();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    loadWidths();
    applyWidthsToTable();
    window.addEventListener('load', () => {
        if (!ENABLE_INFO_OPTIMIZATION) return;
        const tabPanel = document.getElementById('tabpanel-info');
        if (tabPanel) optimizeInfoTab();
    });
})();
