const BuyPaperLog = require("../../model/BuyPaperLog");

module.exports.getBuyPaperLogController = async (req, res) => {
  const account = res.locals.account
  const buypaperlog = await BuyPaperLog.find({"accountId": account.id})
  res.json({
    "code": "success",
    "msg": "lay buypaperlog thanh cong",
    "buypaperlog": buypaperlog
  })
}
