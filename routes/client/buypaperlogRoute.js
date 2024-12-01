const express = require("express")
const router = express.Router()
const controller = require("../../controller/client/buypaperlog_controller")

router.get("/", controller.getBuyPaperLogController)

module.exports = router