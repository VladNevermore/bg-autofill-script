// ==UserScript==
// @name [ALL] CRM + банки (единый)
// @namespace http://tampermonkey.net/
// @version 6.5
// @description Автосохранение, автозаполнение заявок и анкет банков
// @author VladNevermore
// @match https://crm.finleo.ru/crm/orders/*
// @match https://bg.realistbank.ru/new_ticket*
// @match https://bg.alfabank.ru/aft-ui/order*
// @match https://tendertech.ru/front/table/my-applications*
// @match https://tendertech.ru/*
// @match https://bgol.akbars.ru/tasks?add-task=bg-pa
// @match https://likebg.ru/agent/request/create
// @match https://assist24.kubankredit.ru/create
// @match https://lk.vfbank.ru/kabinet*
// @match https://lk.gosoblako.com/applications/new
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_addStyle
// @grant GM_openInTab
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/bgauto.user.js
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/bgauto.user.js
// ==/UserScript==

(function() {
'use strict';

    GM_addStyle(`
    .tm-save-btn, .tm-profile-btn, .tm-mass-btn {
        position: fixed; z-index: 9999; padding: 10px 15px; border: none;
        border-radius: 5px; font-weight: bold; cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-size: 14px; display: block;
    }
    .tm-save-btn { background: #4CAF50; color: white; bottom: 20px; right: 20px; }
    .tm-profile-btn { background: #9C27B0; color: white; bottom: 80px; right: 20px; }
    .tm-mass-btn { background: #FF9800; color: white; bottom: 140px; right: 20px; }
    .tm-status { position: fixed; z-index: 9998; bottom: 200px; right: 20px;
        background: #333; color: white; padding: 8px 12px; border-radius: 5px;
        font-size: 14px; max-width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none; white-space: pre-wrap;
    }
    .realist-create-btn, .alfa-create-btn, .tendertech-create-btn,
    .akbars-create-btn, .likebg-create-btn, .kuban-create-btn,
    .vnesh-create-btn, .gosoblako-create-btn {
        color: white !important; border: none !important; border-radius: 4px !important;
        padding: 6px 12px !important; font-size: 12px !important; cursor: pointer !important;
        margin-left: 8px !important; font-weight: bold !important; display: inline-block !important;
    }
    .realist-create-btn { background: #607D8B !important; }
    .alfa-create-btn { background: #EF3124 !important; }
    .tendertech-create-btn { background: #FF6F00 !important; }
    .akbars-create-btn { background: #1565C0 !important; }
    .likebg-create-btn { background: #00897B !important; }
    .kuban-create-btn { background: #2E7D32 !important; }
    .vnesh-create-btn { background: #6A1B9A !important; }
    .gosoblako-create-btn { background: #0D47A1 !important; }
    .tm-bank-fill-btn {
        position: fixed; z-index: 9999; padding: 10px 15px; border: none;
        border-radius: 5px; font-weight: bold; cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-size: 14px; display: block;
    }
`);

const log = (msg, data) => console.log(`[AllInOne] ${msg}`, data || '');
const showStatus = (msg, duration = 4000) => {
    const old = document.querySelector('.tm-status');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'tm-status';
    el.textContent = msg;
    el.style.display = 'block';
    document.body.appendChild(el);
    if (duration) setTimeout(() => el.remove(), duration);
    return el;
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = (sel, timeout = 15000) => new Promise((res, rej) => {
    const start = Date.now();
    const check = () => {
        const el = document.querySelector(sel);
        if (el) return res(el);
        if (Date.now()-start > timeout) return rej(new Error(`Timeout: ${sel}`));
        requestAnimationFrame(check);
    };
    check();
});

const normalizeNumber = (text) => (text || '').replace(/\s/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
const extractCleanPrice = (text) => {
    if (!text) return '';
    const t = text.split('₽')[0].trim();
    const num = parseFloat(normalizeNumber(t));
    return isNaN(num) ? '' : num.toString();
};
const extractLaw = (text) => {
    if (!text) return '';
    if (text.includes('615 ПП') || text.includes('185 ФЗ')) return '615';
    if (text.includes('Коммерция')) return 'Коммерческий';
    const m = text.match(/(44|223)\s*ФЗ/);
    return m ? m[1] : '';
};

const findFieldByLabel = (label) => {
    const rows = document.querySelectorAll('.sc-ccd2f869-0.dDLOXv');
    for (const row of rows) {
        const labelDiv = row.querySelector('.sc-ccd2f869-2.lLKwF');
        const valueDiv = row.querySelector('.sc-ccd2f869-3.ibrElz');
        if (labelDiv && valueDiv && labelDiv.textContent.trim() === label) {
            const clone = valueDiv.cloneNode(true);
            clone.querySelectorAll('button, .MuiChip-root').forEach(e => e.remove());
            return clone.textContent.trim();
        }
    }
    return null;
};

const getInn = () => {
    const spans = document.querySelectorAll('span.MuiTypography-caption');
    for (const span of spans) {
        const txt = span.textContent.trim();
        if (txt.startsWith('ИНН')) {
            const m = txt.match(/\d{10,12}/);
            if (m) return m[0];
        }
    }
    return '';
};

async function switchTab(tabName) {
    log(`Переключение на вкладку: ${tabName}`);
    const tabs = Array.from(document.querySelectorAll('button.MuiTab-root'));
    const tab = tabs.find(t => t.textContent.trim() === tabName);
    if (!tab) {
        log(`Вкладка ${tabName} не найдена`);
        return false;
    }
    tab.click();
    await sleep(1500);
    log(`Вкладка ${tabName} активирована`);
    return true;
}

async function ensureDataSaved() {
    log('Проверка сохранения данных');
    const paramsExist = findFieldByLabel('Потребность');
    if (!paramsExist) {
        log('Параметры не найдены, переход на вкладку Информация');
        await switchTab('Информация');
        await sleep(2000);
    }
    const saved = saveParams();
    if (!saved) return false;

    const profileRows = document.querySelectorAll('.sc-867848fc-0');
    if (profileRows.length === 0) {
        log('Анкета не найдена, переход на вкладку Анкета');
        await switchTab('Анкета');
        await sleep(2000);
    }
    const profileSaved = saveProfile();
    if (!profileSaved) return false;

    log('Данные успешно сохранены');
    return true;
}

function saveParams() {
    const inn = getInn();
    if (!inn) { log('ИНН не найден'); showStatus('❌ ИНН не найден'); return false; }
    const need = findFieldByLabel('Потребность');
    if (!need) { log('Потребность не найдена'); showStatus('❌ Параметры не найдены'); return false; }
    const notice = findFieldByLabel('Номер извещения');
    const initialPrice = findFieldByLabel('Начальная цена');
    const proposedPrice = findFieldByLabel('Предложенная цена');
    const sum = findFieldByLabel('Сумма БГ');
    const law = findFieldByLabel('Закон');
    const periodStartRaw = findFieldByLabel('Срок c');
    const periodEndRaw = findFieldByLabel('Срок до');
    const advance = findFieldByLabel('Аванс');
    const advancePercent = findFieldByLabel('% аванса');
    const advanceSum = findFieldByLabel('Сумма аванса');
    const customerInn = findFieldByLabel('ИНН заказчика');
    const customerName = findFieldByLabel('Заказчик');
    const datePublication = findFieldByLabel('Дата извещения');
    const purchaseSubject = findFieldByLabel('Предмет контракта');
    const purchaseLink = findFieldByLabel('Ссылка');

    let startDate = '', endDate = '';
    if (periodStartRaw) {
        const m = periodStartRaw.match(/(\d{2}.\d{2}.\d{4})/);
        if (m) startDate = m[0];
    }
    if (periodEndRaw) {
        const dates = periodEndRaw.match(/(\d{2}.\d{2}.\d{4})/g);
        if (dates && dates.length > 0) endDate = dates[dates.length-1];
    }

    let advanceAmount = 'Нет';
    let advancePercentClean = null;
    if (advance && advance.toLowerCase().includes('да')) {
        const sumClean = extractCleanPrice(advanceSum);
        if (sumClean) advanceAmount = sumClean;
        else if (advancePercent) {
            advanceAmount = advancePercent.trim();
            advancePercentClean = advancePercent.trim();
        } else advanceAmount = 'Да';
    }

    const contactsBlock = document.querySelector('.contacts-auto');
    let customerPhone = '', customerEmail = '', customerAddress = '';
    if (contactsBlock) {
        const phoneEl = contactsBlock.querySelector('.contact-phone');
        const emailEl = contactsBlock.querySelector('.contact-email');
        const addrEl = contactsBlock.querySelector('.contact-address');
        if (phoneEl) customerPhone = phoneEl.textContent.replace(/^📞\s/, '').trim();
        if (emailEl) customerEmail = emailEl.textContent.replace(/^✉️\s/, '').trim();
        if (addrEl) customerAddress = addrEl.textContent.replace(/^📍\s*/, '').trim();
    }

    const data = {
        inn, notice: notice || '', startDate, endDate,
        sum: extractCleanPrice(sum), law: extractLaw(law), advanceAmount,
        advancePercent: advancePercentClean,
        initialPrice: extractCleanPrice(initialPrice), proposedPrice: extractCleanPrice(proposedPrice),
        customerInn: customerInn || '', customerName: customerName || '',
        customerPhone, customerEmail, customerAddress, datePublication: datePublication || '',
        needText: need, purchaseSubject: purchaseSubject || '',
        purchaseLink: purchaseLink || ''
    };
    GM_setValue('bankRequestData', data);
    log('Параметры сохранены', data);
    showStatus('✅ Параметры сохранены!');
    return true;
}

function saveProfile() {
    const profileRows = document.querySelectorAll('.sc-867848fc-0');
    if (profileRows.length === 0) { log('Анкета не найдена'); showStatus('❌ Анкета не найдена'); return false; }
    const profile = {};
    profileRows.forEach(row => {
        const label = row.querySelector('.sc-867848fc-1')?.textContent?.replace(/:/, '').trim();
        const value = row.querySelector('.sc-867848fc-2')?.textContent?.trim();
        if (label && value !== undefined) profile[label] = value;
    });
    const persons = [];
    const personBlocks = document.querySelectorAll('.sc-45e60d61-1.crQhlQ');
    personBlocks.forEach(block => {
        const title = block.querySelector('h5')?.textContent?.trim();
        const rows = block.querySelectorAll('.sc-867848fc-0');
        const info = {};
        rows.forEach(r => {
            const lbl = r.querySelector('.sc-867848fc-1')?.textContent?.replace(/:/, '').trim();
            const val = r.querySelector('.sc-867848fc-2')?.textContent?.trim();
            if (lbl && val !== undefined) info[lbl] = val;
        });
        if (title) persons.push({ title, ...info });
    });
    GM_setValue('clientProfileData', { company: profile, persons });
    log('Анкета сохранена');
    showStatus('✅ Анкета сохранена!');
    return true;
}

function initCRM() {
    const bankConfigs = [
        { keyword: 'РЕАЛИСТ', className: 'realist-create-btn', flag: 'autoFillRealist', url: 'https://bg.realistbank.ru/new_ticket/stage_0?product_id=1', group: 'realist' },
        { keyword: 'АЛЬФА', className: 'alfa-create-btn', flag: 'autoFillAlfa', url: 'https://bg.alfabank.ru/aft-ui/order', group: 'alfa' },
        { keyword: 'УРАЛСИБ', className: 'tendertech-create-btn', flag: 'autoFillTendertech', url: 'https://tendertech.ru/front', group: 'tendertech' },
        { keyword: 'ТКБ БАНК', className: 'tendertech-create-btn', flag: 'autoFillTendertech', url: 'https://tendertech.ru/front', group: 'tendertech' },
        { keyword: 'АГРОРОС', className: 'tendertech-create-btn', flag: 'autoFillTendertech', url: 'https://tendertech.ru/front', group: 'tendertech' },
        { keyword: 'Калуга', className: 'tendertech-create-btn', flag: 'autoFillTendertech', url: 'https://tendertech.ru/front', group: 'tendertech' },
        { keyword: 'МОСКОВСКИЙ КРЕДИТНЫЙ', className: 'tendertech-create-btn', flag: 'autoFillTendertech', url: 'https://tendertech.ru/front', group: 'tendertech' },
        { keyword: 'АК БАРС', className: 'akbars-create-btn', flag: 'autoFillAkbars', url: 'https://bgol.akbars.ru/tasks?add-task=bg-pa', group: 'akbars' },
        { keyword: 'ГТ банк', className: 'likebg-create-btn', flag: 'autoFillLikebg', url: 'https://likebg.ru/agent/request/create', group: 'likebg' },
        { keyword: 'Трансстройбанк', className: 'likebg-create-btn', flag: 'autoFillLikebg', url: 'https://likebg.ru/agent/request/create', group: 'likebg' },
        { keyword: 'СОКОЛОВСКИЙ', className: 'likebg-create-btn', flag: 'autoFillLikebg', url: 'https://likebg.ru/agent/request/create', group: 'likebg' },
        { keyword: 'Кубань Кредит', className: 'kuban-create-btn', flag: 'autoFillKuban', url: 'https://assist24.kubankredit.ru/create', group: 'kuban' },
        { keyword: 'ВНЕШФИНБАНК', className: 'vnesh-create-btn', flag: 'autoFillVnesh', url: 'https://lk.vfbank.ru/kabinet', group: 'vnesh' },
        { keyword: 'ПСБ', className: 'gosoblako-create-btn', flag: 'autoFillGosOblako', url: 'https://lk.gosoblako.com/applications/new', group: 'gosoblako' },
        { keyword: 'ГПБ', className: 'gosoblako-create-btn', flag: 'autoFillGosOblako', url: 'https://lk.gosoblako.com/applications/new', group: 'gosoblako' }
    ];

    function findBankConfig(cells) {
        for (const td of cells) {
            const ariaDivs = td.querySelectorAll('div[aria-label]');
            for (const div of ariaDivs) {
                const aria = div.getAttribute('aria-label');
                for (const cfg of bankConfigs) {
                    if (aria.includes(cfg.keyword)) {
                        return cfg;
                    }
                }
            }
        }
        return null;
    }

    async function openSingleBank(cfg) {
        const ok = await ensureDataSaved();
        if (!ok) return;
        GM_setValue(cfg.flag, true);
        const newWindow = window.open(cfg.url, '_blank');
        if (newWindow) {
            const data = GM_getValue('bankRequestData', null);
            setTimeout(() => {
                newWindow.postMessage({ type: cfg.flag.toUpperCase()+'_AUTOFILL', payload: data }, '*');
            }, 3000);
        }
    }

    async function openAllBanks() {
        const rows = document.querySelectorAll('tr.V5pxh');
        const seenGroups = new Set();
        const openUrls = [];
        rows.forEach(row => {
            const cfg = findBankConfig(row.querySelectorAll('td'));
            if (cfg && !seenGroups.has(cfg.group)) {
                seenGroups.add(cfg.group);
                openUrls.push({ url: cfg.url, flag: cfg.flag });
            }
        });
        if (openUrls.length === 0) {
            showStatus('⚠️ Не найдено ни одного банка.');
            return;
        }
        const ok = await ensureDataSaved();
        if (!ok) return;
        openUrls.forEach((item, index) => {
            setTimeout(() => {
                GM_setValue(item.flag, true);
                const newWindow = window.open(item.url, '_blank');
                if (newWindow) {
                    const data = GM_getValue('bankRequestData', null);
                    setTimeout(() => {
                        newWindow.postMessage({ type: item.flag.toUpperCase()+'_AUTOFILL', payload: data }, '*');
                    }, 3000);
                }
            }, index * 1500);
        });
    }

    function addBankButtons() {
        const rows = document.querySelectorAll('tr.V5pxh');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const cfg = findBankConfig(cells);
            if (!cfg) return;
            const actionCell = cells[0];
            const container = actionCell.querySelector('.sc-cOpnSz.eCLuvx.MuiBox-root') || actionCell;
            if (!container.querySelector(`.${cfg.className}`)) {
                const btn = document.createElement('button');
                btn.className = cfg.className;
                btn.textContent = 'Завести';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openSingleBank(cfg);
                };
                container.appendChild(btn);
            }
        });
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'tm-save-btn';
    saveBtn.textContent = 'Сохранить параметры';
    saveBtn.onclick = () => {
        if (!findFieldByLabel('Потребность')) {
            switchTab('Информация').then(() => setTimeout(saveParams, 2000));
        } else saveParams();
    };
    document.body.appendChild(saveBtn);

    const profileBtn = document.createElement('button');
    profileBtn.className = 'tm-profile-btn';
    profileBtn.textContent = 'Сохранить анкету';
    profileBtn.onclick = () => {
        if (document.querySelectorAll('.sc-867848fc-0').length === 0) {
            switchTab('Анкета').then(() => setTimeout(saveProfile, 2000));
        } else saveProfile();
    };
    document.body.appendChild(profileBtn);

    const massBtn = document.createElement('button');
    massBtn.className = 'tm-mass-btn';
    massBtn.textContent = 'Завести все банки';
    massBtn.onclick = openAllBanks;
    document.body.appendChild(massBtn);

    addBankButtons();
    new MutationObserver(addBankButtons).observe(document.body, { childList: true, subtree: true });
}

async function fillRealistForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Реалист...', 0);
    try {
        const selectValue = async (sel, val) => {
            const el = await waitFor(sel);
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(300);
        };
        const fillField = async (sel, val) => {
            const el = await waitFor(sel);
            el.focus();
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            await sleep(300);
        };

        await selectValue('#product_id', '1');
        const lawMap = { '44': '1', '223': '2', '615': '3', 'Коммерческий': '0' };
        await selectValue('#type_bank_guarantee', lawMap[data.law] || '0');
        await selectValue('#form_bg', '2');

        const partyInput = await waitFor('input.w-dadata-party');
        partyInput.value = data.inn;
        partyInput.dispatchEvent(new Event('input', { bubbles: true }));
        partyInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(2500);
        const firstSugg = document.querySelector('.suggestions-suggestion');
        if (firstSugg) firstSugg.click();
        await sleep(1500);

        await fillField('#bg_sum', data.sum);
        if (data.endDate) {
            const dateInput = await waitFor('#bg_end_at');
            dateInput.focus();
            dateInput.value = data.endDate;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(300);
            document.body.click();
            await sleep(500);
        }
        await fillField('#auction_number', data.notice);
        let realistType = '0';
        if (data.needText.includes('БГ на исполнение')) realistType = '2';
        else if (data.needText.includes('БГ на гарантийный срок')) realistType = '3';
        else if (data.needText.includes('БГ на участие')) realistType = '0';
        await selectValue('#bg_reason', realistType);
        status.textContent = '✅ Реалист заполнен';
        setTimeout(() => status.remove(), 3000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillRealistProfile() {
    const profile = GM_getValue('clientProfileData', null);
    const params = GM_getValue('bankRequestData', null);
    if (!profile) { showStatus('❌ Анкета не сохранена'); return; }
    const status = showStatus('⏳ Анкета Реалист...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const actualAsLegal = document.querySelector('#client_actual_address_as_legal');
        if (actualAsLegal && !actualAsLegal.checked) actualAsLegal.click();
        const postAsLegal = document.querySelector('#client_post_address_as_legal');
        if (postAsLegal && !postAsLegal.checked) postAsLegal.click();

        setInput(await waitFor('#employees_num'), '5');

        const director = profile.persons?.find(p => p.title?.includes('Генеральный директор') || p.title?.includes('Директор'));
        if (director) {
            setInput(await waitFor('#client_head_position'), 'Генеральный директор');
            setInput(await waitFor('#client_head_full_name'), director['ФИО:'] || '');
            if (director['Серия паспорта:']) setInput(await waitFor('#client_head_passport_series'), director['Серия паспорта:']);
            if (director['Номер паспорта:']) setInput(await waitFor('#client_head_passport_number'), director['Номер паспорта:']);
            if (director['Кем выдан:']) setInput(await waitFor('#client_head_passport_taken'), director['Кем выдан:']);
            if (director['Дата выдачи:']) setInput(await waitFor('#client_head_passport_date'), director['Дата выдачи:']);
            if (director['Адрес регистрации:']) setInput(await waitFor('#client_head_legal_address'), director['Адрес регистрации:']);
            if (director['ИНН:']) setInput(await waitFor('#client_head_inn'), director['ИНН:']);
        }

        const contactFio = director?.['ФИО:'] || profile.company?.['Телефон:'] || '';
        setInput(await waitFor('#contact_person_name'), contactFio);
        setInput(await waitFor('#contact_person_phone'), profile.company?.['Телефон:'] || '+70000000000');
        setInput(await waitFor('#contact_person_email'), profile.company?.['Почта:'] || 'b.documents@bk.ru');
        setInput(await waitFor('#client_website'), '-');

        if (params) {
            const beneficiaryInput = await waitFor('#beneficiary_full_name');
            beneficiaryInput.value = params.customerName || '';
            beneficiaryInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1500);
            const sugg = document.querySelector('.suggestions-suggestion');
            if (sugg) sugg.click();
        }

        if (params && params.purchaseSubject) {
            setInput(await waitFor('#contract_subject'), params.purchaseSubject);
        }

        const founders = profile.persons?.filter(p => p.title?.includes('Учредитель'));
        if (founders && founders.length > 0) {
            const deleteButtons = document.querySelectorAll('#founders .gsa-script-delete');
            for (let i = 1; i < deleteButtons.length; i++) deleteButtons[i].click();
            const firstFounder = founders[0];
            setInput(await waitFor('#founder_0_name'), firstFounder['ФИО:'] || '');
            if (firstFounder['ИНН:']) setInput(await waitFor('#founder_0_inn'), firstFounder['ИНН:']);
            const share = firstFounder['Доля:'] ? parseFloat(firstFounder['Доля:']) : 100;
            setInput(await waitFor('#founder_0_share'), String(share));
        }

        const beneficial = profile.persons?.find(p => p.title?.includes('Учредитель'));
        if (beneficial) {
            setInput(await waitFor('[data-gsa-index="name"]'), beneficial['ФИО:'] || '');
            if (beneficial['Адрес регистрации:']) setInput(await waitFor('[data-gsa-index="legal_address"]'), beneficial['Адрес регистрации:']);
            if (beneficial['ИНН:']) setInput(await waitFor('[data-gsa-index="inn"]'), beneficial['ИНН:']);
            if (beneficial['Серия паспорта:']) setInput(await waitFor('[data-gsa-index="document_series"]'), beneficial['Серия паспорта:']);
            if (beneficial['Номер паспорта:']) setInput(await waitFor('[data-gsa-index="document_number"]'), beneficial['Номер паспорта:']);
            if (beneficial['Дата выдачи:']) setInput(await waitFor('[data-gsa-index="document_date"]'), beneficial['Дата выдачи:']);
            if (beneficial['Кем выдан:']) setInput(await waitFor('[data-gsa-index="document_taken"]'), beneficial['Кем выдан:']);
            if (beneficial['Место рождения:']) setInput(await waitFor('[data-gsa-index="birth_place"]'), beneficial['Место рождения:']);
            if (beneficial['Дата рождения:']) setInput(await waitFor('[data-gsa-index="birth_date"]'), beneficial['Дата рождения:']);
        }

        const requisites = profile.persons?.find(p => p.title?.includes('Реквизиты'));
        if (requisites && requisites['БИК:']) {
            const bankRows = document.querySelectorAll('#checking_accounts .bank-container');
            if (bankRows.length > 0) {
                const bikInput = bankRows[0].querySelector('[data-gsa-index="3"]');
                if (bikInput) {
                    setInput(bikInput, requisites['БИК:']);
                    await sleep(1000);
                    const sugg = document.querySelector('.suggestions-suggestion');
                    if (sugg) sugg.click();
                }
            }
        }

        status.textContent = '✅ Анкета Реалист заполнена';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillAlfaForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Альфа...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const principalInput = await waitFor('[data-test-id="principal-field"]');
        principalInput.focus();
        setInput(principalInput, data.inn);
        await sleep(2500);
        const suggestion = document.querySelector('[role="option"], .suggestions-suggestion');
        if (suggestion) { suggestion.click(); await sleep(1500); }

        let needType = 'исполнения';
        if (data.needText.includes('БГ на участие')) needType = 'заявки';
        else if (data.needText.includes('БГ на гарантийный срок')) needType = 'гарантийных';
        else if (data.needText.includes('БГ на исполнение')) needType = 'исполнения';

        const typeSelect = await waitFor('[data-test-id="bankGuaranteeType"] .select__field_pkyjw');
        typeSelect.click();
        await sleep(800);
        const opts = document.querySelectorAll('[role="option"]');
        for (const opt of opts) {
            if (opt.textContent.includes(needType)) { opt.click(); await sleep(500); break; }
        }

        const tradeInput = await waitFor('[data-test-id="tradeNumber"]');
        setInput(tradeInput, data.notice || 'б/н');
        await sleep(4000);

        const lawValMap = { '44': '44', '223': '223', '615': '185-615', 'Коммерческий': 'Коммерческий' };
        const lawVal = lawValMap[data.law] || '44';
        const radioLaw = document.querySelector(`[data-test-id="law.${lawVal}"]`);
        if (radioLaw) radioLaw.click();

        if (data.law === '44') {
            const pubSelect = await waitFor('[data-test-id="publicationRegistry"] .select__field_pkyjw');
            pubSelect.click();
            await sleep(800);
            const pubOpts = document.querySelectorAll('[role="option"]');
            for (const opt of pubOpts) {
                if (opt.textContent.includes('В реестре ЕИС')) { opt.click(); await sleep(500); break; }
            }
        }

        if (data.law === '223') {
            const ikzInput = await waitFor('[data-test-id="ikz"]');
            setInput(ikzInput, '111111111111111111111111111111111111');
        }

        if (data.proposedPrice) {
            const finalInput = await waitFor('[data-test-id="finalAmount"]');
            setInput(finalInput, data.proposedPrice);
        }

        const hasAdvance = data.advanceAmount && data.advanceAmount !== 'Нет';
        const switchAv = document.querySelector('[data-test-id="prepaymentExists"]');
        if (switchAv && switchAv.checked !== hasAdvance) switchAv.click();

        if (hasAdvance) {
            await sleep(500);
            const percentField = await waitFor('[data-test-id="prepaymentAmount.percent"]');
            let percentValue = '0';
            if (data.advancePercent) {
                percentValue = data.advancePercent.replace('%', '').trim();
            } else if (data.advanceAmount && data.advanceAmount !== 'Да') {
                const sum = parseFloat(data.advanceAmount);
                const nmc = parseFloat(data.initialPrice || data.proposedPrice || 0);
                if (nmc > 0) percentValue = Math.round((sum / nmc) * 100 * 100) / 100;
            }
            setInput(percentField, String(percentValue).replace('.', ','));
        }

        const isWarranty = data.needText.includes('гарантийный срок');
        const switchWarr = document.querySelector('[data-test-id="isGuaranteePeriod"]');
        if (switchWarr && switchWarr.checked !== isWarranty) switchWarr.click();

        const radioDate = document.querySelector('[data-test-id="termStartDateType.FROM_ISSUE_DATE"]');
        if (radioDate) radioDate.click();
        if (data.endDate) {
            const endInput = await waitFor('[data-test-id="guaranteeDateRange.to"]');
            setInput(endInput, data.endDate);
        }

        const purchaseLinkInput = await waitFor('[data-test-id="purchaseLink"]');
        if (data.purchaseLink && !data.purchaseLink.startsWith('-')) {
            setInput(purchaseLinkInput, data.purchaseLink);
        } else {
            setInput(purchaseLinkInput, '-');
        }

        if (data.purchaseSubject) {
            const subjectInput = await waitFor('[data-test-id="purchaseSubject"]');
            subjectInput.value = data.purchaseSubject;
            subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await sleep(1000);
        const editBtn = document.querySelector('[data-test-id="beneficiaries.[0].editButton"]');
        if (editBtn) {
            editBtn.click();
            await sleep(1000);
            const bgAmountInput = await waitFor('[data-test-id="beneficiaries[0].bgAmount"]', 10000);
            setInput(bgAmountInput, data.sum);
            const phoneInput = document.querySelector('[data-test-id="beneficiaries[0].phone"]');
            if (phoneInput && !phoneInput.value.trim()) setInput(phoneInput, data.customerPhone || '89823609907');
            const emailInput = document.querySelector('[data-test-id="beneficiaries[0].email"]');
            if (emailInput && !emailInput.value.trim()) setInput(emailInput, data.customerEmail || 'info@example.com');
            await sleep(500);
            const saveBtn = document.querySelector('[data-test-id="beneficiaries.modal.save"]');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.click(); await sleep(500); }
        } else {
            const addBeneficiaryBtn = await waitFor('[data-test-id="beneficiaries.addButton"]');
            addBeneficiaryBtn.click();
            await sleep(1000);
            const addBeneficiaryModalBtn = await waitFor('[data-test-id="beneficiaries.modal.addButton"]');
            addBeneficiaryModalBtn.click();
            await sleep(1000);
            const companyField = await waitFor('[data-test-id="beneficiaries[0].company-field"]');
            setInput(companyField, data.customerInn);
            await sleep(2000);
            const companyOption = document.querySelector('[role="option"]');
            if (companyOption) companyOption.click();
            await sleep(1000);
            const bgAmount = await waitFor('[data-test-id="beneficiaries[0].bgAmount"]');
            setInput(bgAmount, data.sum);
            const phone = document.querySelector('[data-test-id="beneficiaries[0].phone"]');
            if (phone) setInput(phone, data.customerPhone || '89823609907');
            const email = document.querySelector('[data-test-id="beneficiaries[0].email"]');
            if (email) setInput(email, data.customerEmail || 'info@example.com');
            const address = document.querySelector('[data-test-id="beneficiaries[0].legalAddressResult"]');
            if (address) setInput(address, data.customerAddress || '');
            await sleep(500);
            const saveModal = document.querySelector('[data-test-id="beneficiaries.modal.save"]');
            if (saveModal) { saveModal.disabled = false; saveModal.click(); await sleep(500); }
        }

        status.textContent = '✅ Альфа заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        console.error('[Alfa] Error:', e);
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillAlfaProfile() {
    const profile = GM_getValue('clientProfileData', null);
    if (!profile) { showStatus('❌ Анкета не сохранена'); return; }
    const status = showStatus('⏳ Заполняем анкету Альфа-Банка...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const addAccountBtn = await waitFor('[data-test-id="company.bankAccounts.addButton"]', 5000);
        addAccountBtn.click();
        await sleep(1000);
        const bikInput = await waitFor('[data-test-id="bank-field"]', 10000);
        const requisites = profile.persons?.find(p => p.title?.includes('Реквизиты'));
        const bik = requisites?.['БИК:'] || '';
        const account = requisites?.['р/с:'] || '';
        setInput(bikInput, bik);
        await sleep(500);
        const firstBikOption = document.querySelector('[role="option"]');
        if (firstBikOption) firstBikOption.click();
        await sleep(500);
        const accountInput = await waitFor('[data-test-id="number"]', 5000);
        setInput(accountInput, account);
        await sleep(500);
        const saveAccountBtn = document.querySelector('[data-test-id="drawer.footer"] [type="submit"]');
        if (saveAccountBtn) { saveAccountBtn.disabled = false; saveAccountBtn.click(); }
        await sleep(1000);

        const contactEditBtn = await waitFor('[data-test-id="company.contactPerson.editButton"]');
        contactEditBtn.click();
        await sleep(1000);
        const fioInput = await waitFor('[data-test-id="name"]', 5000);
        const director = profile.persons?.find(p => p.title?.includes('Генеральный директор'));
        const fio = director?.['ФИО:'] || '';
        setInput(fioInput, fio);
        const phoneInput = await waitFor('[data-test-id="phone"]', 5000);
        setInput(phoneInput, profile.company?.['Телефон:'] || '');
        const emailInput = await waitFor('[data-test-id="email"]', 5000);
        setInput(emailInput, profile.company?.['Почта:'] || '');
        await sleep(500);
        const saveContactBtn = document.querySelector('[data-test-id="drawer.footer"] [type="submit"]');
        if (saveContactBtn) { saveContactBtn.disabled = false; saveContactBtn.click(); }
        await sleep(1000);

        const headEditBtn = await waitFor('[data-test-id="company.head.editButton"]');
        headEditBtn.click();
        await sleep(1000);
        const positionInput = await waitFor('[data-test-id="relationEmployee.position"]', 5000);
        setInput(positionInput, 'Директор');
        const docSelect = await waitFor('[data-test-id="relationEmployee.authorizationDocRefId"]');
        docSelect.click();
        await sleep(500);
        const docOption = Array.from(document.querySelectorAll('[role="option"]')).find(opt => opt.textContent.includes('Решение'));
        if (docOption) docOption.click();
        await sleep(500);
        const docNumberInput = await waitFor('[data-test-id="relationEmployee.authorizationNumber"]', 5000);
        setInput(docNumberInput, '1');
        const issueDateInput = await waitFor('[data-test-id="relationEmployee.authorizationIssueDate"]', 5000);
        setInput(issueDateInput, director?.['Срок полномочий от:'] || '');
        const expDateInput = await waitFor('[data-test-id="relationEmployee.authorizationExpirationDate"]', 5000);
        setInput(expDateInput, director?.['Срок полномочий до:'] || '');
        await sleep(500);
        const saveHeadBtn = document.querySelector('[data-test-id="drawer.footer"] [type="submit"]');
        if (saveHeadBtn) { saveHeadBtn.disabled = false; saveHeadBtn.click(); }
        await sleep(1000);

        const signerAddBtn = await waitFor('[data-test-id="company.signer.addButton"]');
        signerAddBtn.click();
        await sleep(1000);
        const selectSigner = await waitFor('[data-test-id="drawer.content"] .select__component_1fscm', 5000);
        selectSigner.click();
        await sleep(500);
        const signerOption = document.querySelector('[role="option"]');
        if (signerOption) signerOption.click();
        await sleep(500);
        const saveSignerBtn = document.querySelector('[data-test-id="drawer.footer"] [type="submit"]');
        if (saveSignerBtn) { saveSignerBtn.disabled = false; saveSignerBtn.click(); }
        await sleep(500);

        status.textContent = '✅ Анкета Альфа-Банка заполнена';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillTendertechForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Тендертех...', 0);
    try {
        const isTablePage = window.location.href.includes('/table/my-applications');
        if (isTablePage) {
            const newBtn = await waitFor('[data-qa="buttonNewApplication"]');
            newBtn.click();
            await sleep(1500);
            const modal = await waitFor('[data-qa="modalNewApplication"]');
            const rntInput = await waitFor('[data-qa="modalNewApplicationInputRnt"]');
            rntInput.value = data.notice || '';
            rntInput.dispatchEvent(new Event('input', { bubbles: true }));
            const typeSelect = await waitFor('[data-qa="modalNewApplicationSelectTypeBg"]');
            typeSelect.click();
            await sleep(500);
            const typeMap = {
                'БГ на участие': 'Банковская гарантия на участие в тендере',
                'БГ на исполнение': 'Банковская гарантия на исполнение контракта',
                'БГ на гарантийный срок': 'Банковская гарантия на обеспечение гарантийных обязательств'
            };
            let targetType = typeMap[data.needText] || 'Банковская гарантия на исполнение контракта';
            const options = document.querySelectorAll('.v-menu__content .options__item');
            for (const opt of options) {
                if (opt.textContent.trim() === targetType) { opt.click(); break; }
            }
            await sleep(500);
            const radioClient = document.querySelector('[data-qa="modalNewApplicationRadioClient"] input[type="radio"]');
            if (radioClient) { radioClient.click(); await sleep(300); }
            const searchInput = await waitFor('[data-qa="modalNewApplicationInputClientSearch"]');
            searchInput.value = data.inn;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(3000);
            const clientRow = document.querySelector('table tbody tr:not(.no-border-bottom)');
            if (clientRow) {
                const radioInTable = clientRow.querySelector('input[type="radio"]');
                if (radioInTable) { radioInTable.click(); await sleep(300); }
            } else {
                const radioInn = document.querySelector('[data-qa="modalNewApplicationRadioInn"] input[type="radio"]');
                if (radioInn) { radioInn.click(); await sleep(300); }
                const innInput = await waitFor('[data-qa="modalNewApplicationInputInn"]');
                innInput.value = data.inn;
                innInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            await sleep(500);
            const createBtn = await waitFor('[data-qa="modalNewApplicationButtonCreate"]');
            createBtn.click();
            await sleep(5000);
            status.textContent = '⏳ Ожидаем перехода на страницу параметров...';
            await waitFor('[data-qa="inputSumBgParameters"]', 30000);
            status.textContent = '⏳ Заполняем параметры...';
        }

        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const setInput = (el, val) => {
            nativeSetter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const sumBg = await waitFor('[data-qa="inputSumBgParameters"]');
        setInput(sumBg, data.sum || '');
        if (data.startDate) {
            const fromDate = await waitFor('[data-qa="inputDateBgFromParameters"]');
            setInput(fromDate, data.startDate);
        }
        if (data.endDate) {
            const toDate = await waitFor('[data-qa="inputDateBgToParameters"]');
            setInput(toDate, data.endDate);
        }
        const hasAdvance = data.advanceAmount && data.advanceAmount !== 'Нет';
        const radioYes = document.querySelector('[data-qa="radioPrepaidParameters"] [data-qa="yes"] input[type="radio"]');
        const radioNo = document.querySelector('[data-qa="radioPrepaidParameters"] [data-qa="no"] input[type="radio"]');
        if (hasAdvance && radioYes) radioYes.click();
        else if (!hasAdvance && radioNo) radioNo.click();

        const isWarranty = data.needText.includes('гарантийный срок');
        const warrantyYes = document.querySelector('[data-qa="radioWarrantyObligationsParameters"] [data-qa="yes"] input');
        const warrantyNo = document.querySelector('[data-qa="radioWarrantyObligationsParameters"] [data-qa="no"] input');
        if (isWarranty && warrantyYes) warrantyYes.click();
        else if (!isWarranty && warrantyNo) warrantyNo.click();

        const saveBtn = await waitFor('[data-qa="buttonSaveChangesParameters"]');
        saveBtn.click();
        await sleep(2000);
        status.textContent = '✅ Тендертех заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillAkbarsForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Ак Барс...', 0);
    try {
        const principalInput = await waitFor('input.fzp-company__autocomplete');
        principalInput.value = data.inn;
        principalInput.dispatchEvent(new Event('input', { bubbles: true }));
        principalInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(2500);
        const firstSugg = document.querySelector('.suggestions .suggestion-selected');
        if (firstSugg) firstSugg.click();
        await sleep(1500);

        const fillField = async (sel, val) => {
            const el = await waitFor(sel);
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        await fillField('input[ng-model="my.model.contactPerson.fio"]', 'Иванов Иван Иванович');
        await fillField('input[ng-model="my.model.contactPerson.email"]', 'test@test.ru');
        await fillField('input[ng-model="my.model.contactPerson.workPhone"]', '+7(999)999-99-99');

        let bgType = '3';
        if (data.needText.includes('БГ на участие')) bgType = '2';
        else if (data.needText.includes('БГ на исполнение')) bgType = '3';
        else if (data.needText.includes('БГ на гарантийный срок')) bgType = '4';
        const selectEl = await waitFor('select[ng-model="model.data.bankGuaranteeTypeRefId"]');
        selectEl.value = bgType;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));

        if (data.startDate) await fillField('input[ng-model="model.data.startDate"]', data.startDate);
        if (data.endDate) await fillField('input[ng-model="model.data.endDate"]', data.endDate);

        await fillField('input[ng-model="model.data.purchase.purchaseNumber"]', data.notice);
        const searchBtn = await waitFor('button[ng-click="my.zgrSearch()"]');
        searchBtn.disabled = false;
        searchBtn.click();
        await sleep(6000);

        const lotsContainer = document.querySelector('div[ng-repeat="lot in model.data.purchase.lots"]');
        if (lotsContainer) {
            const scope = angular.element(lotsContainer).scope();
            const lot = scope.lot;
            if (lot) {
                if (data.proposedPrice) {
                    const finalAmountInput = lotsContainer.querySelector('input[ng-model="lot.finalAmount"]');
                    if (finalAmountInput && !finalAmountInput.readOnly) {
                        finalAmountInput.value = data.proposedPrice;
                        finalAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
                const prepaymentCheckbox = lotsContainer.querySelector('input[ng-model="lot.contractConditions.prepaymentExists"]');
                if (prepaymentCheckbox && data.advanceAmount && data.advanceAmount !== 'Нет') {
                    prepaymentCheckbox.checked = true;
                    prepaymentCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            const bgAmountInput = document.querySelector('input[ng-model="x.bgAmount"]');
            if (bgAmountInput) {
                bgAmountInput.value = data.sum || '';
                bgAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
                bgAmountInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            status.textContent = '✅ Ак Барс заполнен';
        } else {
            status.textContent = '⚠️ Закупка не найдена.';
        }
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillLikebgForm() {
    const data = GM_getValue('bankRequestData', null);
    const profile = GM_getValue('clientProfileData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ LikeBG...', 0);
    try {
        const setValue = (el, val) => {
            const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                nativeSetter.call(el, val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        const innInput = await waitFor('.input-autocomplete input');
        setValue(innInput, data.inn);
        await sleep(2000);
        const sugg = document.querySelector('.input-autocomplete__suggestion-wrap li, .suggestions-suggestion');
        if (sugg) { sugg.click(); await sleep(1000); }

        const noticeContainers = document.querySelectorAll('.input-autocomplete');
        let noticeInput = null;
        for (const container of noticeContainers) {
            const label = container.querySelector('label');
            if (label && label.textContent.includes('Реестровый номер закупки')) {
                noticeInput = container.querySelector('input');
                break;
            }
        }
        if (!noticeInput) throw new Error('Поле "Реестровый номер закупки" не найдено');
        setValue(noticeInput, data.notice);
        await sleep(2000);
        const noticeSugg = document.querySelector('.input-autocomplete__suggestion-wrap li, .suggestions-suggestion');
        if (noticeSugg) { noticeSugg.click(); await sleep(2000); }

        const typeRadios = document.querySelectorAll('input[type="radio"][value]');
        const typeMap = { 'БГ на участие': 'participation', 'БГ на исполнение': 'execution', 'БГ на гарантийный срок': 'garantue_warranty' };
        const needVal = typeMap[data.needText] || 'execution';
        for (const radio of typeRadios) {
            if (radio.value === needVal) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                break;
            }
        }

        const sumInput = await waitFor('.text-input__input[placeholder*="сумму гарантии"]');
        setValue(sumInput, data.sum);

        const endDateInput = await waitFor('.date-picker.is-invalid .mx-input');
        if (data.endDate) setValue(endDateInput, data.endDate);

        const advanceCheckbox = document.querySelector('.checkbox__label');
        if (advanceCheckbox && data.advanceAmount && data.advanceAmount !== 'Нет') {
            advanceCheckbox.click();
            await sleep(300);
        }

        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Далее');
        if (nextBtn) { nextBtn.click(); await sleep(2000); }

        const director = profile?.persons?.find(p => p.title.includes('Генеральный директор'));
        const fio = director?.['ФИО:'] || 'Иванов Иван Иванович';
        const fioInput = await waitFor('.input-autocomplete input[placeholder*="ФИО"]');
        setValue(fioInput, fio);
        const phoneInput = await waitFor('.phone-input input');
        const emailInput = await waitFor('input[type="email"]');
        setValue(phoneInput, profile?.company?.['Телефон:'] || '+7(999)999-99-99');
        setValue(emailInput, profile?.company?.['Почта:'] || 'test@test.ru');

        const requisites = profile?.persons?.find(p => p.title.includes('Реквизиты'));
        if (requisites) {
            const bankNameInput = document.querySelector('.input-autocomplete input[placeholder="банка"]');
            const bikInput = document.querySelector('.input-autocomplete input[placeholder="БИК"]');
            const accountInput = document.querySelector('input[name="cur_account"]');
            if (bankNameInput) setValue(bankNameInput, requisites['Банк:'] || '');
            if (bikInput) setValue(bikInput, requisites['БИК:'] || '');
            if (accountInput) setValue(accountInput, requisites['р/с:'] || '');
        }
        const addressInput = document.querySelector('.address-input');
        if (addressInput) setValue(addressInput, profile?.company?.['Юридический:'] || '');

        const confirmCheckbox = document.querySelector('.checkbox--align-center input');
        if (confirmCheckbox && !confirmCheckbox.checked) confirmCheckbox.click();

        const nextBtn2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Далее');
        if (nextBtn2) { nextBtn2.click(); await sleep(2000); }

        if (director) {
            const parts = (director['ФИО:'] || '').split(' ');
            setValue(await waitFor('.text-input input[placeholder*="Фамилия"]'), parts[0] || '');
            setValue(await waitFor('.text-input input[placeholder*="Имя"]'), parts[1] || '');
            setValue(await waitFor('.text-input input[placeholder*="Отчество"]'), parts[2] || '');

            const sexSelect = document.querySelector('.select-simple input[readonly]');
            if (sexSelect) {
                sexSelect.click();
                await sleep(500);
                const opts = document.querySelectorAll('.select-simple__option');
                const target = director['Пол:'] === 'Мужской' ? 'Мужской' : 'Женский';
                for (const opt of opts) {
                    if (opt.textContent.trim() === target) { opt.click(); break; }
                }
            }

            const birthInput = await waitFor('.date-picker.is-invalid .mx-input');
            if (director['Дата рождения:']) setValue(birthInput, director['Дата рождения:']);
            const birthPlace = await waitFor('.text-input input[placeholder*="Место рождения"]');
            if (director['Место рождения:']) setValue(birthPlace, director['Место рождения:']);

            const passport = await waitFor('input[data-mask="#### ######"]');
            if (director['Серия паспорта:'] && director['Номер паспорта:']) {
                setValue(passport, `${director['Серия паспорта:']} ${director['Номер паспорта:']}`);
            }

            const issueDate = document.querySelector('.date-picker .mx-input:not(.is-invalid .mx-input)');
            if (director['Дата выдачи:']) setValue(issueDate, director['Дата выдачи:']);

            const codeDiv = await waitFor('input[data-mask="###-###"]');
            if (director['Код подразделения:']) setValue(codeDiv, director['Код подразделения:']);

            const issuer = await waitFor('.input-autocomplete input[placeholder*="Кем выдан"]');
            if (director['Кем выдан:']) setValue(issuer, director['Кем выдан:']);

            const regAddr = document.querySelector('.address-input:not([placeholder*="Юридический"])');
            if (director['Адрес регистрации:']) setValue(regAddr, director['Адрес регистрации:']);

            const innHead = await waitFor('.text-input input[maxlength="12"]');
            if (director['ИНН:']) setValue(innHead, director['ИНН:']);

            const positionSelect = document.querySelectorAll('.select-simple input[readonly]')[2];
            if (positionSelect) {
                positionSelect.click();
                await sleep(500);
                const opts = document.querySelectorAll('.select-simple__option');
                for (const opt of opts) {
                    if (opt.textContent.includes('Генеральный директор')) { opt.click(); break; }
                }
            }

            const appointInput = document.querySelector('.date-picker .mx-input');
            if (director['Срок полномочий от:']) setValue(appointInput, director['Срок полномочий от:']);
        }

        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Сохранить');
        if (saveBtn) { saveBtn.click(); await sleep(1000); }

        status.textContent = '✅ LikeBG заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillKubanKreditForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Кубань Кредит...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const innInput = await waitFor('input[name="entity_inn"]');
        setInput(innInput, data.inn);
        await sleep(500);
        const purchaseInput = await waitFor('input[name="purchase"]');
        setInput(purchaseInput, data.notice || '');
        const bgTypeSelect = await waitFor('select[name="bg_types"]');
        let typeValue = '0';
        if (data.needText.includes('БГ на исполнение') && data.advanceAmount !== 'Нет') typeValue = '2';
        else if (data.needText.includes('БГ на исполнение')) typeValue = '0';
        else if (data.needText.includes('БГ на участие')) typeValue = '1';
        else if (data.needText.includes('БГ на гарантийный срок')) typeValue = '3';
        bgTypeSelect.value = typeValue;
        bgTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(300);
        const finalPriceInput = await waitFor('input[name="final_price"]');
        if (data.proposedPrice) setInput(finalPriceInput, data.proposedPrice);
        const sumInput = await waitFor('input[name="execSum_0"]');
        if (data.sum) setInput(sumInput, data.sum);
        const dateFinishInput = await waitFor('input[name="date_finish_0"]');
        if (data.endDate) {
            dateFinishInput.value = data.endDate;
            dateFinishInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateFinishInput.dispatchEvent(new Event('change', { bubbles: true }));
            dateFinishInput.dispatchEvent(new Event('blur', { bubbles: true }));
            await sleep(200);
        }
        status.textContent = '✅ Кубань Кредит заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillVneshfinbankForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ Внешфинбанк...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const tab = await waitFor('li.ui-state-default a[href="#logintabs-5"]');
        if (tab) { tab.click(); await sleep(1000); }
        const innInput = await waitFor('#innogrn');
        setInput(innInput, data.inn);
        const konkursInput = await waitFor('#konkurs');
        setInput(konkursInput, data.notice || '');
        const priceInput = await waitFor('#price');
        if (data.proposedPrice) setInput(priceInput, data.proposedPrice);
        const bgTypeSelect = await waitFor('#bg_type');
        let typeVal = '2';
        if (data.needText.includes('БГ на участие')) typeVal = '1';
        else if (data.needText.includes('БГ на исполнение')) typeVal = '2';
        else if (data.needText.includes('БГ на гарантийный срок')) typeVal = '4';
        bgTypeSelect.value = typeVal;
        bgTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        const commentInput = await waitFor('#comment');
        const comment = `Срок БГ до ${data.endDate || 'указать'}, Сумма БГ ${data.sum || 'указать'}`;
        setInput(commentInput, comment);
        const submitBtn = await waitFor('#submit-element input[type="submit"]');
        if (submitBtn) { submitBtn.click(); await sleep(3000); }
        const submitBtn2 = await waitFor('#submit-element input[type="submit"]');
        if (submitBtn2) { submitBtn2.click(); await sleep(2000); }
        status.textContent = '✅ Внешфинбанк заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

async function fillGosOblakoForm() {
    const data = GM_getValue('bankRequestData', null);
    if (!data || !data.inn) { showStatus('❌ Нет данных'); return; }
    const status = showStatus('⏳ ГосОблако...', 0);
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const setInput = (el, val) => {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    try {
        const innField = await waitFor('.ApplicationNewInn input[type="search"]');
        setInput(innField, data.inn);
        innField.dispatchEvent(new Event('blur', { bubbles: true }));
        await sleep(1500);
        const firstOption = await waitFor('[role="listbox"] .q-item', 10000);
        firstOption.click();
        await sleep(1000);

        const ebgTab = document.querySelector('.q-tab__label:not(.q-tab--active)');
        if (ebgTab && ebgTab.textContent.includes('ЭБГ')) { ebgTab.click(); await sleep(1000); }

        const rntInput = await waitFor('input[aria-label="РНТ"]');
        setInput(rntInput, data.notice || '');

        if (data.law !== 'Коммерческий') {
            const lawMap = { '44': '44-ФЗ', '223': '223-ФЗ', '615': '615-ПП' };
            const lawText = lawMap[data.law] || '44-ФЗ';
            const lawBtn = Array.from(document.querySelectorAll('.q-btn-toggle .q-btn')).find(b => b.textContent.includes(lawText));
            if (lawBtn) { lawBtn.click(); await sleep(300); }
            const gozToggle = document.querySelector('.q-toggle .q-toggle__native');
            if (gozToggle && gozToggle.checked) gozToggle.click();
        } else {
            const notEisToggle = document.querySelector('.q-toggle .q-toggle__native');
            if (notEisToggle && !notEisToggle.checked) { notEisToggle.click(); await sleep(500); }
            const commercialRadio = document.querySelector('.q-radio .q-radio__native');
            if (commercialRadio && !commercialRadio.checked) commercialRadio.click();
            const saveBtn = Array.from(document.querySelectorAll('.q-btn__content .block')).find(b => b.textContent.trim() === 'Сохранить');
            if (saveBtn) { saveBtn.closest('button').click(); await sleep(1500); }
        }

        const typeSelect = await waitFor('.q-select__focus-target');
        typeSelect.click();
        await sleep(500);
        const typeMap = {
            'БГ на участие': 'Участие',
            'БГ на исполнение': 'Исполнение',
            'БГ на гарантийный срок': 'Гарантийные'
        };
        const target = typeMap[data.needText] || 'Исполнение';
        const opt = Array.from(document.querySelectorAll('.q-item__label')).find(el => el.textContent.includes(target));
        if (opt) { opt.click(); await sleep(500); }

        const sumInput = await waitFor('input[aria-label="Сумма банковской гарантии"]');
        if (data.sum) setInput(sumInput, data.sum);

        const dateToInput = await waitFor('input[placeholder="дд.мм.гггг"]');
        if (data.endDate) {
            setInput(dateToInput, data.endDate);
            dateToInput.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        const electronicBtn = Array.from(document.querySelectorAll('.q-btn-toggle .q-btn__content .block')).find(b => b.textContent.includes('Электронная'));
        if (electronicBtn) electronicBtn.closest('button').click();

        status.textContent = '✅ ГосОблако заполнен';
        setTimeout(() => status.remove(), 5000);
    } catch (e) {
        status.textContent = `❌ Ошибка: ${e.message}`;
        setTimeout(() => status.remove(), 5000);
    }
}

function initRealist() {
    if (document.querySelector('#product_id')) {
        const btn = document.createElement('button');
        btn.className = 'tm-bank-fill-btn'; btn.style.background = '#607D8B'; btn.style.color = 'white';
        btn.style.bottom = '20px'; btn.style.right = '20px';
        btn.textContent = 'Заполнить РеалистБанк';
        btn.onclick = fillRealistForm;
        document.body.appendChild(btn);
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'AUTOFILLREALIST_AUTOFILL') {
                if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
                fillRealistForm();
            }
        });
        if (GM_getValue('autoFillRealist', false)) {
            GM_setValue('autoFillRealist', false);
            setTimeout(fillRealistForm, 3000);
        }
    }
    if (document.querySelector('#client_legal_full_name')) {
        const profileBtn = document.createElement('button');
        profileBtn.className = 'tm-bank-fill-btn'; profileBtn.style.background = '#4CAF50'; profileBtn.style.color = 'white';
        profileBtn.style.bottom = '80px'; profileBtn.style.right = '20px';
        profileBtn.textContent = 'Заполнить анкету Реалист';
        profileBtn.onclick = fillRealistProfile;
        document.body.appendChild(profileBtn);
    }
}

function initAlfa() {
    waitFor('[data-test-id="principal-field"]', 60000).then(() => {
        if (!document.querySelector('.tm-bank-fill-btn[style*="#EF3124"]')) {
            const btn = document.createElement('button');
            btn.className = 'tm-bank-fill-btn'; btn.style.background = '#EF3124'; btn.style.color = 'white';
            btn.style.bottom = '20px'; btn.style.right = '20px';
            btn.textContent = 'Заполнить Альфа-Банк';
            btn.onclick = fillAlfaForm;
            document.body.appendChild(btn);
        }
        if (GM_getValue('autoFillAlfa', false)) {
            GM_setValue('autoFillAlfa', false);
            setTimeout(fillAlfaForm, 3000);
        }
    }).catch(() => {});
    waitFor('[data-test-id="companyInfoForm"]', 60000).then(() => {
        if (!document.querySelector('.tm-bank-fill-btn[style*="#1565C0"]')) {
            const profileBtn = document.createElement('button');
            profileBtn.className = 'tm-bank-fill-btn'; profileBtn.style.background = '#1565C0'; profileBtn.style.color = 'white';
            profileBtn.style.bottom = '80px'; profileBtn.style.right = '20px';
            profileBtn.textContent = 'Заполнить анкету';
            profileBtn.onclick = fillAlfaProfile;
            document.body.appendChild(profileBtn);
        }
    }).catch(() => {});
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLALFA_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillAlfaForm();
        }
    });
}

function initTendertech() {
    if (document.querySelector('[data-qa="buttonNewApplication"]') || document.querySelector('[data-qa="inputSumBgParameters"]')) {
        const btn = document.createElement('button');
        btn.className = 'tm-bank-fill-btn'; btn.style.background = '#FF6F00'; btn.style.color = 'white';
        btn.style.bottom = '20px'; btn.style.right = '20px';
        btn.textContent = 'Заполнить Тендертех';
        btn.onclick = fillTendertechForm;
        document.body.appendChild(btn);
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'AUTOFILLTENDERTECH_AUTOFILL') {
                if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
                fillTendertechForm();
            }
        });
        if (GM_getValue('autoFillTendertech', false)) {
            GM_setValue('autoFillTendertech', false);
            setTimeout(fillTendertechForm, 3000);
        }
    }
}

function initAkbars() {
    const btn = document.createElement('button');
    btn.className = 'tm-bank-fill-btn'; btn.style.background = '#1565C0'; btn.style.color = 'white';
    btn.style.bottom = '20px'; btn.style.right = '20px';
    btn.textContent = 'Заполнить Ак Барс';
    btn.onclick = fillAkbarsForm;
    document.body.appendChild(btn);
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLAKBARS_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillAkbarsForm();
        }
    });
    if (GM_getValue('autoFillAkbars', false)) {
        GM_setValue('autoFillAkbars', false);
        setTimeout(fillAkbarsForm, 3000);
    }
}

function initLikebg() {
    const btn = document.createElement('button');
    btn.className = 'tm-bank-fill-btn'; btn.style.background = '#00897B'; btn.style.color = 'white';
    btn.style.bottom = '20px'; btn.style.right = '20px';
    btn.textContent = 'Заполнить LikeBG';
    btn.onclick = fillLikebgForm;
    document.body.appendChild(btn);
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLLIKEBG_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillLikebgForm();
        }
    });
    if (GM_getValue('autoFillLikebg', false)) {
        GM_setValue('autoFillLikebg', false);
        setTimeout(fillLikebgForm, 3000);
    }
}

function initKuban() {
    const btn = document.createElement('button');
    btn.className = 'tm-bank-fill-btn'; btn.style.background = '#2E7D32'; btn.style.color = 'white';
    btn.style.bottom = '20px'; btn.style.right = '20px';
    btn.textContent = 'Заполнить Кубань Кредит';
    btn.onclick = fillKubanKreditForm;
    document.body.appendChild(btn);
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLKUBAN_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillKubanKreditForm();
        }
    });
    if (GM_getValue('autoFillKuban', false)) {
        GM_setValue('autoFillKuban', false);
        setTimeout(fillKubanKreditForm, 3000);
    }
}

function initVnesh() {
    const btn = document.createElement('button');
    btn.className = 'tm-bank-fill-btn'; btn.style.background = '#6A1B9A'; btn.style.color = 'white';
    btn.style.bottom = '20px'; btn.style.right = '20px';
    btn.textContent = 'Заполнить Внешфинбанк';
    btn.onclick = fillVneshfinbankForm;
    document.body.appendChild(btn);
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLVNESH_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillVneshfinbankForm();
        }
    });
    if (GM_getValue('autoFillVnesh', false)) {
        GM_setValue('autoFillVnesh', false);
        setTimeout(fillVneshfinbankForm, 3000);
    }
}

function initGosOblako() {
    const btn = document.createElement('button');
    btn.className = 'tm-bank-fill-btn'; btn.style.background = '#0D47A1'; btn.style.color = 'white';
    btn.style.bottom = '20px'; btn.style.right = '20px';
    btn.textContent = 'Заполнить ГосОблако';
    btn.onclick = fillGosOblakoForm;
    document.body.appendChild(btn);
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AUTOFILLGOSOBLAKO_AUTOFILL') {
            if (event.data.payload) GM_setValue('bankRequestData', event.data.payload);
            fillGosOblakoForm();
        }
    });
    if (GM_getValue('autoFillGosOblako', false)) {
        GM_setValue('autoFillGosOblako', false);
        setTimeout(fillGosOblakoForm, 3000);
    }
}

const url = window.location.href;
if (url.includes('crm.finleo.ru/crm/orders/')) {
    initCRM();
} else if (url.includes('bg.realistbank.ru/new_ticket')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRealist);
    else initRealist();
} else if (url.includes('bg.alfabank.ru/aft-ui/order')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAlfa);
    else initAlfa();
} else if (url.includes('tendertech.ru')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTendertech);
    else initTendertech();
} else if (url.includes('bgol.akbars.ru/tasks?add-task=bg-pa')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAkbars);
    else initAkbars();
} else if (url.includes('likebg.ru/agent/request/create')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLikebg);
    else initLikebg();
} else if (url.includes('assist24.kubankredit.ru/create')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKuban);
    else initKuban();
} else if (url.includes('lk.vfbank.ru/kabinet')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initVnesh);
    else initVnesh();
} else if (url.includes('lk.gosoblako.com/applications/new')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGosOblako);
    else initGosOblako();
}
})();
