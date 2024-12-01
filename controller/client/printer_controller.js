const Printer = require("../../model/Printer")
const Account = require("../../model/Account")
const EWallet = require("../../model/E-wallets")
const File = require("../../model/File")
const History = require("../../model/History")
const BuyPaperLog = require("../../model/BuyPaperLog");


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
      "msg": "chua co id"
    })
  }
  const printer = await Printer.findOne({
    "_id": id
  })
  res.json({
    "code": "error",
    "msg": "lay thong cong may in",
    "printer": printer
  })
}

module.exports.postPrinterController = async (req, res) => {
  const PrinterId = req.body.printerId
  const FileId = req.body.fileId
  const PrintingSize = req.body.printingSize
  const file = await File.findOne({
    "_id": FileId
  })
  if(!file){
    res.json({
      "code": "error",
      "msg": "không tìm thấy file"
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
      "msg": "không tìm thấy may in"
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
      "msg": "Khong tim thay e-wallet"
    })
    return
  }

  let paper =0;


  if(printer.type == "A3"){
    if(PrintingSize== "A3")
      {
        paper = parseInt((file.pages + 1)/2)
        paper = paper * 2
      }
    if(PrintingSize== "A4")
      {
        paper = parseInt((file.pages + 3)/4)
        paper = paper * 2
      }
    if(eWallet.balancePaper < paper){
      res.json({
        "code": "error",
        "msg": "Bạn nghèo tôi cũng nghèo cố gắng nạp tiền vào để in nhe"
      })
      return
    }
  }


  if(printer.type == "A4"){
    paper = parseInt((file.pages + 1)/2)
    if(PrintingSize== "A3")
    {
      res.json({
        "code": "error",
        "msg": "Máy in khổ A4 không hỗ trợ in khổ A3"
      })
      return
    }
    if(eWallet.balancePaper < paper){
      res.json({
        "code": "error",
        "msg": "Bạn nghèo tôi cũng nghèo cố gắng nạp tiền vào để in nhe"
      })
      return
    }
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
    totle: paper,
    balancePaperNew: balancePaperNew,
    linkPath: file.link,
    status: "doing",
    printerId: printer.id
  }
  const record = new History(dataHistory)
  await record.save()
}