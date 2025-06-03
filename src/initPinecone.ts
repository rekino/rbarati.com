require("dotenv").config();

import pinecone from './config/pinecone';
import experiences from '../experiences.json';
import AppConfig from "./appconfig";

async function run() {
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(index => {
        return index.name === AppConfig.pinecone_index
    });

    if (!indexExists) {
        console.error('Index does not exists. Creating the index...');
        await pinecone.createIndexForModel({
            name: AppConfig.pinecone_index,
            cloud: 'aws',
            region: 'us-east-1',
            embed: {
                model: 'multilingual-e5-large',
                fieldMap: { text: 'chunk_text' },
            },
            waitUntilReady: true,
        });
    }

    const index = pinecone.index(AppConfig.pinecone_index).namespace(AppConfig.pinecone_namespace);

    const records = experiences.map(exp => {
        return {
            chunk_text: `${exp.role} at ${exp.company} from ${exp.from} to ${exp.to} - goals: ${exp.goal} - tasks: ${exp.tasks} - results: ${exp.results} - skills: ${exp.skills.join(',')}`,
            ...exp
        }
    });

    // Upload to Pinecone
    await index.upsertRecords(records);

    console.log(`Successfully upserted ${records.length} records to Pinecone.`);
}

run().catch((err) => {
  console.error('Error populating Pinecone index:', err);
  process.exit(1);
});
