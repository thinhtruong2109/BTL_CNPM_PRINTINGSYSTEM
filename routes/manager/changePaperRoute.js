const express = require("express")
const router = express.Router()
const controller = require("../../controller/manager/changePaper_controller")

router.post("/updatePaperNumber", controller.changePaperController)
router.post("/updateTime", controller.changeUpdateTimeController)

module.exports = router