import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { MongoClient } from "mongodb";

const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
	await mongoClient.connect();
	console.log("MongoDB conectado!");
} catch (err) {
	console.log(err.message);
}
const db = mongoClient.db();




app.post("/signup", async (req, res) => { //POSTAR CADASTRO
	const { name, email, password, age } = req.body;
	const singUpSchema = joi.object({
		name: joi.required(),
		email: joi.required(),
		password: joi.required(),
		age: joi.required(),
	});

	const validation = singUpSchema.validate(req.body, { abortEarly: false });
	if (validation.error) {
		const errors = validation.error.details.map((detail) => detail.message);
		return res.status(422).send(errors);
	}
	const hash = bcrypt.hashSync(password, 10);
	const newUser = { name, email, password: hash, age };

	try {
		const emailUsed = await db.collection("users").findOne({ email });
		if (emailUsed) return res.status(409).send("Esse email já está cadastrado");
		await db.collection("users").insertOne(newUser);
		return res.status(201).send(`Cadastro de ${newUser.name} realizado com sucesso!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.post("/login", async (req, res) => { //FAZ O LOGIN
	const { email, password } = req.body;
	try {
		const loginUser = await db.collection("users").findOne({ email });
		if (!loginUser) return res.status(404).send("E-mail não cadastrado");
		const verifyPassword = bcrypt.compareSync(password, loginUser.password);
		if (!verifyPassword) return res.status(401).send("Senha incorreta");
		const token = uuid();
		await db.collection("sessions").insertOne({ idUser: loginUser._id, name: loginUser.name, token }); //USUARIOS LOGADOS
		const sucessLogin = { name: loginUser.name, token: token };
		return res.status(200).send(sucessLogin); //MANDA O TOKEN PRO FRONT
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.post("/van/stock", async (req, res) => {  //ADMIN POSTAR ITEM AO ESTOQUE
	const itemSchema = joi.object({
		name: joi.string().required(),
		category: joi.string().required(),
		description: joi.string().required(),
		price: joi.number().required(),
		quantity: joi.number().required(),
		image: joi.required(),
	});

	const validation = itemSchema.validate(req.body, { abortEarly: false });
	if (validation.error) return res.status(422).send(validation.error);


	const newItem = req.body;

	try {
		const itemAlreadyOnStock = await db.collection("stock").findOne({ name: newItem.name });
		if (itemAlreadyOnStock)
			return res.status(409).send(`${newItem.name} já está no estoque!`);
		const categoryExists = await db.collection("stock").findOne({ category: newItem.category });
		if (!categoryExists) {
			await db.collection("categories").insertOne({ category: newItem.category });
			await db.collection("stock").insertOne(newItem);
			return res.status(200).send(`${newItem.name} adicionado ao estoque!
            E categoria ${newItem.category} adicionada à coleção de categorias!`);
		} else {
			await db.collection("stock").insertOne(newItem);
			return res.status(200).send(`${newItem.name} adicionado ao estoque na categoria ${newItem.category}!`);
		}
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/van/stock", async (req, res) => {  //MOSTRA TODOS OS ITENS
	try {
		const stock = await db.collection("stock").find().toArray();
		return res.status(200).send(stock);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.get("/categories", async (req, res) => { //PEGA TODAS AS CATEGORIAS DO ESTOQUE
	try {
		const categories = await db.collection("categories").find().toArray();
		return res.status(200).send(categories);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.get("/categoria/:category", async (req, res) => {  //PEGA OS ITEMS DE UMA CATEGORIA
	const { category } = req.params;
	try {
		const categoryItems = await db.collection("stock").find({ category: category }).toArray();
		return res.status(200).send(categoryItems);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.get("/:category/:item", async (req, res) => {  //PEGA ITEM EM ESPECÍFICO
	const { category, item } = req.params;
	try {
		const itemInCategory = await db.collection("stock").findOne({ category, name: item });
		return res.status(200).send(itemInCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.post("/home/cart", async (req, res) => {  //ADICIONA ITENS AO CARRINHO DO USUARIO DE ACORDO COM O TOKEN

    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '')

const {name, category, price, quantity, image } = req.body

    try{
    const thisUser = await db.collection("sessions").findOne({token})
	const userCart = {
		idUser: thisUser.idUser,
		name, 
		category, 
		price, 
		quantity, 
		image
	}
await db.collection("userCart").insertOne(userCart)
return res.status(200).send(`Item ${name} adicionado ao carrinho de ${thisUser.name}!`)
    }
    catch (err) {
		res.status(500).send(err.message);
	}
})


app.get("/home/cart/show", async (req, res) => { //LISTA OS ITENS DO CARRINHO DO USUARIO DE ACOROD COM O TOKEN
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '')

    try{
        const thisUser = await db.collection("sessions").findOne({token})
        const cartShow = await db.collection("userCart").find({idUser: thisUser.idUser}).toArray()
        return res.status(200).send(cartShow)
    }catch (err) {
		res.status(500).send(err.message);
	}
})





//PARA USO ADMINISTRATIVO

app.get("/signup", async (req, res) => { //VE OS CADASTRADOS
	
	try {
		const users = await db.collection("users").find().toArray();
		return res.status(200).send(users);
	} catch (err) {
		res.status(500).send(err.message);
	}
});



app.delete("/signup/:email", async (req, res) => { //DELETA CADASTRADO POR EMAIL
	const { email } = req.params;
	try {
		const deleted = await db.collection("users").deleteOne({ email });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res.status(200).send(`Participante com email ${email} deletado com sucesso!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.get("/login", async (req, res) => { //MOSTRA OS USUARIOS LOGADOS
	try {
		const usersLogins = await db.collection("sessions").find().toArray();
		return res.status(200).send(usersLogins);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.delete("/van/stock/:name", async (req, res) => {  //RETIRA ITEM DO ESTOQUE POR NOME
	const { name } = req.params;
	try {
		const deleted = await db.collection("stock").deleteOne({ name });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res.status(200).send(`Item ${name} retirado do estoque!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.delete("/categories/:category", async (req, res) => { //APAGA CATEGORIA E OS ITENS NELA
	const { category } = req.params;
	try {
		const deletedCategory = await db.collection("categories").deleteOne({ category });
		if (deletedCategory.deletedCount === 0)
			return res.status(404).send("Essa categoria não existe!");
        const deletedItemsInCategory = await db.collection("stock").deleteMany({category: category})
		return res.status(200).send(`Categoria ${category} apagada, assim como todos os
        ${deletedItemsInCategory.deletedCount} itens presentes nela!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});


app.delete("/home/cart/show/:name", async (req, res) => {
    const { name } = req.params;
    try{
        const deleted = await db.collection("userCart").deleteMany({ name });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res.status(200).send(`Item ${name} retirado do carrinho`);
    }
    catch (err) {
		res.status(500).send(err.message);
	}
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
