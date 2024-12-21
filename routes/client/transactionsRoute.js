const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/transactions_controller")
const MiddlewareAuth = require("../../middlewares/client/auth")

router.get("/",MiddlewareAuth.requireAuth, controller.getTransactionsController)

module.exports = router