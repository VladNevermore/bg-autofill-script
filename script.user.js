// ==UserScript==
// @name         Автозаполнение и проверка параметров
// @namespace    http://tampermonkey.net/
// @version      16.5
// @description  Автозаполнение форм и сравнение параметров
// @match        https://crm.finleo.ru/crm/orders/*
// @match        https://bg.realistbank.ru/new_ticket*
// @match        https://bg.alfabank.ru/aft-ui/order*
// @match        https://assist24.kubankredit.ru/create*
// @match        https://lk.gosoblako.com/applications/new*
// @match        https://b2g.tbank.ru/bgbroker/main/create-order*
// @match        https://bg1.moscombank.ru/create*
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
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

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
        .tm-alfa-btn { background: #EF3124; color: white; bottom: 500px; right: 20px; }
        .tm-psb-btn { background: #2E7D32; color: white; bottom: 560px; right: 20px; }
        .tm-tbank-btn { background: #FF6B35; color: white; bottom: 620px; right: 20px; }
        .tm-gpb-btn { background: #1E88E5; color: white; bottom: 680px; right: 20px; }
        .tm-status {
            position: fixed;
            z-index: 9998;
            bottom: 740px;
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
        .realist-create-btn {
            background: #607D8B !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            font-weight: bold !important;
            display: inline-block !important;
        }
        .realist-create-btn:hover {
            background: #546E7A !important;
            transform: translateY(-1px) !important;
        }
        .psb-create-btn {
            background: #2E7D32 !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            font-weight: bold !important;
            display: inline-block !important;
        }
        .psb-create-btn:hover {
            background: #1B5E20 !important;
            transform: translateY(-1px) !important;
        }
        .tm-tbank-btn {
            background: #FF6B35 !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            font-weight: bold !important;
            display: inline-block !important;
        }
        .tm-tbank-btn:hover {
            background: #E55A2B !important;
            transform: translateY(-1px) !important;
        }
        .gpb-create-btn {
            background: #1E88E5 !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            font-weight: bold !important;
            display: inline-block !important;
        }
        .gpb-create-btn:hover {
            background: #1976D2 !important;
            transform: translateY(-1px) !important;
        }
        .alfa-create-btn {
            background: #EF3124 !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            margin-left: 8px !important;
            font-weight: bold !important;
            display: inline-block !important;
        }
        .alfa-create-btn:hover {
            background: #D32F2F !important;
            transform: translateY(-1px) !important;
        }
        .kuban-create-btn {
        background: #FF6F00 !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 6px 12px !important;
        font-size: 12px !important;
        cursor: pointer !important;
        margin-left: 8px !important;
        font-weight: bold !important;
        display: inline-block !important;
    }
    .kuban-create-btn:hover {
        background: #E65100 !important;
        transform: translateY(-1px) !important;
    }
    .tm-kuban-btn {
        background: #FF6F00 !important;
        color: white !important;
        bottom: 740px !important;
        right: 20px !important;
    }
        .tm-kuban-btn {
            background: #FF6F00 !important;
            color: white !important;
            bottom: 740px !important;
            right: 20px !important;
       }
        .moscom-create-btn {
        background: #1A237E !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 6px 12px !important;
        font-size: 12px !important;
        cursor: pointer !important;
        margin-left: 8px !important;
        font-weight: bold !important;
        display: inline-block !important;
    }
    .moscom-create-btn:hover {
        background: #0D1B6B !important;
        transform: translateY(-1px) !important;
    }
    .tm-moscom-btn {
        background: #1A237E !important;
        color: white !important;
        bottom: 800px !important;
        right: 20px !important;
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
                bank2Type: 'PART',
                realistType: '0',
                alfaType: '0',
                psbType: 'Исполнение',
                tbankType: 'Исполнение',
                priceField: 'Начальная цена',
                proposedPriceField: 'Начальная цена'
            };
        }

        if (needText.includes('БГ на участие')) {
            log('Тип гарантии: БГ на участие');
            return {
                bank2Type: 'PART',
                realistType: '0',
                alfaType: '0',
                psbType: 'Участие',
                tbankType: 'Участие',
                priceField: 'Начальная цена',
                proposedPriceField: 'Начальная цена'
            };
        } else if (needText.includes('БГ на исполнение')) {
            log('Тип гарантии: БГ на исполнение');
            return {
                bank2Type: 'EXEC',
                realistType: '2',
                alfaType: '1',
                psbType: 'Исполнение',
                tbankType: 'Исполнение',
                priceField: 'Предложенная цена',
                proposedPriceField: 'Предложенная цена'
            };
        } else if (needText.includes('БГ на гарантийный срок')) {
            log('Тип гарантии: БГ на гарантийный срок');
            return {
                bank2Type: 'GARANT',
                realistType: '3',
                alfaType: '4',
                psbType: 'Гарантийные обязательства',
                tbankType: 'Гарантийные обязательства',
                priceField: 'Предложенная цена',
                proposedPriceField: 'Предложенная цена'
            };
        }

        log('Тип гарантии не распознан, используется значение по умолчанию');
        return {
            bank2Type: 'PART',
            realistType: '0',
            alfaType: '0',
            psbType: 'Исполнение',
            tbankType: 'Исполнение',
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
            compareAndHighlightGuaranteePeriod(clientData.guaranteePeriod, procurementData, requirementType, clientData);

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

    function compareAndHighlightGuaranteePeriod(clientValue, procurementData, requirementType, clientData) {
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

            let minRequiredDate = null;
            let tooltipText = '';

            if (requirementType === 'participation') {
                const applicationEndDate = findFieldByLabel('Дата и время окончания подачи заявки');
                if (applicationEndDate) {
                    const appDateMatch = applicationEndDate.match(/(\d{2}\.\d{2}\.\d{4})/);
                    if (appDateMatch) {
                        const appDate = parseDate(appDateMatch[0]);
                        if (appDate) {
                            minRequiredDate = addMonths(appDate, 1);
                            tooltipText = `Минимальный срок: ${minRequiredDate.toLocaleDateString('ru-RU')} (окончание подачи заявок ${appDateMatch[0]} + 1 месяц)`;
                        }
                    }
                }
            } else if (requirementType === 'execution' || requirementType === 'warranty') {
                if (procurementData.contractEndDate !== 'Нет данных') {
                    const contrEndDate = parseDate(procurementData.contractEndDate);
                    if (contrEndDate) {
                        minRequiredDate = addMonths(contrEndDate, 1);
                        tooltipText = `Минимальный срок: ${minRequiredDate.toLocaleDateString('ru-RU')} (окончание контракта ${procurementData.contractEndDate} + 1 месяц)`;
                    }
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

    const addRealistCreateButtons = () => {
        log('Поиск строк с банком Реалист для добавления кнопок "Завести"');

        const rows = document.querySelectorAll('tr.V5pxh');
        let buttonsAdded = 0;

        rows.forEach(row => {
            const realistCell = Array.from(row.querySelectorAll('td')).find(td => {
                const divWithBankName = td.querySelector('div[aria-label*="РЕАЛИСТ БАНК"]');
                return divWithBankName && divWithBankName.textContent.includes('РЕАЛИСТ БАНК (АО)');
            });

            if (realistCell) {
                log('Найдена строка с банком Реалист');

                const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                    const button = td.querySelector('button');
                    return button && button.textContent && (
                        button.textContent.includes('Новая') ||
                        button.textContent.includes('Рассмотрение') ||
                        button.textContent.includes('Запрос-ссылка') ||
                        button.textContent.includes('Запрос')
                    );
                });

                if (actionCells.length > 0) {
                    const actionCell = actionCells[0];
                    log('Найдена ячейка с кнопкой действия', actionCell);

                    if (!actionCell.querySelector('.realist-create-btn')) {
                        const createButton = document.createElement('button');
                        createButton.className = 'realist-create-btn';
                        createButton.textContent = 'Завести';
                        createButton.title = 'Создать заявку в Реалист';

                        createButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            log('Нажата кнопка "Завести" для Реалист Банка');

                            const data = GM_getValue('bankRequestData', null);
                            if (!data || !data.inn) {
                                showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                                log('Ошибка: Нет сохраненных данных');
                                return;
                            }

                            showStatus('⏳ Открываем форму Реалист Банка...', 3000);

                            GM_setValue('autoFillRealist', true);

                            setTimeout(() => {
                                window.open('https://bg.realistbank.ru/new_ticket/stage_0?product_id=1', '_blank');
                            }, 1000);
                        });

                        const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                        buttonContainer.appendChild(createButton);
                        buttonsAdded++;
                        log('Кнопка "Завести" добавлена для Реалист Банка');
                    }
                } else {
                    log('Не найдена ячейка с кнопкой действия');
                }
            }
        });

        if (buttonsAdded > 0) {
            log(`Добавлено кнопок "Завести": ${buttonsAdded}`);
        } else {
            log('Не добавлено ни одной кнопки "Завести"');
        }

        return buttonsAdded > 0;
    };

    const addPSBCreateButtons = () => {
        log('Поиск строк с банком ПСБ для добавления кнопок "Завести"');

        const rows = document.querySelectorAll('tr.V5pxh');
        let buttonsAdded = 0;

        rows.forEach(row => {
            const psbCell = Array.from(row.querySelectorAll('td')).find(td => {
                const divWithBankName = td.querySelector('div[aria-label*="ПСБ"]');
                return divWithBankName && divWithBankName.textContent.includes('ПАО «Банк ПСБ»');
            });

            if (psbCell) {
                log('Найдена строка с банком ПСБ');

                const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                    const button = td.querySelector('button');
                    return button && button.textContent && (
                        button.textContent.includes('Новая') ||
                        button.textContent.includes('Рассмотрение') ||
                        button.textContent.includes('Запрос-ссылка') ||
                        button.textContent.includes('Запрос')
                    );
                });

                if (actionCells.length > 0) {
                    const actionCell = actionCells[0];
                    log('Найдена ячейка с кнопкой действия', actionCell);

                    if (!actionCell.querySelector('.psb-create-btn')) {
                        const createButton = document.createElement('button');
                        createButton.className = 'psb-create-btn';
                        createButton.textContent = 'Завести';
                        createButton.title = 'Создать заявку в ПСБ';

                        createButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            log('Нажата кнопка "Завести" для ПСБ');

                            const data = GM_getValue('bankRequestData', null);
                            if (!data || !data.inn) {
                                showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                                log('Ошибка: Нет сохраненных данных');
                                return;
                            }

                            showStatus('⏳ Открываем форму ПСБ...', 3000);

                            GM_setValue('autoFillPSB', true);

                            setTimeout(() => {
                                window.open('https://lk.gosoblako.com/applications/new', '_blank');
                            }, 1000);
                        });

                        const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                        buttonContainer.appendChild(createButton);
                        buttonsAdded++;
                        log('Кнопка "Завести" добавлена для ПСБ');
                    }
                } else {
                    log('Не найдена ячейка с кнопкой действия');
                }
            }
        });

        if (buttonsAdded > 0) {
            log(`Добавлено кнопок "Завести" для ПСБ: ${buttonsAdded}`);
        } else {
            log('Не добавлено ни одной кнопки "Завести" для ПСБ');
        }

        return buttonsAdded > 0;
    };

    const addGPBCreateButtons = () => {
        log('Поиск строк с банком ГПБ для добавления кнопок "Завести"');

        const rows = document.querySelectorAll('tr.V5pxh');
        let buttonsAdded = 0;

        rows.forEach(row => {
            const gpbCell = Array.from(row.querySelectorAll('td')).find(td => {
                const divWithBankName = td.querySelector('div[aria-label*="ГПБ (АО)"]');
                return divWithBankName && divWithBankName.textContent.includes('ГПБ (АО)');
            });

            if (gpbCell) {
                log('Найдена строка с банком ГПБ');

                const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                    const button = td.querySelector('button');
                    return button && button.textContent && (
                        button.textContent.includes('Новая') ||
                        button.textContent.includes('Рассмотрение') ||
                        button.textContent.includes('Запрос-ссылка') ||
                        button.textContent.includes('Запрос')
                    );
                });

                if (actionCells.length > 0) {
                    const actionCell = actionCells[0];
                    log('Найдена ячейка с кнопкой действия', actionCell);

                    if (!actionCell.querySelector('.gpb-create-btn')) {
                        const createButton = document.createElement('button');
                        createButton.className = 'gpb-create-btn';
                        createButton.textContent = 'Завести';
                        createButton.title = 'Создать заявку в ГПБ';

                        createButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            log('Нажата кнопка "Завести" для ГПБ');

                            const data = GM_getValue('bankRequestData', null);
                            if (!data || !data.inn) {
                                showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                                log('Ошибка: Нет сохраненных данных');
                                return;
                            }

                            showStatus('⏳ Открываем форму ГПБ...', 3000);

                            GM_setValue('autoFillGPB', true);

                            setTimeout(() => {
                                window.open('https://lk.gosoblako.com/applications/new', '_blank');
                            }, 1000);
                        });

                        const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                        buttonContainer.appendChild(createButton);
                        buttonsAdded++;
                        log('Кнопка "Завести" добавлена для ГПБ');
                    }
                }
            }
        });

        if (buttonsAdded > 0) {
            log(`Добавлено кнопок "Завести" для ГПБ: ${buttonsAdded}`);
        } else {
            log('Не добавлено ни одной кнопки "Завести" для ГПБ');
        }

        return buttonsAdded > 0;
    };

    const addTbankCreateButtons = () => {
        log('Поиск строк с банком Тбанк для добавления кнопок "Завести"');

        const rows = document.querySelectorAll('tr.V5pxh');
        let buttonsAdded = 0;

        rows.forEach(row => {
            const tbankCell = Array.from(row.querySelectorAll('td')).find(td => {
                const divWithBankName = td.querySelector('div[aria-label*="Т-Банк (АО)"]');
                return divWithBankName && divWithBankName.textContent.includes('Т-Банк (АО)');
            });

            if (tbankCell) {
                log('Найдена строка с банком Тбанк');

                const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                    const button = td.querySelector('button');
                    return button && button.textContent && (
                        button.textContent.includes('Новая') ||
                        button.textContent.includes('Рассмотрение') ||
                        button.textContent.includes('Запрос-ссылка') ||
                        button.textContent.includes('Запрос')
                    );
                });

                if (actionCells.length > 0) {
                    const actionCell = actionCells[0];
                    log('Найдена ячейка с кнопкой действия', actionCell);

                    if (!actionCell.querySelector('.tm-tbank-btn')) {
                        const createButton = document.createElement('button');
                        createButton.className = 'tm-tbank-btn';
                        createButton.textContent = 'Завести';
                        createButton.title = 'Создать заявку в Тбанк';

                        createButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            log('Нажата кнопка "Завести" для Тбанка');

                            const data = GM_getValue('bankRequestData', null);
                            if (!data || !data.inn) {
                                showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                                log('Ошибка: Нет сохраненных данных');
                                return;
                            }

                            showStatus('⏳ Открываем форму Тбанка...', 3000);

                            GM_setValue('autoFillTbank', true);

                            setTimeout(() => {
                                window.open('https://b2g.tbank.ru/bgbroker/main/create-order', '_blank');
                            }, 1000);
                        });

                        const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                        buttonContainer.appendChild(createButton);
                        buttonsAdded++;
                        log('Кнопка "Завести" добавлена для Тбанка');
                    }
                }
            }
        });

        if (buttonsAdded > 0) {
            log(`Добавлено кнопок "Завести" для Тбанка: ${buttonsAdded}`);
        } else {
            log('Не добавлено ни одной кнопки "Завести" для Тбанка');
        }

        return buttonsAdded > 0;
    };

    const addAlfaCreateButtons = () => {
        log('Поиск строк с банком Альфа-Банк для добавления кнопок "Завести"');

        const rows = document.querySelectorAll('tr.V5pxh');
        let buttonsAdded = 0;

        rows.forEach(row => {
            const alfaCell = Array.from(row.querySelectorAll('td')).find(td => {
                const divWithBankName = td.querySelector('div[aria-label*="АЛЬФА-БАНК"]');
                return divWithBankName && divWithBankName.textContent.includes('АЛЬФА-БАНК (АО)');
            });

            if (alfaCell) {
                log('Найдена строка с банком Альфа-Банк');

                const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                    const button = td.querySelector('button');
                    return button && button.textContent && (
                        button.textContent.includes('Новая') ||
                        button.textContent.includes('Рассмотрение') ||
                        button.textContent.includes('Запрос-ссылка') ||
                        button.textContent.includes('Запрос')
                    );
                });

                if (actionCells.length > 0) {
                    const actionCell = actionCells[0];
                    log('Найдена ячейка с кнопкой действия', actionCell);

                    if (!actionCell.querySelector('.alfa-create-btn')) {
                        const createButton = document.createElement('button');
                        createButton.className = 'alfa-create-btn';
                        createButton.textContent = 'Завести';
                        createButton.title = 'Создать заявку в Альфа-Банке';

                        createButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            log('Нажата кнопка "Завести" для Альфа-Банка');

                            const data = GM_getValue('bankRequestData', null);
                            if (!data || !data.inn) {
                                showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                                log('Ошибка: Нет сохраненных данных');
                                return;
                            }

                            showStatus('⏳ Открываем форму Альфа-Банка...', 3000);

                            GM_setValue('autoFillAlfa', true);
                            GM_setValue('alfaTabOpened', true);

                            setTimeout(() => {
                                window.open('https://bg.alfabank.ru/aft-ui/order', '_blank');
                            }, 1000);
                        });

                        const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                        buttonContainer.appendChild(createButton);
                        buttonsAdded++;
                        log('Кнопка "Завести" добавлена для Альфа-Банка');
                    }
                } else {
                    log('Не найдена ячейка с кнопкой действия');
                }
            }
        });

        if (buttonsAdded > 0) {
            log(`Добавлено кнопок "Завести" для Альфа-Банка: ${buttonsAdded}`);
        } else {
            log('Не добавлено ни одной кнопки "Завести" для Альфа-Банка');
        }

        return buttonsAdded > 0;
    };

    const addKubanCreateButtons = () => {
    log('Поиск строк с банком Кубань для добавления кнопок "Завести"');

    const rows = document.querySelectorAll('tr.V5pxh');
    let buttonsAdded = 0;

    rows.forEach(row => {
        const kubanCell = Array.from(row.querySelectorAll('td')).find(td => {
            const divWithBankName = td.querySelector('div[aria-label*="КУБАНЬ"]');
            return divWithBankName && divWithBankName.textContent.includes('КУБАНЬ');
        });

        if (kubanCell) {
            log('Найдена строка с банком Кубань');

            const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                const button = td.querySelector('button');
                return button && button.textContent && (
                    button.textContent.includes('Новая') ||
                    button.textContent.includes('Рассмотрение') ||
                    button.textContent.includes('Запрос-ссылка') ||
                    button.textContent.includes('Запрос')
                );
            });

            if (actionCells.length > 0) {
                const actionCell = actionCells[0];
                log('Найдена ячейка с кнопкой действия', actionCell);

                if (!actionCell.querySelector('.kuban-create-btn')) {
                    const createButton = document.createElement('button');
                    createButton.className = 'kuban-create-btn';
                    createButton.textContent = 'Завести';
                    createButton.title = 'Создать заявку в Кубань';

                    createButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        log('Нажата кнопка "Завести" для банка Кубань');

                        const data = GM_getValue('bankRequestData', null);
                        if (!data || !data.inn) {
                            showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                            log('Ошибка: Нет сохраненных данных');
                            return;
                        }

                        showStatus('⏳ Открываем форму банка Кубань...', 3000);

                        GM_setValue('autoFillKuban', true);

                        setTimeout(() => {
                            window.open('https://assist24.kubankredit.ru/create', '_blank'); // Замените на реальный URL
                        }, 1000);
                    });

                    const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                    buttonContainer.appendChild(createButton);
                    buttonsAdded++;
                    log('Кнопка "Завести" добавлена для банка Кубань');
                }
            } else {
                log('Не найдена ячейка с кнопкой действия');
            }
        }
    });

    if (buttonsAdded > 0) {
        log(`Добавлено кнопок "Завести" для банка Кубань: ${buttonsAdded}`);
    } else {
        log('Не добавлено ни одной кнопки "Завести" для банка Кубань');
    }

    return buttonsAdded > 0;
};
    const addMoscomCreateButtons = () => {
    log('Поиск строк с банком Моском для добавления кнопок "Завести"');

    const rows = document.querySelectorAll('tr.V5pxh');
    let buttonsAdded = 0;

    rows.forEach(row => {
        const moscomCell = Array.from(row.querySelectorAll('td')).find(td => {
            const divWithBankName = td.querySelector('div[aria-label*="МОСКОМ"]');
            return divWithBankName && divWithBankName.textContent.includes('МОСКОМ');
        });

        if (moscomCell) {
            log('Найдена строка с банком Моском');

            const actionCells = Array.from(row.querySelectorAll('td')).filter(td => {
                const button = td.querySelector('button');
                return button && button.textContent && (
                    button.textContent.includes('Новая') ||
                    button.textContent.includes('Рассмотрение') ||
                    button.textContent.includes('Запрос-ссылка') ||
                    button.textContent.includes('Запрос')
                );
            });

            if (actionCells.length > 0) {
                const actionCell = actionCells[0];
                log('Найдена ячейка с кнопкой действия', actionCell);

                if (!actionCell.querySelector('.moscom-create-btn')) {
                    const createButton = document.createElement('button');
                    createButton.className = 'moscom-create-btn';
                    createButton.textContent = 'Завести';
                    createButton.title = 'Создать заявку в Моском';

                    createButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        log('Нажата кнопка "Завести" для банка Моском');

                        const data = GM_getValue('bankRequestData', null);
                        if (!data || !data.inn) {
                            showStatus('❌ Нет сохраненных данных для автозаполнения', 5000);
                            log('Ошибка: Нет сохраненных данных');
                            return;
                        }

                        showStatus('⏳ Открываем форму банка Моском...', 3000);

                        GM_setValue('autoFillMoscom', true);

                        setTimeout(() => {
                            window.open('https://bg1.moscombank.ru/create', '_blank');
                        }, 1000);
                    });

                    const buttonContainer = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
                    buttonContainer.appendChild(createButton);
                    buttonsAdded++;
                    log('Кнопка "Завести" добавлена для банка Моском');
                }
            } else {
                log('Не найдена ячейка с кнопкой действия');
            }
        }
    });

    if (buttonsAdded > 0) {
        log(`Добавлено кнопок "Завести" для банка Моском: ${buttonsAdded}`);
    } else {
        log('Не добавлено ни одной кнопки "Завести" для банка Моском');
    }

    return buttonsAdded > 0;
};

const initMoscomAutoCreate = () => {
    log('Инициализация автозаполнения для банка Моском');

    let attempts = 0;
    const maxAttempts = 20;

    const tryAddButtons = () => {
        attempts++;
        const success = addMoscomCreateButtons();

        if (success) {
            log(`✅ Успешно добавлены кнопки "Завести" для банка Моском (попытка ${attempts})`);
        } else if (attempts >= maxAttempts) {
            log(`❌ Не удалось добавить кнопки для банка Моском после ${attempts} попыток`);
            return;
        } else {
            setTimeout(tryAddButtons, 1000);
        }
    };

    setTimeout(tryAddButtons, 2000);

    const observer = new MutationObserver(() => {
        addMoscomCreateButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};



const initKubanAutoCreate = () => {
    log('Инициализация автозаполнения для банка Кубань');

    let attempts = 0;
    const maxAttempts = 20;

    const tryAddButtons = () => {
        attempts++;
        const success = addKubanCreateButtons();

        if (success) {
            log(`✅ Успешно добавлены кнопки "Завести" для банка Кубань (попытка ${attempts})`);
        } else if (attempts >= maxAttempts) {
            log(`❌ Не удалось добавить кнопки для банка Кубань после ${attempts} попыток`);
            return;
        } else {
            setTimeout(tryAddButtons, 1000);
        }
    };

    setTimeout(tryAddButtons, 2000);

    const observer = new MutationObserver(() => {
        addKubanCreateButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

    const initRealistAutoCreate = () => {
        log('Инициализация автозаполнения для Реалист Банка');

        let attempts = 0;
        const maxAttempts = 20;

        const tryAddButtons = () => {
            attempts++;
            const success = addRealistCreateButtons();

            if (success) {
                log(`✅ Успешно добавлены кнопки "Завести" (попытка ${attempts})`);
            } else if (attempts >= maxAttempts) {
                log(`❌ Не удалось добавить кнопки после ${attempts} попыток`);
                return;
            } else {
                setTimeout(tryAddButtons, 1000);
            }
        };

        setTimeout(tryAddButtons, 2000);

        const observer = new MutationObserver(() => {
            addRealistCreateButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const initPSBAutoCreate = () => {
        log('Инициализация автозаполнения для ПСБ');

        let attempts = 0;
        const maxAttempts = 20;

        const tryAddButtons = () => {
            attempts++;
            const success = addPSBCreateButtons();

            if (success) {
                log(`✅ Успешно добавлены кнопки "Завести" для ПСБ (попытка ${attempts})`);
            } else if (attempts >= maxAttempts) {
                log(`❌ Не удалось добавить кнопки для ПСБ после ${attempts} попыток`);
                return;
            } else {
                setTimeout(tryAddButtons, 1000);
            }
        };

        setTimeout(tryAddButtons, 2000);

        const observer = new MutationObserver(() => {
            addPSBCreateButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const initGPBAutoCreate = () => {
        log('Инициализация автозаполнения для ГПБ');

        let attempts = 0;
        const maxAttempts = 20;

        const tryAddButtons = () => {
            attempts++;
            const success = addGPBCreateButtons();

            if (success) {
                log(`✅ Успешно добавлены кнопки "Завести" для ГПБ (попытка ${attempts})`);
            } else if (attempts >= maxAttempts) {
                log(`❌ Не удалось добавить кнопки для ГПБ после ${attempts} попыток`);
                return;
            } else {
                setTimeout(tryAddButtons, 1000);
            }
        };

        setTimeout(tryAddButtons, 2000);

        const observer = new MutationObserver(() => {
            addGPBCreateButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const initTbankAutoCreate = () => {
        log('Инициализация автозаполнения для Тбанка');

        let attempts = 0;
        const maxAttempts = 20;

        const tryAddButtons = () => {
            attempts++;
            const success = addTbankCreateButtons();

            if (success) {
                log(`✅ Успешно добавлены кнопки "Завести" для Тбанка (попытка ${attempts})`);
            } else if (attempts >= maxAttempts) {
                log(`❌ Не удалось добавить кнопки для Тбанка после ${attempts} попыток`);
                return;
            } else {
                setTimeout(tryAddButtons, 1000);
            }
        };

        setTimeout(tryAddButtons, 2000);

        const observer = new MutationObserver(() => {
            addTbankCreateButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const initAlfaAutoCreate = () => {
        log('Инициализация автозаполнения для Альфа-Банка');

        let attempts = 0;
        const maxAttempts = 20;

        const tryAddButtons = () => {
            attempts++;
            const success = addAlfaCreateButtons();

            if (success) {
                log(`✅ Успешно добавлены кнопки "Завести" для Альфа-Банка (попытка ${attempts})`);
            } else if (attempts >= maxAttempts) {
                log(`❌ Не удалось добавить кнопки для Альфа-Банка после ${attempts} попыток`);
                return;
            } else {
                setTimeout(tryAddButtons, 1000);
            }
        };

        setTimeout(tryAddButtons, 2000);

        const observer = new MutationObserver(() => {
            addAlfaCreateButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

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

    const fillFieldByElement = async (field, value) => {
        log(`Заполнение поля значением: ${value}`);
        field.focus();
        field.click();
        await new Promise(r => setTimeout(r, 500));

        field.value = '';
        field.dispatchEvent(new Event('input', {bubbles: true}));

        for (let i = 0; i < value.length; i++) {
            field.value = value.substring(0, i + 1);
            field.dispatchEvent(new Event('input', {bubbles: true}));
            await new Promise(r => setTimeout(r, 50));
        }

        field.dispatchEvent(new Event('change', {bubbles: true}));
        await new Promise(r => setTimeout(r, 1000));
    };

    const fillFieldBySelector = async (selector, value) => {
        log(`Заполнение поля ${selector} значением: ${value}`);
        const field = await waitForElement(selector);
        return fillFieldByElement(field, value);
    };

    if (window.location.href.includes('https://crm.finleo.ru/crm/orders/')) {
        log('Инициализация на новом сайте CRM Finleo');
        createToggleSwitch();
        createComparisonButton();
        initRealistAutoCreate();
        initPSBAutoCreate();
        initGPBAutoCreate();
        initTbankAutoCreate();
        initAlfaAutoCreate();
        initKubanAutoCreate();
        initMoscomAutoCreate();

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

    if (window.location.href.includes('bg.realistbank.ru/new_ticket')) {
        log('Инициализация на сайте RealistBank');
        createToggleSwitch();

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
                dateField.click();
                await new Promise(r => setTimeout(r, 500));

                dateField.value = value;

                dateField.dispatchEvent(new Event('input', {bubbles: true}));
                dateField.dispatchEvent(new Event('change', {bubbles: true}));
                dateField.dispatchEvent(new Event('blur', {bubbles: true}));
                dateField.dispatchEvent(new Event('focus', {bubbles: true}));

                await new Promise(r => setTimeout(r, 1000));

                dateField.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true}));
                dateField.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter', code: 'Enter', bubbles: true}));

                document.body.click();
                await new Promise(r => setTimeout(r, 500));

                dateField.focus();
                await new Promise(r => setTimeout(r, 200));
                dateField.blur();

                log(`Поле даты заполнено значением: ${dateField.value}`);
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
                await fillFieldBySelector('#auction_number', data.notice);

                status.textContent = '⏳ Вводим сумму БГ...';
                await fillFieldBySelector('#bg_sum', data.sum);

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

        const autoFillRealist = GM_getValue('autoFillRealist', false);
        if (autoFillRealist) {
            log('Заполнение формы Реалист');
            GM_setValue('autoFillRealist', false);
            setTimeout(() => {
                fillRealistBankForm();
            }, 2000);
        }
    }

    if (window.location.href.includes('bg.alfabank.ru/aft-ui/order')) {
    log('Инициализация на сайте Альфа-Банка');
    createToggleSwitch();

    const checkAndFillAlfa = () => {
        const shouldAutoFill = GM_getValue('autoFillAlfa', false);
        const tabOpened = GM_getValue('alfaTabOpened', false);

        if (shouldAutoFill && tabOpened) {
            log('Запуск автозаполнения Альфа-Банка');
            GM_setValue('autoFillAlfa', false);
            GM_setValue('alfaTabOpened', false);

            let attempts = 0;
            const maxAttempts = 5;

            const tryFill = () => {
                attempts++;
                log(`Попытка автозаполнения Альфа-Банка ${attempts}/${maxAttempts}`);

                if (document.querySelector('[data-test-id="principal-field"]')) {
                    log('Форма готова, начинаем заполнение');
                    fillAlfaBankForm();
                } else if (attempts < maxAttempts) {
                    setTimeout(tryFill, 3000);
                } else {
                    log('Не удалось найти форму после всех попыток');
                    showStatus('❌ Не удалось найти форму Альфа-Банка', 5000);
                }
            };

            setTimeout(tryFill, 2000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndFillAlfa);
    } else {
        setTimeout(checkAndFillAlfa, 1000);
    }

    const fillInnField = async (inn) => {
        log(`Заполнение поля ИНН: ${inn}`);
        const principalField = await waitForElement('[data-test-id="principal-field"]', 10000);

        principalField.focus();
        principalField.click();
        await new Promise(r => setTimeout(r, 1000));

        principalField.select();
        await new Promise(r => setTimeout(r, 500));

        principalField.value = '';
        principalField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        principalField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

        await new Promise(r => setTimeout(r, 500));

        for (let i = 0; i < inn.length; i++) {
            principalField.value = inn.substring(0, i + 1);

            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: inn[i]
            });

            const keydownEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: inn[i],
                code: `Digit${inn[i]}`,
                keyCode: inn[i].charCodeAt(0)
            });

            const keyupEvent = new KeyboardEvent('keyup', {
                bubbles: true,
                cancelable: true,
                key: inn[i],
                code: `Digit${inn[i]}`,
                keyCode: inn[i].charCodeAt(0)
            });

            principalField.dispatchEvent(keydownEvent);
            principalField.dispatchEvent(inputEvent);
            principalField.dispatchEvent(keyupEvent);
            await new Promise(r => setTimeout(r, 150));
        }

        principalField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        principalField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

        await new Promise(r => setTimeout(r, 3000));

        principalField.focus();
        principalField.click();

        const arrowDownEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'ArrowDown',
            code: 'ArrowDown',
            keyCode: 40
        });
        principalField.dispatchEvent(arrowDownEvent);

        await new Promise(r => setTimeout(r, 3000));

        log(`ИНН установлен: ${principalField.value}`);
        return true;
    };

    const selectFirstCompany = async () => {
        log(`Поиск и выбор первой компании`);
        await new Promise(r => setTimeout(r, 5000));

        const optionSelectors = [
            '[id*="downshift-"][id*="-item-0"]',
            '[role="option"]:first-child',
            '.select-option-with-addons_option__G6b92:first-child',
            '.select__option_1k4c0:first-child',
            '[data-test-id*="option"]:first-child',
            'div[role="listbox"] [role="option"]:first-child',
            '.Select__option:first-child'
        ];

        for (const selector of optionSelectors) {
            try {
                const option = document.querySelector(selector);
                if (option) {
                    log(`Найдена опция: ${selector}`);
                    option.click();
                    await new Promise(r => setTimeout(r, 3000));
                    return true;
                }
            } catch (e) {
                continue;
            }
        }

        const allOptions = document.querySelectorAll('[role="option"], .select__option_1k4c0, [data-test-id*="option"], .Select__option');
        if (allOptions.length > 0) {
            log(`Найдено опций: ${allOptions.length}, выбираем первую`);
            allOptions[0].click();
            await new Promise(r => setTimeout(r, 3000));
            return true;
        }

        const dropdowns = document.querySelectorAll('[role="listbox"], .Select__menu');
        if (dropdowns.length > 0) {
            log('Найден выпадающий список, пробуем кликнуть в область списка');
            dropdowns[0].click();
            await new Promise(r => setTimeout(r, 2000));

            const optionsAfterClick = document.querySelectorAll('[role="option"]');
            if (optionsAfterClick.length > 0) {
                optionsAfterClick[0].click();
                await new Promise(r => setTimeout(r, 3000));
                return true;
            }
        }

        throw new Error('Не удалось найти опции для выбора компании');
    };

    const selectGuaranteeType = async (guaranteeType) => {
        log(`Выбор типа гарантии: ${guaranteeType}`);

        const guaranteeField = await waitForElement('[data-test-id="bankGuaranteeType-field"]', 5000);
        guaranteeField.click();
        await new Promise(r => setTimeout(r, 3000));

        await new Promise(r => setTimeout(r, 2000));

        const optionSelectors = [
            `[data-test-id="bankGuaranteeType-option"]:nth-child(${parseInt(guaranteeType) + 1})`,
            `.select__option_1k4c0:nth-child(${parseInt(guaranteeType) + 1})`,
            `[role="option"]:nth-child(${parseInt(guaranteeType) + 1})`
        ];

        for (const selector of optionSelectors) {
            try {
                const option = document.querySelector(selector);
                if (option) {
                    option.click();
                    await new Promise(r => setTimeout(r, 3000));
                    return true;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error(`Не удалось найти опцию типа гарантии с индексом ${guaranteeType}`);
    };

    const fillTradeNumber = async (notice) => {
        log(`Заполнение номера извещения: ${notice}`);
        const tradeField = await waitForElement('[data-test-id="tradeNumber"]', 5000);

        tradeField.focus();
        tradeField.click();
        await new Promise(r => setTimeout(r, 1000));

        tradeField.value = '';
        tradeField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        for (let i = 0; i < notice.length; i++) {
            tradeField.value = notice.substring(0, i + 1);
            tradeField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 100));
        }

        tradeField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        tradeField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 3000));

        log(`Номер извещения установлен: ${tradeField.value}`);
    };

    const handleRequirementSelection = async (data) => {
        log('Обработка выбора потребности');
        await new Promise(r => setTimeout(r, 5000));

        const requirementField = document.querySelector('[data-test-id="requirement-field"]');
        if (!requirementField) {
            log('Поле потребности не найдено, пропускаем');
            return;
        }

        requirementField.click();
        await new Promise(r => setTimeout(r, 3000));

        let targetText = 'Обеспечение исполнения';
        if (data.guaranteeInfo.alfaType === '0') targetText = 'Обеспечение заявки';
        else if (data.guaranteeInfo.alfaType === '4') targetText = 'Гарантийные обязательства';

        const options = document.querySelectorAll('[data-test-id="requirement-option"], [role="option"], .select__option_1k4c0');

        for (const option of options) {
            if (option.textContent && option.textContent.includes(targetText)) {
                option.click();
                await new Promise(r => setTimeout(r, 3000));
                log(`Потребность выбрана: ${targetText}`);
                return;
            }
        }

        if (options.length > 0) {
            options[0].click();
            await new Promise(r => setTimeout(r, 3000));
            log('Выбрана первая доступная потребность');
        }
    };

    const selectPublicationRegistry = async () => {
        log('Выбор реестра публикаций');

        try {
            const registryField = await waitForElement('[data-test-id="publicationRegistry-field"]', 5000);
            registryField.click();
            await new Promise(r => setTimeout(r, 3000));

            const options = document.querySelectorAll('[data-test-id="publicationRegistry-option"], [role="option"]');

            for (const option of options) {
                if (option.textContent && option.textContent.includes('Реестр ЕИС')) {
                    option.click();
                    await new Promise(r => setTimeout(r, 3000));
                    log('Выбран реестр ЕИС');
                    return;
                }
            }

            if (options.length > 0) {
                options[0].click();
                await new Promise(r => setTimeout(r, 3000));
                log('Выбран первый доступный реестр');
            }
        } catch (error) {
            log('Не удалось выбрать реестр публикаций: ' + error.message);
        }
    };

    const fillFinalAmount = async (price) => {
        log(`Заполнение предложенной цены: ${price}`);
        const finalAmountField = await waitForElement('[data-test-id="finalAmount"]', 5000);

        finalAmountField.focus();
        finalAmountField.click();
        await new Promise(r => setTimeout(r, 1000));

        finalAmountField.value = '';
        finalAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        for (let i = 0; i < price.length; i++) {
            finalAmountField.value = price.substring(0, i + 1);
            finalAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 100));
        }

        finalAmountField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        finalAmountField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 2000));

        log(`Предложенная цена установлена: ${finalAmountField.value}`);
    };

    const handleAdvance = async (advanceAmount) => {
        if (!advanceAmount || advanceAmount === '' || advanceAmount === '0') {
            log('Аванс не указан, пропускаем');
            return;
        }

        log(`Обработка аванса: ${advanceAmount}`);

        try {
            const prepaymentCheckbox = await waitForElement('[data-test-id="prepaymentExists"]', 3000);
            if (!prepaymentCheckbox.checked) {
                prepaymentCheckbox.click();
                await new Promise(r => setTimeout(r, 2000));
            }

            const prepaymentAmountField = await waitForElement('[data-test-id="prepaymentAmount"]', 3000);

            prepaymentAmountField.focus();
            prepaymentAmountField.click();
            await new Promise(r => setTimeout(r, 1000));

            prepaymentAmountField.value = '';
            prepaymentAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

            for (let i = 0; i < advanceAmount.length; i++) {
                prepaymentAmountField.value = advanceAmount.substring(0, i + 1);
                prepaymentAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                await new Promise(r => setTimeout(r, 100));
            }

            prepaymentAmountField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            prepaymentAmountField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 2000));

            log(`Сумма аванса установлена: ${prepaymentAmountField.value}`);
        } catch (error) {
            log('Ошибка при заполнении аванса: ' + error.message);
        }
    };

    const fillEndDate = async (endDate) => {
        log(`Заполнение даты окончания: ${endDate}`);
        const endDateField = await waitForElement('[data-test-id="guaranteeDateRange.to"]', 5000);

        endDateField.focus();
        endDateField.click();
        await new Promise(r => setTimeout(r, 1000));

        endDateField.value = '';
        endDateField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        for (let i = 0; i < endDate.length; i++) {
            endDateField.value = endDate.substring(0, i + 1);
            endDateField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 100));
        }

        endDateField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        endDateField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 2000));

        log(`Дата окончания установлена: ${endDateField.value}`);
    };

    const clickEditBeneficiaryButton = async () => {
        log('Нажимаем кнопку редактирования бенефициара');

        const editButtonSelectors = [
            '[data-test-id="beneficiaries.[0].editButton"]',
            '.beneficiary-item_editButton__7pHjx',
            'button[data-test-id*="beneficiaries"]',
            'button[class*="editButton"]'
        ];

        for (const selector of editButtonSelectors) {
            try {
                const button = await waitForElement(selector, 3000);
                if (button) {
                    button.click();
                    await new Promise(r => setTimeout(r, 5000));
                    log('Кнопка редактирования нажата');
                    return true;
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error('Не удалось найти кнопку редактирования бенефициара');
    };

    const fillBgAmount = async (sum) => {
        log(`Заполнение суммы БГ: ${sum}`);
        const bgAmountField = await waitForElement('[data-test-id="beneficiaries[0].bgAmount"]', 5000);

        bgAmountField.focus();
        await new Promise(r => setTimeout(r, 1000));

        bgAmountField.select();
        await new Promise(r => setTimeout(r, 500));

        bgAmountField.value = '';
        bgAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        for (let i = 0; i < sum.length; i++) {
            bgAmountField.value = sum.substring(0, i + 1);
            bgAmountField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            await new Promise(r => setTimeout(r, 100));
        }

        bgAmountField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        bgAmountField.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 2000));

        log(`Сумма БГ установлена: ${bgAmountField.value}`);
    };

    const fillAlfaBankForm = async () => {
        log('Начало заполнения формы в Альфа-Банке');
        const data = GM_getValue('bankRequestData', null);
        if (!data || !data.inn) {
            log('Ошибка: Нет сохраненных данных или ИНН');
            showStatus('❌ Нет сохраненных данных', 5000);
            return;
        }

        const status = showStatus('⏳ Начинаем заполнение в Альфа-Банке...', null);

        try {
            status.textContent = '⏳ Вводим ИНН...';
            await fillInnField(data.inn);

            status.textContent = '⏳ Выбираем компанию...';
            await selectFirstCompany();

            status.textContent = '⏳ Выбираем тип гарантии...';
            const guaranteeType = data.guaranteeInfo?.alfaType || '1';
            await selectGuaranteeType(guaranteeType);

            status.textContent = '⏳ Вводим номер извещения...';
            await fillTradeNumber(data.notice);

            status.textContent = '⏳ Обрабатываем выбор потребности...';
            await handleRequirementSelection(data);

            status.textContent = '⏳ Выбираем реестр публикаций...';
            await selectPublicationRegistry();

            status.textContent = '⏳ Вводим предложенную цену...';
            await fillFinalAmount(data.proposedPrice || data.price);

            if (data.advanceAmount && data.advanceAmount !== '' && data.advanceAmount !== '0') {
                status.textContent = '⏳ Заполняем аванс...';
                await handleAdvance(data.advanceAmount);
            }

            status.textContent = '⏳ Вводим дату окончания...';
            await fillEndDate(data.endDate);

            status.textContent = '⏳ Редактируем бенефициара...';
            await clickEditBeneficiaryButton();

            status.textContent = '⏳ Вводим сумму БГ...';
            await fillBgAmount(data.sum);

            status.textContent = '✅ Форма Альфа-Банка полностью заполнена!';
            log('Форма Альфа-Банка полностью заполнена');
            setTimeout(() => status.remove(), 5000);

        } catch (error) {
            log(`Ошибка при заполнении формы Альфа-Банка: ${error.message}`, error);
            status.textContent = `❌ Ошибка: ${error.message}`;
            setTimeout(() => status.remove(), 7000);
        }
    };

    const alfaBtn = document.createElement('button');
    alfaBtn.className = 'tm-control-btn tm-alfa-btn';
    alfaBtn.textContent = 'Заполнить АльфаБанк';
    alfaBtn.onclick = fillAlfaBankForm;
    document.body.appendChild(alfaBtn);
}

    if (window.location.href.includes('lk.gosoblako.com/applications/new')) {
        log('Инициализация на сайте ПСБ/ГПБ');
        createToggleSwitch();

        const fillPSBForm = async () => {
            log('Начало заполнения формы в ПСБ/ГПБ');
            const data = await GM_getValue('bankRequestData', null);
            if (!data || !data.inn) {
                log('Ошибка: Нет сохраненных данных или ИНН');
                showStatus('❌ Нет сохраненных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Начинаем заполнение в ПСБ/ГПБ...', null);

            try {
                status.textContent = '⏳ Вводим ИНН...';

                const innInputSelectors = [
                    '[placeholder="000000000000"]',
                    'input[placeholder*="ИНН"]',
                    'input[id*="f_"]',
                    'input[aria-label*="ИНН"]'
                ];

                let innInput = null;
                for (const selector of innInputSelectors) {
                    try {
                        innInput = await waitForElement(selector, 2000);
                        if (innInput) break;
                    } catch (e) {}
                }

                if (!innInput) {
                    const allInputs = document.querySelectorAll('input');
                    for (const input of allInputs) {
                        if (input.placeholder && input.placeholder.includes('0000000000')) {
                            innInput = input;
                            break;
                        }
                    }
                }

                if (!innInput) throw new Error('Не найдено поле для ввода ИНН');

                let companySelected = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    status.textContent = `⏳ Вводим ИНН (попытка ${attempt}/3)...`;

                    innInput.focus();
                    innInput.click();
                    await new Promise(r => setTimeout(r, 500));

                    innInput.value = '';
                    innInput.dispatchEvent(new Event('input', {bubbles: true}));
                    await new Promise(r => setTimeout(r, 300));

                    for (let i = 0; i < data.inn.length; i++) {
                        innInput.value = data.inn.substring(0, i + 1);
                        innInput.dispatchEvent(new Event('input', {bubbles: true}));
                        await new Promise(r => setTimeout(r, 100));
                    }

                    innInput.dispatchEvent(new Event('change', {bubbles: true}));

                    await new Promise(r => setTimeout(r, 3000));

                    status.textContent = `⏳ Ищем компанию (попытка ${attempt}/3)...`;

                    const companySelectors = [
                        `[id*="_0"]`,
                        '[role="option"]:first-child',
                        '.q-item:first-child',
                        '.InnOption:first-child',
                        '[class*="InnOption"]:first-child',
                        'div[class*="option"]:first-child'
                    ];

                    let companyElement = null;
                    for (const selector of companySelectors) {
                        try {
                            const elements = document.querySelectorAll(selector);
                            if (elements.length > 0) {
                                companyElement = elements[0];
                                break;
                            }
                        } catch (e) {}
                    }

                    if (!companyElement) {
                        const allElements = document.querySelectorAll('*');
                        for (const element of allElements) {
                            if (element.textContent && element.textContent.includes(data.inn) &&
                                (element.tagName === 'DIV' || element.tagName === 'SPAN' || element.tagName === 'BUTTON')) {
                                companyElement = element;
                                break;
                            }
                        }
                    }

                    if (companyElement) {
                        companyElement.click();
                        companySelected = true;
                        log('Компания успешно выбрана');
                        break;
                    } else {
                        log(`Попытка ${attempt}: компания не найдена, пробуем еще раз`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                if (!companySelected) {
                    throw new Error('Не удалось выбрать компанию после 3 попыток. Попробуйте перезагрузить страницу.');
                }

                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Активируем вкладку ЭБГ...';

                const tabSelectors = [
                    'div.q-tab__content',
                    '.q-tab',
                    '[role="tab"]'
                ];

                let ebTab = null;
                for (const selector of tabSelectors) {
                    const tabs = document.querySelectorAll(selector);
                    for (const tab of tabs) {
                        if (tab.textContent && (tab.textContent.includes('ЭБГ') || tab.textContent.includes('Заявка ЭБГ'))) {
                            ebTab = tab;
                            break;
                        }
                    }
                    if (ebTab) break;
                }

                if (ebTab) {
                    ebTab.click();
                } else {
                    const firstTab = document.querySelector('div.q-tab__content');
                    if (firstTab) firstTab.click();
                }

                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Вводим номер извещения...';

                const rntSelectors = [
                    '[aria-label="РНТ"]',
                    'input[placeholder*="РНТ"]',
                    'input[placeholder*="номер"]',
                    'input[id*="f_"]'
                ];

                let rntField = null;
                for (const selector of rntSelectors) {
                    try {
                        rntField = await waitForElement(selector, 2000);
                        if (rntField) break;
                    } catch (e) {}
                }

                if (!rntField) throw new Error('Не найдено поле для номера извещения');

                rntField.focus();
                rntField.click();
                await new Promise(r => setTimeout(r, 500));

                rntField.value = '';
                rntField.dispatchEvent(new Event('input', {bubbles: true}));

                for (let i = 0; i < data.notice.length; i++) {
                    rntField.value = data.notice.substring(0, i + 1);
                    rntField.dispatchEvent(new Event('input', {bubbles: true}));
                    await new Promise(r => setTimeout(r, 50));
                }

                rntField.dispatchEvent(new Event('change', {bubbles: true}));
                await new Promise(r => setTimeout(r, 1000));

                status.textContent = '⏳ Выбираем тип обеспечения...';

                const typeSelectors = [
                    '[aria-label="Тип обеспечения"]',
                    '.q-field__native',
                    'div[role="button"]'
                ];

                let typeField = null;
                for (const selector of typeSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            if (element.textContent && element.textContent.includes('Исполнение')) {
                                typeField = element;
                                break;
                            }
                        }
                        if (typeField) break;
                    } catch (e) {}
                }

                if (typeField) {
                    typeField.click();
                    await new Promise(r => setTimeout(r, 2000));

                    const optionSelectors = [
                        '[role="option"]',
                        '.q-item',
                        '[id*="_0"]'
                    ];

                    let optionElement = null;
                    for (const selector of optionSelectors) {
                        const options = document.querySelectorAll(selector);
                        for (const option of options) {
                            if (option.textContent && option.textContent.includes(data.guaranteeInfo.psbType)) {
                                optionElement = option;
                                break;
                            }
                        }
                        if (optionElement) break;
                    }

                    if (optionElement) {
                        optionElement.click();
                    } else {
                        const firstOption = document.querySelector('[role="option"]:first-child, .q-item:first-child, [id*="_0"]');
                        if (firstOption) firstOption.click();
                    }
                }

                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Вводим сумму БГ...';

                const sumSelectors = [
                    '[aria-label="Сумма банковской гарантии"]',
                    'input[placeholder*="сумма"]',
                    'input[id*="f_"]'
                ];

                let sumField = null;
                for (const selector of sumSelectors) {
                    try {
                        sumField = await waitForElement(selector, 2000);
                        if (sumField) break;
                    } catch (e) {}
                }

                if (!sumField) throw new Error('Не найдено поле для суммы БГ');

                sumField.focus();
                sumField.click();
                await new Promise(r => setTimeout(r, 500));

                sumField.select();
                await new Promise(r => setTimeout(r, 200));

                sumField.value = data.sum;
                sumField.dispatchEvent(new Event('input', {bubbles: true}));
                sumField.dispatchEvent(new Event('change', {bubbles: true}));
                await new Promise(r => setTimeout(r, 1000));

                status.textContent = '⏳ Устанавливаем дату окончания...';

                const allDateFields = document.querySelectorAll('input[placeholder="дд.мм.гггг"]');
                let endDateField = null;

                for (const field of allDateFields) {
                    if (!field.disabled && !field.value) {
                        endDateField = field;
                        log('Найдено поле даты окончания (не disabled и пустое)');
                        break;
                    }
                }

                if (!endDateField && allDateFields.length > 0) {
                    endDateField = allDateFields[allDateFields.length - 1];
                    log('Используем последнее поле даты');
                }

                if (endDateField) {
                    endDateField.focus();
                    endDateField.click();
                    await new Promise(r => setTimeout(r, 500));

                    endDateField.value = '';
                    endDateField.dispatchEvent(new Event('input', {bubbles: true}));

                    for (let i = 0; i < data.endDate.length; i++) {
                        endDateField.value = data.endDate.substring(0, i + 1);
                        endDateField.dispatchEvent(new Event('input', {bubbles: true}));
                        await new Promise(r => setTimeout(r, 100));
                    }

                    endDateField.dispatchEvent(new Event('change', {bubbles: true}));
                    endDateField.dispatchEvent(new Event('blur', {bubbles: true}));
                    log(`Дата окончания установлена: ${endDateField.value}`);
                } else {
                    throw new Error('Не найдено поле для даты окончания');
                }

                await new Promise(r => setTimeout(r, 1000));

                status.textContent = '⏳ Выбираем бумажную гарантию...';

                const buttons = document.querySelectorAll('button');
                for (const button of buttons) {
                    if (button.textContent && button.textContent.includes('Бумажная')) {
                        button.click();
                        break;
                    }
                }

                status.textContent = '✅ Форма ПСБ/ГПБ заполнена! Проверьте данные';
                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении формы ПСБ/ГПБ: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const psbBtn = document.createElement('button');
        psbBtn.className = 'tm-control-btn tm-psb-btn';
        psbBtn.textContent = 'Заполнить ПСБ/ГПБ';
        psbBtn.onclick = fillPSBForm;
        document.body.appendChild(psbBtn);

        const autoFillPSB = GM_getValue('autoFillPSB', false);
        const autoFillGPB = GM_getValue('autoFillGPB', false);
        if (autoFillPSB || autoFillGPB) {
            log('Автоматическое заполнение формы ПСБ/ГПБ');
            GM_setValue('autoFillPSB', false);
            GM_setValue('autoFillGPB', false);
            setTimeout(() => {
                fillPSBForm();
            }, 2000);
        }
    }

    if (window.location.href.includes('b2g.tbank.ru/bgbroker/main/create-order')) {
        log('Инициализация на сайте Тбанка');
        createToggleSwitch();

        const fillTbankForm = async () => {
            log('Начало заполнения формы в Тбанке');
            const data = GM_getValue('bankRequestData', null);
            if (!data || !data.inn) {
                log('Ошибка: Нет сохраненных данных или ИНН');
                showStatus('❌ Нет сохраненных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Начинаем заполнение в Тбанке...', null);

            try {
                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Вводим номер закупки...';
                const purchaseNumberInput = await waitForElement('input[data-appearance="textfield"][placeholder=""]');
                await fillFieldByElement(purchaseNumberInput, data.notice);

                status.textContent = '⏳ Вводим ИНН...';
                const innInput = await waitForElement('input[tuicombobox]');
                await fillFieldByElement(innInput, data.inn);

                await new Promise(r => setTimeout(r, 3000));

                status.textContent = '⏳ Выбираем компанию...';
                const firstCompany = await waitForElement('button[role="option"]');
                firstCompany.click();
                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Выбираем Федеральный закон...';
                let lawLabels = Array.from(document.querySelectorAll('label'));
                let lawLabel = lawLabels.find(label => label.textContent.includes('Федеральный закон'));
                if (!lawLabel) {
                    const allLabels = Array.from(document.querySelectorAll('label, span, div'));
                    for (const element of allLabels) {
                        if (element.textContent && element.textContent.includes('Федеральный закон')) {
                            lawLabel = element;
                            break;
                        }
                    }
                }

                if (!lawLabel) throw new Error('Не найден элемент для Федерального закона');

                let lawInput = null;
                if (lawLabel.getAttribute('for')) {
                    lawInput = document.getElementById(lawLabel.getAttribute('for'));
                } else {
                    lawInput = lawLabel.closest('div').querySelector('input, button, div[role="button"]');
                }

                if (!lawInput) throw new Error('Не найден input для Федерального закона');

                lawInput.click();
                await new Promise(r => setTimeout(r, 1500));

                const lawValue = data.law === '44' ? '44 ФЗ' :
                                data.law === '223' ? '223 ФЗ' :
                                data.law === '615' ? '615 ПП' : '44 ФЗ';

                const lawOptions = document.querySelectorAll('button[role="option"]');
                let lawOptionFound = false;
                for (const option of lawOptions) {
                    if (option.textContent.includes(lawValue)) {
                        option.click();
                        lawOptionFound = true;
                        break;
                    }
                }

                if (!lawOptionFound && lawOptions.length > 0) {
                    lawOptions[0].click();
                }

                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Выбираем тип гарантии...';
                let typeLabels = Array.from(document.querySelectorAll('label'));
                let typeLabel = typeLabels.find(label => label.textContent.includes('Тип гарантии'));

                if (!typeLabel) {
                    const allElements = Array.from(document.querySelectorAll('label, span, div'));
                    for (const element of allElements) {
                        if (element.textContent && (
                            element.textContent.includes('Тип гарантии') ||
                            element.textContent.includes('Вид гарантии')
                        )) {
                            typeLabel = element;
                            break;
                        }
                    }
                }

                if (!typeLabel) throw new Error('Не найден элемент для Типа гарантии');

                let typeInput = null;
                if (typeLabel.getAttribute('for')) {
                    typeInput = document.getElementById(typeLabel.getAttribute('for'));
                } else {
                    typeInput = typeLabel.closest('div').querySelector('input, button, div[role="button"]');
                }

                if (!typeInput) throw new Error('Не найден input для Типа гарантии');

                typeInput.click();
                await new Promise(r => setTimeout(r, 1500));

                const guaranteeType = data.guaranteeInfo.tbankType || 'Исполнение';
                const typeOptions = document.querySelectorAll('button[role="option"]');
                let typeOptionFound = false;
                for (const option of typeOptions) {
                    if (option.textContent.includes(guaranteeType)) {
                        option.click();
                        typeOptionFound = true;
                        break;
                    }
                }

                if (!typeOptionFound && typeOptions.length > 0) {
                    typeOptions[0].click();
                }

                await new Promise(r => setTimeout(r, 2000));

                status.textContent = '⏳ Вводим сумму БГ...';
                const amountInput = await waitForElement('input[tuiinputnumber]');
                await fillFieldByElement(amountInput, data.sum);

                status.textContent = '⏳ Вводим срок БГ...';

                await new Promise(r => setTimeout(r, 1000));

                const dateInput = await waitForElement('input[tuiinputdaterange]');

                if (!dateInput) {
                    throw new Error('Не найден input для срока БГ');
                }

                let dateValue;
                if (data.law === '44' && data.guaranteeInfo.tbankType === 'Исполнение') {
                    dateValue = data.endDate;
                } else {
                    dateValue = `${data.startDate} — ${data.endDate}`;
                }

                await fillFieldByElement(dateInput, dateValue);

                status.textContent = '✅ Форма Тбанка заполнена! Проверьте данные';
                log('Форма Тбанка успешно заполнена');
                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении формы Тбанка: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const tbankBtn = document.createElement('button');
        tbankBtn.className = 'tm-control-btn tm-tbank-btn';
        tbankBtn.textContent = 'Заполнить Тбанк';
        tbankBtn.onclick = fillTbankForm;
        document.body.appendChild(tbankBtn);

        const autoFillTbank = GM_getValue('autoFillTbank', false);
        if (autoFillTbank) {
            log('Автоматическое заполнение формы Тбанка');
            GM_setValue('autoFillTbank', false);
            setTimeout(() => {
                fillTbankForm();
            }, 2000);
        }
    }
    if (window.location.href.includes('https://assist24.kubankredit.ru/create')) {
    log('Инициализация на сайте банка Кубань');
    createToggleSwitch();

    const fillKubanForm = async () => {
        log('Начало заполнения формы в банке Кубань');
        const data = GM_getValue('bankRequestData', null);
        if (!data || !data.inn) {
            log('Ошибка: Нет сохраненных данных или ИНН');
            showStatus('❌ Нет сохраненных данных', 5000);
            return;
        }

        const status = showStatus('⏳ Начинаем заполнение в банке Кубань...', null);

        try {
            status.textContent = '⏳ Вводим ИНН клиента...';
            const innField = await waitForElement('input[name="entity_inn"]');
            await fillFieldByElement(innField, data.inn);

            status.textContent = '⏳ Вводим номер извещения...';
            const noticeField = await waitForElement('input[name="purchase"]');
            await fillFieldByElement(noticeField, data.notice);

            status.textContent = '⏳ Выбираем тип банковской гарантии...';
            const bgTypeField = await waitForElement('select[name="bg_types"]');

            let kubanType = '0';
            if (data.guaranteeInfo) {
                if (data.guaranteeInfo.alfaType === '0') {
                    kubanType = '1';
                } else if (data.guaranteeInfo.alfaType === '1') {
                    if (data.advanceAmount && data.advanceAmount !== '' && data.advanceAmount !== '0') {
                        kubanType = '2';
                    } else {
                        kubanType = '0';
                    }
                } else if (data.guaranteeInfo.alfaType === '4') {
                    kubanType = '3';
                }
            }

            bgTypeField.value = kubanType;
            bgTypeField.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 2000));

            status.textContent = '⏳ Вводим предложенную цену...';
            const priceField = await waitForElement('input[name="final_price"]');
            await fillFieldByElement(priceField, data.proposedPrice || data.price);

            status.textContent = '⏳ Вводим сумму БГ...';
            const sumField = await waitForElement('input[name="execSum_0"]');
            await fillFieldByElement(sumField, data.sum);

            status.textContent = '⏳ Вводим дату окончания БГ...';
            const dateField = await waitForElement('input[name="date_finish_0"]');
            await fillFieldByElement(dateField, data.endDate);

            status.textContent = '✅ Форма банка Кубань заполнена! Проверьте данные';
            log('Форма банка Кубань успешно заполнена');
            setTimeout(() => status.remove(), 5000);

        } catch (error) {
            log(`Ошибка при заполнении формы банка Кубань: ${error.message}`, error);
            status.textContent = `❌ Ошибка: ${error.message}`;
            setTimeout(() => status.remove(), 5000);
        }
    };

    const kubanBtn = document.createElement('button');
    kubanBtn.className = 'tm-control-btn tm-kuban-btn';
    kubanBtn.textContent = 'Заполнить Кубань';
    kubanBtn.onclick = fillKubanForm;
    document.body.appendChild(kubanBtn);

    const autoFillKuban = GM_getValue('autoFillKuban', false);
    if (autoFillKuban) {
        log('Автоматическое заполнение формы банка Кубань');
        GM_setValue('autoFillKuban', false);
        setTimeout(() => {
            fillKubanForm();
        }, 2000);
    }
}
    if (window.location.href.includes('bg1.moscombank.ru/create')) {
    log('Инициализация на сайте банка Моском');
    createToggleSwitch();

    const formatNumberForMoscom = (numberStr) => {
        if (!numberStr) return '0,00';

        let cleanNumber = numberStr.toString().replace(/\s/g, '').replace(',', '.');
        let number = parseFloat(cleanNumber);

        if (isNaN(number)) return '0,00';

        return number.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const fillFieldWithFormattedNumber = async (field, value) => {
        log(`Заполнение поля форматированным числом: ${value}`);
        field.focus();
        field.click();
        await new Promise(r => setTimeout(r, 500));

        field.value = '';
        field.dispatchEvent(new Event('input', {bubbles: true}));

        const formattedValue = formatNumberForMoscom(value);

        for (let i = 0; i < formattedValue.length; i++) {
            field.value = formattedValue.substring(0, i + 1);
            field.dispatchEvent(new Event('input', {bubbles: true}));
            await new Promise(r => setTimeout(r, 50));
        }

        field.dispatchEvent(new Event('change', {bubbles: true}));
        field.dispatchEvent(new Event('blur', {bubbles: true}));
        await new Promise(r => setTimeout(r, 1000));
    };

    const fillMoscomForm = async () => {
        log('Начало заполнения формы в банке Моском');
        const data = GM_getValue('bankRequestData', null);
        if (!data || !data.inn) {
            log('Ошибка: Нет сохраненных данных или ИНН');
            showStatus('❌ Нет сохраненных данных', 5000);
            return;
        }

        const status = showStatus('⏳ Начинаем заполнение в банке Моском...', null);

        try {
            status.textContent = '⏳ Вводим ИНН клиента...';
            const innField = await waitForElement('input[name="entity_inn"]');
            await fillFieldByElement(innField, data.inn);

            status.textContent = '⏳ Вводим номер извещения...';
            const noticeField = await waitForElement('input[name="purchase"]');
            await fillFieldByElement(noticeField, data.notice);

            status.textContent = '⏳ Выбираем тип банковской гарантии...';
            const bgTypeField = await waitForElement('select[name="bg_types"]');

            let moscomType = '0';
            if (data.guaranteeInfo) {
                if (data.guaranteeInfo.alfaType === '0') {
                    moscomType = '1';
                } else if (data.guaranteeInfo.alfaType === '1') {
                    moscomType = '0';
                } else if (data.guaranteeInfo.alfaType === '4') {
                    moscomType = '3';
                }
            }

            bgTypeField.value = moscomType;
            bgTypeField.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 2000));

            status.textContent = '⏳ Вводим предложенную цену...';
            const priceField = await waitForElement('input[name="final_price"]');
            await fillFieldWithFormattedNumber(priceField, data.proposedPrice || data.price);

            status.textContent = '⏳ Вводим сумму БГ...';
            const sumField = await waitForElement('input[name="execSum"]');
            await fillFieldWithFormattedNumber(sumField, data.sum);

            status.textContent = '⏳ Вводим дату окончания БГ...';
            const dateField = await waitForElement('input[name="date_finish"]');
            await fillFieldByElement(dateField, data.endDate);

            if (data.advanceAmount && data.advanceAmount !== '' && data.advanceAmount !== '0') {
                status.textContent = '⏳ Отмечаем наличие аванса...';
                const advanceCheckbox = await waitForElement('input[id="avans"]');
                if (!advanceCheckbox.checked) {
                    advanceCheckbox.click();
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            status.textContent = '✅ Форма банка Моском заполнена! Проверьте данные';
            log('Форма банка Моском успешно заполнена');
            setTimeout(() => status.remove(), 5000);

        } catch (error) {
            log(`Ошибка при заполнении формы банка Моском: ${error.message}`, error);
            status.textContent = `❌ Ошибка: ${error.message}`;
            setTimeout(() => status.remove(), 5000);
        }
    };

    const moscomBtn = document.createElement('button');
    moscomBtn.className = 'tm-control-btn tm-moscom-btn';
    moscomBtn.textContent = 'Заполнить Моском';
    moscomBtn.onclick = fillMoscomForm;
    document.body.appendChild(moscomBtn);

    const autoFillMoscom = GM_getValue('autoFillMoscom', false);
    if (autoFillMoscom) {
        log('Автоматическое заполнение формы банка Моском');
        GM_setValue('autoFillMoscom', false);
        setTimeout(() => {
            fillMoscomForm();
        }, 2000);
    }
}
})();
