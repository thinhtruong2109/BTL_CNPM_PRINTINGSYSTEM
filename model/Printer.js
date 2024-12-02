const mongoose = require("mongoose")
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)

const PrinterSchema = new mongoose.Schema({
  cs: Number,
  brand: String,
  model: String,
  description: String,
  location: String,
  status: String,
  type: String,
  deleted: Boolean,
  price: Number 
},{
  timestamps: true,
  }
);

const Printer = mongoose.model(
  'Printer',
  PrinterSchema,
  'printers'
)

module.exports = Printer