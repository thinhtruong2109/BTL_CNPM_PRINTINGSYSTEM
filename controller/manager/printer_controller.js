const Printer = require("../../model/Printer")

module.exports.postPrintController = async (req, res) => {
  const newPrint = req.body
  const record = new Printer(newPrint)
  await record.save()
  res.json({
    code: "success",
    msg: "Tạo máy in thành công",
  })
} 

module.exports.getPrintStatusController = async (req, res) => {
  find = {
    deleted: false,
  }
  sort = {}
  if(req.query.cs){
    find.cs = parseInt(req.query.cs)
  }
  const printer = await Printer.find(find).sort(sort)
  res.json({
    code: "success",
    msg: "Lấy máy in thành công",
    printer: printer
  })
}


module.exports.getDetailController = async (req, res) => {
  const id = req.params.id
  if(!id){
    res.json({
      "code": "error",
      "msg": "Chưa có ID máy in"
    })
  }
  const printer = await Printer.findOne({
    "_id": id
  })
  res.json({
    "code": "error",
    "msg": "Lấy thành công máy in",
    "printer": printer
  })
}

module.exports.changeStatusByIds = async (req, res) => {
  IDs = req.body.ids
  await Printer.updateMany({
    "_id": IDs,
  }, {
    "status": req.body.status
  })
  res.json({
    "code": "success",
    "msg": "Cập nhật thành công"
  })
}

module.exports.changePrinterInfoByID = async (req, res) => {
  const id = req.params.id
  if(!id){
    res.json({
      "code": "error",
      "msg": "ID không tồn tại"
    })
    return
  }
  await Printer.updateOne({
    "_id": id
  }, req.body)
  res.json({
    "code": "success",
    "msg": "Update máy in thanh công"
  })
}

module.exports.deletePrinterController = async (req, res) => {
  const id = req.params.id
  if(!id){
    res.json({
      "code": "error",
      "msg": "Không có ID"
    })
    return
  }
  await Printer.deleteOne({
    "_id": id
  })
  res.json({
    "code": "success",
    "msg": "Xóa máy in thành công"
  })
}
