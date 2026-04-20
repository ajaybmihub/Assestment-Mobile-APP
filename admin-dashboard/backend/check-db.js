const mongoose = require('mongoose');

const uri = "mongodb://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank-shard-00-00.qjtlk.mongodb.net:27017,tat-qestion-bank-shard-00-01.qjtlk.mongodb.net:27017,tat-qestion-bank-shard-00-02.qjtlk.mongodb.net:27017/interview_ai?ssl=true&replicaSet=atlas-d7dld0-shard-0&authSource=admin&retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        const db = mongoose.connection.db;
        const usersCount = await db.collection('users').countDocuments();
        const interviewsCount = await db.collection('interviews').countDocuments();
        
        console.log(`Users count: ${usersCount}`);
        console.log(`Interviews count: ${interviewsCount}`);
        
        const lastInterviews = await db.collection('interviews').find().sort({_id: -1}).limit(5).toArray();
        console.log("Last 5 interviews:", JSON.stringify(lastInterviews, null, 2));
        
        const lastUsers = await db.collection('users').find().sort({_id: -1}).limit(5).toArray();
        console.log("Last 5 users:", JSON.stringify(lastUsers, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
