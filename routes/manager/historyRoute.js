const express = require("express")

const router = express.Router()
const controller = require("../../controller/manager/history_controller")

router.get("/", controller.getHistoryController)
router.get("/log", controller.getHistoryByMonthYearController);

module.exports = router