import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import bcrypt from "bcrypt"

//Criação do servidor
const app = express()

//Configurações
app.use(express.json())
app.use(cors())
dotenv.config()

//Conexão com o Banco de Dados
const mongoClient = new MongoClient(process.env.DATABASE_URL); //no dotenv
try {
    await mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err.message)
}
const db = mongoClient.db()


//Endpoints 

app.post("/singup", async (req, res) => {
    const {name, email, password, age} = req.body
    const singUpSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required().min(3),
        age: joi.number().required()
    })

    const validation = singUpSchema.validate(req.body, { abortEarly: false })
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }
    const hash = bcrypt.hashSync(password, 10)
    const newUser = {name, email, password: hash, age}
    try {
        const emailUsed = await db.collection("users").findOne({email})
        if (emailUsed) return res.status(409).send("Esse email já está cadastrado")
        await db.collection("users").insertOne(newUser)
        return res.sendStatus(201)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/singup", async (req, res) => {
    try {
        const users = await db.collection("users").find().toArray()
        return res.status(200).send(users)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete("/singup/:email", async (req, res) => {
const {email} = req.params
try{
    const deleted = await db.collection("users").deleteOne({email})
    if (deleted.deletedCount === 0) return res.status(404).send("Esse item não existe!")
    return res.status(200).send(`Participante com email ${email} deletado com sucesso!`)
}
catch(err){
    res.status(500).send(err.message)
}
})




//Deixar o app escutante
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))