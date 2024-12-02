const History = require("../../model/History")

module.exports.getHistoryController = async (req, res) => {
  const account = res.locals.account
  historys = await History.find({
    "accountId": account.id
  })
  res.json({
    "code": "success",
    "msg": "Lấy thành công lịch sử in",
    "historys": historys
  })
}


