-- Migration: Add layout_config to services table
-- Version: 1.0
-- Date: 2025-11-23

-- Add layout_config column
ALTER TABLE services 
ADD COLUMN layout_config JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN services.layout_config IS 
'Dynamic page layout configuration - Array of block objects. 
Example: [{"type": "hero", "data": {...}}, {"type": "pricing", "data": {...}}]';

-- Create index for better query performance
CREATE INDEX idx_services_layout_config ON services USING GIN (layout_config);

-- Example updated layout for existing services
UPDATE services
SET layout_config = '[
  {
    "type": "intro",
    "order": 0,
    "data": {
      "title": "Dịch vụ dọn nhà chuyên nghiệp",
      "banner_image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/intro-banner.jpg"
    }
  },
  {
    "type": "definition",
    "order": 1,
    "data": {
      "title": "Về dịch vụ",
      "content": "Chúng tôi cung cấp dịch vụ dọn dẹp nhà cửa chuyên nghiệp..."
    }
  },
  {
    "type": "pricing",
    "order": 2,
    "data": {
      "service_title": "Dọn nhà",
      "note": "Giá đã bao gồm VAT và vật tư cơ bản",
      "subservices": [
        {
          "subservice_title": "2 phòng",
          "price": 100000
        },
        {
          "subservice_title": "3 phòng",
          "price": 200000
        },
        {
          "subservice_title": "4+ phòng",
          "price": 300000
        }
      ]
    }
  },
  {
    "type": "tasktab",
    "order": 3,
    "data": {
      "title": "Chi tiết các công việc thực hiện",
      "tabs": [
        {
          "tab_title": "Nhà bếp",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/kitchen-cleaning.jpg",
          "description": "<ul><li>Rửa chén và xếp chén đĩa</li><li>Lau bụi và lau tất cả các bề mặt</li><li>Lau mặt ngoài tủ bếp, thiết bị gia dụng</li><li>Cọ rửa bếp, bồn rửa</li><li>Đổ rác và lau sàn</li></ul>"
        },
        {
          "tab_title": "Phòng tắm",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/bathroom-cleaning.jpg",
          "description": "<ul><li>Cọ rửa toilet, bồn cầu</li><li>Lau chùi vòi sen, bồn tắm, bồn rửa</li><li>Lau sạch gương và các vách kính</li><li>Sắp xếp gọn gàng vật dụng</li><li>Cọ rửa sàn nhà tắm</li></ul>"
        },
        {
          "tab_title": "Phòng khách",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/livingroom-cleaning.jpg",
          "description": "<ul><li>Quét bụi trần nhà, quạt trần</li><li>Lau bụi đồ nội thất, kệ tivi, bàn ghế</li><li>Lau các công tắc điện, tay nắm cửa</li><li>Đổ rác các thùng chứa</li><li>Hút bụi và lau sàn nhà</li></ul>"
        },
        {
          "tab_title": "Phòng ngủ",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/bedroom-cleaning.jpg",
          "description": "<ul><li>Thay ga trải giường (nếu có yêu cầu)</li><li>Sắp xếp lại giường ngủ gọn gàng</li><li>Lau bụi bàn trang điểm, tủ đầu giường</li><li>Lau sạch gương soi</li><li>Hút bụi thảm và lau sàn</li></ul>"
        }
      ]
    }
  },
  {
    "type": "process",
    "order": 4,
    "data": {
      "title": "Quy trình 3 bước vận chuyển chuyên nghiệp",
      "steps": [
        {
          "step_title": "Bước 1: Phân loại & Đóng gói",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/moving-step1.jpg",
          "description": "<ul><li><b>Phân loại:</b> Kiểm tra và phân loại đồ đạc theo kích thước, tính chất.</li><li><b>Tháo dỡ:</b> Tháo các thiết bị điện tử, giường tủ, kệ gỗ an toàn.</li><li><b>Đóng gói:</b> Dùng màng PE, xốp nổ bao bọc kỹ đồ dễ vỡ và đóng vào thùng carton.</li><li><b>Đánh dấu:</b> Ghi chú bên ngoài thùng để tránh nhầm lẫn.</li></ul>"
        },
        {
          "step_title": "Bước 2: Vận chuyển",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/moving-step2.jpg",
          "description": "<p>Xe tải chuyên dụng di chuyển đồ đạc đến địa điểm mới theo lộ trình an toàn và nhanh nhất. Đảm bảo tài sản không bị xô lệch, hư hỏng trong quá trình di chuyển.</p>"
        },
        {
          "step_title": "Bước 3: Lắp đặt & Bàn giao",
          "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/moving-step3.jpg",
          "description": "<ul><li><b>Bốc dỡ & Di chuyển:</b> Đưa đồ đạc vào đúng vị trí các phòng tại nhà mới.</li><li><b>Lắp ráp:</b> Lắp lại giường, tủ, máy lạnh và các thiết bị điện tử.</li><li><b>Nghiệm thu:</b> Khách hàng kiểm tra lại tình trạng đồ đạc và ký xác nhận hoàn thành công việc.</li></ul>"
        }
      ]
    }
  },
  {
    "type": "booking",
    "order": 5,
    "data": {
      "title": "Đặt lịch ngay hôm nay",
      "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1/booking-cta.jpg",
      "button_text": "Book now"
    }
  }
]'::jsonb
WHERE layout_config IS NULL OR layout_config = '[]'::jsonb;