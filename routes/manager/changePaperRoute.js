const express = require("express")
const router = express.Router()
const controller = require("../../controller/manager/changePaper_controller")

router.post("/", controller.changePaperController)

module.exports = router