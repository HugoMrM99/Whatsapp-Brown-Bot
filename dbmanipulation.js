const { MongoClient } = require("mongodb");

const mongoUser = 'hugomrmartins99';
const mongoPass = 'wbR2iowarBmeHgeN';

const uri = "mongodb+srv://" + mongoUser + ":" + mongoPass + "@browncluster.btfzanj.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function queryPoopsOnMonth(pooperId) {
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poopers = database.collection('poopers');
        // Query for pooper with 
        const query = { phone: pooperId };
        var pooper = await poopers.findOne(query);
        if (pooper == null) return -1;
        return pooper.poops.length;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function queryTotalPoops(pooperId) {
    try {
        await client.connect();
        const database = client.db('BrownDB');
        const poopers = database.collection('poopers');
        // Query for pooper with 
        const query = { phone: pooperId };
        var pooper = await poopers.findOne(query);
        if (pooper === null) return -1;
        console.log(pooper);
        return await pooper.poops.length;
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

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
            "monthly": 0,
            "weekly": 0,
            "browns": 0
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

        const weeklyPoops = pooper.weekly + 1;
        const monthlyPoops = pooper.monthly + 1;
        const totalPoops = pooper.browns + 1;

        const newPoop = {
            "participant": pooperId, 
            "date": Date.now() 
        };
        const poopAdded = await poops.insertOne(newPoop);
        if (poopAdded.acknowledged){ 
            // create a document that sets the new poopCounters of the Pooper
            const updatePooper = {
                $set: {
                    "monthly": monthlyPoops,
                    "weekly": weeklyPoops,
                    "browns": totalPoops
                }
            };
            await poopers.updateOne(pooperFilter, updatePooper);
        }
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function checkForMileStones(pooperId){

}

module.exports = { addPooper, addPoop, checkForMileStones };
