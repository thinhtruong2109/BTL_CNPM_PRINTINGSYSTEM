const cron = require('node-cron');
const EWallet = require("../../model/E-wallets");

// *    *    *    *    *    *
// |    |    |    |    |    +-- Ngày trong tuần (0 - 7)
// |    |    |    |    +------- Tháng (1 - 12)
// |    |    |    +----------- Ngày trong tháng (1 - 31)
// |    |    +--------------- Giờ (0 - 23)
// |    +------------------- Phút (0 - 59)
// +----------------------- Giây (0 - 59)


var incrementPaperNum = 0;


module.exports.changePaperController = async (req, res) => {
    incrementPaperNum = req.body.number
    res.json({
        "code": "success",
        "msg": "Thay doi gia tri giay free mac dinh thanh cong"
      })
}


// Định nghĩa cron job (chạy mỗi phút, thay đổi lịch nếu cần)
cron.schedule('* * * */30 * *', async () => {
  try {
    const incrementAmount = incrementPaperNum; // Số tiền sẽ cộng vào balancePaper
    const updatedWallets = await EWallet.updateMany(
      {}, // Điều kiện (áp dụng cho tất cả các ví, có thể thêm điều kiện khác nếu cần)
      { $inc: { balancePaper: incrementAmount } } // Tăng giá trị balancePaper
    );
    console.log(`${updatedWallets.modifiedCount} ví đã được cập nhật.`);
  } catch (error) {
    console.error('Lỗi khi cập nhật ví:', error);
  }
});
