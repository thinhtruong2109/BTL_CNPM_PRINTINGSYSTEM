const Transaction = require("../../model/Transaction");
module.exports.getTransactionsController = async (req, res) => {
    try {
      const transactions = await Transaction.find({
        accountId: res.locals.account.id,
      }).sort({
        updatedAt: 1,
      });
  
      res.json({
        code: "success",
        msg: "Lấy lịch sử giao dịch thành công",
        transactions,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: "error",
        msg: "Đã xảy ra lỗi khi lấy danh sách lịch sử giao dịch",
      });
    }
  };