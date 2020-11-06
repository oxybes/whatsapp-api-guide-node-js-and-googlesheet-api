// https://developers.google.com/sheets/api/quickstart/nodejs?hl=ru
// https://console.developers.google.com/
// https://developers.google.com/identity/protocols/oauth2/scopes

const config = require("./config.js");
const {google} = require('googleapis');
const keys = require('./keys.json');

const client = new google.auth.JWT(
    keys.client_email,
    null,
    keys.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
) //Json Web Token

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

async function getLastRow() // Получить номер последней строки в таблице
{
    const opt = {
        spreadsheetId: config.spreadid,
        range: 'Data!A1:A'
    }
    let response = await gsapi.spreadsheets.values.get(opt);
    return response.data.values.length;
}

module.exports.updateSheet = updateSheet;
module.exports.getValues = getValues;
module.exports.getLastRow = getLastRow;