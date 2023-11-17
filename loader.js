const { MongoClient } = require("mongodb");
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const mongoUser = 'hugomrmartins99';
const mongoPass = 'wbR2iowarBmeHgeN';
const uri = "mongodb+srv://" + mongoUser + ":" + mongoPass + "@browncluster.btfzanj.mongodb.net/?retryWrites=true&w=majority";
// Teste com Sofia
const testChat = '120363180567061733@g.us';
// Chat dos Cocos
const poopChat = '120363180567061733@g.us';


const mongoClient = new MongoClient(uri);
const client = new Client({ authStrategy : new LocalAuth()});

client.on('qr', (qr) =>  {
    qrcode.generate(qr, {small : true});
});


client.on('ready', () => {
    console.log('Client is ready!');

    const result = client.getChats();
    result.then(chats => {
        for(const chat of chats){
            if (chat.name !== '💩💩💩') continue;
            //const chatInst = client.getChatById(chat.id._serialized);
            //chatInst.then(coco => {
                // Load participants
                const participants = chat.groupMetadata.participants;
                loadPoopers(participants);

                // Load previous messages
                const messages = chat.fetchMessages({ limit: Number.MAX_VALUE });
                messages.then(mess => loadMessages(mess));
            //});
        }
    });
});

client.initialize();

async function loadMessages(messages){
    // only run once to load Poops loaded (already ran and loaded)
    try {
        await mongoClient.connect();
        const database = mongoClient.db('BrownDB');
        const browns = database.collection('browns');
        const lastBrown = await browns.findOne({}, { sort: { date: -1 }});

        const newPoops = [];
        for (const message of messages){
            const data = message._data;
            if(data.body === '💩'){
                const newPoop = { 
                    participant: data.author.user, 
                    date: (new Date(data.t * 1000)).getTime()
                };
                if (data.t * 1000 > lastBrown.date)
                    newPoops.push(newPoop);
            }
        }
        if(newPoops.length < 1) return;

        for (const p of newPoops)
            console.log(p.participant, ' date ', new Date(p.date));
    
        //const result = await browns.insertMany(newPoops, { ordered: true });
        //console.log(result);
    } finally {
        // Ensures that the client will close when you finish/error
        await mongoClient.close();
    }
}

async function loadPoopers(participants){
    const poopers = [];
    for (const participant of participants){
        const contact = await client.getContactById(participant.id._serialized);
        const newPooper = {
            id : contact.number,
            name: contact.pushname,
            podiums: 0,
            firsts: 0
        };
        poopers.push(newPooper);
    }
    if(poopers.length < 1) return;

    console.log(poopers);
    return;

    // only run once to load Poops loaded (already ran and loaded)
    try {
        await mongoClient.connect();
        const database = mongoClient.db('BrownDB');
        const participants = database.collection('participants');
        const result = await participants.insertMany(poopers, { ordered: true });
        console.log(result);
    } finally {
        // Ensures that the client will close when you finish/error
        await mongoClient.close();
    }
}
