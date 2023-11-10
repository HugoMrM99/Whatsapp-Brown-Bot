const qrcode = require('qrcode-terminal');
//Teste com Sofia
const chatCode = '120363180567061733@g.us';

const { addPooper, addPoop, checkForMileStones } = require('./dbmanipulation.js');
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({ authStrategy : new LocalAuth()});

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
            const added = addPooper(sender.number, sender.pushname != null ? sender.pushname : sender.number);
            added.then(result => {
                var returnMessage = '';
                switch(result){
                    case -1 :
                        returnMessage += '💩💩💩 ERRO 💩💩💩\nNão foi posível a inscrição.\nTente a descarga mais tarde.';
                        break;
                    case 0 : 
                        returnMessage += '💩💩💩 INFO 💩💩💩\nJá faz parte do Gang Castanho';
                        break;
                    case 1 : 
                        returnMessage += '💩💩💩 BEM VINDO 💩💩💩\n@' + sender.id.user + ' os seus cagalhões não serão esquecidos.';
                        break;
                };
                client.sendMessage(message.from, returnMessage, { mentions: [sender.id._serialized]});
            });
            break;
        case '💩' :
            // Adiciona um cagalhão ao utilizador que enviou a mensagem
            await addPoop(sender.number);
            // Verfica milestones Diários / Mensais e Semanais
            const milestoneMessage = await checkForMileStones(sender.number);
            milestoneMessage.then(mileStone => {
                if(mileStone != null)
                    client.sendMessage(message.from, '💩💩💩 Parabéns 💩💩💩\n' + mileStone);
            })
            break;
        case '/stats' : 
            client.sendMessage(message.from, '💩💩💩 ESTATÍSTICA 💩💩💩\n Cagalhoto em desenvolvimento');
            break;

        case '/leaderboard' : 
            client.sendMessage(message.from, '💩💩💩 ESTATÍSTICA 💩💩💩\n Cagalhoto em desenvolvimento');
            break;
        case '/leaderboard' : 
            client.sendMessage(message.from, '💩💩💩 ESTATÍSTICA 💩💩💩\n Cagalhoto em desenvolvimento');
            break;
    }
});
 

client.initialize();
