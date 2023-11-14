const qrcode = require('qrcode-terminal');
//Teste com Sofia
const chatCode = '120363180567061733@g.us';

const { addPooper, addPoop, checkMileStones, getBrownCount, checkPoopingRecords, 
    getPooperByPhone, queryLastPoop, getBrownLeaders } = require('./dbaccess.js');
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({ authStrategy : new LocalAuth()});

var nextCheck;
resetNextCheck();

function resetNextCheck(){
    nextCheck = new Date(Date.now() + 1000 * 60 * 60);
    nextCheck.setSeconds(0, 0);
    console.log('Checking things....');
}

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
            const milestones = await checkMileStones(sender.number);
            for(let milestone of milestones){
                client.sendMessage(message.from, '💩🥳💩🥳 PARABÉNS 💩🥳💩🥳\n' + '@' + 
                    sender.id.user + ' ' + milestone, { mentions: [sender.id._serialized] });    
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
    
    if (Date.now() > nextCheck.getTime()){
        const messages = checkPoopingRecords();
        resetNextCheck();


    }
    
});
 

client.initialize();
