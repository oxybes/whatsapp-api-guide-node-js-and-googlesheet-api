# WhatsApp bot на NodeJS с использованием google sheets API

# Введение
[Исходный код](https://github.com/oxybes/whatsapp-api-guide-node-js-and-googlesheet-api)
В этом гайде мы покажем принципы работы с сервисом https://chat-api.com. Создадим бота WA на NodeJS, а также наш функционал будет включать в себя работу с API Google Sheets.
Функции, которые реализуем в боте:
+ Запись информации в таблицу.
+ Считывание информации из таблицы.
+ Рассылка сообщений по номерам из таблицы.
+ Отправка файла из ячейки таблицы

# Подготовка и настройка сервисов Google
[Официальная статья "Быстрый старт" на NodeJS от Google](https://developers.google.com/sheets/api/quickstart/nodejs?hl=ru) содержит в себе пример работы с API

### Настройка аккаунта на работу с API
Прежде всего необходимо зайти на [сайт разработчиков](https://console.developers.google.com/) и создать новый проект.
![](https://ia.wampi.ru/2020/11/06/image30a75973833c5eb9.png)
![](https://ia.wampi.ru/2020/11/06/2020-11-06_23-46-00.png)

После создания проекта, необходимо выбрать вкладку "Библиотека"
![](https://ia.wampi.ru/2020/11/06/image98d3bdce44c27827.png)

И в списке выбрать Google Sheets API
![](https://ia.wampi.ru/2020/11/06/image6f8f53f701aad03c.png)

После чего нажать на кнопку "Включить"
![](https://ia.wampi.ru/2020/11/06/imagebdf38d62e1f19c6a.png)

Должно произойти перенаправление на страницу настроек данного API.
На этой странице, необходимо будет создать доступы. по кнопке "Создать учетные данные"
![](https://ia.wampi.ru/2020/11/06/imagea6bc7632b40b3e24.png)

В появившемся окне нужно выбрать настройки для сервисного аккаунта и нажать на кнопку "Выбрать тип учетных данных". Рекомендую использовать такие, как на скриншоте
![](https://ia.wampi.ru/2020/11/06/imagea54200ff5042dbd7.png)

Далее необходимо задать имя аккаунту и роль. Необходимо выбрать роль **Проект - Редактор**.
![](https://ia.wampi.ru/2020/11/06/image2c0b609435cb97f8.png)
Тип ключа Json. Жмем продолжить. Будет предложено скачать JSON файл с данными. Сохраняем его в папку с проектом, переименовываем в **keys.json** для более удобного обращения к нему из проекта.

На этом настройка аккаунтов практически закончена. Осталось лишь назначить в качестве редактора только что созданный аккаунт в нашем google таблице. Для этого откроем её и нажмем на кнопку "Настройки доступа"
![](https://ia.wampi.ru/2020/11/06/imagec49b957480bf905e.png)

Неободимо добавить аккаунт, который мы создали в качестве редактора данной таблицы. Для этого нужно посмотреть его email в [консоли разработчика](https://console.developers.google.com/) во вкладке "Учетные даные" и скопировать почту
![](https://ia.wampi.ru/2020/11/06/image739d201b53408fce.png)

![](https://ia.wampi.ru/2020/11/06/imaged0ac828572753a68.png)

На этом настройку сервисов можно считать законченной. Перейдем к самому проекту.


# Создадим модуль для работы с Google API

Для начала создадим файл **config.js** в котором мы будем хранить конфигурационные данные для бота. И запишем в него ID нашей Google таблицы. Посмотреть его можно в адресной строке. 
![](https://ia.wampi.ru/2020/11/06/image20e62fac8d083cd1.png)

**config.js**
```js
module.exports = {
    spreadid:"1M6fyEhv64ug7zILRz86H1PBKEKHUgKV9pWSW2m_r4SI",  // ID google таблицы
}
```

После чего создадим файл **googleapi.js** 
В нем у нас будут хранится все функции и данные по работе с API Google.Для начала необходимо установить модуль по работе с Google Api для NodeJS.
Введем команду **npm install googleapis@39 --save** в терминале, для установки данного модуля.
В самом файле импортируем зависимости
```js
const config = require("./config.js");
const {google} = require('googleapis');
const keys = require('./keys.json');
```
и создадим объект клиента, который будет авторизировать нас в google. 

```js
const client = new google.auth.JWT(
    keys.client_email,
    null,
    keys.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
) //Json Web Token
```
Параметры, которые принимает функция JWT:
+ email из json файла с доступами,
+ Путь до файла с закрытым ключом (мы его не передаем, поэтому null)
+ Приватный ключ из json файла с доступами
+ И список доступов, у нас из доступов только google sheets. При необходимости передаются в этотс список и другие API от google.

Далее необходимо вызвать функцию, которая нас авторизирует в системе.
```js
client.authorize(function(err, tokens) {
    if (err){
        console.log(err);
        return;
    }
    
    console.log('Connected Google Sheets Api!');
    gsrun(client);
});

let gsapi;

async function gsrun(cl){
    gsapi = google.sheets({version:'v4', auth:cl})
}
```
Если все успешно прошло, то выводим в консоль "Connected Google Sheets Api!"
И записываем в объект gsapi класс Sheets, который в параметры принимает версию используемого API и объект Client, который мы создавали ранее. После этого нам остается описать функции, которые будут работать с данными.

Для того, чтобы получать данные из таблицы, мы напишем функцию 
```js
async function getValues(range) 
{
    const opt = {
        spreadsheetId: config.spreadid,
        range : range
    }

    let data = await gsapi.spreadsheets.values.get(opt);
    let dataArray = data.data.values;

    return dataArray;
}
```
В параметры она принимает диапазон ячеек в таком формате: **"Лист1!A1:B2"**, где Лист1 - это имя вашего листа в таблице. Будьте, внимательны, когда указываете этот параметр.

**opt** - Это словарь параметров, которые мы передаем в запрос к Api google.
+ spreadsheetId - id таблицы
+ range - Диапазон значений, откуда извлекать информацию

Для того, чтобы извлечь данные из таблицы, opt нужно передать в метод gsapi.spreadsheets.values.get(opt);
Данный метод возвращает всю информацию о запросе, а конкретно данные хранит в data.values

Теперь напишем метод, который позволит нам записывать данные в таблицу. Чтобы записывать данные в конец таблицы, нам нужно сначала узнать номер последней строки. API не позволяет этого сделать напрямую, поэтому мы сначала опишем метод, который будет возвращать номер последней строки, прежде чем записывать данные.

```js
async function getLastRow() // Получить номер последней строки в таблице
{
    const opt = {
        spreadsheetId: config.spreadid,
        range: 'Data!A1:A'
    }
    let response = await gsapi.spreadsheets.values.get(opt);
    return response.data.values.length;
}
```
Его суть в том, чтобы получить все данные из диапазона A1:1 - То есть до конца таблицы, а потом просто вернуть длину получившегося массива. 

**Метод по записи данных**
```js
async function updateSheet(name, phone) // Записать в последнюю строку таблицы данные.
{
    let lastRow = await getLastRow() + 1;
    const opt = {
            spreadsheetId : config.spreadid,
            range: 'Data!A' + lastRow,
            valueInputOption:'USER_ENTERED',
            resource: {values: [[name, phone]]}
    }
    await gsapi.spreadsheets.values.update(opt);
}
```
В параметры принимает имя и телефон (Их мы будем хранить в таблице). Также словарь opt теперь содержит дополнительные параметры ввиде наших данных. обратите внимание, что values - это массив массивов (Так мы можем передавать диапазон данных, а не только одну строку). Для записи используется метод update. 

На этом наша работа с GoogleApi закончена, осталось лишь экспортировать методы по работе с Api, чтобы мы могли их вызывать из другого класса. 
```js
module.exports.updateSheet = updateSheet;
module.exports.getValues = getValues;
module.exports.getLastRow = getLastRow;
```

# Работа с WA Api. 
Для работы с WA Api нам потребуется токен и Uri из вашего [личного кабинета](https://app.chat-api.com). 
![](https://ia.wampi.ru/2020/11/06/image318a64efb4362c04.png)
Запишем их в конфигурационный файл
```js
module.exports = {
    apiUrl: "https://eu115.chat-api.com/instance12345/", // URL адрес для обращений к API
    token: "1hi0xwfzaenxsews", // Токен для работы с API из личного кабинета
    spreadid:"1M6fyEhv64ug7zILRz86H1PBKEKHUgKV9pWSW2m_r4SI",  // ID google таблицы
}
```

После чего создадим файл **index.js**
Он будет содержать всю логику работы бота и сервер по обработке запросов от Weebhook.
Импортируем все зависимости.
```js
const config = require("./config.js");
const googleapi = require("./googleapi.js");
const token = config.token, apiUrl = config.apiUrl;
const menu_text = config.menuText;
const app = require('express')();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
```
+ node-fetch позволит совершать запросы к API, config подгрузит наши данные с другого файла
+ token и apiUrl наши данные из конфигурационного файла, которые позволяют обращаться к WA Api
+ Модуль Express нужен для разворачивания веб-сервера, который будет обрабатывать запросы
+ body-parser позволит удобно извлекать поток входящих запросов
+ googleapi - наш модуль по работе с googleApi

Далее говорим серверу, что будем парсить Json данные
```js
app.use(bodyParser.json());
```
Вешаем обработчик ошибок
```js
process.on('unhandledRejection', err => {
    console.log(err)
});
```

И описываем функцию, которая будет работать с WA Api.
```js
async function apiChatApi(method, params){
    const options = {};
    options['method'] = "POST";
    options['body'] = JSON.stringify(params);
    options['headers'] = { 'Content-Type': 'application/json' };
    
    const url = `${apiUrl}/${method}?token=${token}`; 
    
    const apiResponse = await fetch(url, options);
    const jsonResponse = await apiResponse.json();
    return jsonResponse;
}
```
В параметры данная функция принимает метод, который необходимо выполнить и объект с параметрами, которые мы будем передавать в запросе. Внутри функции создаём объект options, который сразу пополняем двумя ключами: json и method. В первом мы передаём параметры, необходимые для API, а во втором указываем метод, с котором обращаемся и в котором хотим получить ответ. Далее мы объявляем константу – наш url адрес для обращения к API. Он будет содержать в себе, собственно, сам url (из конфига), метод и токен. После этого посылаем запрос к chat-api. 

Теперь, когда у нас функция готова, можем описать основную логику работы бота. Опишем обработчик, на который будут приходить данные от webhook.
```js
app.post('/', async function (req, res) {
    const data = req.body;
}
```
Данная функция - это и есть обработчик, который обрабатывает пост запросы по основному адресу сервера (За это отвечает '/' - путь). 
**data** - это пришедший json файл.

Для того, чтобы узнать, какой именно JSON нам будет приходить на сервер. Воспользуемся инструментами [тестирования](https://app.chat-api.com/testing)
![](https://ia.wampi.ru/2020/11/06/image60f8878200d5b8b9.png)

```js
app.post('/', async function (req, res) {
    const data = req.body;
    for (var i in data.messages) {
        const body = String(data.messages[i].body.toLowerCase());
        const chatId = data.messages[i].chatId;
        splitBody = body.split(' ');
        command = splitBody[0];

        if(data.messages[i].fromMe)
            return;
        
        if(command == 'помощь')
        {
            await apiChatApi('sendMessage', {chatId:chatId, body: menu_text});
        }
        else if (command == 'запись')
        {
            name = splitBody[1];
            phone = splitBody[2];
            await googleapi.updateSheet(name, phone)
            await apiChatApi('sendMessage', {chatId:chatId, body: 'Успешно записано'})
        }

        else if (command == 'инфо')
        {
            let result;
            if (splitBody.length == 1){
                result = await getInfoDataFromSheet('A2:D2');
            }
            else{
                result = await getInfoDataFromSheet(splitBody[1]);
            }
            x = await apiChatApi('sendMessage', {chatId:chatId, body: result})
			console.log(x);
        }
		
		else if (command == 'файл')
        {
            linkFile = (await googleapi.getValues('Data!D2'))[0][0];
            x = await apiChatApi('sendFile', {chatId:chatId, body: linkFile, 'filename':'testfile'})
        }

        else if (command == 'рассылка'){
            lastRow = await googleapi.getLastRow() + 1;
            dataAll = await googleapi.getValues('Data!A2:D' + lastRow);
            dataAll.forEach(async function(entry){
                await apiChatApi('sendMessage', {phone:entry[1], body: `Привет, ${entry[0]}, это тестовая рассылка.`});
            });
        }
        
        else
        {
            await apiChatApi('sendMessage', {chatId:chatId, body: menu_text})
        }
    }
    res.send('Ok');
});
```
В данном обработчике - мы в зависимости от присылаемой команды выполняем нужные действия.

Для записи данных в таблицу мы берем сообщение, разбиваем его с помощью метода split и передаем имя и телефон в функцию, которую мы написали для работы с google API
```js
        else if (command == 'запись')
        {
            name = splitBody[1];
            phone = splitBody[2];
            await googleapi.updateSheet(name, phone)
            await apiChatApi('sendMessage', {chatid:chatId, body: 'Успешно записано'})
        }
```

Для получения данных мы либо передаем входящий диапазон данных из сообещния, либо если пользователь не отправил диапазон, то отправляем стандартный A2:D2
```js
 else if (command == 'инфо')
        {
            let result;
            if (splitBody.length == 1){
                result = await getInfoDataFromSheet('A2:D2');
            }
            else{
                result = await getInfoDataFromSheet(splitBody[1]);
            }
            await apiChatApi('sendMessage', {chatId:chatId, body: result})
        }
```

Функция GetInfoDataFromSheet просто формирует строку из массивов данных, которые вернул нам GoogleApi

```js
async function getInfoDataFromSheet(range){
    data = await googleapi.getValues('Data!' + range);
    result = "";
    data.forEach(function(entry) {
        result += entry.join(' ') + "\n"  
    });
    return result;
}
```

Для отправки файла мы берем прямую ссылку на файл из ячейки таблицы и отправляем с помощью метода sendFile
```js
		else if (command == 'файл')
        {
            linkFile = (await googleapi.getValues('Data!D2'))[0][0];
            x = await apiChatApi('sendFile', {chatId:chatId, body: linkFile, 'filename':'testfile'})
        }
```
![](https://ia.wampi.ru/2020/11/07/image16b40bb643bbb16f.png)



Для рассылки мы просто проходимся по всей таблице и отправляем сообщения на указанные номера
```js
else if (command == 'рассылка'){
            lastRow = await googleapi.getLastRow() + 1;
            dataAll = await googleapi.getValues('Data!A2:D' + lastRow);
            dataAll.forEach(async function(entry){
                await apiChatApi('sendMessage', {phone:entry[1], body: `Привет, ${entry[0]}, это тестовая рассылка.`});
            });
        }
```

Теперь мы можем загрузить нашего бота на сервер и установить Weebhook

# Weebhook
Webhook решает проблему с задержкой на отклик входящих сообщений. Без него, нашему боту пришлось бы постоянно спрашивать у сервера о входящих данных, делать периодические фиксированные во времени запросы к серверам. Тем самым имея некоторую задержку в отклике, а также это способствовало бы нагрузке на сервер.

Но, если мы укажем адрес Webhook сервера, то данная необходимость перестанет быть актуальной. Сервера сами будут присылать уведомления о входящих изменениях, как только они появятся. А задача Webhook сервера их принять и правильно обработать, реализовывая логику бота. Указывать можно как домен, так и ip адрес.

Поэтому сейчас нам необходимо загрузить бота на хостинг (Выделенный сервер) и запустить его. Когда мы это сделаем, то укажем домен или IP адрес в личном кабинете в качестве вебхука и протестируем работу бота.
![](https://ia.wampi.ru/2020/11/06/imagec435b3639cf78d70.png)

# Тестируем

При запуске должно появляться сообщение с успешным подключением 
![](https://ia.wampi.ru/2020/11/06/imageea130a8fae7b34da.png)

И вот, что вышло
![](https://ia.wampi.ru/2020/11/07/image02fe9b95f6651d10.png)
Помощь

![](https://ia.wampi.ru/2020/11/06/imageef722241f4661cf0.png)
Запись
![](https://ia.wampi.ru/2020/11/06/image0c48824290b221ce.png)
Результат в таблице

![](https://ia.wampi.ru/2020/11/06/image4ecf8422ee79cf3f.png)
Инфо

Для рассылки в таблицу добавил свой собственный номер в две строки
![](https://ia.wampi.ru/2020/11/06/imageff273839612fb264.png)

Получить файл
![](https://ia.wampi.ru/2020/11/07/imagefd3ecdd7af052a05.png)
