var mongoose = require('mongoose');
var Category = require('./category');

var productSchema = {
  name: { type: String, required: true },
  pictures: [{ type: String, match: /^http:\/\//i }],
  price: {
    amount: { type: NUmber, required: true },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP'],
      required: true
    }
  },
  category: Category.categorySchema
};

var schema = new mongoose.Schema(productSchema);

var currencySymbols = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£'
};

/*
 * Virtual to convert price to human-readable string form -
 * "$25" rather than "25 USD"
 */
schema.virtual('displayPrice').get(function() {
  return currencySymbols[this.price.currency] +
    '' + this.price.amount;
});

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

module.exports = schema;
module.exports.productSchema = productSchema;
// ^ for putting into users' carts
