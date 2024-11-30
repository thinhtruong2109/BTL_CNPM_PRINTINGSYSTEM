const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/e-wallet_controller")
const MiddlewareAuth = require("../../middlewares/client/auth")

router.get("/", MiddlewareAuth.requireAuth ,controller.eWalletController)
router.patch("/change", MiddlewareAuth.requireAuth, controller.PaymentController)
// router.get("/change", controller.getEWalletController)
router.post("/buy", MiddlewareAuth.requireAuth, controller.postBuyPaper)
// router.post("/create-payment-link", controller.PaymentController)
router.post("/receive-hook", controller.ReceiveHookController)
module.exports = router

