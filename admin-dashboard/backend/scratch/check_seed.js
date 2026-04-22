const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkSeed() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('MONGO_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const jobCount = await mongoose.connection.db.collection('jobs').countDocuments();
        const questionCount = await mongoose.connection.db.collection('generalquestions').countDocuments();

        console.log(`Jobs found: ${jobCount}`);
        console.log(`General Questions found: ${questionCount}`);

        if (jobCount > 0) {
            const jobs = await mongoose.connection.db.collection('jobs').find().toArray();
            console.log('Jobs List:');
            jobs.forEach(j => console.log(`- ${j.title} (ID: ${j.job_id})`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSeed();
