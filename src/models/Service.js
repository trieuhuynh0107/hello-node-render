const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'services',
  timestamps: false,
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Service;