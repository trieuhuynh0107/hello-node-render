// src/controllers/serviceController.js
const serviceService = require('../services/serviceService');
const { BLOCK_TYPES, BLOCK_SCHEMAS } = require('../config/blockSchemas');

// ==========================================
// PUBLIC APIs (User)
// ==========================================

const getPublicServices = async (req, res, next) => {
    try {
        const services = await serviceService.getAllServicesCore(req.query, false);
        res.json({ success: true, data: { services, total: services.length } });
    } catch (error) { next(error); }
};

const getServiceDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await serviceService.getServiceByIdCore(id, false);
        res.json({ success: true, data: { service } });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Dịch vụ không tồn tại' });
        next(error);
    }
};

// ==========================================
// ADMIN APIs (Quản lý)
// ==========================================

const getAdminServices = async (req, res, next) => {
    try {
        const services = await serviceService.getAllServicesCore(req.query, true);
        res.json({ success: true, data: { services, total: services.length } });
    } catch (error) { next(error); }
};

const getServiceForEdit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await serviceService.getServiceByIdCore(id, true);
        res.json({ success: true, data: { service } });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        next(error);
    }
};

const createService = async (req, res, next) => {
    try {
        const service = await serviceService.createServiceCore(req.body);
        res.status(201).json({ success: true, message: 'Tạo dịch vụ thành công', data: { service } });
    } catch (error) {
        if (error.message === 'INVALID_PRICE_DURATION') return res.status(400).json({ success: false, message: 'Giá và thời gian phải lớn hơn 0' });
        // Handle lỗi validate layout (thường message sẽ dài)
        if (error.message.startsWith('Block')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

const updateService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await serviceService.updateServiceCore(id, req.body);
        res.json({ success: true, message: 'Cập nhật thành công', data: { service } });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        if (error.message === 'INVALID_PRICE_DURATION') return res.status(400).json({ success: false, message: 'Giá và thời gian phải lớn hơn 0' });
        if (error.message.startsWith('Block')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

const updateServiceLayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { layout_config } = req.body;
        // Tái sử dụng core update
        const service = await serviceService.updateServiceCore(id, { layout_config });
        res.json({ success: true, message: 'Cập nhật layout thành công', data: { service } });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        if (error.message.startsWith('Block')) return res.status(400).json({ success: false, message: error.message });
        next(error);
    }
};

const toggleService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await serviceService.toggleServiceCore(id);
        res.json({ 
            success: true, 
            message: service.is_active ? 'Đã bật dịch vụ' : 'Đã tắt dịch vụ', 
            data: { service } 
        });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        next(error);
    }
};

const deleteService = async (req, res, next) => {
    try {
        const { id } = req.params;
        await serviceService.deleteServiceCore(id);
        res.json({ success: true, message: 'Xóa dịch vụ thành công' });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        if (error.message === 'HAS_BOOKINGS') return res.status(400).json({ success: false, message: 'Không thể xóa vì đã có đơn hàng sử dụng dịch vụ này.' });
        next(error);
    }
};

// UI Config (Không cần service core vì lấy config tĩnh)
const getBlockSchemas = (req, res) => {
    res.json({
        success: true,
        data: {
            block_types: BLOCK_TYPES,
            schemas: BLOCK_SCHEMAS
        }
    });
};

module.exports = {
    getPublicServices,
    getServiceDetail,
    // Admin
    getAdminServices,
    getServiceForEdit,
    createService,
    updateService,
    updateServiceLayout,
    toggleService,
    deleteService,
    getBlockSchemas
};