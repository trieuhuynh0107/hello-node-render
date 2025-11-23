const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['ADMIN', 'CUSTOMER']]
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
  tableName: 'users',
  timestamps: false, // Vì ta tự quản lý created_at
  paranoid: true, // Soft delete
  deletedAt: 'deleted_at'
});

// Instance method: So sánh password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Static method: Hash password trước khi lưu
User.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

// Hook: Tự động hash password khi tạo user mới
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});

module.exports = User;