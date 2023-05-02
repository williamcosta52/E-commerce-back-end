import { MongoClient } from "mongodb"
import dotenv from "dotenv"

//Configuração
dotenv.config()

//Conexão com o banco de dados
const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err.message)
}
export const db = mongoClient.db()