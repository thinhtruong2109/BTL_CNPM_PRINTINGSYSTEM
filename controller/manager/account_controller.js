const md5 = require("md5")
const Account = require("../../model/Account")
const jwt = require("jsonwebtoken")
require('dotenv').config();
const secret = process.env.JWT_SECRET


module.exports.loginController = async (req, res) => {
  const userAgent = req.headers['user-agent'];
  if(!userAgent){
    res.json({
      "code": "error",
      "msg": "Mầy biến khỏi đây"
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
      code: "email khong ton tai"
    })
    return
  }
  if(!account){
    res.json({
      code: "account khong ton tai"
    })
    return
  }
  if(md5(password) != account.password){
    res.json({
      code: "mat khau khong chinh xac"
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

module.exports.getAccountController = async (req, res) => {
  const account = await Account.findOne({
    "_id": res.locals.account.id 
  }).select("name email phone avatar role")
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
      "msg": "id may dau troi oi"
    })
    return
  }
  const account = await Account.findOne({
    "_id": id,
    "role": "student"
  }).select("name email")
  res.json({
    "code": "error",
    "msg": "Lấy ra account thành công",
    "account": account
  })
}

module.exports.getAllAccountController = async (req, res) => {
  const accounts = await Account.find({
    "role": "student"
  }).select("name id phone email")
  res.json({
    "code": "success",
    "accounts": accounts
  })
}