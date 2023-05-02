import {db} from "../database/database.connection.js"
import joi from "joi"
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";



export async function postarCadastro(req, res){ //POSTAR CADASTRO
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
}


export async function postarLogin(req, res){ //FAZ O LOGIN
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
}