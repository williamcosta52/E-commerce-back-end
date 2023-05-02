import { Router } from "express";


import { pegarCategorias, pegarEstoque, pegarItemEspecifico, pegarItensDaCategorias, postarItemEstoque } from "../controllers/loja.controllers.js";


const lojaRouter = Router()


lojaRouter.post("/van/stock", postarItemEstoque);

lojaRouter.get("/van/stock", pegarEstoque);


lojaRouter.get("/categories", pegarCategorias);


lojaRouter.get("/categoria/:category", pegarItensDaCategorias);


lojaRouter.get("/:category/:item", pegarItemEspecifico);

export default lojaRouter