const { Booking, User, Service, Cleaner } = require('../models');
const { Op } = require('sequelize');
// 🔥 FIX 1: Import Sequelize từ thư viện gốc để dùng các hàm fn, col
const Sequelize = require('sequelize'); 

// GET /api/admin/stats/dashboard
const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalRevenue,
            totalBookings,
            totalCustomers,
            bookingsByStatus,
            topServices,
            recentBookings
        ] = await Promise.all([

            // 1. TỔNG DOANH THU (Chỉ tính đơn đã hoàn thành)
            Booking.sum('total_price', {
                where: { status: 'COMPLETED' }
            }),

            // 2. TỔNG SỐ ĐƠN HÀNG
            Booking.count(),

            // 3. TỔNG SỐ KHÁCH HÀNG
            User.count({
                where: { role: 'CUSTOMER' }
            }),

            // 4. THỐNG KÊ THEO TRẠNG THÁI
            Booking.findAll({
                attributes: [
                    'status',
                    // 🔥 FIX 2: Dùng Sequelize.fn và Sequelize.col (Chữ S hoa)
                    [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
                ],
                group: ['status']
            }),

            // 5. TOP 5 DỊCH VỤ BÁN CHẠY NHẤT
            Booking.findAll({
                attributes: [
                    'service_id',
                    // 🔥 FIX 3: Dùng Sequelize.fn và Sequelize.col
                    [Sequelize.fn('COUNT', Sequelize.col('service_id')), 'count']
                ],
                include: [{
                    model: Service,
                    as: 'service',
                    attributes: ['name']
                }],
                // Group by cả id của bảng Service để tránh lỗi SQL mode only_full_group_by
                group: ['service_id', 'service.id'], 
                order: [[Sequelize.col('count'), 'DESC']],
                limit: 5
            }),

            // 6. 5 ĐƠN HÀNG GẦN NHẤT
            Booking.findAll({
                limit: 5,
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, as: 'customer', attributes: ['full_name'] },
                    { model: Service, as: 'service', attributes: ['name'] }
                ],
                attributes: ['id', 'status', 'total_price', 'created_at']
            })
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    total_revenue: totalRevenue || 0,
                    total_bookings: totalBookings,
                    total_customers: totalCustomers
                },
                charts: {
                    by_status: bookingsByStatus,
                    top_services: topServices
                },
                recent_activity: recentBookings
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };