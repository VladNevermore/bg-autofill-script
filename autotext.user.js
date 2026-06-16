// ==UserScript==
// @name         Автотекст
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  Автотекст
// @match        https://crm.finleo.ru/crm/orders/*
// @author       VladNevermore
// @icon         https://i.pinimg.com/736x/78/53/ad/7853ade6dd49b8caba4d1037e7341323.jpg
// @grant        none
// @updateURL    https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autotext.user.js
// @downloadURL  https://raw.githubusercontent.com/VladNevermore/bg-autofill-script/main/autotext.user.js
// ==/UserScript==

(function() {
    'use strict';

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

    const bankConfigs = {
        'АЛЬФА-БАНК': {
            className: 'alfabank',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

Просьба указать способ доставки:
- Печатный оригинал не нужен (электронная гарантия)
- Самовывоз (г. Москва пр-кт Андропова д.18 к.3)
- Доставка службой Zest Express (необходимо указать адрес, ФИО и номер телефона получателя)
- Почта России (необходимо указать адрес, ФИО и номер телефона получателя)

*для гарантий по 44-ФЗ доставка составляет 600 руб. курьерской службой и Почтой России`,
            sender: 'ООО «КГ «Атом»'
        },
        'ЗЕНИТ': {
            className: 'zenit',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

Просьба указать способ доставки:
- Печатный оригинал не нужен (электронная гарантия)
- Доставка службой Pony Express (необходимо указать адрес, ФИО и номер телефона получателя) - платеж от 20 000 руб.
- Почта России (необходимо указать адрес, ФИО и номер телефона получателя) - платеж до 20 000 руб.

**Для гарантий, публикуемых в РНГ, выпуск всегда осуществляется строго в электронной форме. Предоставляются дополнительные услуги для выпуска БГ, требующих публикации в РНГ, доплата составит три тысячи рублей :

1. Возможна доставка дубликата на бумажном носителе с печатями и подписями. 

2. Выпуск оригинала БГ на бумаге

При необходимости получения оригинала такой БГ в бумажном формате или дубликата в бумажном формате просьба запросить обновление счета в чате. Самовывоз дубликата БГ в бумажном формате - бесплатно.`,
            sender: 'ООО «СФК»'
        },
        'АБС': {
            className: 'abs',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

Если вам потребуется доставка оригинала БГ, то возможны следующие варианты получения оригинала:
- получение в офисе Банка – дополнительная комиссия не взимается;
- гарантии по 185-ФЗ, коммерческие, платежные, налоговые, гарантии с гос. тайной, закрытые и прочие ФЗ – дополнительная комиссия не взимается;
- гарантии по 44-ФЗ и 223-ФЗ (открытые) – доплата составит 450 рублей.
Просьба сообщить, если понадобится доставка оригинала курьерской службой - мы переформируем счет с учетом доставки.
(КВ агента с оплаты доставки не оплачивается)`,
            sender: 'ООО «СФК»'
        },
        'СБЕРБАНК': {
            className: 'sberbank',
            comment: `Добрый день! Вам предварительно одобрена БГ.
Теперь вам необходимо проверить текст банковской гарантии и согласовать его с заказчиком. Формы заказчиков согласуются от 1 до 3 дней.
Внимание!!! Уведомляем, что все правки в текст гарантии вносятся ДО оплаты по счёту, так как оплатой Вы подтверждаете своё согласие с текстом гарантии, прикрепленным к счету-оферте, и после поступления денег в банк гарантия автоматически выпускается.
Также прошу учесть и уведомить клиента, что после оплаты, перед самим выпуском, заявка еще раз уходит на доп. проверку.
И если у клиента за это время не появилось никаких стоп-факторов , то тогда ожидаем выпуск БГ.

Просьба указать способ получения БГ:
- электронно (подписана ЭЦП банка)
- на бумажном носителе + доставка (+1 000 руб к счету)
*если выбираете бумажный вариант, просьба указать адрес, фио и номер телефона получателя`,
            sender: 'ООО «КГ «Атом»'
        },
        'ВТБ': {
            className: 'vtb',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить
Если Вам потребуется доставка оригинала БГ, то возможны следующие варианты получения оригинала:
- получение в офисе Банка – дополнительная комиссия не взимается
- доставка Почтой России – дополнительная комиссия не взимается. Трек номер формируется в течение 10 рабочих дней.
*все гарантии выпускается в электронном формате. Возможна отправка дубликата, заверенного банком  – дополнительная комиссия не взимается`,
            sender: 'ООО «СФК»'
        },
        'ТКБ, Калуга, Агророс': {
            className: 'tkb',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить и направить в чат на согласование, после того, как макет будет согласован с Заказчиком.
!!!НЕ ПРИНИМАТЬ предложение, пока не будет согласован макет БГ, так как счет на оплату формируется после принятия предложения!!!
После принятия предложения, банк проводит повторную проверку документов и оставляет за собой право отказа, в случае выявления стоп-факторов.`,
            sender: 'ООО «СФК»'
        },
        'Уралсиб': {
            className: 'uralsib',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить и направить в чат на согласование, после того, как макет будет согласован с Заказчиком.
!!!НЕ ПРИНИМАТЬ предложение, пока не будет согласован макет БГ, так как счет на оплату формируется после принятия предложения!!!
После принятия предложения, банк проводит повторную проверку документов и оставляет за собой право отказа, в случае выявления стоп-факторов
*все гарантии по 44-ФЗ до 3 000 000 руб. выпускаются в электронном формате. Возможен забор дубликата из офиса банка – дополнительная комиссия не взимается (это тот же оригинал с печатью, но также штамп копия верна)`,
            sender: 'ООО «СФК»'
        },
        'ИНГОССТРАХ': {
            className: 'ingosstrah',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить
Если правок по форме не будет, то примите предложение и направьте ПП в чат.
После принятия предложения, банк проводит повторную проверку документов и оставляет за собой право отказа, в случае выявления стоп-факторов.

! Все гарантии выпускаются в электронном формате. Возможен выпуск бумажной формы – дополнительная комиссия не взимается, просьба перед выпуском сообщить в чат`,
            sender: 'ООО «КГ «Атом»'
        },
        'Тбанк': {
            className: 'tbank',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

!!!Внимание!!! БГ выпускаются только в электронном виде`,
            sender: 'ООО «КГ «Атом»'
        },
        'Сдм, ГТ, Акбарс, Соколовский, МСП(likeBG)': {
            className: 'sdm-gt-akbars',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить
Если правок по форме не будет, то примите предложение и направьте ПП в чат.
После принятия предложения, банк проводит повторную проверку документов и оставляет за собой право отказа, в случае выявления стоп-факторов.`,
            sender: 'ООО «КГ «Атом»'
        },
        'ТСБ': {
            className: 'tsb',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить
Если правок по форме не будет, то примите предложение и направьте ПП в чат.
После принятия предложения, банк проводит повторную проверку документов и оставляет за собой право отказа, в случае выявления стоп-факторов.

! Все гарантии выпускаются в бумажном формате.`,
            sender: 'ООО «КГ «Атом»'
        },
        'Реалист': {
            className: 'realist',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

Банк оставляет за собой право увеличения комиссии на любом этапе сделки в связи с внесением ранее правок в макет, связанных с авансом либо согласование индивидуальной формы заказчика. Просьба при внесении таких правок уточнять комиссию.`,
            sender: 'ООО «КГ «Атом»'
        },
        'Совком': {
            className: 'sovkom',
            comment: `Добрый день! Просьба согласовать проект БГ, в случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить Далее в Личном кабинете https://scb-private.fintender.ru/ в заявке №_____ принять предложение и выгрузить реквизиты для оплаты (все это делает клиент) при оплате выбираете вариант ""на прямую в банк""
!!!НЕ ПРИНИМАТЬ предложение, пока не будет согласован макет БГ!!!`,
            sender: 'ООО «КОНКОРД»'
        },
        'ПСБ': {
            className: 'psb',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

БГ до 500 тыс. по 44-фз не подлежат доставке, будет доступен только скан гарантии с КЭП Банка. В случае необходимости оригинал можно будет забрать самостоятельно из офиса Банка. Самовывоз оригиналов без доп. согласования! г. Москва, Дербеневская наб. д. 7, корпус 22 (подъезд А 2 этаж, офис напротив лифтов, телефоны для связи с сотрудниками указаны на двери!) График работы с 09:00 до 18:00, обеденный перерыв с 12:00 до 13:00. `,
            sender: 'ООО «КОНКОРД»'
        },
        'СТАНДАРТ': {
            className: 'clasic',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить 
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности`,
            sender: 'ООО «КГ «Атом»'
        },
        'Метком': {
            className: 'Metkom',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить 
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности
Просьба указать способ доставки:
- Оригинал не требуется
- Самовывоз (Москва 1-я Фрунзенская дом 5, тел.495-109-00-14 доб.612 Ольга) - потребуется доверенность на получателя и паспорт, либо директор
- Почта России (просьба указать адрес, ФИО и номер телефона получателя) - +1 000 рублей (ДО выпуска и оплаты счета просьба сообщить о доставке, мы сформируем доп. счет, который нужно будет оплатить)`,
            sender: 'ООО «КГ «Атом»'
        },
        'Левобережный': {
            className: 'Levober',
            comment: `Добрый день! Ваша заявка одобрена.
Теперь вам необходимо проверить текст банковской гарантии и согласовать его с заказчиком.
Напоминаю, что все правки в текст гарантии вносятся ДО оплаты по счёту, так как оплатой Вы подтверждаете своё согласие с текстом гарантии, прикрепленным к счету-оферте, и после поступления денег в банк гарантия автоматически выпускается.
В случае необходимости внесения изменений в текст гарантии после выпуска банк взимает дополнительную плату в соответствии с тарифами Банка.`,
            sender: 'ООО «КГ «Атом»'
        },
        'МСП': {
            className: 'MSP',
            comment: `Добрый день! 
Заявка одобрена. Просим сообщить дату выдачи гарантии (для формирования счета на оплату, оплату осуществляете только в день выдачи). 
Направляем для согласования с Заказчиком проект гарантии по форме Банка (приложен). В случае внесения изменений в проект БГ, просьба выделить цветом:
желтым - изменить,  красным - удалить.
Если у Заказчика имеется своя форма проекта гарантии, просим заполнить и направить в Банк на согласование.`,
            sender: 'ООО «СФК»'
        },
        'Примсоц': {
            className: 'Primsoc',
            comment: `Добрый день! Направляем вам форму для согласования с заказчиком
В случае внесения изменений в макет БГ, просьба выделить цветом: желтым - изменить, красным - удалить 
! Особое внимание просим уделить контактным данным Принципала/Бенефициара и региону подсудности

Для выпуска необходимо оплатить счет и прислать скан БГ с пометкой ""согласовано"" с датой, подписью, должностью и ФИО. А также подписать оферту в Диадок. Текст оферты также прикладываем для ознакомления.`,
            sender: 'ООО «КГ «Атом»'
        }
    };
    
    const log = (message, data = null) => {
        console.log(`[Offer Autofill] ${message}`, data || '');
    };

    let isDropdownOpen = false;

    const setReactInputValue = (element, value) => {
        element.focus();

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement?.prototype || window.HTMLInputElement?.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);

            const inputEvent = new Event('input', {
                bubbles: true,
                cancelable: true
            });

            inputEvent.simulated = true;
            element.dispatchEvent(inputEvent);

            const changeEvent = new Event('change', {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(changeEvent);
        } else {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        log(`Значение установлено: ${value.substring(0, 50)}...`);
    };

    const setCommentValue = (element, value) => {
        if (!element) return;

        try {

            element.focus();

            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(element, value);

                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(inputEvent);


                ['change', 'blur', 'focus'].forEach(eventType => {
                    element.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
            } else {
                // Fallback
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }

            log(`Комментарий установлен: ${value.substring(0, 50)}...`);
        } catch (error) {
            log(`Ошибка при установке комментария: ${error.message}`);
            // Простой fallback
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };


    const createAutofillButton = () => {
        log('Создание компактной кнопки для автозаполнения');


        const commentField = document.querySelector('textarea[name="comment"]');
        if (!commentField) {
            log('Поле комментария не найдено');
            return;
        }


        const existingContainer = document.querySelector('.tm-autofill-container');
        if (existingContainer) {
            existingContainer.remove();
        }


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

        log('Компактная кнопка с выпадающим списком создана');
    };


    const fillOfferData = (bankName) => {
        log(`Заполнение данных для банка: ${bankName}`);

        const config = bankConfigs[bankName];
        if (!config) {
            log(`Конфигурация для банка ${bankName} не найдена`);
            return;
        }

        try {

            const commentField = document.querySelector('textarea[name="comment"]');
            if (commentField) {
                setCommentValue(commentField, config.comment);
                log('Комментарий заполнен');
            }


            fillSenderField(config.sender);

            showStatus(`✅ Данные для ${bankName} заполнены!`, 3000);

        } catch (error) {
            log(`Ошибка при автозаполнении: ${error.message}`, error);
            showStatus('❌ Ошибка при автозаполнении', 3000);
        }
    };


    const fillSenderField = (targetSender) => {
        const senderInput = document.querySelector('input[placeholder="Поиск..."][id*="rh"], input[placeholder="Поиск..."][id*="ri"]');

        if (senderInput) {
            log(`Найдено поле отправителя, ищем: ${targetSender}`);


            const popupIndicator = document.querySelector('.MuiAutocomplete-popupIndicator');
            if (popupIndicator) {
                popupIndicator.click();
                log('Нажали на кнопку открытия списка');
            }


            setTimeout(() => {

                const dropdownOptions = document.querySelectorAll('[role="option"], .MuiAutocomplete-option, li[role="option"]');
                log(`Найдено опций в списке: ${dropdownOptions.length}`);

                let targetOption = null;


                for (const option of dropdownOptions) {
                    if (option.textContent && option.textContent.includes(targetSender)) {
                        targetOption = option;
                        log(`Найден нужный отправитель: ${option.textContent}`);
                        break;
                    }
                }

                if (targetOption) {
                    targetOption.click();
                    log(`Отправитель выбран: ${targetSender}`);
                } else {
                    log(`Отправитель "${targetSender}" не найден в списке, пробуем ввод текста`);


                    senderInput.focus();
                    setReactInputValue(senderInput, targetSender);

                    log(`Введен текст: ${targetSender}`);


                    setTimeout(() => {
                        const retryOptions = document.querySelectorAll('[role="option"], .MuiAutocomplete-option');
                        let foundOption = null;

                        for (const option of retryOptions) {
                            if (option.textContent && option.textContent.includes(targetSender)) {
                                foundOption = option;
                                break;
                            }
                        }

                        if (foundOption) {
                            foundOption.click();
                            log(`Отправитель выбран через ввод текста: ${targetSender}`);
                        } else if (retryOptions.length > 0) {
                            // Если не нашли точного совпадения, выбираем первую опцию
                            retryOptions[0].click();
                            log(`Выбрана первая опция: ${retryOptions[0].textContent}`);
                        } else {
                            log(`Не удалось найти отправителя "${targetSender}"`);
                        }
                    }, 500);
                }
            }, 800);

        } else {
            log('Поле отправителя не найдено');
        }
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


    const initObserver = () => {
        log('Инициализация наблюдателя для автозаполнения предложений');

        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.querySelector && node.querySelector('textarea[name="comment"]')) {
                                shouldUpdate = true;
                            }
                            if (node.matches('textarea[name="comment"]')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });

            if (shouldUpdate) {
                log('Обнаружено поле комментария - создаем кнопку');
                setTimeout(createAutofillButton, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

  
        setTimeout(createAutofillButton, 1000);


        setTimeout(createAutofillButton, 3000);
    };


    log('Скрипт автозаполнения предложений запущен');
    initObserver();

})();
