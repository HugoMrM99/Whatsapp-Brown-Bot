const qrcode = require('qrcode-terminal');
//Teste com Sofia
const chatCode = '120363180567061733@g.us';

const { addPooper, addPoop, checkMileStones, getBrownCount, checkPoopingRecords, 
    getPooperByPhone, queryLastPoop, getBrownLeaders } = require('./dbmanipulation.js');
const { Client, LocalAuth, MessageAck } = require('whatsapp-web.js');
const client = new Client({ authStrategy : new LocalAuth()});

async function showLeaderBoard(type){
    let leaderBoardType = '';
    switch(type){
        case 'w' : 
            leaderBoardType = 'desta Semana ';
            break;
        case 'm' : 
            leaderBoardType = 'deste Mês ';
            break;
        case 'd' : 
            leaderBoardType = ' Hoje';
            break;
        default : 
            leaderBoardType = '';
            break;
    }
    let message = '💩💩💩 Líderes ' + leaderBoardType + '💩💩💩\n\n';
    const weeklyPoopers = await getBrownLeaders(type);

    for (let i = 0; i < weeklyPoopers.length; i++) { 
        const pooper = weeklyPoopers[i];
        let aux = '';
        if (i == 0) aux = '🥇 ';
        else if (i == 1) aux = '🥈 ';
        else if (i == 2) aux = '🥉 ';
        aux = aux + pooper.pooper.name + ' -> 💩x' + pooper.count + '\n';
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
    if (message.from !== chatCode) return; 
    const sender = await message.getContact();
	switch(message.body){
        case '/enrole' : 
            // Entrar no concurso criar participante ou informasr que já está inscrito caso se verifique
            const result = await addPooper(sender.number, sender.pushname != null ? sender.pushname : sender.number);
            let enroleMessage
            switch(result){
                case -1 :
                    enroleMessage = '💩💩💩 ERRO 💩💩💩\nNão foi posível a inscrição.\nTente a descarga mais tarde.';
                    break;
                case 0 : 
                    enroleMessage = '💩💩💩 INFO 💩💩💩\nJá faz parte do Gang Castanho';
                    break;
                case 1 : 
                    enroleMessage = '💩💩💩 BEM VINDO 💩💩💩\n@' + sender.id.user + ' os seus cagalhões não serão esquecidos.';
                    break;
            };
            client.sendMessage(message.from, enroleMessage, { mentions: [sender.id._serialized]});
            break;
        case '💩' :
            // Adiciona um cagalhão ao utilizador que enviou a mensagem
            await addPoop(sender.number);
            // Verfica milestones Diários / Mensais e Semanais
            await checkMileStones(sender.number);
            break;
        case '/stats' : 
            const pooper = await getPooperByPhone(sender.number);
            const statsMessage = '💩💩💩 @' + sender.id.user + ' 💩💩💩\n' + 
                            "\nUtima pintura de sanita -> " + new Date(await queryLastPoop(sender.number)) +
                            "\nHoje -> 💩x" + await getBrownCount('d', sender.number)  + 
                            "\nEsta Semana -> 💩x" + await getBrownCount('m', sender.number) +
                            "\nEste Mês -> 💩x" + await getBrownCount('w', sender.number) + 
                            "\nTotal -> 💩x" + await getBrownCount(null, sender.number) +
                            "\nPrimeiro poio do dia -> 🥇x" + pooper.firsts + 
                            "\nPódios -> 🏆x" + pooper.podiums ;

            client.sendMessage(message.from, statsMessage, { mentions: [sender.id._serialized] });
            break;
        case '/weekly' : 
            client.sendMessage(message.from, await showLeaderBoard('w'));
            break;
        case '/monthly' : 
            client.sendMessage(message.from, await showLeaderBoard('m'));
            break;
        case '/daily' : 
            client.sendMessage(message.from, await showLeaderBoard('d'));
            break;
        case '/total' : 
            client.sendMessage(message.from, await showLeaderBoard(null));
            break;
        
    }
    const recordNotShown = await checkPoopingRecords();
});
 

client.initialize();
