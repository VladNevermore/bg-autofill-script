// ==UserScript==
// @name         Автотекст 3.0
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Автотекст с загрузкой данных из Google Таблицы
// @match        https://crm.finleo.ru/crm/orders/*
// @author       VladNevermore
// @icon         https://i.pinimg.com/736x/78/53/ad/7853ade6dd49b8caba4d1037e7341323.jpg
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autotext.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autotext.user.js
// ==/UserScript==

(function() {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy5YzeIzAtbaP4BN03W_lcur8LWzG7wGbS9ymnmWjFa1xgLoJskvCxtf6VKskNd5I7/exec?action=getConfig';

    let bankConfigs = {};
    let isDataLoaded = false;

    const styles = `
        .tm-autofill-container {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
        }

        .tm-autofill-btn {
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 3px;
            width: 24px;
            height: 24px;
            font-size: 12px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tm-autofill-btn:hover {
            background: #1976D2;
        }

        .tm-autofill-select {
            background: white;
            color: #333;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px;
            font-size: 12px;
            min-width: 180px;
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tm-autofill-select option {
            padding: 6px 8px;
        }

        .tm-offer-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const log = (message, data = null) => {
        console.log(`[Offer Autofill] ${message}`, data || '');
    };

    let isDropdownOpen = false;

    const setReactInputValue = (element, value) => {
        element.focus();
        let nativeInputValueSetter;
        if (element.tagName === 'TEXTAREA') {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        } else if (element.tagName === 'INPUT') {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        }
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const setCommentValue = (element, value) => {
        if (!element) return;
        try {
            setReactInputValue(element, value);
        } catch (e) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    const findCommentField = () => {
        const textareas = document.querySelectorAll('textarea[name="comment"]');
        for (const ta of textareas) {
            let parent = ta.closest('.MuiFormControl-root');
            if (!parent) continue;
            const label = parent.querySelector('label');
            if (label && label.textContent.trim() === 'Комментарий') {
                if (!ta.closest('td')) return ta;
            }
        }
        return null;
    };

    const createAutofillButton = () => {
        if (!isDataLoaded) {
            log('Данные ещё не загружены, кнопка будет создана позже');
            return;
        }

        const commentField = findCommentField();
        if (!commentField) return;

        const existingContainer = commentField.parentElement?.querySelector('.tm-autofill-container');
        if (existingContainer) existingContainer.remove();

        const container = document.createElement('div');
        container.className = 'tm-autofill-container';

        const button = document.createElement('button');
        button.className = 'tm-autofill-btn';
        button.textContent = '📝';
        button.title = 'Автозаполнение';
        button.type = 'button';

        const select = document.createElement('select');
        select.className = 'tm-autofill-select';
        select.style.display = 'none';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите банк...';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        select.appendChild(defaultOption);

        Object.keys(bankConfigs).forEach(bankName => {
            const option = document.createElement('option');
            option.value = bankName;
            option.textContent = bankName;
            select.appendChild(option);
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isDropdownOpen) {
                select.style.display = 'none';
                isDropdownOpen = false;
            } else {
                select.style.display = 'block';
                select.focus();
                isDropdownOpen = true;
            }
        });

        select.addEventListener('change', (e) => {
            const selectedBank = e.target.value;
            if (selectedBank) {
                log(`Выбран банк: ${selectedBank}`);
                fillOfferData(selectedBank);
                e.target.value = '';
                select.style.display = 'none';
                isDropdownOpen = false;
            }
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target) && isDropdownOpen) {
                select.style.display = 'none';
                isDropdownOpen = false;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isDropdownOpen) {
                select.style.display = 'none';
                isDropdownOpen = false;
            }
        });

        container.appendChild(button);
        container.appendChild(select);

        const commentContainer = commentField.closest('.MuiInputBase-root');
        if (commentContainer) {
            commentContainer.style.position = 'relative';
            commentContainer.appendChild(container);
        }
    };

    const fillOfferData = (bankName) => {
        const config = bankConfigs[bankName];
        if (!config) return;

        try {
            const commentField = findCommentField();
            if (commentField && config.comment) {
                setCommentValue(commentField, config.comment);
                log('Комментарий заполнен');
            }
            if (config.sender) {
                fillSenderField(config.sender);
            }
            showStatus(`✅ Данные для ${bankName} заполнены!`, 3000);
        } catch (error) {
            showStatus('❌ Ошибка при автозаполнении', 3000);
        }
    };

    const fillSenderField = (targetSender) => {
        const senderContainer = document.querySelector('div[name="ourCompanyNameId"]');
        if (!senderContainer) return;

        const input = senderContainer.querySelector('input[placeholder="Поиск..."]');
        if (!input) return;

        input.click();
        const popupIndicator = senderContainer.querySelector('.MuiAutocomplete-popupIndicator');
        if (popupIndicator) popupIndicator.click();

        const waitForOptions = (timeout = 3000) => {
            return new Promise((resolve) => {
                const startTime = Date.now();
                const checkOptions = () => {
                    const options = document.querySelectorAll('[role="option"]');
                    if (options.length > 0) {
                        resolve(Array.from(options));
                        return;
                    }
                    if (Date.now() - startTime > timeout) {
                        resolve([]);
                        return;
                    }
                    const observer = new MutationObserver(() => {
                        const opts = document.querySelectorAll('[role="option"]');
                        if (opts.length > 0) {
                            observer.disconnect();
                            resolve(Array.from(opts));
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                    setTimeout(() => {
                        observer.disconnect();
                        resolve([]);
                    }, timeout - (Date.now() - startTime));
                };
                checkOptions();
            });
        };

        waitForOptions(2000).then((options) => {
            let targetOption = options.find(opt => opt.textContent.includes(targetSender));
            if (targetOption) {
                targetOption.click();
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();
                return;
            }
            input.value = targetSender;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            waitForOptions(2000).then((newOptions) => {
                let found = newOptions.find(opt => opt.textContent.includes(targetSender));
                if (found) {
                    found.click();
                } else if (newOptions.length > 0) {
                    newOptions[0].click();
                }
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();
            });
        });
    };

    const showStatus = (message, duration = 3000) => {
        const existing = document.querySelector('.tm-offer-status');
        if (existing) existing.remove();
        const statusEl = document.createElement('div');
        statusEl.className = 'tm-offer-status';
        statusEl.textContent = message;
        document.body.appendChild(statusEl);
        setTimeout(() => statusEl.remove(), duration);
    };

    function loadConfigFromSheet() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: APPS_SCRIPT_URL,
            onload: function(response) {
                try {
                    const banksArray = JSON.parse(response.responseText);
                    if (Array.isArray(banksArray)) {
                        banksArray.forEach(item => {
                            bankConfigs[item.name] = {
                                comment: item.comment,
                                sender: item.sender
                            };
                        });
                        isDataLoaded = true;
                        log('✅ Конфигурация банков загружена, банков: ' + Object.keys(bankConfigs).length);
                        createAutofillButton();
                    }
                } catch (e) {
                    log('❌ Ошибка парсинга конфигурации из Google Sheets', e);
                    showStatus('⚠️ Не удалось загрузить данные автозаполнения', 5000);
                    isDataLoaded = true;
                    createAutofillButton();
                }
            },
            onerror: function(err) {
                log('❌ Ошибка сети при загрузке конфигурации', err);
                showStatus('⚠️ Нет связи с Google Sheets', 5000);
                isDataLoaded = true;
                createAutofillButton();
            }
        });
    }

    const initObserver = () => {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.querySelector && node.querySelector('textarea[name="comment"]')) {
                                shouldUpdate = true;
                            }
                            if (node.matches && node.matches('textarea[name="comment"]')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });
            if (shouldUpdate) {
                setTimeout(createAutofillButton, 500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(createAutofillButton, 1000);
        setTimeout(createAutofillButton, 3000);
    };

    log('🚀 Скрипт автозаполнения запущен');
    loadConfigFromSheet();
    initObserver();
})();
