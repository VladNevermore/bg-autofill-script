// ==UserScript==
// @name         Автозаполнение и проверка параметров // dev
// @namespace    http://tampermonkey.net/
// @version      12.7
// @description  Автозаполнение форм и сравнение параметров // dev
// @match        https://crm.finleo.ru/orders/*
// @match        https://market.bg.ingobank.ru/tasks*
// @match        https://bg.realistbank.ru/new_ticket*
// @match        https://bg.alfabank.ru/aft-ui/orders*
// @match        https://b2g.tbank.ru/bgbroker/main/create-order*
// @author       VladNevermore
// @icon         https://i.pinimg.com/736x/78/53/ad/7853ade6dd49b8caba4d1037e7341323.jpg
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.dev.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/script.dev.user.js
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
        .tm-status {
            position: fixed;
            z-index: 9998;
            bottom: 440px;
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
        .tm-alfabank-btn {
            background: #EF3124 !important;
            color: white !important;
            bottom: 380px !important;
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
        const parts = text.split('—');
        if (parts.length < 2) return '';
        const dateMatch = parts[0].trim().match(/(\d{2}\.\d{2}\.\d{4})/);
        return dateMatch ? dateMatch[0] : '';
    };

    const extractEndDate = (text) => {
        if (!text) return '';
        const parts = text.split('—');
        if (parts.length < 2) return '';
        const dateMatch = parts[1].trim().match(/(\d{2}\.\d{2}\.\d{4})/);
        return dateMatch ? dateMatch[0] : '';
    };

    const extractLaw = (text) => {
        if (!text) return '';
        if (text.includes('615 ПП') || text.includes('185 ФЗ')) return '615';
        const match = text.match(/(44|223)\sФЗ/);
        return match ? match[1] : '';
    };

    const splitFIO = (fio) => {
        if (!fio) return { lastName: '', firstName: '', middleName: '' };
        const parts = fio.split(' ');
        return {
            lastName: parts[0] || '',
            firstName: parts[1] || '',
            middleName: parts[2] || ''
        };
    };

    const findFieldByLabel = (labelText) => {
        log(`Поиск поля по метке: ${labelText}`);
        const containers = document.querySelectorAll('div.sc-92db39bc-0');
        for (const container of containers) {
            const titleDiv = container.querySelector('div.sc-92db39bc-2');
            if (titleDiv && titleDiv.textContent.trim() === labelText) {
                const valueDiv = container.querySelector('div.sc-92db39bc-3');
                if (valueDiv) {
                    const span = valueDiv.querySelector('span');
                    return span ? span.textContent.trim() : valueDiv.textContent.trim();
                }
            }
        }
        log(`Метка '${labelText}' не найдена`);
        return null;
    };

    const getInn = () => {
        const innElement = document.querySelector('span.sc-bRKDuR');
        if (innElement) {
            const innMatch = innElement.textContent.match(/\d{10,12}/);
            if (innMatch) {
                const inn = innMatch[0];
                log(`Получен ИНН: ${inn}`);
                return inn;
            }
        }
        log('ИНН не найден');
        return '';
    };

    const getGuaranteeType = (needText) => {
        log(`Определение типа гарантии для: ${needText}`);
        if (!needText) return {
            ingoType: '0',
            bank2Type: 'PART',
            realistType: '0',
            priceField: 'Начальная цена',
            proposedPriceField: 'Начальная цена'
        };

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
            const containers = document.querySelectorAll('div.sc-92db39bc-0');
            let linkElement = null;

            for (const container of containers) {
                const titleDiv = container.querySelector('div.sc-92db39bc-2');
                if (titleDiv && titleDiv.textContent.trim() === 'Ссылка') {
                    linkElement = container.querySelector('a');
                    break;
                }
            }

            if (linkElement && linkElement.href) {
                compareParameters(linkElement.href);
            } else {
                alert('Ссылка на закупку не найдена');
            }
        });

        document.body.appendChild(button);
    }

    async function compareParameters(procurementUrl) {
        try {
            showStatus('⏳ Сравнение параметров...', 5000);
            log('Начало сравнения параметров');
        } catch (error) {
            console.error('Ошибка при сравнении параметров:', error);
            showStatus('❌ Ошибка при сравнении параметров', 5000);
        }
    }

    function findFieldElement(fieldName) {
        const containers = document.querySelectorAll('div.sc-92db39bc-0');
        for (const container of containers) {
            const titleDiv = container.querySelector('div.sc-92db39bc-2');
            if (titleDiv && titleDiv.textContent.trim() === fieldName) {
                const valueDiv = container.querySelector('div.sc-92db39bc-3');
                return { container, titleDiv, valueElement: valueDiv };
            }
        }
        return null;
    }

    if (window.location.href.includes('https://crm.finleo.ru/orders/')) {
        log('Инициализация на сайте CRM Finleo');
        createToggleSwitch();
        createComparisonButton();

        const saveProfileBtn = document.createElement('button');
        saveProfileBtn.className = 'tm-control-btn tm-profile-btn';
        saveProfileBtn.textContent = 'Сохранить анкету';
        saveProfileBtn.onclick = () => {
            log('Сохранение анкетных данных');
            const fio = findFieldByLabel('ФИО:');
            const birthDate = findFieldByLabel('Дата рождения:');
            const birthPlace = findFieldByLabel('Место рождения:');
            const passportSeries = findFieldByLabel('Серия паспорта:');
            const passportNumber = findFieldByLabel('Номер паспорта:');
            const passportIssueDate = findFieldByLabel('Дата выдачи:');
            const passportDepartmentCode = findFieldByLabel('Код подразделения:');
            const registrationAddress = findFieldByLabel('Адрес регистрации:');
            const bik = findFieldByLabel('БИК:');
            const accountNumber = findFieldByLabel('р/с:');

            const fioParts = splitFIO(fio);

            const profileData = {
                fio: fio || '',
                lastName: fioParts.lastName,
                firstName: fioParts.firstName,
                middleName: fioParts.middleName,
                birthDate: birthDate || '',
                birthPlace: birthPlace || '',
                passportSeries: passportSeries || '',
                passportNumber: passportNumber || '',
                passportIssueDate: passportIssueDate || '',
                passportDepartmentCode: passportDepartmentCode || '',
                registrationAddress: registrationAddress || '',
                bik: bik || '',
                accountNumber: accountNumber || ''
            };

            GM_setValue('bankProfileData', profileData);
            log('Анкетные данные сохранены', profileData);
            showStatus('✅ Анкетные данные сохранены!', 3000);
        };
        document.body.appendChild(saveProfileBtn);

        const saveParamsBtn = document.createElement('button');
        saveParamsBtn.className = 'tm-control-btn tm-save-btn';
        saveParamsBtn.textContent = 'Сохранить параметры';
        saveParamsBtn.onclick = () => {
            log('Сохранение параметров заявки');
            const inn = getInn();
            if (!inn) {
                log('Ошибка: ИНН не найден');
                showStatus('❌ Не удалось получить ИНН', 3000);
                return;
            }

            const needText = findFieldByLabel('Потребность');
            const notice = findFieldByLabel('Номер извещения');
            const initialPrice = findFieldByLabel('Начальная цена');
            const proposedPrice = findFieldByLabel('Предложенная цена');
            const sum = findFieldByLabel('Сумма БГ');
            const period = findFieldByLabel('Срок');
            const law = findFieldByLabel('Закон');
            const advance = findFieldByLabel('Аванс');

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

        const fillProfileInFirstBank = async () => {
            log('Начало заполнения анкетных данных в Ingobank');
            const profileData = await GM_getValue('bankProfileData', null);
            if (!profileData) {
                log('Ошибка: Нет сохраненных анкетных данных');
                showStatus('❌ Нет сохраненных анкетных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Заполняем анкетные данные...', null);

            try {
                const editBtn = document.querySelector('.fz-two-buttons-ctn.blue button');
                const addBtn = document.querySelector('.fz-button.blue.bg-blue[ng-click*="onButtonClickHandler"]');

                if (editBtn) {
                    log('Найдена кнопка редактирования');
                    editBtn.click();
                } else if (addBtn) {
                    log('Найдена кнопка добавления');
                    addBtn.click();
                } else {
                    throw new Error('Не найдена кнопка изменения/добавления');
                }

                await new Promise(r => setTimeout(r, 1000));

                const bankInput = document.querySelector('input[fz-select-bank]');
                if (bankInput) {
                    log(`Заполнение БИК: ${profileData.bik}`);
                    bankInput.value = profileData.bik;
                    bankInput.dispatchEvent(new Event('input', {bubbles: true}));
                    await new Promise(r => setTimeout(r, 1500));

                    const firstBankOption = document.querySelector('.suggestions .suggestion');
                    if (firstBankOption) {
                        firstBankOption.click();
                    }
                }

                await Promise.all([
                    fillField('input[ng-model="model.data.accountNumber"]', profileData.accountNumber),
                    fillField('input[ng-model="model.data.lastName"]', profileData.lastName),
                    fillField('input[ng-model="model.data.firstName"]', profileData.firstName),
                    fillField('input[ng-model="model.data.middleName"]', profileData.middleName),
                    fillField('input[ng-model="model.data.birthDate"]', profileData.birthDate),
                    fillField('input[ng-model="model.data.birthPlace"]', profileData.birthPlace),
                    fillField('input[ng-model="model.data.passportSeries"]', profileData.passportSeries),
                    fillField('input[ng-model="model.data.passportNumber"]', profileData.passportNumber),
                    fillField('input[ng-model="model.data.passportIssueDate"]', profileData.passportIssueDate),
                    fillField('input[ng-model="model.data.passportDepartmentCode"]', profileData.passportDepartmentCode),
                    fillField('input[ng-model="model.data.registrationAddress"]', profileData.registrationAddress)
                ]);

                const saveBtn = document.querySelector('button[ng-click*="save"]');
                if (saveBtn) {
                    saveBtn.click();
                    log('Анкетные данные сохранены');
                    status.textContent = '✅ Анкетные данные заполнены и сохранены!';
                } else {
                    throw new Error('Не найдена кнопка сохранения');
                }

                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении анкетных данных: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message || error}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const fillBtn = document.createElement('button');
        fillBtn.className = 'tm-control-btn tm-fill-btn';
        fillBtn.textContent = 'Заполнить';
        fillBtn.onclick = () => fillForm(false);
        document.body.appendChild(fillBtn);

        const fastFillBtn = document.createElement('button');
        fastFillBtn.className = 'tm-control-btn tm-fast-btn';
        fastFillBtn.textContent = 'Быстро заполнить';
        fastFillBtn.onclick = () => fillForm(true);
        document.body.appendChild(fastFillBtn);

        const profileBtn = document.createElement('button');
        profileBtn.className = 'tm-control-btn tm-profile-btn';
        profileBtn.textContent = 'Заполнить анкету';
        profileBtn.onclick = fillProfileInFirstBank;
        document.body.appendChild(profileBtn);
    }

    if (window.location.href.includes('bg.realistbank.ru/new_ticket')) {
        log('Инициализация на сайте RealistBank');
        createToggleSwitch();

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

                status.textContent = '⏳ Вводим ИНН...';
                const companyInput = await waitForElement('.gsa-dadata-company-name');
                companyInput.value = data.inn;
                companyInput.dispatchEvent(new Event('input', {bubbles: true}));
                await new Promise(r => setTimeout(r, 1500));

                status.textContent = '⏳ Вводим номер извещения...';
                await fillField('#auction_number', data.notice);

                status.textContent = '⏳ Вводим сумму БГ...';
                await fillField('#bg_sum', data.sum);

                status.textContent = '⏳ Вводим дату окончания...';
                await fillField('#bg_end_at', data.endDate);

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
    if (window.location.href.includes('bg.alfabank.ru/aft-ui/order')) {
        log('Инициализация на сайте Альфа-Банка');
        createToggleSwitch();

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

        const clickElement = async (selector) => {
            log(`Клик по элементу: ${selector}`);
            const element = await waitForElement(selector);
            element.click();
            await new Promise(r => setTimeout(r, 500));
        };

        const selectFirstOption = async () => {
            try {
                log('Попытка выбрать первый вариант из списка');
                const firstOption = await waitForElement('.suggestions-suggestion', 3000);
                firstOption.click();
                log('Первый вариант выбран');
                return true;
            } catch (error) {
                log(`Ошибка при выборе варианта: ${error.message}`);
                return false;
            }
        };

        const fillAlfabankForm = async () => {
            log('Начало заполнения формы в Альфа-Банке');
            const data = GM_getValue('bankRequestData', null);
            if (!data || !data.inn) {
                log('Ошибка: Нет сохраненных данных или ИНН');
                showStatus('❌ Нет сохраненных данных', 5000);
                return;
            }

            const status = showStatus('⏳ Начинаем заполнение в Альфа-Банке...', null);
            const phoneNumber = "79253526319";
            const email = "b.documents@bk.ru";

            try {
                status.textContent = '⏳ Вводим ИНН...';
                const innInput = await waitForElement('input[data-test-id="principal-field"]');
                innInput.value = data.inn;
                innInput.dispatchEvent(new Event('input', {bubbles: true}));
                await new Promise(r => setTimeout(r, 1500));

                await selectFirstOption();

                status.textContent = '⏳ Выбираем тип гарантии...';
                await clickElement('div[data-test-id="bankGuaranteeType"]');
                await new Promise(r => setTimeout(r, 500));

                let guaranteeType;
                if (data.guaranteeInfo.bank2Type === 'PART') {
                    guaranteeType = 'Обеспечение заявки на участие в торгах';
                } else if (data.guaranteeInfo.bank2Type === 'EXEC') {
                    guaranteeType = 'Обеспечение исполнения обязательств по контракту';
                } else if (data.guaranteeInfo.bank2Type === 'GARANT') {
                    guaranteeType = 'Обеспечение гарантийного периода';
                } else {
                    guaranteeType = 'Обеспечение заявки на участие в торгах';
                }

                const options = Array.from(document.querySelectorAll('.select__option_199of'));
                const targetOption = options.find(opt =>
                    opt.textContent.includes(guaranteeType)
                );

                if (targetOption) {
                    targetOption.click();
                } else {
                    throw new Error(`Не найден тип гарантии: ${guaranteeType}`);
                }

                status.textContent = '⏳ Вводим номер извещения...';
                await fillField('input[data-test-id="tradeNumber"]', data.notice);

                status.textContent = '⏳ Выбираем реестр ЕИС...';
                await clickElement('div[data-test-id="publicationRegistry"]');
                await new Promise(r => setTimeout(r, 500));
                await clickElement('div[data-test-id="publicationRegistry-option"]:first-child');

                status.textContent = '⏳ Вводим цену...';
                const priceValue = data.guaranteeInfo.priceField === 'Предложенная цена' ?
                    data.proposedPrice : data.initialPrice;
                await fillField('input[data-test-id="finalAmount"]', priceValue);

                status.textContent = '⏳ Вводим дату окончания...';
                await fillField('input[data-test-id="guaranteeDateRange.to"]', data.endDate);

                status.textContent = '⏳ Редактируем бенефициара...';
                await clickElement('button[data-test-id="beneficiaries.[0].editButton"]');

                status.textContent = '⏳ Вводим сумму БГ...';
                await fillField('input[data-test-id="beneficiaries[0].bgAmount"]', data.sum);

                status.textContent = '⏳ Вводим телефон...';
                await fillField('input[data-test-id="beneficiaries[0].phone"]', phoneNumber);

                status.textContent = '⏳ Вводим email...';
                await fillField('input[data-test-id="beneficiaries[0].email"]', email);

                status.textContent = '✅ Форма Альфа-Банка заполнена! Проверьте данные';
                log('Форма Альфа-Банка успешно заполнена');
                setTimeout(() => status.remove(), 5000);

            } catch (error) {
                log(`Ошибка при заполнении формы Альфа-Банка: ${error.message}`, error);
                status.textContent = `❌ Ошибка: ${error.message || error}`;
                setTimeout(() => status.remove(), 5000);
            }
        };

        const alfabankBtn = document.createElement('button');
        alfabankBtn.className = 'tm-control-btn tm-alfabank-btn';
        alfabankBtn.textContent = 'Заполнить АльфаБанк';
        alfabankBtn.onclick = fillAlfabankForm;
        document.body.appendChild(alfabankBtn);
    }
})();
