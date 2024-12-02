const Printer = require("../../model/Printer")
const Account = require("../../model/Account")
const EWallet = require("../../model/E-wallets")
const File = require("../../model/File")
const History = require("../../model/History")
const Field = require("../../model/Field")


module.exports.printerController = async (req, res) => {
  find = {
    deleted: false,
    status: "active"
  }
  sort = {}
  if(req.query.cs){
    find.cs = parseInt(req.query.cs)
  }
  if(req.query.price){
    sort.price = parseInt(req.query.price)
  }
  const printer = await Printer.find(find).sort(sort)
  res.json({
    listPrinter: printer
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

module.exports.postPrinterController = async (req, res) => {
  const PrinterId = req.body.printerId
  const FileId = req.body.fileId
  const file = await File.findOne({
    "_id": FileId
  })
  if(!file){
    res.json({
      "code": "error",
      "msg": "Không tìm thấy file"
    })
    return
  }
  const printer = await Printer.findOne({
    "_id": PrinterId,
    "deleted": false,
    "status": "active"
  })
  if (!printer){
    res.json({
      "code": "error",
      "msg": "Không tìm thấy máy in"
    })
    return
  }
  const account  = res.locals.account
  const eWallet = await EWallet.findOne({
    accountId: account.id
  })
  if (!eWallet) {
    res.json({
      "code": "error",
      "msg": "Không tìm thấy e-wallet"
    })
    return
  }
  let paper = parseInt((file.pages + 1)/2)
  if(printer.type == "A3"){
    paper = file.pages
  }
  if(eWallet.balancePaper < paper){
    res.json({
      "code": "error",
      "msg": "Không đủ Token Paper để in"
    })
    return
  }
  balancePaperNew = eWallet.balancePaper - paper
  await EWallet.updateOne({
    "_id": eWallet.id
  }, {
    balancePaper: balancePaperNew
  })
  res.json({
    "code": "success",
    "msg": "Bạn đã in thành công",
    "balancePaper": balancePaperNew
  })
  const dataHistory = {
    accountId: account.id,
    cs: printer.cs,
    location: printer.location,
    pages: file.pages,
    total: paper,
    balancePaperNew: balancePaperNew,
    linkPath: file.linkPath,
    status: "doing",
    printerId: printer.id
  }
  const record = new History(dataHistory)
  await record.save()
}