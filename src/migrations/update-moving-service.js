const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');

// ==========================================
// 1. Cấu hình kết nối
// ==========================================
let clientConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  clientConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
} else {
  clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
}

const client = new Client(clientConfig);

// ==========================================
// 2. Data Layout cho CHUYỂN NHÀ
// ==========================================
const layoutConfig = [
  // Block 1: Intro
  {
    "type": "intro",
    "order": 0,
    "data": {
      "title": "Dịch vụ Chuyển nhà Trọn gói",
      "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764081000/moving-service/banner-moving.jpg" 
    }
  },
  // Block 2: Process (Quy trình)
  {
    "type": "process",
    "order": 1,
    "data": {
      "heading": "Quy trình 4 bước đơn giản",
      "steps": [
        { "number": 1, "title": "Đặt lịch", "description": "Điền thông tin địa chỉ và đồ đạc", "image_url": "" },
        { "number": 2, "title": "Khảo sát & Báo giá", "description": "Nhân viên liên hệ báo giá chi tiết", "image_url": "" },
        { "number": 3, "title": "Vận chuyển", "description": "Đóng gói và vận chuyển chuyên nghiệp", "image_url": "" },
        { "number": 4, "title": "Nghiệm thu", "description": "Sắp xếp đồ đạc tại nhà mới", "image_url": "" }
      ]
    }
  },
  // Block 3: Pricing (Bảng giá tham khảo)
  {
    "type": "pricing",
    "order": 2,
    "data": {
      "service_title": "Bảng giá thuê xe tải",
      "note": "Giá chưa bao gồm phí bốc xếp hai đầu",
      "subservices": [
        { "subservice_title": "Xe ba gác", "price": 350000 },
        { "subservice_title": "Xe tải 500kg", "price": 500000 },
        { "subservice_title": "Xe tải 1.5 tấn", "price": 800000 },
        { "subservice_title": "Xe tải 2 tấn", "price": 1200000 }
      ]
    }
  },
  // Block 4: Booking Form (Dynamic)
  {
    "type": "booking",
    "order": 3,
    "data": {
      "title": "Nhận báo giá chuyển nhà",
      "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764081100/moving-service/booking-bg.jpg",
      "button_text": "Nhận báo giá",
      "form_schema": [
        {
          "field_name": "truck_type",
          "field_type": "select",
          "label": "Loại xe tải",
          "required": true,
          "options": ["truck_0t5", "truck_1t5", "truck_2t"]
        },
        {
          "field_name": "from_address",
          "field_type": "text",
          "label": "Địa chỉ đi (nhà cũ)",
          "required": true
        },
        {
          "field_name": "from_has_elevator",
          "field_type": "checkbox",
          "label": "Có thang máy?",
          "required": false
        },
        {
          "field_name": "to_address",
          "field_type": "text",
          "label": "Địa chỉ đến (nhà mới)",
          "required": true
        },
        {
          "field_name": "to_has_elevator",
          "field_type": "checkbox",
          "label": "Có thang máy?",
          "required": false
        },
        {
          "field_name": "booking_date",
          "field_type": "date",
          "label": "Ngày chuyển",
          "required": true
        },
        {
          "field_name": "booking_time",
          "field_type": "time",
          "label": "Giờ bắt đầu",
          "required": true
        },
        {
          "field_name": "phone",
          "field_type": "text",
          "label": "Số điện thoại",
          "required": true
        },
        {
          "field_name": "note",
          "field_type": "textarea",
          "label": "Ghi chú (số lượng đồ, yêu cầu đặc biệt...)",
          "required": false
        }
      ]
    }
  }
];

// ==========================================
// 3. Chạy Update
// ==========================================
async function updateMovingService() {
  try {
    console.log('🔌 Connecting to DB...');
    await client.connect();
    
    // ⚠️ QUAN TRỌNG: Bạn cần chắc chắn ID của dịch vụ Chuyển nhà là 2
    const SERVICE_ID = 2; 

    console.log(`🔄 Updating layout_config for Moving Service (ID: ${SERVICE_ID})...`);
    
    const jsonString = JSON.stringify(layoutConfig);
    
    const res = await client.query('UPDATE services SET layout_config = $1 WHERE id = $2', [jsonString, SERVICE_ID]);
    
    if (res.rowCount > 0) {
        console.log('✅ Update thành công cho dịch vụ Chuyển nhà! Đã thêm booking_time.');
    } else {
        console.log(`⚠️ Không tìm thấy Service ID ${SERVICE_ID}. Vui lòng kiểm tra lại Database.`);
    }

  } catch (err) {
    console.error('❌ Error updating database:', err);
  } finally {
    await client.end();
  }
}

updateMovingService();