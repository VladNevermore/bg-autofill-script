// ==UserScript==
// @name         Автозаполнение и проверка параметров DEV NEW
// @namespace    http://tampermonkey.net/
// @version      15.7
// @description  Автозаполнение форм и сравнение параметров
// @match        https://crm.finleo.ru/crm/orders/*
// @match        https://market.bg.ingobank.ru/tasks*
// @match        https://bg.realistbank.ru/new_ticket*
// @author       VladNevermore
// @icon         https://i.pinimg.com/736x/78/53/ad/7853ade6dd49b8caba4d1037e7341323.jpg
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      zakupki.gov.ru
// @connect      www.zakupki.gov.ru
// @connect      epz.zakupki.gov.ru
// @connect      *
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script1.dev.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script1.dev.js
// ==/UserScript==

(function() {
    'use strict';

    const testData = {
        inn: '532117984747',
        notice: '0365300050225000167',
        period: '31.10.2025 — 31.01.2029 / 1188 дн.',
        startDate: '31.10.2025',
        endDate: '31.01.2029',
        price: '1500000',
        sum: '75000',
        law: '44',
        advanceAmount: '300000',
        initialPrice: '1500000',
        proposedPrice: '1450000',
        email: "b.documents@bk.ru",
        guaranteeInfo: {
            ingoType: '1',
            bank2Type: 'EXEC',
            realistType: '2',
            priceField: 'Предложенная цена',
            proposedPriceField: 'Предложенная цена'
        }
    };

    const loadTestData = () => {
        GM_setValue('bankRequestData', testData);
        console.log('Тестовые данные загружены:', testData);
        showStatus('✅ Тестовые данные загружены!', 3000);
    };

    GM_addStyle(`
        .tm-control-btn {
            position: fixed;
            z-index: 9999;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-size: 14px;
            transition: all 0.2s;
            display: none;
        }
        .tm-control-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .tm-save-btn { background: #4CAF50; color: white; bottom: 20px; right: 20px; }
        .tm-profile-btn { background: #9C27B0; color: white; bottom: 80px; right: 20px; }
        .tm-fill-btn { background: #2196F3; color: white; bottom: 140px; right: 20px; }
        .tm-fast-btn { background: #FF5722; color: white; bottom: 200px; right: 20px; }
        .tm-like-btn { background: #FF9800; color: white; bottom: 260px; right: 20px; }
        .tm-realist-btn { background: #607D8B; color: white; bottom: 320px; right: 20px; }
        .tm-compare-btn { background: #17a2b8; color: white; bottom: 380px; right: 20px; }
        .tm-test-btn { background: #795548; color: white; bottom: 440px; right: 20px; }
        .tm-status {
            position: fixed;
            z-index: 9998;
            bottom: 500px;
            right: 20px;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: none;
        }
        .tm-toggle-container {
            position: fixed;
            z-index: 10000;
            top: 150px;
            right: 10px;
            background: rgba(255,255,255,0.9);
            padding: 5px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
        }
        .tm-toggle-label {
            margin-right: 5px;
            font-size: 12px;
            color: #333;
        }
        .tm-toggle-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
        }
        .tm-toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .tm-toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
        }
        .tm-toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .tm-toggle-slider { background-color: #2196F3; }
        input:checked + .tm-toggle-slider:before { transform: translateX(20px); }

        .highlight {
            background-color: #fff3cd !important;
            color: #856404 !important;
            border: 1px solid #ffeeba !important;
            padding: 2px 5px !important;
            border-radius: 4px !important;
        }
        .match {
            background-color: #d4edda !important;
            color: #155724 !important;
            border: 1px solid #c3e6cb !important;
            padding: 2px 5px !important;
            border-radius: 4px !important;
        }
        .warning {
            background-color: #f8d7da !important;
            color: #721c24 !important;
            border: 1px solid #f5c6cb !important;
            padding: 2px 5px !important;
            border-radius: 4px !important;
        }
    `);

    const log = (message, data = null) => {
        console.log(`[BG Script] ${message}`, data || '');
    };

    const showStatus = (message, duration = 3000) => {
        const existing = document.querySelector('.tm-status');
        if (existing) existing.remove();

        const statusEl = document.createElement('div');
        statusEl.className = 'tm-status';
        statusEl.textContent = message;
        document.body.appendChild(statusEl);

        if (duration) setTimeout(() => statusEl.remove(), duration);
        return statusEl;
    };

    const normalizeNumber = (text) => {
        if (!text) return '';
        return text.replace(/\s/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
    };

    const extractNumber = (text) => {
        if (!text) return '';
        const cleaned = text.replace(/[^\d\s,.]/g, '');
        const numStr = cleaned.replace(/,/g, '.').replace(/\s/g, '');
        const num = parseFloat(numStr);
        return isNaN(num) ? '' : num.toString();
    };

    const extractCleanPrice = (text) => {
        if (!text) return '';
        const cleanText = text.split('₽')[0].trim();
        return extractNumber(cleanText);
    };

    const extractAdvanceAmount = (text) => {
        if (!text) return '';
        const parts = text.split('/');
        if (parts.length > 1) {
            const amountPart = parts[1].trim();
            return extractCleanPrice(amountPart);
        }
        return '';
    };

    const extractStartDate = (text) => {
        if (!text) return '';
        const dates = text.match(/(\d{2}\.\d{2}\.\d{4})/g);
        return dates && dates.length > 0 ? dates[0] : '';
    };

    const extractEndDate = (text) => {
        if (!text) return '';
        const dates = text.match(/(\d{2}\.\d{2}\.\d{4})/g);
        return dates && dates.length > 1 ? dates[1] : (dates && dates.length > 0 ? dates[0] : '');
    };

    const extractLaw = (text) => {
        if (!text) return '';
        if (text.includes('615 ПП') || text.includes('185 ФЗ')) return '615';
        const match = text.match(/(44|223)\sФЗ/);
        return match ? match[1] : '';
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const cleaned = dateStr.replace(/[^\d.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const addMonths = (date, months) => {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    };

    const getCleanedElementText = (element) => {
        if (!element) return '';
        const clone = element.cloneNode(true);
        const buttons = clone.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        const chips = clone.querySelectorAll('[class*="Chip"], [class*="chip"]');
        chips.forEach(chip => chip.remove());
        return clone.textContent.trim();
    };

    const findFieldByLabel = (labelText) => {
        log(`Поиск поля по метке: "${labelText}"`);

        const containers = document.querySelectorAll('[class*="sc-"]');
        for (const container of containers) {
            const labelElement = Array.from(container.children).find(child => {
                const text = getCleanedElementText(child);
                return text && text === labelText;
            });
            if (labelElement) {
                const valueElement = Array.from(container.children).find(child => {
                    if (child === labelElement) return false;
                    const text = getCleanedElementText(child);
                    return text && text !== '';
                });
                if (valueElement) {
                    const result = getCleanedElementText(valueElement);
                    log(`Найдено значение для "${labelText}": "${result}"`);
                    return result;
                }
            }
        }

        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const elementText = getCleanedElementText(element);
            if (elementText && elementText === labelText) {
                log(`Найдена метка: "${labelText}"`, element);

                let currentElement = element.parentElement;
                let depth = 0;

                while (currentElement && depth < 10) {
                    const children = Array.from(currentElement.children);
                    const valueElement = children.find(child => {
                        if (child === element) return false;
                        const text = getCleanedElementText(child);
                        return text && text !== '';
                    });

                    if (valueElement) {
                        const result = getCleanedElementText(valueElement);
                        log(`Найдено значение для "${labelText}": "${result}"`);
                        return result;
                    }

                    currentElement = currentElement.parentElement;
                    depth++;
                }

                let nextElement = element.nextElementSibling;
                depth = 0;
                while (nextElement && depth < 5) {
                    const text = getCleanedElementText(nextElement);
                    if (text && text !== '') {
                        log(`Найдено значение для "${labelText}" в соседнем элементе: "${text}"`);
                        return text;
                    }
                    nextElement = nextElement.nextElementSibling;
                    depth++;
                }
            }
        }

        log(`Метка "${labelText}" не найдена`);
        return null;
    };

    const getInn = () => {
        log('Поиск ИНН');

        const captionElements = document.querySelectorAll('.MuiTypography-caption');
        for (const element of captionElements) {
            if (element.textContent && element.textContent.includes('ИНН')) {
                const innMatch = element.textContent.match(/\d{10,12}/);
                if (innMatch) {
                    const inn = innMatch[0];
                    log(`Получен ИНН из MuiTypography-caption: ${inn}`);
                    return inn;
                }
            }
        }

        const scElements = document.querySelectorAll('.sc-bRKDuR');
        for (const element of scElements) {
            if (element.textContent && element.textContent.includes('ИНН')) {
                const innMatch = element.textContent.match(/\d{10,12}/);
                if (innMatch) {
                    const inn = innMatch[0];
                    log(`Получен ИНН из sc-bRKDuR: ${inn}`);
                    return inn;
                }
            }
        }

        const elementsWithInn = document.querySelectorAll('*');
        for (const element of elementsWithInn) {
            if (element.textContent && element.textContent.includes('ИНН')) {
                const innMatch = element.textContent.match(/\d{10,12}/);
                if (innMatch) {
                    const inn = innMatch[0];
                    log(`Получен ИНН: ${inn}`);
                    return inn;
                }
            }
        }

        log('ИНН не найден');
        return '';
    };

    const getProcurementLink = () => {
        log('Поиск ссылки на закупку');

        const links = document.querySelectorAll('a');
        for (const link of links) {
            if (link.href && link.href.includes('zakupki.gov.ru')) {
                log('Найдена ссылка на закупки:', link.href);
                return link.href;
            }
        }

        const linkFromField = findFieldByLabel('Ссылка на закупку');
        if (linkFromField) {
            const linkMatch = linkFromField.match(/https?:\/\/[^\s]+/);
            if (linkMatch) {
                log('Найдена ссылка из поля:', linkMatch[0]);
                return linkMatch[0];
            }
        }

        log('Ссылка на закупку не найдена');
        return null;
    };

    const getGuaranteeType = (needText) => {
        log(`Определение типа гарантии для: ${needText}`);
        if (!needText) {
            log('Текст потребности пуст, используется значение по умолчанию');
            return {
                ingoType: '0',
                bank2Type: 'PART',
                realistType: '0',
                priceField: 'Начальная цена',
                proposedPriceField: 'Начальная цена'
            };
        }

        if (needText.includes('БГ на участие')) {
            log('Тип гарантии: БГ на участие');
            return {
                ingoType: '0',
                bank2Type: 'PART',
                realistType: '0',
                priceField: 'Начальная цена',
                proposedPriceField: 'Начальная цена'
            };
        } else if (needText.includes('БГ на исполнение')) {
            log('Тип гарантии: БГ на исполнение');
            return {
                ingoType: '1',
                bank2Type: 'EXEC',
                realistType: '2',
                priceField: 'Предложенная цена',
                proposedPriceField: 'Предложенная цена'
            };
        } else if (needText.includes('БГ на гарантийный срок')) {
            log('Тип гарантии: БГ на гарантийный срок');
            return {
                ingoType: '2',
                bank2Type: 'GARANT',
                realistType: '3',
                priceField: 'Предложенная цена',
                proposedPriceField: 'Предложенная цена'
            };
        }

        log('Тип гарантии не распознан, используется значение по умолчанию');
        return {
            ingoType: '0',
            bank2Type: 'PART',
            realistType: '0',
            priceField: 'Начальная цена',
            proposedPriceField: 'Начальная цена'
        };
    };

    const createToggleSwitch = () => {
        log('Создание переключателя кнопок');
        const container = document.createElement('div');
        container.className = 'tm-toggle-container';

        const label = document.createElement('span');
        label.className = 'tm-toggle-label';
        label.textContent = 'Кнопки';

        const switchContainer = document.createElement('label');
        switchContainer.className = 'tm-toggle-switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;

        const slider = document.createElement('span');
        slider.className = 'tm-toggle-slider';

        switchContainer.appendChild(checkbox);
        switchContainer.appendChild(slider);
        container.appendChild(label);
        container.appendChild(switchContainer);

        checkbox.addEventListener('change', function() {
            log(`Переключатель кнопок: ${this.checked ? 'включен' : 'выключен'}`);
            const buttons = document.querySelectorAll('.tm-control-btn, .tm-status');
            buttons.forEach(btn => {
                btn.style.display = this.checked ? 'block' : 'none';
            });
        });

        document.body.appendChild(container);
    };

    function createComparisonButton() {
        const button = document.createElement('button');
        button.className = 'tm-control-btn tm-compare-btn';
        button.textContent = 'Сравнить параметры';

        button.addEventListener('click', () => {
            log('Нажата кнопка сравнения параметров');
            const link = getProcurementLink();
            if (link) {
                log(`Ссылка найдена: ${link}`);
                compareParameters(link);
            } else {
                log('Ссылка не найдена');
                alert('Ссылка на закупку не найдена');
            }
        });

        document.body.appendChild(button);
    }

    async function compareParameters(procurementUrl) {
        try {
            showStatus('⏳ Сравнение параметров...', null);
            log('Начало сравнения параметров с URL:', procurementUrl);

            const procurementData = await fetchProcurementData(procurementUrl);
            const clientData = getClientData();
            const requirementType = getRequirementType(clientData.requirement);

            compareAndHighlight('Номер извещения', clientData.noticeNumber, procurementData.noticeNumber);
            compareAndHighlight('Предмет контракта', clientData.purchaseSubject, procurementData.purchaseSubject);
            compareAndHighlight('Начальная цена', clientData.maxPrice, procurementData.maxPrice);
            compareAndHighlightGuaranteePeriod(clientData.guaranteePeriod, procurementData, requirementType);

            if (requirementType === 'participation') {
                compareAndHighlightGuaranteeAmount('Сумма БГ', clientData.guaranteeAmount, procurementData.bidSecurityAmount, clientData, procurementData, requirementType);
            } else if (requirementType === 'execution') {
                compareAndHighlightGuaranteeAmount('Сумма БГ', clientData.guaranteeAmount, procurementData.contractSecurityAmount, clientData, procurementData, requirementType);
                compareAndHighlight('Аванс', clientData.advancePayment, procurementData.advancePayment);
            } else if (requirementType === 'warranty') {
                compareAndHighlightGuaranteeAmount('Сумма БГ', clientData.guaranteeAmount, procurementData.warrantySecurityAmount, clientData, procurementData, requirementType);
            }

            showStatus('✅ Сравнение завершено!', 5000);

        } catch (error) {
            console.error('Ошибка при сравнении параметров:', error);
            showStatus('❌ Ошибка при сравнении параметров: ' + error.message, 5000);
        }
    }

    function compareAndHighlightGuaranteeAmount(fieldName, clientValue, procurementValue, clientData, procurementData, requirementType) {
        log(`Сравнение суммы БГ: CRM="${clientValue}", Закупки="${procurementValue}"`);

        const field = findFieldElement(fieldName);
        if (field && field.valueElement) {
            log(`Найдено поле для подсветки:`, field.valueElement);

            field.valueElement.classList.remove('highlight', 'match', 'warning');

            let normalizedClient = normalizeNumber(clientValue);
            let normalizedProcurement = normalizeNumber(procurementValue);
            let tooltipText = '';

            if (procurementValue.includes('%')) {
                const percentMatch = procurementValue.match(/(\d+(?:,\d+)?)\s*%/);
                if (percentMatch) {
                    const percent = parseFloat(percentMatch[1].replace(',', '.'));
                    let priceValue = 0;

                    if (requirementType === 'participation') {
                        priceValue = parseFloat(normalizeNumber(clientData.maxPrice));
                    } else if (requirementType === 'execution' || requirementType === 'warranty') {
                        const proposedPrice = findFieldByLabel('Предложенная цена');
                        priceValue = parseFloat(normalizeNumber(proposedPrice || clientData.maxPrice));
                    }

                    if (!isNaN(percent) && !isNaN(priceValue) && priceValue > 0) {
                        const calculatedAmount = Math.round(priceValue * percent / 100);
                        normalizedProcurement = calculatedAmount.toString();
                        tooltipText = `На сайте гос. закупок указан процент: ${percent}%. Рассчитанная сумма: ${calculatedAmount.toLocaleString('ru-RU')} ₽`;
                    }
                }
            }

            if (!tooltipText) {
                tooltipText = procurementValue === 'Нет данных' ?
                    'Не удалось получить данные с сайта гос. закупок' :
                    'На сайте гос. закупок: ' + procurementValue;
            }

            const clientNum = parseFloat(normalizedClient);
            const procurementNum = parseFloat(normalizedProcurement);

            if (!isNaN(clientNum) && !isNaN(procurementNum)) {
                if (Math.abs(clientNum - procurementNum) < 1) {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = 'Совпадает с сайтом гос. закупок: ' + (tooltipText || procurementValue);
                } else if (procurementValue === 'Нет данных') {
                    field.valueElement.classList.add('warning');
                    field.valueElement.title = tooltipText;
                } else {
                    field.valueElement.classList.add('highlight');
                    field.valueElement.title = tooltipText;
                }
            } else if (procurementValue === 'Нет данных') {
                field.valueElement.classList.add('warning');
                field.valueElement.title = tooltipText;
            } else {
                field.valueElement.classList.add('highlight');
                field.valueElement.title = tooltipText;
            }
        } else {
            log(`❌ Не удалось найти поле "${fieldName}" для подсветки`);
        }
    }

    function compareAndHighlightGuaranteePeriod(clientValue, procurementData, requirementType) {
        log(`Сравнение срока БГ: CRM="${clientValue}", Закупки="${JSON.stringify(procurementData)}"`);

        const fieldNames = ['Срок БГ', 'Срок'];
        let field = null;

        for (const fieldName of fieldNames) {
            field = findFieldElement(fieldName);
            if (field) break;
        }

        if (field && field.valueElement) {
            log(`Найдено поле для подсветки:`, field.valueElement);

            field.valueElement.classList.remove('highlight', 'match', 'warning');

            const clientEndDate = extractEndDate(clientValue);
            const clientDate = parseDate(clientEndDate);

            if (!clientDate) {
                log(`Не удалось распарсить дату: ${clientEndDate}`);
                field.valueElement.classList.add('warning');
                field.valueElement.title = 'Не удалось распознать дату окончания срока БГ';
                return;
            }

            let procurementDate = null;
            let minRequiredDate = null;
            let tooltipText = '';

            if (requirementType === 'participation' && procurementData.applicationEndDate !== 'Нет данных') {
                procurementDate = parseDate(procurementData.applicationEndDate);
                if (procurementDate) {
                    minRequiredDate = addMonths(procurementDate, 1);
                    tooltipText = `Минимальный срок: ${minRequiredDate.toLocaleDateString('ru-RU')} (окончание подачи заявок ${procurementData.applicationEndDate} + 1 месяц)`;
                }
            } else if ((requirementType === 'execution' || requirementType === 'warranty') && procurementData.contractEndDate !== 'Нет данных') {
                procurementDate = parseDate(procurementData.contractEndDate);
                if (procurementDate) {
                    minRequiredDate = addMonths(procurementDate, 1);
                    tooltipText = `Минимальный срок: ${minRequiredDate.toLocaleDateString('ru-RU')} (окончание контракта ${procurementData.contractEndDate} + 1 месяц)`;
                }
            }

            if (minRequiredDate) {
                if (clientDate >= minRequiredDate) {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = `Срок соответствует требованиям! ${tooltipText}`;
                } else {
                    field.valueElement.classList.add('highlight');
                    field.valueElement.title = `Срок меньше требуемого! ${tooltipText}`;
                }
            } else {
                field.valueElement.classList.add('warning');
                field.valueElement.title = 'Не удалось проверить срок (нет данных с сайта закупок)';
            }
        } else {
            log(`❌ Не удалось найти поле для срока БГ`);
        }
    }

    function getRequirementType(requirementText) {
        if (!requirementText) return 'unknown';
        if (requirementText.includes('БГ на участие') || requirementText.includes('Обеспечение заявки')) return 'participation';
        if (requirementText.includes('БГ на исполнение') || requirementText.includes('Обеспечение исполнения')) return 'execution';
        if (requirementText.includes('БГ на гарантийный срок') || requirementText.includes('Гарантийные обязательства')) return 'warranty';
        return 'unknown';
    }

    function fetchProcurementData(url) {
        return new Promise((resolve, reject) => {
            log(`Загрузка данных с госзакупок: ${url}`);

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'text',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
                },
                onload: function(response) {
                    log(`Статус ответа госзакупок: ${response.status}`);

                    if (response.status === 200 && response.responseText) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');

                            const noticeNumberElement = doc.querySelector('.cardMainInfo__purchaseLink a');
                            const noticeNumber = noticeNumberElement ?
                                noticeNumberElement.textContent.trim().replace(/№\s*/g, '') :
                                'Нет данных';

                            const purchaseSubjectElement = doc.querySelector('.cardMainInfo__section span.cardMainInfo__content');
                            const purchaseSubject = purchaseSubjectElement ?
                                purchaseSubjectElement.textContent.trim() :
                                'Нет данных';

                            const maxPriceElement = doc.querySelector('.price .cardMainInfo__content.cost');
                            let maxPrice = maxPriceElement ?
                                maxPriceElement.textContent.trim() :
                                'Нет данных';

                            let bidSecurityAmount = 'Нет данных';
                            const bidSecuritySection = findSectionByTitle(doc, 'Размер обеспечения заявки');
                            if (bidSecuritySection) {
                                bidSecurityAmount = bidSecuritySection.querySelector('.section__info').textContent.trim();
                            }

                            let contractSecurityAmount = 'Нет данных';
                            const contractSecuritySection = findSectionByTitle(doc, 'Размер обеспечения исполнения контракта');
                            if (contractSecuritySection) {
                                contractSecurityAmount = contractSecuritySection.querySelector('.section__info').textContent.trim();
                            }

                            let warrantySecurityAmount = 'Нет данных';
                            const warrantySecuritySection = findSectionByTitle(doc, 'Размер обеспечения гарантийных обязательств');
                            if (warrantySecuritySection) {
                                warrantySecurityAmount = warrantySecuritySection.querySelector('.section__info').textContent.trim();
                            }

                            let advancePayment = 'Нет данных';
                            const advanceSection = findSectionByTitle(doc, 'Размер аванса');
                            if (advanceSection) {
                                advancePayment = advanceSection.querySelector('.section__info').textContent.trim();
                            }

                            let contractPeriod = 'Нет данных';
                            const contractSection = findSectionByTitle(doc, 'Срок исполнения контракта');
                            if (contractSection) {
                                contractPeriod = contractSection.querySelector('.section__info').textContent.trim().split('\n')[0].trim();
                            }

                            let applicationEndDate = 'Нет данных';
                            const applicationEndSection = findSectionByTitle(doc, 'Дата и время окончания срока подачи заявок');
                            if (applicationEndSection) {
                                const dateTimeText = applicationEndSection.querySelector('.section__info').textContent.trim();
                                const dateMatch = dateTimeText.match(/(\d{2}\.\d{2}\.\d{4})/);
                                if (dateMatch) {
                                    applicationEndDate = dateMatch[0];
                                }
                            }

                            let contractEndDate = 'Нет данных';
                            if (contractSection) {
                                const contractPeriodText = contractSection.querySelector('.section__info').textContent.trim();
                                const dateMatch = contractPeriodText.match(/(\d{2}\.\d{2}\.\d{4})/);
                                if (dateMatch) {
                                    contractEndDate = dateMatch[0];
                                }
                            }

                            const procurementData = {
                                purchaseSubject: purchaseSubject,
                                maxPrice: maxPrice,
                                bidSecurityAmount: bidSecurityAmount,
                                contractSecurityAmount: contractSecurityAmount,
                                warrantySecurityAmount: warrantySecurityAmount,
                                advancePayment: advancePayment,
                                noticeNumber: noticeNumber,
                                contractPeriod: contractPeriod,
                                applicationEndDate: applicationEndDate,
                                contractEndDate: contractEndDate
                            };

                            log('Успешно загружены данные с госзакупок:', procurementData);
                            resolve(procurementData);

                        } catch (error) {
                            log('Ошибка парсинга страницы госзакупок:', error);
                            reject(new Error('Ошибка парсинга страницы: ' + error.message));
                        }
                    } else {
                        reject(new Error(`HTTP error: ${response.status}`));
                    }
                },
                onerror: function(error) {
                    log('Ошибка загрузки страницы госзакупок:', error);
                    reject(new Error(`Ошибка загрузки: ${error.error}`));
                },
                timeout: 15000
            });
        });
    }

    function findSectionByTitle(doc, titleText) {
        const sections = Array.from(doc.querySelectorAll('.blockInfo__section'));
        return sections.find(section => {
            const title = section.querySelector('.section__title');
            return title && title.textContent.includes(titleText);
        });
    }

    function findFieldElement(fieldName) {
        log(`Поиск элемента поля: "${fieldName}"`);

        const containers = document.querySelectorAll('[class*="sc-"]');
        for (const container of containers) {
            const labelElement = Array.from(container.children).find(child => {
                const text = getCleanedElementText(child);
                return text && text === fieldName;
            });
            if (labelElement) {
                const valueElement = Array.from(container.children).find(child => {
                    if (child === labelElement) return false;
                    const text = getCleanedElementText(child);
                    return text && text !== '';
                });
                if (valueElement) {
                    return { container: container, titleElement: labelElement, valueElement: valueElement };
                }
            }
        }

        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const elementText = getCleanedElementText(element);
            if (elementText && elementText === fieldName) {
                log(`Найдена метка: "${fieldName}"`, element);

                let currentElement = element.parentElement;
                let depth = 0;

                while (currentElement && depth < 10) {
                    const children = Array.from(currentElement.children);
                    const valueElement = children.find(child => {
                        if (child === element) return false;
                        const text = getCleanedElementText(child);
                        return text && text !== '';
                    });

                    if (valueElement) {
                        return { container: currentElement, titleElement: element, valueElement: valueElement };
                    }

                    currentElement = currentElement.parentElement;
                    depth++;
                }
            }
        }

        log(`Поле "${fieldName}" не найдено`);
        return null;
    }

    function getClientData() {
        log('Получение данных из CRM');

        function findValueByTitle(titleText) {
            return findFieldByLabel(titleText) || 'Нет данных';
        }

        const requirement = findValueByTitle('Потребность');
        const advanceField = findFieldByLabel('Аванс');
        let advancePayment = 'Нет данных';
        if (advanceField && advanceField.toLowerCase().includes('нет')) {
            advancePayment = 'Нет';
        }

        const clientData = {
            purchaseSubject: findValueByTitle('Предмет контракта'),
            maxPrice: findValueByTitle('Начальная цена'),
            guaranteeAmount: findValueByTitle('Сумма БГ'),
            noticeNumber: findValueByTitle('Номер извещения'),
            guaranteePeriod: findValueByTitle('Срок БГ') || findValueByTitle('Срок'),
            requirement: requirement,
            advancePayment: advancePayment
        };

        log('Данные из CRM:', clientData);
        return clientData;
    }

    function compareAndHighlight(fieldName, clientValue, procurementValue, additionalInfo = null) {
        log(`Сравнение поля "${fieldName}": CRM="${clientValue}", Закупки="${procurementValue}"`);

        const field = findFieldElement(fieldName);
        if (field && field.valueElement) {
            log(`Найдено поле для подсветки:`, field.valueElement);

            field.valueElement.classList.remove('highlight', 'match', 'warning');

            let tooltipText = procurementValue === 'Нет данных' ?
                'Не удалось получить данные с сайта гос. закупок' :
                'На сайте гос. закупок: ' + procurementValue;

            if (fieldName === 'Аванс') {
                if (clientValue === 'Нет' && procurementValue === 'Нет данных') {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = 'На сайте гос. закупок аванс не указан';
                } else if (clientValue === 'Нет' && procurementValue !== 'Нет данных') {
                    field.valueElement.classList.add('highlight');
                    field.valueElement.title = 'На сайте гос. закупок указан аванс: ' + procurementValue;
                } else if (clientValue !== 'Нет' && procurementValue === 'Нет данных') {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = 'На сайте гос. закупок аванс не указан';
                } else {
                    const clientPercent = parseFloat(clientValue.replace('%', '').trim());
                    const procurementPercent = parseFloat(procurementValue.replace('%', '').replace(',', '.').trim());
                    if (clientPercent === procurementPercent) {
                        field.valueElement.classList.add('match');
                        field.valueElement.title = 'Процент аванса совпадает: ' + procurementValue;
                    } else {
                        field.valueElement.classList.add('highlight');
                        field.valueElement.title = 'Процент аванса отличается: ' + procurementValue;
                    }
                }
            } else if (fieldName === 'Начальная цена') {
                const normalizedClient = normalizeNumber(clientValue);
                const normalizedProcurement = normalizeNumber(procurementValue);

                const clientNum = parseFloat(normalizedClient);
                const procurementNum = parseFloat(normalizedProcurement);

                if (!isNaN(clientNum) && !isNaN(procurementNum) && Math.abs(clientNum - procurementNum) < 1) {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = 'Совпадает с сайтом гос. закупок: ' + procurementValue;
                } else if (procurementValue === 'Нет данных') {
                    field.valueElement.classList.add('warning');
                    field.valueElement.title = tooltipText;
                } else {
                    field.valueElement.classList.add('highlight');
                    field.valueElement.title = tooltipText;
                }
            } else {
                if (clientValue === procurementValue) {
                    field.valueElement.classList.add('match');
                    field.valueElement.title = 'Совпадает с сайтом гос. закупок: ' + procurementValue;
                } else if (procurementValue === 'Нет данных') {
                    field.valueElement.classList.add('warning');
                    field.valueElement.title = tooltipText;
                } else {
                    field.valueElement.classList.add('highlight');
                    field.valueElement.title = tooltipText;
                }
            }
        } else {
            log(`❌ Не удалось найти поле "${fieldName}" для подсветки`);
        }
    }

    function createTestDataButton() {
        const testDataBtn = document.createElement('button');
        testDataBtn.className = 'tm-control-btn tm-test-btn';
        testDataBtn.textContent = 'Тестовые данные';
        testDataBtn.onclick = loadTestData;
        document.body.appendChild(testDataBtn);
    }

    if (window.location.href.includes('https://crm.finleo.ru/crm/orders/')) {
        log('Инициализация на новом сайте CRM Finleo');
        createToggleSwitch();
        createComparisonButton();
        createTestDataButton();

        const saveParamsBtn = document.createElement('button');
        saveParamsBtn.className = 'tm-control-btn tm-save-btn';
        saveParamsBtn.textContent = 'Сохранить параметры';
        saveParamsBtn.onclick = () => {
            log('Сохранение параметров заявки в новом CRM');
            const inn = getInn();
            if (!inn) {
                log('Ошибка: ИНН не найден');
                showStatus('❌ Не удалось получить ИНН', 3000);
                return;
            }

            log('Поиск полей в CRM');
            const needText = findFieldByLabel('Потребность');
            const notice = findFieldByLabel('Номер извещения');
            const initialPrice = findFieldByLabel('Начальная цена');
            const proposedPrice = findFieldByLabel('Предложенная цена');
            const sum = findFieldByLabel('Сумма БГ');
            const period = findFieldByLabel('Срок БГ') || findFieldByLabel('Срок');
            const law = findFieldByLabel('Закон');
            const advance = findFieldByLabel('Аванс');

            log('Найденные значения:', {
                needText, notice, initialPrice, proposedPrice, sum, period, law, advance
            });

            const guaranteeInfo = getGuaranteeType(needText);

            const priceToUse = guaranteeInfo.priceField === 'Предложенная цена' ? proposedPrice : initialPrice;

            const cleanPrice = extractCleanPrice(priceToUse);
            const cleanSum = extractCleanPrice(sum);
            const startDate = extractStartDate(period || '');
            const endDate = extractEndDate(period || '');
            const lawCode = extractLaw(law || '');
            const advanceAmount = extractAdvanceAmount(advance || '');

            const data = {
                inn: inn,
                notice: notice || '',
                period: period || '',
                startDate: startDate,
                endDate: endDate,
                price: cleanPrice,
                sum: cleanSum,
                law: lawCode,
                advanceAmount: advanceAmount,
                initialPrice: extractCleanPrice(initialPrice),
                proposedPrice: extractCleanPrice(proposedPrice),
                email: "b.documents@bk.ru",
                guaranteeInfo: guaranteeInfo
            };

            GM_setValue('bankRequestData', data);
            log('Параметры заявки сохранены', data);
            showStatus('✅ Параметры заявки сохранены!', 3000);
        };
        document.body.appendChild(saveParamsBtn);
    }

    if (window.location.href.includes('market.bg.ingobank.ru/tasks')) {
        log('Инициализация на сайте Ingobank');
        createToggleSwitch();
        createTestDataButton();

        const waitForElement = (selector, timeout = 15000) => {
            log(`Ожидание элемента: ${selector}`);
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) {
                        log(`Элемент найден: ${selector}`);
                        return resolve(el);
                    }
                    if (Date.now() - start > timeout) {
                        log(`Таймаут ожидания элемента: ${selector}`);
                        return reject(new Error(`Элемент не найден: ${selector}`));
                    }
                    requestAnimationFrame(check);
                };
                check();
            });
        };

        const fillField = async (selector, value) => {
            log(`Заполнение поля ${selector} значением: ${value}`);
            const field = await waitForElement(selector);
            field.value = value;
            field.dispatchEvent(new Event('input', {bubbles: true}));
            await new Promise(r => setTimeout(r, 300));
        };

        const setSelectValue = async (selector, value) => {
            log(`Установка значения селектора ${selector} в: ${value}`);
            const select = await waitForElement(selector);
            select.value = value;
            select.dispatchEvent(new Event('change', {bubbles: true}));
            await new Promise(r => setTimeout(r, 300));
        };

        const fillForm = async (fastMode = false) => {
            log(`Начало заполнения формы (быстрый режим: ${fastMode})`);
            const data = await GM_getValue('bankRequestData', null);
            if (!data || !data.inn) {
                log('Ошибка: Нет сохраненных данных или ИНН');
                showStatus('❌ Нет сохраненных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Начинаем заполнение...', null);

            try {
                status.textContent = '⏳ Вводим ИНН...';
                await fillField('input[placeholder="Выберите компанию"]', data.inn);
                await new Promise(r => setTimeout(r, fastMode ? 500 : 1000));

                const firstOption = await waitForElement('.suggestion', 5000);
                firstOption.click();
                await new Promise(r => setTimeout(r, fastMode ? 500 : 1000));

                status.textContent = '⏳ Заполняем основные поля...';
                await Promise.all([
                    fillField('input[type="email"]', data.email),
                    setSelectValue('select[ng-model="model.data.bankGuaranteeTypeRefId"]', data.guaranteeInfo.ingoType),
                    fillField('input[placeholder="ДД.ММ.ГГГГ"]', data.endDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('ru-RU')),
                    setSelectValue('select[ng-model="model.data.signingMethodTypeId"]', "1"),
                    fillField('input[ng-model="model.data.purchase.purchaseNumber"]', data.notice)
                ]);

                status.textContent = '⏳ Ищем извещение...';
                const searchBtn = await waitForElement('button[ng-click="my.zgrSearch()"]');
                searchBtn.removeAttribute('disabled');
                searchBtn.click();
                await new Promise(r => setTimeout(r, fastMode ? 1500 : 2500));

                status.textContent = '⏳ Вводим суммы...';
                await Promise.all([
                    fillField('input[ng-model="lot.finalAmount"]', data.price),
                    fillField('input[ng-model="x.bgAmount"]', data.sum)
                ]);

                if (data.advanceAmount && data.advanceAmount !== '') {
                    status.textContent = '⏳ Заполняем аванс...';
                    const prepaymentCheckbox = await waitForElement('input[id="avans-0"]');
                    if (!prepaymentCheckbox.checked) {
                        prepaymentCheckbox.click();
                        await new Promise(r => setTimeout(r, 500));
                    }

                    const advanceInput = await waitForElement('input[ng-model="lot.contractConditions.prepaymentAmount"]');
                    advanceInput.value = data.advanceAmount;
                    advanceInput.dispatchEvent(new Event('input', {bubbles: true}));
                    await new Promise(r => setTimeout(r, 300));
                }

                status.textContent = '✅ Форма заполнена! Проверьте данные';
                log('Форма успешно заполнена');
                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении формы: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message || error}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const fastFillBtn = document.createElement('button');
        fastFillBtn.className = 'tm-control-btn tm-fast-btn';
        fastFillBtn.textContent = 'Быстро заполнить';
        fastFillBtn.onclick = () => fillForm(true);
        document.body.appendChild(fastFillBtn);
    }

    if (window.location.href.includes('bg.realistbank.ru/new_ticket')) {
        log('Инициализация на сайте RealistBank');
        createToggleSwitch();
        createTestDataButton();

        const waitForElement = (selector, timeout = 15000) => {
            log(`Ожидание элемента: ${selector}`);
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) {
                        log(`Элемент найден: ${selector}`);
                        return resolve(el);
                    }
                    if (Date.now() - start > timeout) {
                        log(`Таймаут ожидания элемента: ${selector}`);
                        return reject(new Error(`Элемент не найден: ${selector}`));
                    }
                    requestAnimationFrame(check);
                };
                check();
            });
        };

        const fillField = async (selector, value) => {
            log(`Заполнение поля ${selector} значением: ${value}`);
            const field = await waitForElement(selector);
            field.value = value;
            field.dispatchEvent(new Event('input', {bubbles: true}));
            field.dispatchEvent(new Event('change', {bubbles: true}));
            await new Promise(r => setTimeout(r, 300));
        };

        const setSelectValue = async (selector, value) => {
            log(`Установка значения селектора ${selector} в: ${value}`);
            const select = await waitForElement(selector);
            select.value = value;
            select.dispatchEvent(new Event('change', {bubbles: true}));
            await new Promise(r => setTimeout(r, 300));
        };

        const selectFirstCompany = async () => {
            try {
                log('Ожидание появления списка компаний');
                await new Promise(r => setTimeout(r, 2000));
                
                const firstCompany = await waitForElement('.suggestions-suggestion', 5000);
                log('Найден первый вариант компании, выбираем его');
                firstCompany.click();
                await new Promise(r => setTimeout(r, 1000));
                return true;
            } catch (error) {
                log('Не удалось выбрать первую компанию из списка', error);
                return false;
            }
        };

        const fillDateField = async (selector, value) => {
            try {
                log(`Заполнение поля даты ${selector} значением: ${value}`);
                const dateField = await waitForElement(selector);
                
                dateField.focus();
                await new Promise(r => setTimeout(r, 200));
                
                dateField.value = '';
                await new Promise(r => setTimeout(r, 100));
                
                dateField.value = value;
                await new Promise(r => setTimeout(r, 100));
                
                dateField.dispatchEvent(new Event('input', {bubbles: true}));
                dateField.dispatchEvent(new Event('change', {bubbles: true}));
                dateField.dispatchEvent(new Event('blur', {bubbles: true}));
                
                await new Promise(r => setTimeout(r, 500));
                
                dateField.focus();
                await new Promise(r => setTimeout(r, 200));
                
                dateField.select();
                await new Promise(r => setTimeout(r, 200));
                
                dateField.dispatchEvent(new Event('focus', {bubbles: true}));
                dateField.dispatchEvent(new Event('click', {bubbles: true}));
                
                await new Promise(r => setTimeout(r, 500));
                
                dateField.blur();
                await new Promise(r => setTimeout(r, 300));
                
                document.activeElement && document.activeElement.blur();
                
                return true;
            } catch (error) {
                log('Ошибка при заполнении поля даты', error);
                return false;
            }
        };

        const fillRealistBankForm = async () => {
            log('Начало заполнения формы в RealistBank');
            const data = await GM_getValue('bankRequestData', null);
            if (!data || !data.inn) {
                log('Ошибка: Нет сохраненных данных или ИНН');
                showStatus('❌ Нет сохраненных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Начинаем заполнение в RealistBank...', null);

            try {
                status.textContent = '⏳ Выбираем продукт...';
                await setSelectValue('#product_id', '1');

                status.textContent = '⏳ Выбираем вид гарантии...';
                const lawValue = data.law === '44' ? '1' : data.law === '223' ? '2' : data.law === '615' ? '3' : '0';
                await setSelectValue('#type_bank_guarantee', lawValue);

                status.textContent = '⏳ Выбираем форму гарантии...';
                await setSelectValue('#form_bg', '2');

                status.textContent = '⏳ Вводим ИНН и выбираем компанию...';
                const companyInput = await waitForElement('.gsa-dadata-company-name');
                companyInput.value = data.inn;
                companyInput.dispatchEvent(new Event('input', {bubbles: true}));
                companyInput.dispatchEvent(new Event('change', {bubbles: true}));
                
                await selectFirstCompany();

                status.textContent = '⏳ Вводим номер извещения...';
                await fillField('#auction_number', data.notice);

                status.textContent = '⏳ Вводим сумму БГ...';
                await fillField('#bg_sum', data.sum);

                status.textContent = '⏳ Вводим дату окончания...';
                await fillDateField('#bg_end_at', data.endDate);

                status.textContent = '⏳ Выбираем тип гарантии...';
                await setSelectValue('#bg_reason', data.guaranteeInfo.realistType);

                status.textContent = '✅ Форма RealistBank заполнена! Проверьте данные';
                log('Форма RealistBank успешно заполнена');
                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении формы RealistBank: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message || error}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const realistBtn = document.createElement('button');
        realistBtn.className = 'tm-control-btn tm-realist-btn';
        realistBtn.textContent = 'Заполнить RealistBank';
        realistBtn.onclick = fillRealistBankForm;
        document.body.appendChild(realistBtn);
    }
})();
