const { MongoClient } = require("mongodb");

const mongoUser = 'hugomrmartins99';
const mongoPass = 'wbR2iowarBmeHgeN';
const uri = "mongodb+srv://" + mongoUser + ":" + mongoPass + "@browncluster.btfzanj.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function addPooper(pooperId, pooperName){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poopers = database.collection('participants');
        const pooper = await poopers.findOne({ id: pooperId});
        if (pooper != null) return 0;
        // New pooper info
        const newPooper = {
            "id" : pooperId,
            "name": pooperName,
            "podiums": 0,
            "firsts": 0
        };
        const result = await poopers.insertOne(newPooper);
        return result.acknowledged ? 1 : -1;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

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

async function queryLastPoop(pooperId) {
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('browns');
        // Query for pooper with 
        const query = { participant: pooperId };
        const options = {
            sort: { date: -1 }, // Sorting options
            projection: { _id: 0, date: 1 } // Return options
        };
        // Execute query 
        const latestPoop = await poops.findOne(query);
        return latestPoop != null ? latestPoop.date : 'N/A';
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function getBrownLeaders(typeCount){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('browns');
        // Query for weekly Poops
        const pipeline = [
            { $match: {}},
            { $group: { _id: "$participant", count: { $sum: 1 } } },
            { $lookup: { from: 'participants', localField: '_id', foreignField: 'id', as: 'pooper' } },
            { $sort: { count : 1 } }, 
            { $project: { _id: 1, count: 1, pooper: { '$arrayElemAt': [ '$pooper', 0 ] } } }
        ];

        // Filter according to the type of Count weekly, monthly or daily ( total count default )
        if(typeCount === 'w')
            pipeline[0].$match.date = { $gte: getStartOfWeek() };
        else if(typeCount === 'm')
            pipeline[0].$match.date = { $gte: getStartOfMonth() };
        else if(typeCount === 'd')
            pipeline[0].$match.date = { $gte: getStartOfDay() };

        const leaderboard = await poops.aggregate(pipeline).toArray();
        return leaderboard == null ? null : leaderboard;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}


async function getBrownCount(typeCount, pooper){
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poops = database.collection('browns');
        // Query for weekly Poops
        const pipeline = [
            { $match: { participant: pooper}},
            { $group: { _id: "$participant", count: { $sum: 1 } } },
            { $sort: { count : 1 } }
        ];

        // Filter according to the type of Count weekly, monthly or daily ( total count default )
        if(typeCount === 'w')
            pipeline[0].$match.date = { $gte: getStartOfWeek() };
        else if(typeCount === 'm')
            pipeline[0].$match.date = { $gte: getStartOfMonth() };
        else if(typeCount === 'd')
            pipeline[0].$match.date = { $gte: getStartOfDay() };

        const leaderboard = await poops.aggregate(pipeline).toArray();
        return (leaderboard == null || leaderboard.length == 0) ? 0 : leaderboard[0].count;
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
        const pooper = await poopers.findOne({ id: pooperId}, 
            { projection: { _id: 0, name: 1, podiums: 1, firsts: 1, wins: 1} });
        return pooper;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function checkMileStones(pooperId){
    return [];
}

async function checkPoopingRecords(){
    return [];
}

module.exports = { addPooper, addPoop, checkMileStones, queryLastPoop, getBrownCount, getBrownLeaders, checkPoopingRecords, getPooperByPhone };
