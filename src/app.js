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

app.post("/signup", async (req, res) => {
	const { name, email, password, age } = req.body;
	const singUpSchema = joi.object({
		name: joi.required(),
		email: joi.required(),
		password: joi.required(),
		age: joi.number().required(),
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
		return res.sendStatus(201);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/signup", async (req, res) => {
	try {
		const users = await db.collection("users").find().toArray();
		return res.status(200).send(users);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.delete("/signup/:email", async (req, res) => {
	const { email } = req.params;
	try {
		const deleted = await db.collection("users").deleteOne({ email });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res
			.status(200)
			.send(`Participante com email ${email} deletado com sucesso!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	try {
		const loginUser = await db.collection("users").findOne({ email });
		if (!loginUser) return res.status(404).send("E-mail não cadastrado");
		const verifyPassword = bcrypt.compareSync(password, loginUser.password);
		if (!verifyPassword) return res.status(401).send("Senha incorreta");
		const token = uuid();
		await db
			.collection("sessions")
			.insertOne({ idUser: loginUser._id, name: loginUser.name, token });
		const sucessLogin = { name: loginUser.name, token: token };
		return res.status(200).send(sucessLogin);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/login", async (req, res) => {
	try {
		const usersLogins = await db.collection("sessions").find().toArray();
		return res.status(200).send(usersLogins);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.post("/van/stock", async (req, res) => {
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
		const itemAlreadyOnStock = await db
			.collection("stock")
			.findOne({ name: newItem.name });
		if (itemAlreadyOnStock)
			return res.status(409).send(`${newItem.name} já está no estoque!`);
		const categoryExists = await db
			.collection("stock")
			.findOne({ category: newItem.category });
		if (!categoryExists) {
			await db
				.collection("categories")
				.insertOne({ category: newItem.category });
			await db.collection("stock").insertOne(newItem);
			return res
				.status(200)
				.send(
					`${newItem.name} adicionado ao estoque! E categoria ${newItem.category} adicionada à coleção de categorias!`
				);
		} else {
			await db.collection("stock").insertOne(newItem);
			return res.status(200).send(`${newItem.name} adicionado ao estoque!`);
		}
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/categories", async (req, res) => {
	try {
		const categories = await db.collection("categories").find().toArray();
		return res.status(200).send(categories);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.delete("/categories/:category", async (req, res) => {
	const { category } = req.params;
	try {
		const deleted = await db.collection("categories").deleteOne({ category });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Essa categoria não existe!");
		return res.status(200).send(`Categoria ${category} retirada da coleção!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/van/stock", async (req, res) => {
	try {
		const stock = await db.collection("stock").find().toArray();
		return res.status(200).send(stock);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.delete("/van/stock/:name", async (req, res) => {
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

app.get("/:category", async (req, res) => {
	const { category } = req.params;
	try {
		const categoryItems = await db
			.collection("stock")
			.find({ category: category })
			.toArray();
		return res.status(200).send(categoryItems);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

app.get("/:category/:item", async (req, res) => {
	const { category, item } = req.params;
	try {
		const itemInCategory = await db
			.collection("stock")
			.findOne({ category, name: item });
		return res.status(200).send(itemInCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
