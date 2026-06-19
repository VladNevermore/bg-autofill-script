// ==UserScript==
// @name         Bank AutoLogin
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  -
// @author       VladNevermore
// @match        https://docs.google.com/spreadsheets/d/1Yebxg2TUZSSLzodF9Oz5wpUE93PvlhAvVe5bXiuyBHA/edit*
// @match        https://lk.fenix-bg.ru/*
// @match        https://tendertech.ru/front/login*
// @match        https://bgol.akbars.ru/*
// @match        https://likebg.ru/agent/login*
// @match        https://lk.yofin.ru/auth/login*
// @match        https://bg.alfabank.ru/tasks*
// @match        https://lk.vfbank.ru/auth*
// @match        https://lk.gosoblako.com/login*
// @match        https://ebg.zenit.ru/auth*
// @match        https://auth.bg.ingobank.ru/*
// @match        https://auth.bg.farzoom.ru/auth/realms/carrot-prod/protocol/openid-connect/auth*
// @match        https://bg.realistbank.ru/auth*
// @match        https://id.tbank.ru/auth/step*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autologin.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autologin.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        login: '1',
        password: '2'
    };

    const SITES = [
        { name: 'Феникс', url: 'https://lk.fenix-bg.ru/', host: 'lk.fenix-bg.ru', type: 'standard', buttonSelector: 'div.form-group.text-center.mt-4 button[type="submit"]' },
        { name: 'ТендерТех', url: 'https://tendertech.ru/front/login', host: 'tendertech.ru', type: 'tendertech', buttonSelector: 'button[data-qa="authAgent-buttonEnter"]', radioSelector: 'input[data-qa="radioPartner"]' },
        { name: 'Ак Барс', url: 'https://bgol.akbars.ru/', host: 'bgol.akbars.ru', type: 'standard', buttonSelector: 'button#kc-login' },
        { name: 'Лайк БГ', url: 'https://likebg.ru/agent/login', host: 'likebg.ru', type: 'standard', buttonSelector: 'button.v-button--primary[type="submit"]' },
        { name: 'Ёфин', url: 'https://lk.yofin.ru/auth/login', host: 'lk.yofin.ru', type: 'standard', buttonSelector: 'button.btn-primary[type="submit"]' },
        { name: 'Альфа-Банк БГ', url: 'https://bg.alfabank.ru/tasks', host: 'bg.alfabank.ru', type: 'standard', buttonSelector: 'button#kc-login' },
        { name: 'ВФ Банк', url: 'https://lk.vfbank.ru/auth', host: 'lk.vfbank.ru', type: 'standard', buttonSelector: 'button#do_auth' },
        { name: 'Гособлако', url: 'https://lk.gosoblako.com/login', host: 'lk.gosoblako.com', type: 'standard', buttonSelector: 'div.q-mt-xl button[type="submit"]' },
        { name: 'Зенит', url: 'https://ebg.zenit.ru/auth', host: 'ebg.zenit.ru', type: 'standard', buttonSelector: 'button[type="submit"].btn.bg-blue' },
        { name: 'Ингобанк', url: 'https://auth.bg.ingobank.ru/', host: 'auth.bg.ingobank.ru', type: 'standard', buttonSelector: 'button#kc-login' },
        { name: 'Фарзум', url: 'https://auth.bg.farzoom.ru/auth/realms/carrot-prod/protocol/openid-connect/auth*', host: 'auth.bg.farzoom.ru', type: 'standard', buttonSelector: 'button#kc-login' },
        { name: 'Реалист Банк', url: 'https://bg.realistbank.ru/auth', host: 'bg.realistbank.ru', type: 'standard', buttonSelector: 'button[type="submit"].btn.bg-indigo-800' },
        { name: 'Т-Банк', url: 'https://id.tbank.ru/auth/step*', host: 'id.tbank.ru', type: 'tbank' }
    ];

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForElement(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error(`Элемент ${selector} не найден`));
                requestAnimationFrame(check);
            };
            check();
        });
    }

    function waitForEnabled(selector, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el && !el.disabled) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error(`Кнопка ${selector} не активна`));
                requestAnimationFrame(check);
            };
            check();
        });
    }

    function waitForFieldValue(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el && el.value && el.value.trim().length > 0) return resolve(el);
                if (Date.now() - start > timeout) return reject(new Error(`Поле ${selector} пустое`));
                requestAnimationFrame(check);
            };
            check();
        });
    }

    function addLog(entry) {
        const logs = JSON.parse(GM_getValue('autologin_logs', '[]'));
        logs.push({ ...entry, timestamp: new Date().toISOString() });
        GM_setValue('autologin_logs', JSON.stringify(logs));
        console.log(`[AutoLogin] ${entry.name}: ${entry.message}`);
    }

    async function standardLogin(config) {
        await waitForFieldValue('input[type="text"], input[type="email"], input[type="tel"]').catch(() => {});
        await wait(2000);
        const btn = await waitForEnabled(config.buttonSelector);
        btn.click();
        return 'Клик по кнопке входа выполнен';
    }

    async function tendertechLogin(config) {
        const radio = await waitForElement(config.radioSelector);
        radio.click();
        await wait(2000);
        await waitForFieldValue('input[type="text"], input[type="email"]').catch(() => {});
        const btn = await waitForEnabled(config.buttonSelector);
        btn.click();
        return 'Радио выбрано, кнопка входа нажата';
    }

    async function tbankLogin() {
        const loginInput = await waitForElement('input[automation-id="login-or-phone"]');
        loginInput.value = CONFIG.login;
        loginInput.dispatchEvent(new Event('input', { bubbles: true }));
        const firstBtn = await waitForEnabled('button[automation-id="button-submit"]');
        firstBtn.click();
        const passwordInput = await waitForElement('input[automation-id="password-input"]');
        passwordInput.value = CONFIG.password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(500);
        const secondBtn = await waitForEnabled('button[automation-id="button-submit"]');
        secondBtn.click();
        return 'Логин и пароль введены, кнопка входа нажата';
    }

    async function executeLogin() {
        const host = location.hostname;
        const siteConfig = SITES.find(s => host.includes(s.host));
        if (!siteConfig) throw new Error('Неизвестный сайт');

        switch (siteConfig.type) {
            case 'standard': return await standardLogin(siteConfig);
            case 'tendertech': return await tendertechLogin(siteConfig);
            case 'tbank': return await tbankLogin();
            default: throw new Error('Неизвестный тип входа');
        }
    }

    function createGoogleSheetsButton() {
        const toolbar = document.getElementById('docs-bars');
        if (!toolbar) {
            setTimeout(createGoogleSheetsButton, 1000);
            return;
        }

        if (document.getElementById('tm-autologin-btn')) return;

        GM_addStyle(`
            #tm-autologin-btn {
                position: absolute;
                top: 12px;
                right: 350px;
                z-index: 5000;
                background-color: #1a73e8;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
            }
            #tm-autologin-btn:hover {
                background-color: #1557b0;
                box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
            }
        `);

        const btn = document.createElement('button');
        btn.id = 'tm-autologin-btn';
        btn.innerText = 'Запустить автовход';

        btn.addEventListener('click', () => {
            SITES.forEach((site, index) => {
                setTimeout(() => {
                    window.open(site.url, `autologin_${Date.now()}_${index}`);
                }, index * 1500);
            });
        });

        document.body.appendChild(btn);
    }

    if (location.hostname.includes('docs.google.com')) {
        createGoogleSheetsButton();
    } else {
        if (window.name && window.name.startsWith('autologin_')) {
            window.addEventListener('load', async () => {
                try {
                    const msg = await executeLogin();
                    addLog({ site: location.href, name: SITES.find(s => location.hostname.includes(s.host))?.name || location.hostname, status: 'success', message: msg });
                } catch (e) {
                    addLog({ site: location.href, name: location.hostname, status: 'error', message: e.message });
                }
            });
        }
    }
})();
