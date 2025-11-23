const User = require('./User');
const Service = require('./Service');
const Cleaner = require('./Cleaner');
const Booking = require('./Booking');

// ============================================
// ĐỊNH NGHĨA QUAN HỆ (ASSOCIATIONS)
// ============================================

// User (Customer) có nhiều Bookings
User.hasMany(Booking, {
  foreignKey: 'customer_id',
  as: 'bookings'
});

Booking.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// Service có nhiều Bookings
Service.hasMany(Booking, {
  foreignKey: 'service_id',
  as: 'bookings'
});

Booking.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

// Cleaner có nhiều Bookings
Cleaner.hasMany(Booking, {
  foreignKey: 'cleaner_id',
  as: 'bookings'
});

Booking.belongsTo(Cleaner, {
  foreignKey: 'cleaner_id',
  as: 'cleaner'
});

// ============================================
// EXPORT TẤT CẢ MODELS
// ============================================
module.exports = {
  User,
  Service,
  Cleaner,
  Booking
};