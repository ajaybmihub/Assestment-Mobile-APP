const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } finally {
        await mongoose.disconnect();
    }
}
checkCollections();
