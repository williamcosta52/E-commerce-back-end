import { Router } from "express";
import { deletarCadastroPorEmail, deletarCategoriaComItens, deletarDoEstoquePorNome, mostrarLogados, verQuemTemCadastro } from "../controllers/admin.controllers.js";

const adminRouter = Router()

adminRouter.get("/signup", verQuemTemCadastro);
adminRouter.delete("/signup/:email", deletarCadastroPorEmail);
adminRouter.get("/login", mostrarLogados);
adminRouter.delete("/van/stock/:name", deletarDoEstoquePorNome );
adminRouter.delete("/categories/:category", deletarCategoriaComItens);

export default adminRouter