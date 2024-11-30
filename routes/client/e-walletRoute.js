const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/e-wallet_controller")


router.get("/", controller.eWalletController)
router.patch("/change", controller.PaymentController)
// router.get("/change", controller.getEWalletController)
router.post("/buy", controller.postBuyPaper)
// router.post("/create-payment-link", controller.PaymentController)
router.post("/receive-hook", controller.ReceiveHookController)
module.exports = router

