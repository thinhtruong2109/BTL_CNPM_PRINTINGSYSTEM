const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  orderCode: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});


const Transaction = mongoose.model(
    'Transaction',
    TransactionSchema,
    'transactions'
  )
  
  module.exports = Transaction