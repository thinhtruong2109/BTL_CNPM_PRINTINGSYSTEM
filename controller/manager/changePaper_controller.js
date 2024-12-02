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
var updateTimebyMonth = 1;
let currentCronJob = null;
module.exports.changeUpdateTimeController = async (req , res) => {
    updateTimebyMonth = req.body.months
    startCronJob(updateTimebyMonth,incrementPaperNum)
    res.json({
        "code": "success",
        "msg": "Thay doi gia tri thoi gian thanh cong"
      })
    
}

module.exports.changePaperController = async (req, res) => {
    incrementPaperNum = req.body.number
    startCronJob(updateTimebyMonth,incrementPaperNum)
    res.json({
        "code": "success",
        "msg": "Thay doi gia tri giay free mac dinh thanh cong"
      })
}



// Định nghĩa cron job (chạy mỗi phút, thay đổi lịch nếu cần)
const startCronJob = (updateTimebyMonth, incrementPaperNum) => {
    // Nếu đã có cronJob đang chạy, hủy nó
    if (currentCronJob) {
      currentCronJob.stop();
      console.log("CronJob cũ đã được dừng.");
    }
  
    // Khởi tạo cronJob mới
    currentCronJob = cron.schedule(`*/${updateTimebyMonth} * * * * *`, async () => {
      try {
        const incrementAmount = incrementPaperNum;
        const updatedWallets = await EWallet.updateMany(
          {}, // Điều kiện (áp dụng cho tất cả các ví)
          { $inc: { balancePaper: incrementAmount } } // Tăng giá trị balancePaper
        );
        console.log(`${updatedWallets.modifiedCount} ví đã được cập nhật.`);
        console.log(`Thời gian cập nhật mỗi ${updateTimebyMonth} giây.`);
        console.log(`Số lượng giấy cập nhật là ${incrementAmount} tờ.`);
      } catch (error) {
        console.error("Lỗi khi cập nhật ví:", error);
      }
    });
  
    console.log(`CronJob mới được khởi động, chạy mỗi ${updateTimebyMonth} tháng.`);
};
