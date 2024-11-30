const express = require("express")
const router = express.Router()
const controller = require("../../controller/manager/account_controller")
const middlewares = require("../../middlewares/manager/auth")
router.post("/login", controller.loginController)
router.get("/account", middlewares.requireAuth, controller.getAccountController)
router.get("/accountStudent/:id", middlewares.requireAuth, controller.getAccountStudentController)
router.get("/accountAllStudent", middlewares.requireAuth, controller.getAllAccountController)
module.exports = router