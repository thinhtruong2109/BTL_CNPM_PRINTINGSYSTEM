const Transaction = require("../../model/Transaction");// Đường dẫn tới model Transaction của bạn


module.exports.TransactionController = async (req, res) => {
    try {
        // Lấy accountId từ res.locals.account.id
        const accountId = res.locals.account.id;
    
        if (!accountId) {
          return res.status(400).json({ error: 'Account ID is required.' });
        }
    
        // Tìm tất cả các transaction có accountId khớp
        const transactions = await Transaction.find({ accountId });
    
        // Trả về danh sách transaction
        res.status(200).json({
          success: true,
          data: transactions,
        });
      } catch (error) {
        // Xử lý lỗi
        console.error('Error fetching transactions:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
  };
