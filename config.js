module.exports = {
    apiUrl: "https://eu115.chat-api.com/instance12345/", // URL адрес для обращений к API
    token: "t1o2k3e4n5", // Токен для работы с API из личного кабинета
    spreadid:"1M6fyEhv64ug7zILRz86H1PBKEKHUgKV9pWSW2m_r4SI",  // ID google таблицы

    
    menuText: `Это демо-бот для https://chat-api.com/ с google sheets api.
Команды:
    1. Запись Имя Телефон - Записать данные в ячейки листа.
    2. Инфо [A1:C2] - получить данные из диапазона ячеек. Если ячейка не указана, то возвращаем диапазон A2:D2.
    3. Рассылка - Разослать сообщения контактам из листа.
    4. Помощь - Получить список команд.`
}
