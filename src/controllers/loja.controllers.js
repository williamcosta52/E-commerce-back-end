import joi from "joi"
import {db} from "../database/database.connection.js"

export async function postarItemEstoque(req, res){  //ADMIN POSTAR ITEM AO ESTOQUE
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
}

export async function pegarEstoque(req, res){  //MOSTRA TODOS OS ITENS
	try {
		const stock = await db.collection("stock").find().toArray();
		return res.status(200).send(stock);
	} catch (err) {
		res.status(500).send(err.message);
	}
}

export async function pegarCategorias(req, res){ //PEGA TODAS AS CATEGORIAS DO ESTOQUE
	try {
		const categories = await db.collection("categories").find().toArray();
		return res.status(200).send(categories);
	} catch (err) {
		res.status(500).send(err.message);
	}
}



export async function pegarItensDaCategorias(req, res){  //PEGA OS ITEMS DE UMA CATEGORIA
	const { category } = req.params;
	try {
		const categoryItems = await db.collection("stock").find({ category: category }).toArray();
		return res.status(200).send(categoryItems);
	} catch (err) {
		res.status(500).send(err.message);
	}
}

export async function pegarItemEspecifico(req, res){  //PEGA ITEM EM ESPECÍFICO
	const { category, item } = req.params;
	try {
		const itemInCategory = await db.collection("stock").findOne({ category, name: item });
		return res.status(200).send(itemInCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
}