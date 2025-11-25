-- Migration: Thêm cột booking_data để lưu dynamic form data
-- File: src/migrations/004_add_booking_data.sql

-- Thêm cột booking_data vào bảng bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_data JSONB DEFAULT '{}'::jsonb;

-- Thêm index để query nhanh
CREATE INDEX IF NOT EXISTS idx_bookings_booking_data 
ON bookings USING GIN (booking_data);

-- Thêm comment
COMMENT ON COLUMN bookings.booking_data IS 
'Dynamic form data - Lưu các field tùy chỉnh theo service type. 
VD: {subservice_id: "3br", phone: "0901234567", note: "..."}';

-- Verify
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name = 'booking_data';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: booking_data column added to bookings table';
END $$;