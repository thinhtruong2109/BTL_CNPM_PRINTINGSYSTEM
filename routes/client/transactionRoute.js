const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/transaction_controller")
const MiddlewareAuth = require("../../middlewares/client/auth")

router.get("/", MiddlewareAuth.requireAuth ,controller.TransactionController)
module.exports = router