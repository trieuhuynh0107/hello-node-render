-- Migration: Initial Schema for Cleaning Service Platform
-- Version: 1.0
-- Date: 2025-11-23

-- ============================================
-- DROP EXISTING TABLES (Để tạo lại clean)
-- ============================================
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Table 1: users (Người dùng hệ thống)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index để tối ưu query login
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- ============================================
-- Table 2: services (Dịch vụ)
-- ============================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index để khách hàng query dịch vụ active
CREATE INDEX idx_services_active ON services(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- Table 3: cleaners (Hồ sơ Nhân viên)
-- ============================================
CREATE TABLE cleaners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index để check availability
CREATE INDEX idx_cleaners_status ON cleaners(status) WHERE deleted_at IS NULL;

-- ============================================
-- Table 4: bookings (Đơn hàng - CORE TABLE)
-- ============================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    cleaner_id INTEGER DEFAULT NULL, -- Nullable: chưa gán nhân viên
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    note TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_service FOREIGN KEY (service_id) 
        REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) 
        REFERENCES cleaners(id) ON DELETE RESTRICT,
    
    -- Business Constraints
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- Indexes quan trọng để check conflicts và queries
CREATE INDEX idx_bookings_customer ON bookings(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON bookings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_cleaner_time ON bookings(cleaner_id, start_time, end_time) 
    WHERE deleted_at IS NULL AND cleaner_id IS NOT NULL;
CREATE INDEX idx_bookings_date ON bookings(start_time) WHERE deleted_at IS NULL;

-- ============================================
-- Seed Data: Admin Account
-- ============================================
-- Password: admin123 (đã hash bằng bcrypt, rounds=10)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@cleaningservice.com', 
 '$2a$10$4UQENyXr/jSD/iAehtV3l.AIv/AIuEUGHnrABv1Hm8cbyYDRPJ/2a', 
 'System Admin', 
 '0901234567', 
 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Seed Data: Sample Services
-- ============================================
INSERT INTO services (name, description, base_price, duration_minutes, is_active) VALUES
('Dọn nhà theo giờ', 'Dịch vụ dọn dẹp nhà cửa theo giờ, phù hợp cho căn hộ nhỏ', 150000, 120, true),
('Dọn nhà tổng thể', 'Dọn dẹp toàn bộ nhà cửa bao gồm cả khu vực khó', 300000, 240, true),
('Vệ sinh sau xây dựng', 'Làm sạch hoàn toàn sau khi hoàn thành công trình xây dựng', 500000, 300, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Comments để documentation
-- ============================================
COMMENT ON TABLE bookings IS 'Bảng lưu trữ đơn hàng. Trường cleaner_id NULL khi chưa gán nhân viên';
COMMENT ON COLUMN bookings.start_time IS 'Thời gian bắt đầu làm việc (TIMESTAMPTZ - có timezone)';
COMMENT ON COLUMN bookings.end_time IS 'Thời gian kết thúc = start_time + service.duration_minutes';
COMMENT ON INDEX idx_bookings_cleaner_time IS 'Index để check conflict khi gán nhân viên';