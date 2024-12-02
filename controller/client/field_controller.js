const Field = require("../../model/Field")

module.exports.getFieldController = async (req, res) => {
  const account = res.locals.account
  const field = await Field.find({"accountId": account.id})
  res.json({
    "code": "success",
    "msg": "Lấy lịch sử mua giấy thành công",
    "field": field
  })
}
