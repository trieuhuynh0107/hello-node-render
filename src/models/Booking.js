const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  cleaner_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // NULL khi chưa gán nhân viên
    references: {
      model: 'cleaners',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDING',
    validate: {
      isIn: [['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']]
    }
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'UNPAID',
    validate: {
      isIn: [['UNPAID', 'PAID']]
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'bookings',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Booking;