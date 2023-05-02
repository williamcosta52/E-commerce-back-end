import { Router } from "express";
import lojaRouter from "./loja.routes.js"
import usuarioRouter from "./usuario.routes.js"
import cartRouter from "./cart.routes.js"
import adminRouter from "./admin.routes.js"

const router = Router()

router.use(usuarioRouter)
router.use(lojaRouter)
router.use(cartRouter)
router.use(adminRouter)

export default router