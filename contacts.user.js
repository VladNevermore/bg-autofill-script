// ==UserScript==
// @name         Контакты AUTO (SPA FIXED)
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Блок контактов теперь добавляется в конец списка «Общее»
// @match        https://crm.finleo.ru/crm/orders*
// @author       VladNevermore
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      zakupki.gov.ru
// @connect      cloud-api.gosmonitor.ru
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/contacts.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/contacts.user.js

// ==/UserScript==

(function() {
    'use strict';

    let $ = window.jQuery;
    let currentOrgUrl = null;
    let lastINN = null;
    let observerStarted = false;

    window.addEventListener('load', () => {
        initObserver();
    });

    function initObserver() {
        if (observerStarted) return;
        observerStarted = true;

        const observer = new MutationObserver(() => {
            tryAutoLoad();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('Observer запущен');
    }

    // Получаем строку с ИНН (нам нужна только для извлечения самого ИНН)
    function getINNContainer() {
        const labels = document.querySelectorAll('div');

        for (let el of labels) {
            if (el.textContent.trim() === 'ИНН заказчика') {
                return el.closest('.sc-35272bf4-0');
            }
        }
        return null;
    }

    // Новая функция: находим контейнер всего блока «Общее» (элемент с атрибутом rowscount)
    function getListContainerForINN() {
        const innContainer = getINNContainer();
        if (innContainer) {
            return innContainer.closest('[rowscount]');
        }
        return null;
    }

    function extractINN() {
        const container = getINNContainer();
        if (!container) return null;

        const span = container.querySelector('span');
        if (!span) return null;

        const inn = span.textContent.trim();
        return /^\d{10,12}$/.test(inn) ? inn : null;
    }

    function tryAutoLoad() {
        const inn = extractINN();
        if (!inn) return;

        if (inn === lastINN) return;
        lastINN = inn;

        console.log('Новый ИНН:', inn);
        getContacts(inn);
    }

    async function getContacts(inn) {
        showLoading('Ищу контакты...');

        try {
            let contacts = await api1(inn);

            if (!contacts.phone && !contacts.email) {
                contacts = await api2(inn);
            }

            render(contacts, inn);

        } catch (e) {
            console.error(e);
            renderManual(inn);
        } finally {
            hideLoading();
        }
    }

    function api1(inn) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://cloud-api.gosmonitor.ru/api/rest/company/findByInn/${inn}`,
                onload: res => {
                    try {
                        const d = JSON.parse(res.responseText);
                        resolve(d);
                    } catch {
                        resolve({});
                    }
                },
                onerror: () => resolve({})
            });
        });
    }

    function api2(inn) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://zakupki.gov.ru/epz/organization/search/results.html?searchString=${inn}`,
                onload: res => {
                    const m = res.responseText.match(/organizationId=(\d+)/);
                    if (!m) return resolve({});

                    const url = `https://zakupki.gov.ru/epz/organization/view/info.html?organizationId=${m[1]}`;

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url,
                        onload: r => {
                            currentOrgUrl = url;
                            resolve(parse(r.responseText));
                        },
                        onerror: () => resolve({})
                    });
                },
                onerror: () => resolve({})
            });
        });
    }

    function parse(html) {
        const phone = (html.match(/<span class="section__title ">Телефон<\/span>[\s\S]*?<span class="section__info">([^<]+)<\/span>/) || [])[1];
        const email = (html.match(/<span class="section__title ">Контактный адрес электронной почты<\/span>[\s\S]*?<span class="section__info">([^<]+)<\/span>/) || [])[1];
        const address = (html.match(/<span class="section__title ">Почтовый адрес<\/span>[\s\S]*?<span class="section__info">([^<]+)<\/span>/) || [])[1];

        return {
            phone,
            email,
            address
        };
    }

    // Теперь блок контактов добавляется в конец контейнера списка «Общее»
    function getOrCreateBlock(listContainer) {
        let block = listContainer.querySelector('.contacts-auto');

        if (!block) {
            block = document.createElement('div');
            block.className = 'contacts-auto';
            block.style.marginTop = '10px';
            block.style.padding = '12px';
            block.style.border = '2px solid #28a745';
            block.style.borderRadius = '6px';
            block.style.background = '#f6fff6';

            listContainer.appendChild(block); // Добавляем в конец списка
        }

        return block;
    }

    function render(c, inn) {
        const listContainer = getListContainerForINN();
        if (!listContainer) return;

        const block = getOrCreateBlock(listContainer);

        block.innerHTML = `
            <b>Контакты (${inn})</b><br>
            <span class="contact-phone">📞 ${c.phone || 'нет'}</span><br>
            <span class="contact-email">✉️ ${c.email || 'нет'}</span><br>
            <span class="contact-address">📍 ${c.address || 'нет'}</span><br><br>
            <button class="open-org">Открыть карточку</button>
        `;

        block.querySelector('.open-org').onclick = () => {
            if (currentOrgUrl) {
                GM_openInTab(currentOrgUrl, { active: true });
            }
        };

        // Увеличиваем шрифт для каждого элемента
        block.querySelector('.contact-phone').style.fontSize = '18px';
        block.querySelector('.contact-email').style.fontSize = '18px';
        block.querySelector('.contact-address').style.fontSize = '18px';
    }

    function renderManual(inn) {
        const listContainer = getListContainerForINN();
        if (!listContainer) return;

        const block = getOrCreateBlock(listContainer);

        block.style.border = '2px solid orange';

        block.innerHTML = `
            Не удалось найти контакты<br>
            <button class="manual">Открыть поиск</button>
        `;

        block.querySelector('.manual').onclick = () => {
            GM_openInTab(`https://zakupki.gov.ru/epz/organization/search/results.html?searchString=${inn}`, { active: true });
        };
    }

    function showLoading(t) {
        $('#loading').remove();
        $('body').append(`<div id="loading" style="position:fixed;top:20px;right:20px;background:#007bff;color:#fff;padding:10px;z-index:9999;">${t}</div>`);
    }

    function hideLoading() {
        $('#loading').remove();
    }

})();
