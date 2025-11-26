-- ============================================
-- MASTER SCHEMA - CLEANING SERVICE PLATFORM
-- Version: 2.1 (Optimized for Booking & Assignment)
-- ============================================

-- 1. CLEANUP
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. TABLE: USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- 3. TABLE: SERVICES
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    layout_config JSONB DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
CREATE INDEX idx_services_active ON services(is_active) WHERE deleted_at IS NULL;

-- 4. TABLE: CLEANERS
CREATE TABLE cleaners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Mới thêm: Để liên hệ/login sau này
    avatar TEXT,               -- Mới thêm: Ảnh đại diện
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. TABLE: BOOKINGS
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    cleaner_id INTEGER DEFAULT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    location TEXT NOT NULL, -- "Single source of truth" hiển thị nhanh
    note TEXT,
    cancel_reason TEXT,     -- Mới thêm: Lưu lý do hủy riêng
    
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    
    booking_data JSONB DEFAULT '{}'::jsonb,
    
    -- Review (Chuẩn bị cho tương lai)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id) ON DELETE RESTRICT,
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_cleaner ON bookings(cleaner_id); -- Index để check trùng lịch nhanh hơn
CREATE INDEX idx_bookings_booking_data ON bookings USING GIN (booking_data);

-- ============================================
-- SEED DATA
-- ============================================

-- Admin User
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@cleaningservice.com', '$2a$10$4UQENyXr/jSD/iAehtV3l.AIv/AIuEUGHnrABv1Hm8cbyYDRPJ/2a', 'System Admin', '0901234567', 'ADMIN');

-- Cleaners (Mới thêm để test Gán việc)
INSERT INTO cleaners (name, phone, email, status) VALUES 
('Nguyễn Văn A', '0900000001', 'cleaner1@test.com', 'ACTIVE'),
('Trần Thị B', '0900000002', 'cleaner2@test.com', 'ACTIVE');

-- Services: Dọn nhà (ID 1)
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Dọn nhà theo giờ', 'Dịch vụ dọn dẹp nhà cửa theo giờ', 150000, 120, true, 
'[
  {"type": "intro", "order": 0, "data": {"title": "Dịch vụ Dọn nhà", "banner_image_url": "..."}},
  {"type": "pricing", "order": 1, "data": {"service_title": "Gói dọn dẹp", "note": "Giá đã bao gồm VAT", "subservices": [{"id": "2br", "subservice_title": "Căn hộ 2 phòng", "price": 400000}, {"id": "3br", "subservice_title": "Căn hộ 3 phòng", "price": 550000}]}},
  {"type": "booking", "order": 2, "data": {"title": "Đặt lịch ngay", "button_text": "Đặt ngay", "form_schema": [{"field_name": "subservice_id", "field_type": "select", "label": "Chọn gói", "required": true, "options": ["2br", "3br"]}, {"field_name": "booking_date", "field_type": "date", "label": "Ngày làm", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Giờ làm", "required": true}, {"field_name": "address", "field_type": "text", "label": "Địa chỉ", "required": true}, {"field_name": "phone", "field_type": "text", "label": "SĐT", "required": true}]}}
]'::jsonb);

-- Services: Chuyển nhà (ID 2)
-- 🔥 Đã đồng bộ ID "truck_0t5" để khớp với code test Postman của bạn
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Chuyển nhà trọn gói', 'Chuyển nhà nhanh trọn gói giá rẻ', 500000, 300, true,
'[
  {"type": "intro", "order": 0, "data": {"title": "Dịch vụ Chuyển nhà", "banner_image_url": "..."}},
  {"type": "pricing", "order": 1, "data": {"service_title": "Bảng giá xe", "note": "Chưa gồm bốc xếp", "subservices": [{"id": "truck_0t5", "subservice_title": "Xe 500kg", "price": 350000}, {"id": "truck_1t5", "subservice_title": "Xe 1.5 Tấn", "price": 800000}, {"id": "truck_2t", "subservice_title": "Xe 2 Tấn", "price": 1200000}]}},
  {"type": "booking", "order": 2, "data": {"title": "Nhận báo giá", "button_text": "Gửi yêu cầu", "form_schema": [{"field_name": "subservice_id", "field_type": "select", "label": "Loại xe", "required": true, "options": ["truck_0t5", "truck_1t5", "truck_2t"]}, {"field_name": "from_address", "field_type": "text", "label": "Điểm đi", "required": true}, {"field_name": "to_address", "field_type": "text", "label": "Điểm đến", "required": true}, {"field_name": "booking_date", "field_type": "date", "label": "Ngày chuyển", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Giờ chuyển", "required": true}, {"field_name": "phone", "field_type": "text", "label": "SĐT", "required": true}]}}
]'::jsonb);