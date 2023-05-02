import { Router } from "express"
import { adicionarAoCarrinho, pegarCarrinho, tirarDoCarrinho } from "../controllers/cart.controllers.js";


const cartRouter = Router()



cartRouter.post("/home/cart", adicionarAoCarrinho)


cartRouter.get("/home/cart/show", pegarCarrinho )

cartRouter.delete("/home/cart/delete/:id", tirarDoCarrinho)

export default cartRouter