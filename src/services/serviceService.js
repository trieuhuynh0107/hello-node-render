// src/services/serviceService.js
const { Service, Booking } = require('../models');
const { validateBlock } = require('../config/blockSchemas');
const { Op } = require('sequelize');

// Helper private: Parse JSON an toàn
const _parseLayoutConfig = (service) => {
    if (!service) return null;
    const serviceJson = service.toJSON();
    // Nếu DB trả về string thì parse, nếu là object thì giữ nguyên
    if (typeof serviceJson.layout_config === 'string') {
        serviceJson.layout_config = JSON.parse(serviceJson.layout_config);
    }
    return serviceJson;
};

// Helper private: Validate Layout Config
const _validateLayoutBlocks = (layoutConfig) => {
    if (!Array.isArray(layoutConfig)) return { valid: false, message: 'layout_config phải là array' };
    
    for (let i = 0; i < layoutConfig.length; i++) {
        const block = layoutConfig[i];
        if (!block.type || !block.data) {
            return { valid: false, message: `Block thứ ${i + 1} thiếu type hoặc data` };
        }
        const validation = validateBlock(block.type, block.data);
        if (!validation.valid) {
            return { valid: false, message: `Block ${block.type} lỗi: ${validation.errors.join(', ')}` };
        }
    }
    return { valid: true };
};

// ==========================================
// 1. GET ALL (Chung cho cả Admin & User)
// ==========================================
const getAllServicesCore = async (filter, isAdmin = false) => {
    const { status } = filter;
    const whereCondition = {};

    // Logic User: Chỉ lấy Active
    if (!isAdmin) {
        whereCondition.is_active = true;
    } 
    // Logic Admin: Lọc theo status gửi lên
    else if (status === 'active') {
        whereCondition.is_active = true;
    } else if (status === 'inactive') {
        whereCondition.is_active = false;
    }

    const services = await Service.findAll({
        where: whereCondition,
        order: [['id', 'ASC']],
        attributes: isAdmin 
            ? ['id', 'name', 'description', 'base_price', 'duration_minutes', 'is_active', 'created_at'] // Admin cần xem nhiều hơn
            : ['id', 'name', 'description', 'base_price', 'duration_minutes'] // User chỉ cần cơ bản
    });

    return services;
};

// ==========================================
// 2. GET BY ID (Chi tiết + Layout)
// ==========================================
const getServiceByIdCore = async (id, isAdmin = false) => {
    const whereCondition = { id };
    if (!isAdmin) whereCondition.is_active = true;

    const service = await Service.findOne({ where: whereCondition });
    if (!service) throw new Error('NOT_FOUND');

    return _parseLayoutConfig(service);
};

// ==========================================
// 3. CREATE (Admin)
// ==========================================
const createServiceCore = async (data) => {
    const { name, base_price, duration_minutes, layout_config } = data;

    // Validate Business Logic
    if (base_price <= 0 || duration_minutes <= 0) throw new Error('INVALID_PRICE_DURATION');

    // Validate Layout (nếu có)
    if (layout_config) {
        const check = _validateLayoutBlocks(layout_config);
        if (!check.valid) throw new Error(check.message);
    }

    const service = await Service.create({
        ...data,
        is_active: true // Mặc định active khi tạo
    });
    return _parseLayoutConfig(service);
};

// ==========================================
// 4. UPDATE (Admin - Update Info & Layout)
// ==========================================
const updateServiceCore = async (id, data) => {
    const service = await Service.findByPk(id);
    if (!service) throw new Error('NOT_FOUND');

    // Validate
    if (data.base_price !== undefined && data.base_price <= 0) throw new Error('INVALID_PRICE_DURATION');
    
    if (data.layout_config) {
        const check = _validateLayoutBlocks(data.layout_config);
        if (!check.valid) throw new Error(check.message);
    }

    await service.update(data);
    return _parseLayoutConfig(service);
};

// ==========================================
// 5. TOGGLE STATUS
// ==========================================
const toggleServiceCore = async (id) => {
    const service = await Service.findByPk(id);
    if (!service) throw new Error('NOT_FOUND');

    service.is_active = !service.is_active;
    await service.save();
    return service;
};

// ==========================================
// 6. DELETE
// ==========================================
const deleteServiceCore = async (id) => {
    const service = await Service.findByPk(id);
    if (!service) throw new Error('NOT_FOUND');

    const count = await Booking.count({ where: { service_id: id } });
    if (count > 0) throw new Error('HAS_BOOKINGS');

    await service.destroy();
    return true;
};

module.exports = {
    getAllServicesCore,
    getServiceByIdCore,
    createServiceCore,
    updateServiceCore,
    toggleServiceCore,
    deleteServiceCore
};