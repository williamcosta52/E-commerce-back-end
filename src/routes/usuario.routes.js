import { Router } from "express";
import { postarCadastro, postarLogin } from "../controllers/usuario.controllers.js";


const usuarioRouter = Router()

usuarioRouter.post("/signup", postarCadastro);

usuarioRouter.post("/login", postarLogin);

export default usuarioRouter