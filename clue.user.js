// ==UserScript==
// @name         ClueDB
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Comments
// @author       VladNevermore
// @match        https://crm.finleo.ru/crm/orders/*
// @icon         https://i.pinimg.com/736x/78/53/ad/7853ade6dd49b8caba4d1037e7341323.jpg
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/clue.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/clue.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔧 Скрипт загружен');

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy5YzeIzAtbaP4BN03W_lcur8LWzG7wGbS9ymnmWjFa1xgLoJskvCxtf6VKskNd5I7/exec?action=read';

    let commentsCache = {};
    const REFRESH_INTERVAL = 5000;

    function fetchComments() {
    console.log('📡 Запрашиваю комментарии из Google Sheets...');
    GM_xmlhttpRequest({
        method: 'GET',
        url: APPS_SCRIPT_URL,
        onload: function(response) {
            console.log('✅ Ответ получен, статус:', response.status);
            try {
                const data = JSON.parse(response.responseText);
                if (data && typeof data === 'object' && !data.error) {
                    commentsCache = data;
                    console.log('💬 Комментарии обновлены:', commentsCache);
                } else {
                    console.error('❌ Ошибка в ответе:', data);
                }
            } catch (e) {
                console.error('❌ Ошибка парсинга JSON:', e);
            }
            scanAndAttach();
        },
        onerror: function(err) {
            console.error('❌ Ошибка запроса к Google Apps Script:', err);
        }
    });
}

    const tooltip = document.createElement('div');
    tooltip.id = 'bank-comment-tooltip';
    tooltip.style.cssText = `
        position: fixed; background: #222222; color: #ffffff; padding: 10px 14px;
        border-radius: 6px; font-size: 13px; max-width: 320px; white-space: pre-wrap;
        z-index: 99999; pointer-events: none; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 1px solid #444; font-family: sans-serif; line-height: 1.4;
    `;
    document.body.appendChild(tooltip);

    function showTooltip(e, text) {
        if (!text) return;
        tooltip.textContent = text;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    }

    function moveTooltip(e) {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        }
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    function scanAndAttach() {
        const cells = document.querySelectorAll('td, div, span, [aria-label]');

        cells.forEach(element => {
            let bankName = '';

            if (element.hasAttribute('aria-label')) {
                bankName = element.getAttribute('aria-label').trim();
            } else if (element.children.length === 0 && element.textContent) {
                bankName = element.textContent.trim();
            }

            if (!bankName || bankName.length < 3) return;

            const matchedBank = Object.keys(commentsCache).find(key =>
                bankName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(bankName.toLowerCase())
            );

            if (!matchedBank) return;
            if (element.dataset.bankCommentAttached) return;

            element.dataset.bankCommentAttached = '1';
            element.style.cursor = 'help';
            element.style.borderBottom = '1px dashed #007bff';

            console.log('🔗 Привязана подсказка к элементу:', bankName, '-> база:', matchedBank);

            element.addEventListener('mouseenter', (e) => {
                const comment = commentsCache[matchedBank] || '';
                showTooltip(e, comment);
            });
            element.addEventListener('mousemove', moveTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        });
    }

    fetchComments();
    setInterval(fetchComments, REFRESH_INTERVAL);

    const observer = new MutationObserver(() => {
        scanAndAttach();
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
