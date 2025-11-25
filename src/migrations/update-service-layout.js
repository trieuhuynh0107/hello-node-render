// File: src/migrations/update-service-layout.js
const path = require('path');
// Load file .env từ thư mục gốc
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');

// ==========================================
// 1. Cấu hình kết nối (Theo logic của bạn)
// ==========================================
let clientConfig;

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    clientConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: decodeURIComponent(url.password), // Fix lỗi password có ký tự lạ
    };
  } catch (e) {
    console.error('❌ Lỗi parse DATABASE_URL:', e.message);
    process.exit(1);
  }
} else {
  clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
}

// Bổ sung SSL nếu cần (cho Render/Neon/Supabase)
if (process.env.DB_SSL === 'true') {
  clientConfig.ssl = { rejectUnauthorized: false };
}

const client = new Client(clientConfig);

// ==========================================
// 2. Data Layout Config (Đã có form_schema)
// ==========================================
const layoutConfig = [
  {
    "type": "intro",
    "order": 0,
    "data": {
      "title": "Dịch vụ Dọn nhà Chuyên nghiệp",
      "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078515/cleaning-service/ha7wvcgzbltjsg4n5uhl.png"
    }
  },
  {
    "type": "definition",
    "order": 1,
    "data": {
      "title": "Về dịch vụ",
      "content": "Mang lại không gian sống sạch sẽ, thoáng mát với đội ngũ nhân viên được đào tạo bài bản và dung dịch tẩy rửa an toàn."
    }
  },
  {
    "type": "pricing",
    "order": 2,
    "data": {
      "service_title": "Gói dọn dẹp",
      "note": "<ul><li>Giá đã bao gồm VAT và vật tư cơ bản</li><li>Cam kết sạch sẽ, gọn gàng</li><li>Bảo hành trong vòng 24h</li></ul>",
      "subservices": [
        { "id": "2br", "subservice_title": "Căn hộ 2 phòng", "price": 400000, "description": "50m2" },
        { "id": "3br", "subservice_title": "Căn hộ 3 phòng", "price": 550000, "description": "70m2" },
        { "id": "4br", "subservice_title": "Nhà phố 3 tầng", "price": 800000, "description": "100m2" }
      ]
    }
  },
  {
    "type": "tasktab",
    "order": 3,
    "data": {
      "title": "Chi tiết các hạng mục làm sạch",
      "tabs": [
        {
          "tab_title": "Nhà bếp",
          "description": "<ul><li>Rửa chén và xếp chén đĩa</li><li>Lau bụi và lau tất cả các bề mặt</li><li>Lau mặt ngoài tủ bếp, thiết bị gia dụng</li><li>Cọ rửa bếp, bồn rửa</li><li>Đổ rác và lau sàn</li></ul>",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/drimeim9uosrjnaicte5.jpg"
        },
        {
          "tab_title": "Phòng tắm",
          "description": "<ul><li>Cọ rửa toilet, bồn cầu</li><li>Lau chùi vòi sen, bồn tắm, bồn rửa</li><li>Lau sạch gương và các vách kính</li><li>Sắp xếp gọn gàng vật dụng</li><li>Cọ rửa sàn nhà tắm</li></ul>",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/mi4bql402c6massotyjt.jpg"
        },
        {
          "tab_title": "Phòng khách",
          "description": "<ul><li>Quét bụi trần nhà, quạt trần</li><li>Lau bụi đồ nội thất, kệ tivi, bàn ghế</li><li>Lau các công tắc điện, tay nắm cửa</li><li>Đổ rác các thùng chứa</li><li>Hút bụi và lau sàn nhà</li></ul>",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079308/cleaning-service/rtbyxdk1z60abeg50dlj.jpg"
        },
        {
          "tab_title": "Phòng ngủ",
          "description": "<ul><li>Thay ga trải giường (nếu có yêu cầu)</li><li>Sắp xếp lại giường ngủ gọn gàng</li><li>Lau bụi bàn trang điểm, tủ đầu giường</li><li>Lau sạch gương soi</li><li>Hút bụi thảm và lau sàn</li></ul>",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/tmisxw1xa6ecjmhkqnjr.jpg"
        }
      ]
    }
  },
  {
    "type": "booking",
    "order": 4,
    "data": {
      "title": "Đặt lịch dọn dẹp ngay",
      "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079886/cleaning-service/wfupg0vbm9fqdu0kr6mi.jpg",
      "button_text": "Đặt ngay",
      "form_schema": [
        {
          "field_name": "subservice_id",
          "field_type": "select",
          "label": "Chọn gói dịch vụ",
          "required": true,
          "options": ["2br", "3br", "4br"]
        },
        {
          "field_name": "address",
          "field_type": "text",
          "label": "Địa chỉ dọn dẹp",
          "required": true,
          "placeholder": "Số nhà, tên đường, phường, quận..."
        },
        {
          "field_name": "booking_date",
          "field_type": "date",
          "label": "Ngày làm việc",
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
          "label": "Số điện thoại liên hệ",
          "required": true,
          "validation": {
            "pattern": "^[0-9]{10,11}$"
          }
        },
        {
          "field_name": "note",
          "field_type": "textarea",
          "label": "Ghi chú thêm (Thú cưng, chìa khóa...)",
          "required": false
        }
      ]
    }
  }
];

// ==========================================
// 3. Thực thi Update
// ==========================================
async function updateLayout() {
  try {
    console.log('🔌 Connecting to DB...');
    await client.connect();
    
    console.log('🔄 Updating layout_config for Service ID 1...');
    
    // Convert JSON array to string for query
    const jsonString = JSON.stringify(layoutConfig);
    
    const res = await client.query('UPDATE services SET layout_config = $1 WHERE id = 1', [jsonString]);
    
    if (res.rowCount > 0) {
        console.log('✅ Update thành công! Đã thêm form_schema.');
    } else {
        console.log('⚠️ Không tìm thấy Service ID 1 để update.');
    }

  } catch (err) {
    console.error('❌ Error updating database:', err);
  } finally {
    await client.end();
  }
}

updateLayout();