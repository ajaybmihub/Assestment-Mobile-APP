const { MongoClient } = require('mongodb');

// Configuration
const MONGO_URI = "mongodb://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank-shard-00-00.qjtlk.mongodb.net:27017,tat-qestion-bank-shard-00-01.qjtlk.mongodb.net:27017,tat-qestion-bank-shard-00-02.qjtlk.mongodb.net:27017/interview_ai?ssl=true&replicaSet=atlas-d7dld0-shard-0&authSource=admin&retryWrites=true&w=majority&appName=TAT-Qestion-Bank";
const SOURCE_DB_NAME = "quiz_db";
const TARGET_DB_NAME = "interview_ai";
const TARGET_COLLECTION = "mcqquestions"; // Mongoose pluralizes McqQuestion to mcqquestions

async function migrate() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        const sourceDb = client.db(SOURCE_DB_NAME);
        const targetDb = client.db(TARGET_DB_NAME);

        // Get all collections from source to find where questions are
        const collections = await sourceDb.listCollections().toArray();
        console.log("Source collections:", collections.map(c => c.name));

        // We will pull from all collections except 'topics' and 'system.*'
        for (const collInfo of collections) {
            const collName = collInfo.name;
            if (collName === 'topics' || collName.startsWith('system.')) continue;

            console.log(`\nProcessing collection: ${collName}`);
            const sourceColl = sourceDb.collection(collName);
            const questions = await sourceColl.find({}).toArray();
            console.log(`Found ${questions.length} documents.`);

            if (questions.length === 0) continue;

            const transformedQuestions = questions.map(q => {
                // Clean up and transform based on the schema provided by user
                return {
                    domain: q.domain || q.Domain || "General",
                    topic: q.topic || q.Topic || "Miscellaneous",
                    subtopic: q.subtopic || q.Subtopic || "General",
                    question: q.question || q.Question || "",
                    options: Array.isArray(q.options) ? q.options : [
                        { option: "1", value: q["Option 1"] || "" },
                        { option: "2", value: q["Option 2"] || "" },
                        { option: "3", value: q["Option 3"] || "" },
                        { option: "4", value: q["Option 4"] || "" }
                    ],
                    correct_answer: (q.correct_answer || q["Correct Option"] || q.correct_option || "1").toString(),
                    difficulty: q.difficulty || q.Difficulty || "Medium",
                    imageUrls: [], // New field
                    companies: q.companies || q.Companies || "",
                    citations: q.citations || q.Citations || "",
                    source: q.source || q.Source || "Migrated",
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }).filter(q => q.question.trim() !== "");

            if (transformedQuestions.length > 0) {
                console.log(`Inserting ${transformedQuestions.length} cleaned questions into ${TARGET_COLLECTION}...`);
                await targetDb.collection(TARGET_COLLECTION).insertMany(transformedQuestions);
            }
        }

        console.log("\nMigration completed successfully!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.close();
    }
}

migrate();
