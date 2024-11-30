const EWallet = require("../../model/E-wallets")
require('dotenv').config();
const secret = process.env.JWT_SECRET
const jwt = require("jsonwebtoken");
const Field = require("../../model/Field");
const Account = require("../../model/Account");
const History = require("../../model/History");
const payOS = require('../../payos');
const Transaction = require('../../model/Transaction');


const checkTransactionStatus = async (orderCode, retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    const transaction = await Transaction.findOne({ orderCode });
    if (transaction && transaction.status === 'success') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delay)); // Chờ trước khi kiểm tra lại
  }
  return false;
};

module.exports.eWalletController = async (req, res) => {
  const account = res.locals.account
  const ewallet = await EWallet.findOne({
    accountId: account.id
  })
  res.json({
    "code": "success",
    "msg": "lấy ví điện tử thành công",
    "ewallet": ewallet
  })
}
module.exports.ReceiveHookController = async (req, res) => {
  try {
    const { orderCode, status } = req.body; // Dữ liệu từ PayOS

    // Tìm giao dịch dựa trên orderCode
    const transaction = await Transaction.findOne({ orderCode });
    if (!transaction) {
      console.log('Transaction not found:', orderCode);
      return res.status(404).json({ code: 'error', msg: 'Transaction not found' });
    }

    // Cập nhật trạng thái giao dịch
    transaction.status = status === 'success' ? 'success' : 'failed';
    await transaction.save();

    console.log('Transaction updated:', transaction);

    // Trả về kết quả cho PayOS
    res.json({ code: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 'error', msg: 'Internal server error' });
  }
};
// module.exports.PaymentController = async (req, res) => {

//     const body = {
//         orderCode: Number(String(Date.now()).slice(-6)),
//         amount: 10000,
//         description: 'Thanh toan don hang',
//         returnUrl: ``,
//         cancelUrl: ``
//     };
//     try {
//         const paymentLinkResponse = await payOS.createPaymentLink(body);
//         res.redirect(paymentLinkResponse.checkoutUrl);  
//         console.log("PaymentLinkResponse: ", paymentLinkResponse.checkoutUrl)
        
//     } catch (error) {
//         console.error(error);
//         res.send('Something went error');
//     }
// }



module.exports.PaymentController = async (req, res) => {
  switch (req.body.type) {
    case "add":
    const accountId = res.locals.account.id;
    const orderCode = Number(String(Date.now()).slice(-6));
    const amount = parseInt(req.body.amount);
    const transaction = await Transaction.create({
      accountId,
      orderCode,
      amount,
      status: 'pending',
    });

    // Tạo liên kết thanh toán
    const body = {
      orderCode,
      amount,
      description: 'Thanh toán đơn hàng',
      returnUrl: '',
      cancelUrl: '',
    };
    
    const paymentLinkResponse = await payOS.createPaymentLink(body);
    console.log('PaymentLinkResponse:', paymentLinkResponse.checkoutUrl);

    // Chuyển hướng người dùng đến trang thanh toán
    res.redirect(paymentLinkResponse.checkoutUrl);

    // Kiểm tra trạng thái giao dịch (polling)
    const success = await checkTransactionStatus(orderCode);

      if (success) {
      // Cập nhật số dư ví
      await EWallet.updateOne(
        { accountId },
        { $inc: { balance: amount } }
      );
      return res.json({
        code: 'success',
        msg: 'Nạp tiền thành công',
      });
    } else {
      return res.json({
        code: 'error',
        msg: 'Giao dịch thất bại hoặc hết thời gian chờ',
      });
    }

    case "sub":
      const eWallet = await EWallet.findOne({
        accountId: res.locals.account.id
      })
      if (eWallet.balance < parseInt(req.body.value)) {
        return res.json({
          "code": "error",
          "msg": "Không đủ số dư"
        })
      }
      await EWallet.updateOne({
        accountId: res.locals.account.id
      }, {
        $inc: {
          balance: -parseInt(req.body.value)
        }
      })
      return res.json({
        "code": "success",
        "msg": "Thanh toán thành công"
      })

    default:
      break;
  }

  return res.json({
    "code": "error",
    "msg": "lỗi ví điện tử"
  })
}




// module.exports.getEWalletController = async (req, res) => {
//   try{
//     const authHeader = req.headers['authorization'];
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(400).json({
//         "code": "error",
//         "msg": "Vui lòng cung cấp token hợp lệ trong header Authorization"
//       });
//     }

//     // Lấy token sau 'Bearer ' trong header
//     const token = authHeader.split(' ')[1];
//     if (!req.query.amount) {
//       res.json({
//         "code": "error",
//         "msg": "vui long nhap so tien"
//       });
//     }
//     const amount = parseInt(req.query.amount)
//     if (isNaN(amount)) {
//       return res.json({
//         code: "error",
//         msg: "Số tiền không hợp lệ. Vui lòng nhập số tiền hợp lệ.",
//       });
//     }
//     jwt.verify(token, secret, async (err, decoded) => {
//       if (err) {
//         res.status(401).json({
//           "code": "error",
//           "msg": "Token không hợp lệ"
//         });
//         return 
//       } else {
//         console.log("decoded");
//         await EWallet.updateOne({
//           "accountId": res.locals.account.id 
//         }, {
//           $inc: {
//             balance: amount
//           } 
//         })
//         const ewallet = await EWallet.findOne({
//           "accountId": res.locals.account.id 
//         })
//         res.json({
//           "code": "success",
//           "msg": "Nap tien thanh cong"
//         })
//         const data = {
//           accountId: res.locals.account.id ,
//           transaction: "Nap",
//           amount: amount,
//           balance: ewallet.balance,
//           historyId: ""
//         }
//         const record = new Field(data)
//         await record.save()
//       }
//     });
//   }catch(error){
//     res.json({
//       "code": "error",
//       "msg": error
//     })
//   }
// }

module.exports.postBuyPaper = async (req, res) => {
  if(!req.body.balancePaper){
    res.json({
      "code": "error",
      "msg": "vui long nhap so tien"
    });
    return
  }
  const balancePaper = parseInt(req.body.balancePaper)
  console.log(balancePaper)
  if (isNaN(balancePaper) || balancePaper <= 0) {
    return res.json({
      code: "error",
      msg: "Số giấy không hợp lệ",
    });
  }
  const eWallet = await EWallet.findOne({
    "accountId": res.locals.account.id
  })
  if(!eWallet){
    return res.json({
      code: "error",
      msg: "ewallet loi",
    });
  }
  if(balancePaper*500 > eWallet.balance){
    return res.json({
      code: "error",
      msg: "ban khong du tien",
    });
  }os
  const balanceNew = eWallet.balance - balancePaper*500
  await EWallet.updateOne({
    "_id": eWallet.id
  }, {
    balance: balanceNew,
    balancePaper: eWallet.balancePaper + balancePaper
  })
  const record = new Field({
    "accountId": res.locals.account.id,
    "transaction": "Buy paper",
    "amount": balancePaper*500,
    "balance": balanceNew,
    "historyId": "",
  })
  await record.save()
  res.json({
    "code": "success",
    "msg": "Mua giay thanh cong"
  })
}




