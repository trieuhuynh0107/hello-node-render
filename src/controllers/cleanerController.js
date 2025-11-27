// src/controllers/cleanerController.js
const { Cleaner, Booking } = require('../models');
const { Op } = require('sequelize');
const { getFileUrl} = require('../services/uploadService')

// ============================================
// 1. CREATE CLEANER (Tạo nhân viên mới)
// ============================================
const createCleaner = async (req, res, next) => {
    try {
        const { name, phone, status } = req.body;

        // Validate cơ bản
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Tên và số điện thoại là bắt buộc.' });
        }

        // Kiểm tra xem SĐT đã tồn tại chưa
        const existingCleaner = await Cleaner.findOne({ where: { phone } });
        if (existingCleaner) {
            return res.status(400).json({ success: false, message: 'Số điện thoại nhân viên này đã tồn tại.' });
        }

        // Lấy URL ảnh nếu có
    let avatarUrl = null;
    if (req.file) {
        avatarUrl = getFileUrl(req.file);
    }

        // Tạo mới
        const cleaner = await Cleaner.create({
            name,
            phone,
            status: status || 'ACTIVE',
            avatar: avatarUrl 
        });

        res.status(201).json({
            success: true,
            message: 'Tạo nhân viên thành công!',
            data: cleaner
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// 2. GET ALL CLEANERS (Lấy danh sách)
// ============================================
const getAllCleaners = async (req, res, next) => {
    try {
        const { status } = req.query;
        
        // Tạo bộ lọc nếu có gửi param status lên (VD: ?status=ACTIVE)
        const whereCondition = {};
        if (status) {
            whereCondition.status = status.toUpperCase();
        }

        const cleaners = await Cleaner.findAll({
            where: whereCondition,
            order: [['created_at', 'DESC']] // Người mới nhất lên đầu
        });

        res.json({
            success: true,
            data: cleaners
        });

    } catch (error) {
        next(error);
    }
};

// ============================================
// 3. UPDATE STATUS (Cập nhật trạng thái + Check Logic)
// ============================================
const updateCleanerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACTIVE', 'INACTIVE', 'ON_LEAVE'

        // 1. Tìm nhân viên
        const cleaner = await Cleaner.findByPk(id);
        if (!cleaner) {
            return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại.' });
        }

        // 2. Validate input status
        const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        // 3. LOGIC CHECK: Nếu muốn Nghỉ (ON_LEAVE) hoặc Nghỉ việc (INACTIVE)
        // Phải kiểm tra xem nhân viên có đang vướng lịch booking nào trong tương lai không?
        if (['ON_LEAVE', 'INACTIVE'].includes(status)) {
            const hasFutureBookings = await Booking.count({
                where: {
                    cleaner_id: id,
                    status: { [Op.in]: ['PENDING', 'CONFIRMED'] }, // Các trạng thái chưa hoàn thành
                    start_time: { [Op.gt]: new Date() } // Lớn hơn thời gian hiện tại
                }
            });

            if (hasFutureBookings > 0) {
                return res.status(409).json({ // 409 Conflict
                    success: false,
                    message: `Không thể chuyển trạng thái sang ${status} vì nhân viên này còn ${hasFutureBookings} đơn hàng chưa hoàn thành.`
                });
            }
        }

        // 4. Update nếu thỏa mãn
        cleaner.status = status;
        await cleaner.save();

        res.json({
            success: true,
            message: `Cập nhật trạng thái nhân viên thành: ${status}`,
            data: cleaner
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCleaner,
    getAllCleaners,
    updateCleanerStatus
};