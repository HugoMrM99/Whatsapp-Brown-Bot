const { addPoop, checkMileStones, checkPoopingRecords, startSpecialEvent, endSpecialEvent, 
    getPooperByPhone, queryLastPoop, getBrownLeaders, updateEvent } = require('./dbaccess.js');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({ authStrategy : new LocalAuth()});
const qrcode = require('qrcode-terminal');
// Teste com Sofia
const testChat = '120363180567061733@g.us';
// Chat dos Cocos
const poopChat = '120363180567061733@g.us';
// admin number mine
const adminNumber = "351919966550";
var nextCheck;
resetNextCheck();

function resetNextCheck(){
    nextCheck = new Date(Date.now() + 1000 * 60 * 60);
    nextCheck.setMinutes(30, 0, 0);
    console.log('Checking things.... next check ', nextCheck);
}

function getStartOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when Sunday
    const startOfWeek = new Date(now.setDate(diff));
    
    // Set hours, minutes, seconds, and milliseconds to the beginning of the day
    startOfWeek.setHours(0, 0, 0, 0);
    
    return startOfWeek.getTime();
}

function getStartOfMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Set hours, minutes, seconds, and milliseconds to the beginning of the day
    startOfMonth.setHours(0, 0, 0, 0);
    
    return startOfMonth.getTime();
}

function getStartOfDay() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return startOfDay.getTime();
}

async function showLeaderBoard(type){
    let leaderBoardType = '';
    let dateFilter = null;
    switch(type){
        case 'w' : 
            leaderBoardType = 'desta Semana ';
            dateFilter = { $gte: getStartOfWeek() };
            break;
        case 'm' : 
            leaderBoardType = 'deste Mês ';
            dateFilter = { $gte: getStartOfMonth() };
            break;
        case 'd' : 
            leaderBoardType = ' Hoje';
            dateFilter = { $gte: getStartOfDay() };
            break;
        case 'pw' : 
            leaderBoardType = 'da Semana Passada ';
            const pweek = new Date(getStartOfWeek() - (7 * 24 * 60 * 60* 1000));
            dateFilter = { $gte: getStartOfWeek() };
            break;
        case 'pm' : 
            leaderBoardType = 'do Mês Passado';
            const pmonth = new Date(getStartOfMonth() - (24 * 60 * 60* 1000));
            pmonth.setDate(1);
            pmonth.setHours(0, 0, 0, 0);
            dateFilter = { $gte: pmonth.getTime(), $lt: getStartOfMonth() };
            break;
        case 'y' : 
            leaderBoardType = ' Ontem';
            const pday = new Date(getStartOfDay() - (24 * 60 * 60* 1000));
            dateFilter = { $gte: sod.getTime(), $lt: getStartOfDay() };
            break;    
        default : 
            break;
    }
    let message = '💩💩💩 Líderes ' + leaderBoardType + '💩💩💩\n\n';
    const filter = dateFilter
    const weeklyPoopers = await getBrownLeaders(filter);

    for (let i = 0; i < weeklyPoopers.length; i++) { 
        const pooper = weeklyPoopers[i];
        let aux = '';
        if (i == 0) aux = '🥇 ';
        else if (i == 1) aux = '🥈 ';
        else if (i == 2) aux = '🥉 ';
        aux = aux + pooper.name + ' -> 💩x' + pooper.poops + '\n';
        message = message + aux; 
    }
    
    const finalMessage = (weeklyPoopers != null && weeklyPoopers.length > 0) ?
                message : ('Ainda ninguém pintou a Sanita ' + leaderBoardType.substring(1));
    return finalMessage;
}

client.on('qr', (qr) =>  {
    qrcode.generate(qr, {small : true});
});

client.on('ready', () => {
    console.log('Client is ready!');
})

client.on('message', async (message) => {
    const sender = await message.getContact();
    if (message.from !== poopChat){
        // Special admin commands
        if (sender.number == adminNumber && !message.isGroup){
            // Start event
            const messageText = message.body;
            if(messageText.startsWith('/start ')){
                const eventName = messageText.substring(7);
                const result = await startSpecialEvent(eventName);
                client.sendMessage(message.from, result == null ? 'Erroa ao criar Evento' + eventName : result); 
            }
            else if(messageText.startsWith('/end ')){
                const eventName = messageText.substring(5);
                const result = await endSpecialEvent(eventName);
                if (result == null)
                    client.sendMessage(message.from, 'Erroa ao terminar Evento ' + eventName); 
                else if (await updateEvent(eventName, result)){
                    const leaders = result.leaders;
                    let eventLeaderboard = '💩💩💩 Líderes ' + eventName + ' 💩💩💩\n\n';
                    for (let i = 0; i < leaders.length; i++) { 
                        const pooper = leaders[i];
                        let aux = '';
                        if (i == 0) aux = '🥇 ';
                        else if (i == 1) aux = '🥈 ';
                        else if (i == 2) aux = '🥉 ';
                        aux = aux + pooper.name + ' -> 💩x' + pooper.poops + '\n';
                        eventLeaderboard = eventLeaderboard + aux; 
                    }
                    client.sendMessage(poopChat, eventLeaderboard);
                }
            }
        }
        return;
    }  
	switch(message.body){
        case '💩' :
            // Adiciona um cagalhão ao utilizador que enviou a mensagem
            await addPoop(sender.number);
            // Verfica milestones Diários / Mensais e Semanais
            const milestones = await checkMileStones(sender.number);
            //const buddy = await checkPoopingBuddies();
            for(let milestone of milestones){
                client.sendMessage(message.from, '💩🥳💩🥳 PARABÉNS 💩🥳💩🥳\n' + '@' + 
                    sender.id.user + ' ' + milestone, { mentions: [sender.id._serialized] });    
            }
            const chat = await message.getChat();
            const messages = await chat.fetchMessages({limit: 10});
            for (const m of messages){
                if (m.id != message.id && m.timestamp > message.timestamp - 90 && m.body == '💩')
                    client.sendMessage(message.from, '@' + sender.id.user + ' e @' + m.author.substring(0,m.author.indexOf('@')) 
                + 'são Pooping budies. 💩❤💩'  , { mentions: [sender.id._serialized, m.author] });
            }
            break;
        case '/stats' : 
            const pooper = await getPooperByPhone(sender.number);
            const statsMessage = '💩💩💩 @' + sender.id.user + ' 💩💩💩\n' + 
                            "\nÚltima pintura de sanita -> " + new Date(await queryLastPoop(sender.number)) +
                            "\nHoje -> 💩x" + pooper.day  + "\nEsta Semana -> 💩x" + pooper.week +
                            "\nEste Mês -> 💩x" + pooper.month + "\nTotal -> 💩x" + pooper.total +
                            "\nPrimeiro poio do dia -> 🥇x" + pooper.firsts + "\nPódios -> 🏆x" + pooper.podiums ;

            client.sendMessage(message.from, statsMessage, { mentions: [sender.id._serialized] });
            break;
        case '/weekly' : 
            client.sendMessage(message.from, await showLeaderBoard('w'));
            break;
        case '/lastweek':
            client.sendMessage(message.from, await showLeaderBoard('pw'));
            break;
        case '/monthly' : 
            client.sendMessage(message.from, await showLeaderBoard('m'));
            break;
        case '/lastmonth':
            client.sendMessage(message.from, await showLeaderBoard('pm'));
            break;
        case '/daily' : 
            client.sendMessage(message.from, await showLeaderBoard('d'));
            break;
        case '/yesterday':
            client.sendMessage(message.from, await showLeaderBoard('y'));
            break;
        case '/total' : 
            client.sendMessage(message.from, await showLeaderBoard(null));
            break;
        
    }
    
    const now = new Date();
    if (now.getTime() > nextCheck.getTime()){
        const messages = await checkPoopingRecords(nextCheck, now);
        resetNextCheck();
    }
    
});
 

client.initialize();
