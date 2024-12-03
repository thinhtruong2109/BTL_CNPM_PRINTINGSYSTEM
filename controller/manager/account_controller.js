const md5 = require("md5")
const Account = require("../../model/Account")
const jwt = require("jsonwebtoken")
require('dotenv').config();
const secret = process.env.JWT_SECRET

const getMaxMsByPrefix = async () => {
  const result = await Account.aggregate([
    {
      $match: {
        ms: { $regex: /^(SV|AD)\d+$/ } // Lọc các giá trị ms hợp lệ
      }
    },
    {
      $project: {
        prefix: { $substr: ["$ms", 0, 2] }, // Lấy 2 ký tự đầu (tiền tố)
        number: { $toInt: { $substr: ["$ms", 2, -1] } } // Chuyển phần số còn lại thành số
      }
    },
    {
      $group: {
        _id: "$prefix", // Nhóm theo tiền tố
        maxNumber: { $max: "$number" } // Lấy số lớn nhất trong từng nhóm
      }
    }
  ]);

  const maxMs = {
    SV: 0, // Mặc định là 0 nếu không tìm thấy
    AD: 0
  };

  result.forEach((item) => {
    maxMs[item._id] = item.maxNumber;
  });

  return maxMs;
};


module.exports.loginController = async (req, res) => {
  const userAgent = req.headers['user-agent'];
  if(!userAgent){
    res.json({
      "code": "error",
      "msg": "Không có USER_AGENT"
    })
    return
  }
  const email = req.body.email
  const password = req.body.password
  const account = await Account.findOne({
    email: email
  })
  if(!email){
    res.json({
      code: "Email không tồn tại"
    })
    return
  }
  if (account.role != "manager"){
    res.json({
      code: "Role không tồn tại"
    })
    return
  }

  if(!account){
    res.json({
      code: "Account không tồn tại"
    })
    return
  }
  if(md5(password) != account.password){
    res.json({
      code: "Mật khẩu không chính xác"
    })
    return
  }
  const token = jwt.sign(
  {
    accountToken: {
      "id": account.id,
      "email": account.email,
      "role": account.role,
      "key": md5(userAgent)
    }
  }, secret, { expiresIn: '30m' });
  const rftoken = jwt.sign(
  {
    token: token,
    id: account.id
  }, secret, { expiresIn: '168h' });
  res.json({
    code: "success",
    role: account.role,
    token: token,
    rftoken: rftoken
  })
}

module.exports.RegisterController = async (req, res) => {
  const userAgent = req.headers['user-agent'];
  if(!userAgent){
    res.json({
      "code": "error",
      "msg": "Không hợp lệ"
    })
  }
  const isOtp = await Otp.findOne({
    email: req.body.email,
    otp: req.body.otp
  })
  if(!isOtp){
    res.json({
      "code": "error",
      "msg": "OTP không hợp lệ"
    })
    return
  }
  await Otp.deleteOne({
    email: req.body.email,
    otp: req.body.otp
  })

  const existingAccount = await Account.findOne({ email: req.body.email});
  if (existingAccount) {
    res.json({
      code: "error",
      msg: "Email đã tồn tại trong hệ thống"
    });
    return;
  }

  if(req.body.email && req.body.password && req.body.name && req.body.phone){
    req.body.role = "manager"
    req.body.password = md5(req.body.password)
    const maxMs = await getMaxMsByPrefix();
    const MS = `AD${maxMs.AD + 1}`; 





    const newAccount = new Account({
      ...req.body, // Sao chép tất cả các trường từ req.body
      ms: MS      // Thêm trường ms với giá trị MS
    });
    const newEWallet = new EWallet({
      "accountId": newAccount.id,
      "balance": 0,
      "balancePaper": 0,
      "ms": MS
    })
    await newAccount.save()
    await newEWallet.save()
    const token = jwt.sign(
      {
        accountToken: {
          "id": newAccount.id,
          "email": newAccount.email,
          "role": newAccount.role,
          "key": md5(userAgent)
        }
      }, secret, { expiresIn: '30m' });
      const rftoken = jwt.sign(
      {
        token: token,
        id: newAccount.id
      }, secret, { expiresIn: '168h' });
    res.json({
      code: "success",
      role: newAccount.role,
      token: token,
      rftoken: rftoken
    })
    return 
  }
  else if(req.body.email && req.body.password) {
    const account = await Account.findOne({
      email: req.body.email
    })
    if(account){
      await Account.updateOne({
        "_id": account.id
      }, {
        password: md5(req.body.password)
      })
      const token = jwt.sign(
        {
          accountToken: {
            "id": account.id,
            "email": account.email,
            "role": account.role,
            "key": md5(userAgent)
          }
        }, secret, { expiresIn: '30m' });
        const rftoken = jwt.sign(
        {
          token: token,
          id: account.id
        }, secret, { expiresIn: '168h' });
      res.json({
        code: "success",
        role: account.role,
        token: token,
        rftoken: rftoken
      })
      return 
    }
  }
  res.json({
    code: "fail"
  })
}

module.exports.otpController = async(req, res) => {
  if(!req.body.email){
    res.json({
      "code": "error",
      "msg": "email mầy đâu thằng ngu"
    })
    return
  }
  const existingAccount = await Account.findOne({ email: req.body.email});
  if (existingAccount) {
    res.json({
      code: "error",
      msg: "Email đã tồn tại trong hệ thống"
    });
    return;
  }
  const isOtp = await Otp.findOne({
    email: req.body.email
  })
  if(isOtp){
    res.json({
      "code": "error",
      "msg": "otp da duoc gui truoc do"
    })
    return
  }
  
  const otp = generateRandomNumber(6)
  const data = {
    email: req.body.email,
    otp: otp
  }
  const record = new Otp(data)
  await record.save()
  const subject = "Xac thuc ma OTP"
  const text = `${otp}`
  sendMail(req.body.email, subject, text)
  res.json({
    "code": "success",
    "msg": "Đã gửi otp thành công"
  })
}


module.exports.getAccountController = async (req, res) => {



  const account = await Account.findOne({
    "_id": res.locals.account.id 
  })
  res.json({
    "code": "success",
    "msg": "Lấy account thành công",
    "account": account
  })
}

module.exports.getAccountStudentController = async (req, res) => {
  const id = req.params.id
  if(!id) {
    res.json({
      "code": "error",
      "msg": "Khong có ID"
    })
    return
  }
  const account = await Account.findOne({
    "_id": id,
    "role": "student"


  }).select("name email phone ms role")

  res.json({
    "code": "error",
    "msg": "Lấy ra account thành công",
    "account": account
  })
}

module.exports.getAllAccountController = async (req, res) => {
  const accounts = await Account.find({
    "role": "student"


  }).select("name email phone ms role")

  res.json({
    "code": "success",
    "accounts": accounts
  })
}