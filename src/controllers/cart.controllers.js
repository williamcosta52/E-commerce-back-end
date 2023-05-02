import {db} from "../database/database.connection.js"


export async function adicionarAoCarrinho(req, res){  //ADICIONA ITENS AO CARRINHO DO USUARIO DE ACORDO COM O TOKEN

    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '')

	if (!token) return res.status(401).send(`Faça login para adicionar itens ao carrinho`);
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
}


export async function pegarCarrinho(req, res){ //LISTA OS ITENS DO CARRINHO DO USUARIO DE ACOROD COM O TOKEN
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '')
	if (!token) return res.status(401).send(`Faça login para ver o seu carrinho`);
    try{
        const thisUser = await db.collection("sessions").findOne({token})
        const cartShow = await db.collection("userCart").find({idUser: thisUser.idUser}).toArray()
        return res.status(200).send(cartShow)
    }catch (err) {
		res.status(500).send(err.message);
	}
}

export async function  tirarDoCarrinho(req, res){
    const { id } = req.params;
	const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '')
		try{
			const thisUser = await db.collection("sessions").findOne({token})
			const deleteItem= await db.collection("userCart").deleteOne({idUser: thisUser.idUser, _id: new ObjectId(id)})
			return res.status(200).send(`${deleteItem.deletedCount} item deletado do carrinho`)
    }
    catch (err) {
		res.status(500).send(err.message);
	}
}