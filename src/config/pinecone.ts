import { Pinecone } from '@pinecone-database/pinecone';
import { checkEnvVars } from "./utils";
import AppConfig from "../appconfig";

checkEnvVars(["PINECONE_API_KEY"]);

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string
});

export default pinecone;