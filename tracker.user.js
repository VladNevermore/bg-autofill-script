// ==UserScript==
// @name         Перенос трека времени
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  -
// @author       VladNevermore
// @match        https://docs.google.com/spreadsheets/d/1Aey5mZAQi4vbvri81WyCeSjwKwlH_eHuwbb0aTGAZwk/edit*
// @match        https://tracker.yandex.ru/*
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/tracker.user.js
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/tracker.user.js
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'tracker_time_queue';
    const LOG_KEY = 'tracker_time_log';

    function extractTaskKey(title) {
        const match = title.match(/^([A-Z]+-\d+)/);
        return match ? match[1] : null;
    }

    function parseClipboardData(text) {
        const lines = text.trim().split(/\r?\n/);
        const entries = [];
        for (let line of lines) {
            const cols = line.split('\t');
            while (cols.length < 6) {
                cols.push('');
            }
            const date = cols[0].trim();
            const taskTitle = cols[1].trim();
            const minutes = cols[4].trim();
            const comment = cols[5] ? cols[5].trim() : '';
            const key = extractTaskKey(taskTitle);
            if (!key) continue;
            entries.push({ key, minutes, comment, title: taskTitle });
        }
        return entries;
    }

    async function readClipboard() {
        try {
            return await navigator.clipboard.readText();
        } catch (e) {
            return prompt('Вставь скопированные строки:');
        }
    }

    function showToast(message, type = 'info') {
        const existing = document.getElementById('tracker-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'tracker-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : '#1976d2'};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            font-family: sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            opacity: 1;
            transition: opacity 0.5s;
            white-space: pre-line;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 7000);
    }

    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error(`Timeout: ${selector}`));
                requestAnimationFrame(check);
            };
            check();
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function setNativeValue(el, value) {
        if (el instanceof HTMLInputElement) {
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(el, value);
        } else if (el instanceof HTMLTextAreaElement) {
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
            nativeSetter.call(el, value);
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    async function addLog(entry, success, errorReason = '') {
        const log = await GM_getValue(LOG_KEY, []);
        if (success) {
            log.push(`✅ ${entry.title}`);
        } else {
            log.push(`❌ ${entry.title}${errorReason ? ': ' + errorReason : ''}`);
        }
        await GM_setValue(LOG_KEY, log);
    }

    async function processTask(entry) {
        try {

            let timeBtn;
            try {
                timeBtn = await waitForElement('div.TimeTracking button.Bubble-Button');
            } catch (e) {
                await addLog(entry, false, 'не найдена кнопка времени');
                return false;
            }
            timeBtn.click();
            await sleep(700);
            let spentField;
            try {
                spentField = await waitForElement('input.g-text-input__control[id^="spent-field"]', 10000);
            } catch (e) {
                await addLog(entry, false, 'не появилось поле Списано');
                return false;
            }
            spentField.focus();
            setNativeValue(spentField, `${entry.minutes}м`);
            await sleep(100);
            spentField.blur();
            let commentField;
            try {
                commentField = await waitForElement('textarea.g-text-area__control[id^="comment-field"]', 5000);
            } catch (e) {
                commentField = null;
            }
            if (commentField) {
                commentField.focus();
                setNativeValue(commentField, entry.comment);
                await sleep(100);
                commentField.blur();
            }
            await sleep(200);
            let saveBtn;
            try {
                saveBtn = await waitForElement('button.FieldEdit-Submit', 5000);
            } catch (e) {
                await addLog(entry, false, 'не найдена кнопка Сохранить');
                return false;
            }
            if (saveBtn.hasAttribute('disabled')) {
                await sleep(500);
            }
            saveBtn.click();
            await sleep(2000);
            await addLog(entry, true);
            return true;
        } catch (e) {
            console.error('processTask error', e);
            await addLog(entry, false, 'непредвиденная ошибка: ' + e.message);
            return false;
        }
    }

    async function checkAndProcessQueue() {
        try {
            const queue = await GM_getValue(STORAGE_KEY, []);
            if (!queue.length) return;

            const taskMatch = window.location.href.match(/https:\/\/tracker\.yandex\.ru\/([A-Z]+-\d+)/);
            const currentKey = taskMatch ? taskMatch[1] : null;
            const expectedKey = queue[0].key;

            if (currentKey !== expectedKey) {
                console.warn(`Task ${expectedKey} not found on current page (URL key: ${currentKey})`);
                await addLog(queue[0], false, 'задача не найдена (возможно, удалена или нет доступа)');

                queue.shift();

                if (queue.length > 0) {
                    await GM_setValue(STORAGE_KEY, queue);
                    window.location.href = `https://tracker.yandex.ru/${queue[0].key}`;
                } else {
                    const log = await GM_getValue(LOG_KEY, []);
                    const numberedLog = log.map((entry, idx) => `${idx+1}. ${entry}`).join('\n');
                    const hasError = log.some(e => e.startsWith('❌'));
                    showToast(numberedLog || 'Нет задач', hasError ? 'error' : 'success');
                    await GM_setValue(STORAGE_KEY, []);
                    await GM_setValue(LOG_KEY, []);
                }
                return;
            }

            console.log(`Processing: ${expectedKey}`);
            await processTask(queue[0]);

            queue.shift();

            if (queue.length === 0) {
                const log = await GM_getValue(LOG_KEY, []);
                const numberedLog = log.map((entry, idx) => `${idx+1}. ${entry}`).join('\n');
                const hasError = log.some(e => e.startsWith('❌'));
                showToast(numberedLog || 'Нет задач', hasError ? 'error' : 'success');
                await GM_setValue(STORAGE_KEY, []);
                await GM_setValue(LOG_KEY, []);
                return;
            }

            await GM_setValue(STORAGE_KEY, queue);
            window.location.href = `https://tracker.yandex.ru/${queue[0].key}`;
        } catch (e) {
            console.error('checkAndProcessQueue error', e);
            const log = await GM_getValue(LOG_KEY, []);
            if (log.length > 0) {
                const numberedLog = log.map((e, i) => `${i+1}. ${e}`).join('\n');
                showToast('⚠️ Критическая ошибка:\n' + numberedLog, 'error');
            }
            await GM_setValue(STORAGE_KEY, []);
            await GM_setValue(LOG_KEY, []);
        }
    }

    function addButtonToSheet() {
        const btn = document.createElement('button');
        btn.textContent = '📋 Скопируй и нажми';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 12px 20px;
            background: #ffcc00;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-weight: bold;
        `;
        btn.addEventListener('click', async () => {
            const text = await readClipboard();
            if (!text || !text.trim()) {
                showToast('Буфер обмена пуст', 'error');
                return;
            }
            const entries = parseClipboardData(text);
            if (!entries.length) {
                showToast('Не найдено строк с задачами', 'error');
                return;
            }
            await GM_setValue(STORAGE_KEY, entries);
            await GM_setValue(LOG_KEY, []);
            window.open(`https://tracker.yandex.ru/${entries[0].key}`, '_blank');
        });
        document.body.appendChild(btn);
    }

    function init() {
        if (window.location.hostname === 'docs.google.com') {
            window.addEventListener('load', () => {
                setTimeout(addButtonToSheet, 2000);
            });
        } else if (window.location.hostname === 'tracker.yandex.ru') {
            window.addEventListener('load', () => {
                setTimeout(checkAndProcessQueue, 1000);
            });
        }
    }

    init();
})();
