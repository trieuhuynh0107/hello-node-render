-- Migration: Add layout_config to services table
-- Version: 1.1
-- Date: 2025-11-25

-- 1. Cấu trúc bảng (Schema)
-- Thêm cột nếu chưa tồn tại
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'layout_config') THEN
        ALTER TABLE services ADD COLUMN layout_config JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN services.layout_config IS 
        'Dynamic page layout configuration - Array of block objects.';
        
        CREATE INDEX idx_services_layout_config ON services USING GIN (layout_config);
    END IF;
END $$;

-- 2. Cập nhật dữ liệu (Data Seeding)

-- =============================================
-- UPDATE 1: DỊCH VỤ DỌN NHÀ (Cleaning Service)
-- Đặc điểm: Có block "tasktab" (chi tiết dọn từng phòng), KHÔNG có "process" chuyển nhà
-- =============================================
UPDATE services
SET layout_config = '[
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
        { "id": "2br","subservice_title": "Căn hộ 2 phòng","description":"50m2", "price": 400000 },
        { "id": "3br","subservice_title": "Căn hộ 3 phòng","description":"70m2", "price": 550000 },
        { "id": "4br","subservice_title": "Nhà phố 3 tầng","description":"100m2", "price": 800000 }
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
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079306/cleaning-service/drimeim9uosrjnaicte5.jpg",
          "description": "<ul><li>Rửa chén và xếp chén đĩa</li><li>Lau bụi và lau tất cả các bề mặt</li><li>Lau mặt ngoài tủ bếp, thiết bị gia dụng</li><li>Cọ rửa bếp, bồn rửa</li><li>Đổ rác và lau sàn</li></ul>"
        },
        {
          "tab_title": "Phòng tắm",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/mi4bql402c6massotyjt.jpg",
          "description": "<ul><li>Cọ rửa toilet, bồn cầu</li><li>Lau chùi vòi sen, bồn tắm, bồn rửa</li><li>Lau sạch gương và các vách kính</li><li>Sắp xếp gọn gàng vật dụng</li><li>Cọ rửa sàn nhà tắm</li></ul>"
        },
        {
          "tab_title": "Phòng khách",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079308/cleaning-service/rtbyxdk1z60abeg50dlj.jpg",
          "description": "<ul><li>Quét bụi trần nhà, quạt trần</li><li>Lau bụi đồ nội thất, kệ tivi, bàn ghế</li><li>Lau các công tắc điện, tay nắm cửa</li><li>Đổ rác các thùng chứa</li><li>Hút bụi và lau sàn nhà</li></ul>"
        },
        {
          "tab_title": "Phòng ngủ",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079305/cleaning-service/tmisxw1xa6ecjmhkqnjr.jpg",
          "description": "<ul><li>Thay ga trải giường (nếu có yêu cầu)</li><li>Sắp xếp lại giường ngủ gọn gàng</li><li>Lau bụi bàn trang điểm, tủ đầu giường</li><li>Lau sạch gương soi</li><li>Hút bụi thảm và lau sàn</li></ul>"
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
      "button_text": "Đặt ngay"
    }
  }
]'::jsonb
-- Lưu ý: Hãy thay đổi điều kiện WHERE dưới đây cho đúng với tên dịch vụ trong DB của bạn
WHERE name ILIKE '%dọn nhà%';


-- =============================================
-- UPDATE 2: DỊCH VỤ CHUYỂN NHÀ (Moving Service)
-- Đặc điểm: Có block "process" (quy trình 3 bước), KHÔNG có "tasktab" dọn dẹp
-- =============================================
UPDATE services
SET layout_config = '[
  {
    "type": "intro",
    "order": 0,
    "data": {
      "title": "Dịch vụ Chuyển nhà Trọn gói",
      "banner_image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078515/cleaning-service/xz3eyhsysrle6xowniga.png"
    }
  },
  {
    "type": "definition",
    "order": 1,
    "data": {
      "title": "Về dịch vụ",
      "content": "Giải pháp chuyển nhà nhanh chóng, an toàn tuyệt đối cho tài sản của bạn với quy trình đóng gói và vận chuyển chuyên nghiệp."
    }
  },
  {
    "type": "pricing",
    "order": 2,
    "data": {
      "service_title": "Các loại xe tải",
      "note": "<ul><li><b>Bốc dỡ:</b> Đưa đồ đạc vào đúng vị trí các phòng tại nhà mới.</li><li><b>Lắp ráp:</b> Lắp lại giường, tủ, máy lạnh.</li><li><b>Nghiệm thu:</b> Khách hàng kiểm tra và xác nhận hoàn thành.</li></ul>",
      "subservices": [
        { "id": "truck_0t5","subservice_title": "Xe tải 500kg", "price": 350000 },
        { "id": "truck_1t5","subservice_title": "Xe tải 1.5 Tấn", "price": 600000 },
        { "id": "truck_2t","subservice_title": "Xe tải 2 Tấn", "price": 800000 }
      ]
    }
  },
  {
    "type": "process",
    "order": 3,
    "data": {
      "title": "Quy trình 3 bước vận chuyển",
      "steps": [
        {
          "step_title": "Bước 1: Phân loại & Đóng gói",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078513/cleaning-service/x0jpi1tx3deweqtogzbr.jpg",
          "description": "<ul><li><b>Phân loại:</b> Kiểm tra và phân loại đồ đạc theo kích thước.</li><li><b>Tháo dỡ:</b> Tháo các thiết bị điện tử, giường tủ an toàn.</li><li><b>Đóng gói:</b> Dùng màng PE, xốp nổ bao bọc kỹ và đóng thùng carton.</li></ul>"
        },
        {
          "step_title": "Bước 2: Vận chuyển",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078513/cleaning-service/taeptiurt1v5qy3usssl.jpg",
          "description": "<p>Xe tải chuyên dụng di chuyển đồ đạc đến địa điểm mới theo lộ trình an toàn và nhanh nhất. Đảm bảo tài sản không bị xô lệch, hư hỏng.</p>"
        },
        {
          "step_title": "Bước 3: Lắp đặt & Bàn giao",
          "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764078512/cleaning-service/zbzjbqejppwmuzhoeyaq.jpg",
          "description": "<ul><li><b>Bốc dỡ:</b> Đưa đồ đạc vào đúng vị trí các phòng tại nhà mới.</li><li><b>Lắp ráp:</b> Lắp lại giường, tủ, máy lạnh.</li><li><b>Nghiệm thu:</b> Khách hàng kiểm tra và xác nhận hoàn thành.</li></ul>"
        }
      ]
    }
  },
  {
    "type": "booking",
    "order": 4,
    "data": {
      "title": "Nhận báo giá chuyển nhà",
      "image_url": "https://res.cloudinary.com/dxtwiciz0/image/upload/v1764079886/cleaning-service/wfupg0vbm9fqdu0kr6mi.jpg",
      "button_text": "Nhận báo giá"
    }
  }
]'::jsonb
-- Lưu ý: Hãy thay đổi điều kiện WHERE dưới đây cho đúng với tên dịch vụ trong DB của bạn
WHERE name ILIKE '%chuyển nhà%';