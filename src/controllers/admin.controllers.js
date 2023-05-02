import {db} from "../database/database.connection.js"


export async function verQuemTemCadastro(req, res){ //VE OS CADASTRADOS
	
	try {
		const users = await db.collection("users").find().toArray();
		return res.status(200).send(users);
	} catch (err) {
		res.status(500).send(err.message);
	}
}

export async function deletarCadastroPorEmail(req, res){ //DELETA CADASTRADO POR EMAIL
	const { email } = req.params;
	try {
		const deleted = await db.collection("users").deleteOne({ email });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res.status(200).send(`Participante com email ${email} deletado com sucesso!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
}


export async function mostrarLogados(req, res){ //MOSTRA OS USUARIOS LOGADOS
	try {
		const usersLogins = await db.collection("sessions").find().toArray();
		return res.status(200).send(usersLogins);
	} catch (err) {
		res.status(500).send(err.message);
	}
}

export async function deletarDoEstoquePorNome(req, res){  //RETIRA ITEM DO ESTOQUE POR NOME
	const { name } = req.params;
	try {
		const deleted = await db.collection("stock").deleteOne({ name });
		if (deleted.deletedCount === 0)
			return res.status(404).send("Esse item não existe!");
		return res.status(200).send(`Item ${name} retirado do estoque!`);
	} catch (err) {
		res.status(500).send(err.message);
	}
}


export async function deletarCategoriaComItens(req, res){ //APAGA CATEGORIA E OS ITENS NELA
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
}