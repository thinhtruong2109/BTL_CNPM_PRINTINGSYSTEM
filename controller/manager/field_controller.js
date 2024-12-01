const BuyPaperLog = require("../../model/BuyPaperLog");
const { find } = require("../../model/Printer")

module.exports.getFieldController = async (req, res) => {
  const find = {}
  if(req.query.id){
    find._id = req.query.id
  }
  if(req.query.transaction){
    find.transaction = req.query.transaction
  }
  const buypaperlog = await BuyPaperLog.find(find)
  res.json({
    "code":"success",
    "msg": "Lấy buypaperlog thành công",
    "buypaperlog": buypaperlog,
  })
}