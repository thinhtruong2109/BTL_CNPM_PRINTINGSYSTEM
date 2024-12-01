const mongoose = require("mongoose")
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)


const BuyPaperLogSchema = new mongoose.Schema({
  accountId: String,
  transaction: String,
  amount: Number,
  balance: Number,
  historyId: String
},{
    timestamps: true,
  }
)

const BuyPaperLog = mongoose.model(
  'BuyPaperLog',
  BuyPaperLogSchema,
  'buypaperlog'
)

module.exports = BuyPaperLog