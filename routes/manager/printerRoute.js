
const express = require("express")

const router = express.Router()

const controller = require("../../controller/manager/printer_controller")

router.get("/all", controller.getPrintStatusController)
router.get("/:id", controller.getDetailController)
router.post("/create", controller.postPrintController)
router.patch("/changeStatusByIds", controller.changeStatusByIds)
router.patch("/changePrinterInfoByID/:id", controller.changePrinterInfoByID)
router.delete("/delete/:id", controller.deletePrinterController)
module.exports = router


