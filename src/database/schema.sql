-- ============================================
-- MASTER SCHEMA - CLEANING SERVICE PLATFORM
-- Version: 2.0 (Final)
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

-- 3. TABLE: SERVICES (Đã bao gồm layout_config)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    layout_config JSONB DEFAULT '[]'::jsonb, -- Cột lưu cấu hình UI động
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
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. TABLE: BOOKINGS (Đã bao gồm booking_data và updated_at)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    cleaner_id INTEGER DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    note TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    booking_data JSONB DEFAULT '{}'::jsonb, -- Cột lưu dữ liệu form động
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id) ON DELETE RESTRICT,
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_booking_data ON bookings USING GIN (booking_data);

-- ============================================
-- SEED DATA
-- ============================================

-- Admin User (Pass: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@cleaningservice.com', '$2a$10$4UQENyXr/jSD/iAehtV3l.AIv/AIuEUGHnrABv1Hm8cbyYDRPJ/2a', 'System Admin', '0901234567', 'ADMIN');

-- Services: Dọn nhà (ID 1) - Full JSON Config
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Dọn nhà theo giờ', 'Dịch vụ dọn dẹp nhà cửa theo giờ', 150000, 120, true, 
'[
  {"type": "intro", "order": 0, "data": {"title": "Dịch vụ Dọn nhà Chuyên nghiệp", "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078515/cleaning-service/ha7wvcgzbltjsg4n5uhl.png"}},
  {"type": "definition", "order": 1, "data": {"title": "Về dịch vụ", "content": "Mang lại không gian sống sạch sẽ..."}},
  {"type": "pricing", "order": 2, "data": {"service_title": "Gói dọn dẹp", "note": "Giá đã bao gồm VAT", "subservices": [{"id": "2br", "subservice_title": "Căn hộ 2 phòng", "price": 400000}, {"id": "3br", "subservice_title": "Căn hộ 3 phòng", "price": 550000}, {"id": "4br", "subservice_title": "Nhà phố 3 tầng", "price": 800000}]}},
  {"type": "tasktab", "order": 3, "data": {"title": "Chi tiết công việc", "tabs": [{"tab_title": "Nhà bếp", "description": "Rửa chén, lau bếp...", "image_url": "..."}]}},
  {"type": "booking", "order": 4, "data": {"title": "Đặt lịch ngay", "button_text": "Đặt ngay", "form_schema": [{"field_name": "subservice_id", "field_type": "select", "label": "Chọn gói", "required": true, "options": ["2br", "3br", "4br"]}, {"field_name": "booking_date", "field_type": "date", "label": "Ngày làm", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Giờ làm", "required": true}, {"field_name": "address", "field_type": "text", "label": "Địa chỉ", "required": true}, {"field_name": "phone", "field_type": "text", "label": "SĐT", "required": true}]}}
]'::jsonb);

-- Services: Chuyển nhà (ID 2) - Full JSON Config (Standardized subservice_id)
INSERT INTO services (name, description, base_price, duration_minutes, is_active, layout_config) VALUES
('Chuyển nhà trọn gói', 'Chuyển nhà nhanh trọn gói giá rẻ', 500000, 300, true,
'[
  {"type": "intro", "order": 0, "data": {"title": "Dịch vụ Chuyển nhà", "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764081000/moving-service/banner-moving.jpg"}},
  {"type": "process", "order": 1, "data": {"heading": "Quy trình", "steps": [{"number": 1, "title": "Đặt lịch", "description": "..."}]}},
  {"type": "pricing", "order": 2, "data": {"service_title": "Bảng giá xe", "note": "Chưa gồm bốc xếp", "subservices": [{"id": "truck_bagac", "subservice_title": "Ba gác", "price": 350000}, {"id": "truck_1t5", "subservice_title": "Xe 1.5 Tấn", "price": 800000}, {"id": "truck_2t", "subservice_title": "Xe 2 Tấn", "price": 1200000}]}},
  {"type": "booking", "order": 3, "data": {"title": "Nhận báo giá", "button_text": "Gửi yêu cầu", "form_schema": [{"field_name": "subservice_id", "field_type": "select", "label": "Loại xe", "required": true, "options": ["truck_bagac", "truck_1t5", "truck_2t"]}, {"field_name": "from_address", "field_type": "text", "label": "Điểm đi", "required": true}, {"field_name": "to_address", "field_type": "text", "label": "Điểm đến", "required": true}, {"field_name": "booking_date", "field_type": "date", "label": "Ngày chuyển", "required": true}, {"field_name": "booking_time", "field_type": "time", "label": "Giờ chuyển", "required": true}, {"field_name": "phone", "field_type": "text", "label": "SĐT", "required": true}]}}
]'::jsonb);