const EWallet = require("../../model/E-wallets");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Field = require("../../model/Field");
const Account = require("../../model/Account");
const History = require("../../model/History");
const payOS = require("../../payos");
const Transaction = require("../../model/Transaction");

const secret = process.env.JWT_SECRET;

// Lấy thông tin ví điện tử
module.exports.eWalletController = async (req, res) => {
  try {
    const account = res.locals.account;
    const ewallet = await EWallet.findOne({ accountId: account.id });

    if (!ewallet) {
      return res.status(404).json({
        code: "error",
        msg: "Không tìm thấy ví điện tử",
      });
    }

    return res.json({
      code: "success",
      msg: "Lấy ví điện tử thành công",
      ewallet,
    });
  } catch (error) {
    console.error("Lỗi trong eWalletController:", error);
    return res.status(500).json({
      code: "error",
      msg: "Lỗi máy chủ",
    });
  }
};

// Kiểm tra trạng thái giao dịch
const checkTransactionStatus = async (orderCode, retries = 100, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const transaction = await Transaction.findOne({ orderCode });
      if (transaction && transaction.status === "success") {
        return true;
      }
    } catch (error) {
      console.error(`Lỗi khi kiểm tra giao dịch (${orderCode}):`, error);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
};

// Xử lý hook từ PayOS
module.exports.ReceiveHookController = async (req, res) => {
  try {
    console.log("ReceiveHookController được gọi");
    const orderCode = req.body?.data?.orderCode;
    const status = req.body?.success ? "success" : "failed";

    const transaction = await Transaction.findOne({ orderCode });
    if (!transaction) {
      console.log("Không tìm thấy giao dịch:", orderCode);
      return res.status(404).json({
        code: "error",
        msg: "Giao dịch không tồn tại",
      });
    }

    transaction.status = status;
    await transaction.save();
    console.log("Giao dịch đã được cập nhật:", transaction);

    return res.status(200).json({
      code: "success",
      msg: "Trạng thái giao dịch được cập nhật",
    });
  } catch (error) {
    console.error("Lỗi trong ReceiveHookController:", error);
    return res.status(500).json({
      code: "error",
      msg: "Lỗi máy chủ",
    });
  }
};

// Xử lý thanh toán
module.exports.PaymentController = async (req, res) => {
  try {
    const accountId = res.locals.account.id;

    switch (req.body.type) {
      case "add": {
        const orderCode = Number(String(Date.now()).slice(-6)); // Tạo mã giao dịch ngẫu nhiên
        const amount = +req.body.amount;

        if (amount <= 0) {
          return res.status(400).json({
            code: "error",
            msg: "Số tiền không hợp lệ",
          });
        }

        // Tạo giao dịch mới
        const transaction = await Transaction.create({
          accountId,
          orderCode,
          amount,
          status: "pending",
        });

        const body = {
          orderCode,
          amount,
          description: "Nạp tiền vào ví",
          returnUrl: "hello.html",
          cancelUrl: "hello.html",
        };

        // Tạo liên kết thanh toán qua PayOS
        const paymentLinkResponse = await payOS.createPaymentLink(body);
        console.log("PaymentLinkResponse:", paymentLinkResponse.checkoutUrl);

        // Chuyển hướng người dùng đến trang thanh toán
        res.redirect(paymentLinkResponse.checkoutUrl);

        // Kiểm tra trạng thái giao dịch (polling)
        const success = await checkTransactionStatus(orderCode);

        if (success) {
          // Cập nhật số dư ví nếu giao dịch thành công
          await EWallet.updateOne(
            { accountId },
            { $inc: { balance: amount } }
          );

          console.log(`Nạp tiền thành công: ${amount} vào tài khoản ${accountId}`);
        } else {
          console.error(`Giao dịch ${orderCode} thất bại.`);
        }

        return; // Kết thúc hàm sau khi xử lý xong
      }

      case "sub": {
        const eWallet = await EWallet.findOne({ accountId });

        if (!eWallet || eWallet.balance < parseInt(req.body.amount)) {
          return res.json({
            code: "error",
            msg: "Không đủ số dư",
          });
        }

        await EWallet.updateOne(
          { accountId },
          { $inc: { balance: -parseInt(req.body.amount) } }
        );

        return res.json({
          code: "success",
          msg: "Thanh toán thành công",
        });
      }

      default:
        return res.json({
          code: "error",
          msg: "Loại giao dịch không hợp lệ",
        });
    }
  } catch (error) {
    console.error("Lỗi trong PaymentController:", error);
    return res.status(500).json({
      code: "error",
      msg: "Lỗi máy chủ",
    });
  }
};


// Mua giấy
module.exports.postBuyPaper = async (req, res) => {
  try {
    const balancePaper = parseInt(req.body.balancePaper);

    if (isNaN(balancePaper) || balancePaper <= 0) {
      return res.json({
        code: "error",
        msg: "Số giấy không hợp lệ",
      });
    }

    const eWallet = await EWallet.findOne({ accountId: res.locals.account.id });

    if (!eWallet) {
      return res.json({
        code: "error",
        msg: "Không tìm thấy ví điện tử",
      });
    }

    if (balancePaper * 500 > eWallet.balance) {
      return res.json({
        code: "error",
        msg: "Không đủ tiền",
      });
    }

    const balanceNew = eWallet.balance - balancePaper * 500;

    await EWallet.updateOne(
      { _id: eWallet.id },
      { balance: balanceNew, balancePaper: eWallet.balancePaper + balancePaper }
    );

    const record = new Field({
      accountId: res.locals.account.id,
      transaction: "Mua giấy",
      amount: balancePaper * 500,
      balance: balanceNew,
      balancePaper: balancePaper,
      historyId: "",
    });

    await record.save();

    return res.json({
      code: "success",
      msg: "Mua giấy thành công",
    });
  } catch (error) {
    console.error("Lỗi trong postBuyPaper:", error);
    return res.status(500).json({
      code: "error",
      msg: "Lỗi máy chủ",
    });
  }
};
