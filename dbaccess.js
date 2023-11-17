const { MongoClient } = require("mongodb");

const mongoUser = 'hugomrmartins99';
const mongoPass = 'wbR2iowarBmeHgeN';
const uri = "mongodb+srv://" + mongoUser + ":" + mongoPass + "@browncluster.btfzanj.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function addPoop(pooperId){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poopers = database.collection('participants');
        const poops = database.collection('browns');

        // Create a filter to update the correct Pooper
        const pooperFilter = { "id": pooperId };

        // Get current pooper stats
        const pooper = await poopers.findOne(pooperFilter);
        if (pooper == null) return;

        const newPoop = {
            "participant": pooperId, 
            "date": Date.now() 
        };
        const poopAdded = await poops.insertOne(newPoop);
        return poopAdded == null ? null : poopAdded.acknowledged;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function queryLastPoop(pooperId) {
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('browns');
        // Query for pooper with 
        const query = {};
        if (pooperId != null)
            query.participant = pooperId;
        const options = {
            sort: { date: -1 },
            projection: { _id: 0, date: 1 } // Return options
        };
        // Execute query 
        const latestPoop = await poops.findOne(query, options);
        return latestPoop != null ? latestPoop.date : 'N/A';
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function getBrownLeaders(dateFilter){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('participants');
        // Query for weekly Poops
        const queryFilter = { $expr: { $eq: ["$participant", "$$main"] }  };
        const pipeline = [
            { $lookup: {
                from : "browns",
                  let: { main: "$id" },
                  pipeline: [ { $match: queryFilter}],
                  as: "poops"
            } },
            { $addFields: { 
                  poops: { $size: "$poops" }
            } },
            { $sort: { poops: -1}}
         ];

        // Filter according to the type of Count weekly, monthly or daily ( total count default )
        if(dateFilter != null )
            queryFilter.date = dateFilter;

        const leaderboard = await poops.aggregate(pipeline).toArray();
        return leaderboard == null ? null : leaderboard;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function getPooperByPhone(pooperId){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poopers = database.collection('participants');
        const poops = database.collection('browns');

        const pooper = await poopers.findOne({ id: pooperId}, 
            { projection: { _id: 0, name: 1, podiums: 1, firsts: 1, wins: 1} });
        if (pooper == null) return null;
            
        const poopies = await poops.find({ participant: pooperId }).toArray();

        pooper.day = 0; pooper.week = 0; pooper.month = 0; pooper.total = 0;
        if (poopies == null) return null;
        for(const poo of poopies){
            if ( poo.date >= getStartOfDay()) pooper.day += 1;
            if ( poo.date >= getStartOfWeek()) pooper.week += 1;
            if ( poo.date >= getStartOfMonth()) pooper.month += 1;
        }
        pooper.total = poopies.length; 
        
        return pooper;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function checkFirstOfTheDay(){
    const leaders = await getBrownLeaders({ $gte: getStartOfWeek() });

    if (leaders != null && leaders.length > 1 && leaders[0].poops === 1 && leaders[1].poops === 0){
        const first = leaders[0];
        try {
            await client.connect();
            const database = client.db('BrownDB');
            const poopers = database.collection('participants');
            const result = await poopers.updateOne({ id: first.id}, { $inc: { firsts: 1} });
            
            if (result.modifiedCount == 1)
                return 'foste o primeiro/a do dia a pintar a Sanita.'
            else
                return null;
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close();
        }
    }
    return null;
}

async function checkMileStones(pooperId){
    const mileStones = [];
    const pooper = await getPooperByPhone(pooperId);
    const first = await checkFirstOfTheDay();
    if (first != null)
        mileStones.push(first);

    if (pooper.day == 5)
        mileStones.push('estás com diarreia? Já vais no quinto.\nÉ melhor pores um tampinha ou evitar sair de casa, para evitar desgraças.');
    else if(pooper.day == 3)
        mileStones.push('ontem foi um dia de festa? Pareces ter comido bem, já lá vão três descargas.');
        
    if(pooper.week == 20)
        mileStones.push('de facto uma semana saudável, num bom ritmo, com já 20 poios acumulados.');
    else if(pooper.week == 25)
        mileStones.push('das duas, uma, ou está a chegar o fim da Semana ou andas a cagar muito...\n Já vão 25.');
    else if(pooper.week == 30)
        mileStones.push('30 CARALHOOO.\nExcelente trânsito intestinal para esta semana.');

    if(pooper.month == 75)
        mileStones.push('estás com diarreia? Já vais no quinto.\nÉ melhor pores um tampinha ou evitar sair de casa, para evitar desgraças.');
    else if(pooper.month == 90)
        mileStones.push('se fossem quilómetros dava para fazer mais de duas maratonas.\nMas foi só merda mesmo, em 90 ocasiões diferentes.');
    else if(pooper.month == 100)
        mileStones.push('centésimo cagalhão do mês💯💯💯.\nSe fossem dolares estavas a dar um Benjamin Franklin.');            

    if(pooper.total % 50 == 0)
        mileStones.push('desde que começou a contagem já fizeste um total de ' + total + ' poios.');
    
    return mileStones;
}

async function checkPoopingRecords(previousDay, day){
    const recordsMessages = []
    
    if (day.getDate() != previousDay.getDate()){
        recordsMessages.push({ number: 'd'});
        if (day.getMonth() != previousDay.getMonth()){
            // Start of the Month
            //updatePodiums('m');
            recordsMessages.push({ number: 'm'});
        }
        if (day.getDay() === 1){
            // Start of the Week
            //updatePodiums('w');
            recordsMessages.push({ number: 'w'});
        }
    }

    // Check for constipation
    const constipated = await checkConstipation();
    constipated.forEach(c => recordsMessages.push(c));

    return recordsMessages;
}
 
function getDaysHoursMinutes(interval){
    let nday = '';
    const days = Math.floor(interval / ( 24 * 60 * 60 * 1000 ));
    let remain = interval % ( 24 * 60 * 60 * 1000 );
    if (days == 1)
        nday = days + ' dia, ';
    else if(days > 1 )
        nday = days + ' dias, ';
    const hours = Math.floor(remain / ( 60 * 60 * 1000 ));
    remain = remain % ( 60 * 60 * 1000 )
    const result = nday + hours + ' horas e ' + Math.floor(remain / ( 60 * 1000)) + ' minutos.';
    return result;
}

async function checkConstipation(){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('participants');
        // Query for last Poop of each participant
        const day = 60 * 60 * 24 * 1000;
        const pipeline = [{
              $lookup: { from: "browns", let: { main: "$id"},
                pipeline: [ { $sort: { date: -1 } },
                  { $match: { $expr: { $eq: ["$participant", "$$main"] } } } ],
                as: "last" } },
            { $addFields: { last: { $getField: { field: "date", input: { $arrayElemAt: ["$last", 0] } } } } },
            { $addFields: { interval: { $subtract: [ { $literal: Date.now() }, "$last"] } } } , 
            { $match: { interval: { $gte: day } } } ];

        const constipation = await poops.aggregate(pipeline).toArray();
        const consts = [];
        for(const constipated of constipation){
            const msg = '💩💩💩 ATENÇÃO 💩💩💩\nEstá tudo bem @' + constipated.id + 
            '?\nJá não cagas há ' + getDaysHoursMinutes(constipated.interval);
            consts.push({number: constipated.id, message: msg });
        }
        return consts;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function startSpecialEvent(eventName){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const events = database.collection('events');

        // Create a filter to update the correct Pooper
        const newEvent = { "name": eventName,  "start": Date.now()};

        const eventAdded = await events.insertOne(newEvent);
        return eventAdded != null && eventAdded.acknowledged ? 'Evento ' + eventName + ' iniciado com sucesso.' : null;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function endSpecialEvent(eventName){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const events = database.collection('events');
        const endDate = Date.now();

        const eventInfo = await events.findOne({name: eventName});
        if (eventInfo == null) return null;
        
        const eventLeaders = await getBrownLeaders({ $gte: eventInfo.start, $lte: endDate});
        if (eventLeaders == null ) return;

        const result = { end: endDate, leaders: eventLeaders };
        return result;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function updateEvent(eventName, result){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const events = database.collection('events');
    
        const update = await events.updateOne({name: eventName}, { $set: { end: result.end, leaders: result.leaders }});
        return (update != null && update.modifiedCount > 0);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}


module.exports = { addPoop, checkMileStones, queryLastPoop, getBrownLeaders, endSpecialEvent,
    checkPoopingRecords, getPooperByPhone, checkConstipation, startSpecialEvent, updateEvent };

//const constipation = checkPoopingRecords();
//constipation.then(poopers => {
//   for (const pooper of poopers){
//        console.log(pooper.message);
//    }
//});
