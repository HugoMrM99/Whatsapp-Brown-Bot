const qrcode = require('qrcode-terminal');
//Teste com Sofia
const chatCode = '120363180567061733@g.us';

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
	switch(message.body){
        case '/enrole' : 
            // Entrar no concurso criar participante ou informasr que já está inscrito caso se verifique
            const sender = await message.getContact();
            console.log('Utilizador entrou no concurso do cagalhão ', sender.id.user);
            client.sendMessage(message.from, '💩💩💩 BEM VINDO 💩💩💩\nUtitlizador @' + sender.id.user + ' entrou no concurso', {
                mentions: [sender.id._serialized]});
            break;
        case '/stats' : 
            client.sendMessage(message.from, '💩💩💩 ESTATÍSTICA 💩💩💩\n Cagalhoto em desenvolvimento');
            break;


    }
});
 

client.initialize();
