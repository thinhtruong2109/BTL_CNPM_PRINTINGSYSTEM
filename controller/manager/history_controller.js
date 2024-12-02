const History = require("../../model/History")

module.exports.getHistoryController = async(req, res) => {
  const find = {}
  if(req.query.status){
    find.status = req.query.status
  }
  if(req.query.cs){
    find.cs = req.query.cs
  }
  if(req.query.location){
    find.location = req.query.location
  }
  if(req.query.id){
    find._id = req.query.id
  }
  if(req.query.accountId){
    find.accountId = req.query.accountId
  }
  const historys = await History.find(find)
  res.json({
    "code": "success",
    "historys": historys
  })
}


module.exports.getHistoryByMonthYearController = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Kiểm tra giá trị year
    if (!year || year < 1) {
      return res.status(400).json({
        code: "error",
        msg: "Year is required and must be a positive number."
      });
    }

    // Tạo khoảng thời gian dựa trên month và year
    let startDate, endDate;
    if (month === 0) {
      // Lấy toàn bộ lịch sử của cả năm
      startDate = new Date(year, 0, 1, 0, 0, 0, 0); // Ngày 1/1 của năm đó
      endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0); // Ngày 1/1 của năm tiếp theo
    } else if (month >= 1 && month <= 12) {
      // Lấy lịch sử của một tháng cụ thể
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0); // Ngày đầu tháng
      endDate = new Date(year, month, 1, 0, 0, 0, 0); // Ngày đầu tháng tiếp theo
    } else {
      return res.status(400).json({
        code: "error",
        msg: "Month must be between 0 and 12."
      });
    }

    // Tìm dữ liệu trong khoảng thời gian
    const histories = await History.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    res.json({
      code: "success",
      msg: "Lấy lịch sử thành công.",
      histories
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      code: "error",
      msg: "Đã xảy ra lỗi khi lấy lịch sử.",
    });
  }
};

