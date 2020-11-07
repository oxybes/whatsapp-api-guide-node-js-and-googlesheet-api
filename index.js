const config = require("./config.js");
const googleapi = require("./googleapi.js");
const token = config.token, apiUrl = config.apiUrl;
const menu_text = config.menuText;
const app = require('express')();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

app.use(bodyParser.json());

process.on('unhandledRejection', err => {
    console.log(err)
});	

app.get('/', function (req, res) {
    res.send("It's work.");
}); 

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

app.listen(80, function () {
    console.log('Listening on port 80..');
});



async function getInfoDataFromSheet(range){
    data = await googleapi.getValues('Data!' + range);
    result = "";
    data.forEach(function(entry) {
        result += entry.join(' ') + "\n"  
    });
    return result;
}

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