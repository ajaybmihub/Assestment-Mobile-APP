const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/interview_ai?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

async function migrate() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db();
    const usersColl = db.collection('users');
    const mobileColl = db.collection('mobiledevices');

    const users = await usersColl.find({ device_id: { $exists: true } }).toArray();
    console.log(`Found ${users.length} users with device data.`);

    for (const user of users) {
      console.log(`Migrating device for user: ${user.name || user._id}`);
      
      const deviceData = {
        device_id: user.device_id,
        device_name: user.device_name,
        app_version: user.app_version,
        cpu_cores: user.cpu_cores,
        total_ram: user.total_ram,
        processor: user.processor,
        user_id: user._id,
        last_sync_at: user.last_sync_at || user.updatedAt || new Date(),
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date()
      };

      // 1. Upsert into mobiledevices
      await mobileColl.updateOne(
        { device_id: user.device_id },
        { $set: deviceData },
        { upsert: true }
      );

      // 2. Clean up user collection (remove technical fields)
      await usersColl.updateOne(
        { _id: user._id },
        {
          $unset: {
            device_id: "",
            device_name: "",
            app_version: "",
            cpu_cores: "",
            total_ram: "",
            processor: ""
          }
        }
      );
    }

    console.log("Migration and cleanup completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrate();
