const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/printer_controller")
const MiddlewareAuth = require("../../middlewares/client/auth")
router.get("/",MiddlewareAuth.requireAuth, controller.printerController)
router.get("/:id",MiddlewareAuth.requireAuth, controller.getDetailController)
router.post("/",MiddlewareAuth.requireAuth, controller.postPrinterController)

module.exports = router