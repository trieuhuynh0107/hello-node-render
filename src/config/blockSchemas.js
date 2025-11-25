/**
 * Dynamic Block Schemas - FINAL UPDATED VERSION
 * File: src/config/blockSchemas.js
 */

// 1. Định nghĩa các loại Block (Constants) để tránh gõ sai
const BLOCK_TYPES = {
  INTRO: 'intro',
  DEFINITION: 'definition',
  PRICING: 'pricing',
  TASK_TAB: 'tasktab',
  PROCESS: 'process',
  BOOKING: 'booking'
};

// 2. Schema chi tiết cho từng Block
const BLOCK_SCHEMAS = {
  // --- Block 1: Intro Section ---
  [BLOCK_TYPES.INTRO]: {
    type: BLOCK_TYPES.INTRO,
    name: 'Giới thiệu', // Đổi label thành name cho đồng bộ
    description: 'Banner giới thiệu với hình ảnh và nội dung',
    fields: {
      heading: { // User update: title -> heading
        type: 'text',
        label: 'Tiêu đề',
        required: true,
        placeholder: 'VD: Dịch vụ dọn nhà chuyên nghiệp'
      },
      content: {
        type: 'richtext',
        label: 'Nội dung',
        required: true,
        placeholder: 'Mô tả chi tiết về dịch vụ...'
      },
      image_url: { // User update: banner_image_url -> image_url
        type: 'image',
        label: 'Hình ảnh',
        required: true,
        accept: 'image/*',
        maxSize: 5242880 // 5MB
      },
      layout: {
        type: 'select',
        label: 'Bố cục',
        required: true,
        options: [
          { value: 'image-left', label: 'Hình bên trái' },
          { value: 'image-right', label: 'Hình bên phải' },
          { value: 'text-only', label: 'Chỉ văn bản' }
        ],
        default: 'image-left'
      }
    },
    defaultData: {
      heading: 'Dịch vụ dọn nhà theo giờ',
      content: 'Chúng tôi cung cấp dịch vụ dọn dẹp chuyên nghiệp...',
      image_url: '',
      layout: 'image-left'
    }
  },

  // --- Block 2: Definition/Features ---
  [BLOCK_TYPES.DEFINITION]: {
    type: BLOCK_TYPES.DEFINITION,
    name: 'Định nghĩa / Tính năng',
    description: 'Danh sách các tính năng nổi bật',
    fields: {
      heading: {
        type: 'text',
        label: 'Tiêu đề chung',
        required: true,
        placeholder: 'VD: Tại sao chọn chúng tôi?'
      },
      items: { // User update: content -> items (array)
        type: 'array',
        label: 'Danh sách tính năng',
        required: true,
        minItems: 1,
        maxItems: 10,
        itemSchema: {
          icon: { type: 'icon', label: 'Icon', required: false },
          title: { type: 'text', label: 'Tiêu đề', required: true },
          description: { type: 'textarea', label: 'Mô tả', required: true }
        }
      }
    },
    defaultData: {
      heading: 'Ưu điểm vượt trội',
      items: [
        { icon: 'fa-check', title: 'Chuyên nghiệp', description: 'Đội ngũ đào tạo bài bản' }
      ]
    }
  },

  // --- Block 3: Pricing Table ---
  [BLOCK_TYPES.PRICING]: {
    type: BLOCK_TYPES.PRICING,
    name: 'Bảng giá',
    description: 'Hiển thị bảng giá dịch vụ',
    fields: {
      service_title: {
        type: 'text',
        label: 'Tên dịch vụ',
        required: true,
        placeholder: 'VD: Dọn nhà theo phòng'
      },
      note: {
        type: 'textarea',
        label: 'Ghi chú chung',
        required: false
      },
      subservices: {
        type: 'array',
        label: 'Danh sách gói dịch vụ',
        required: true,
        minItems: 1,
        maxItems: 20,
        itemSchema: {
          subservice_title: { type: 'text', label: 'Tên gói', required: true },
          price: { type: 'number', label: 'Giá (VNĐ)', required: true, min: 0 }
        }
      }
    },
    defaultData: {
      service_title: 'Dọn nhà',
      note: 'Giá đã bao gồm VAT',
      subservices: [
        { subservice_title: '2 phòng ngủ', price: 150000 }
      ]
    }
  },

  // --- Block 4: Task Tabs ---
  [BLOCK_TYPES.TASK_TAB]: {
    type: BLOCK_TYPES.TASK_TAB,
    name: 'Tab công việc',
    description: 'Hiển thị các tab với nội dung khác nhau',
    fields: {
      heading: {
        type: 'text',
        label: 'Tiêu đề chung',
        required: true
      },
      tabs: {
        type: 'array',
        label: 'Danh sách tabs',
        required: true,
        minItems: 2,
        itemSchema: {
          title: { type: 'text', label: 'Tên tab', required: true },
          content: { type: 'richtext', label: 'Nội dung', required: true },
          image_url: { type: 'image', label: 'Hình ảnh', required: true }
        }
      }
    },
    defaultData: {
      heading: 'Quy trình làm việc',
      tabs: [
        { title: 'Bước 1', content: 'Mô tả...', image_url: '' }
      ]
    }
  },

  // --- Block 5: Process Timeline ---
  [BLOCK_TYPES.PROCESS]: {
    type: BLOCK_TYPES.PROCESS,
    name: 'Quy trình',
    description: 'Hiển thị quy trình từng bước',
    fields: {
      heading: {
        type: 'text',
        label: 'Tiêu đề chung',
        required: true
      },
      steps: {
        type: 'array',
        label: 'Danh sách bước',
        required: true,
        itemSchema: {
          number: { type: 'number', label: 'Số thứ tự', required: true, min: 1 },
          title: { type: 'text', label: 'Tiêu đề bước', required: true },
          description: { type: 'textarea', label: 'Mô tả', required: true },
          image_url: { type: 'image', label: 'Hình ảnh', required: true }
        }
      }
    },
    defaultData: {
      heading: 'Quy trình 4 bước',
      steps: [
        { number: 1, title: 'Đặt lịch', description: 'Chọn giờ...', image_url: '' }
      ]
    }
  },

  // --- Block 6: Booking Form (Dynamic) ---
  [BLOCK_TYPES.BOOKING]: {
    type: BLOCK_TYPES.BOOKING,
    name: 'Form đặt lịch',
    description: 'Khối booking với form động',
    fields: {
      title: {
        type: 'text',
        label: 'Tiêu đề',
        required: true
      },
      image_url: {
        type: 'image',
        label: 'Hình nền/ảnh',
        required: true
      },
      button_text: {
        type: 'text',
        label: 'Text nút',
        required: false, // Không bắt buộc vì có default
        default: 'Book now'
      },
      // Schema quy định cấu trúc của Form mà user sẽ điền
      form_schema: {
        type: 'array',
        label: 'Cấu hình fields của Form',
        required: true,
        itemSchema: {
          field_name: { type: 'text', label: 'Tên field (DB)', required: true },
          field_type: { 
            type: 'select', 
            label: 'Loại field', 
            required: true,
            options: [
              { value: 'text', label: 'Text' },
              { value: 'select', label: 'Dropdown' },
              { value: 'date', label: 'Date' }
              // ... thêm option nếu cần
            ]
          },
          label: { type: 'text', label: 'Label hiển thị', required: true },
          required: { type: 'boolean', label: 'Bắt buộc?', default: false },
          options: { type: 'array', label: 'Options (cho select)', required: false }
        }
      }
    },
    defaultData: {
      title: 'Đặt lịch ngay',
      image_url: '',
      button_text: 'Book now',
      form_schema: [
        { field_name: 'fullname', field_type: 'text', label: 'Họ tên', required: true },
        { field_name: 'phone', field_type: 'text', label: 'Số điện thoại', required: true }
      ]
    }
  }
};

/**
 * Validate block data theo schema (Updated Logic)
 * Hàm này kiểm tra tính hợp lệ của data user gửi lên so với schema đã định nghĩa
 */
const validateBlock = (blockType, blockData) => {
  const schema = BLOCK_SCHEMAS[blockType];
  
  if (!schema) {
    return {
      valid: false,
      errors: [`Block type "${blockType}" không tồn tại`]
    };
  }

  const errors = [];

  // Loop qua từng field định nghĩa trong schema
  Object.entries(schema.fields).forEach(([fieldName, fieldConfig]) => {
    const value = blockData[fieldName];

    // 1. Validate Required (Cho phép số 0, chặn null/undefined/empty string)
    if (fieldConfig.required) {
      const isEmpty = value === undefined || value === null || value === '';
      // Lưu ý: Nếu field là boolean (false) hoặc number (0) thì vẫn hợp lệ
      if (isEmpty && value !== 0 && value !== false) {
        errors.push(`Field "${fieldName}" (${fieldConfig.label}) là bắt buộc`);
        return;
      }
    }

    // 2. Validate Array
    if (fieldConfig.type === 'array') {
      // Nếu có value nhưng không phải array
      if (value && !Array.isArray(value)) {
        errors.push(`Field "${fieldName}" phải là danh sách (array)`);
        return;
      }

      // Check minItems (nếu array rỗng mà schema yêu cầu có item)
      if (fieldConfig.required && Array.isArray(value) && value.length === 0) {
        errors.push(`Field "${fieldName}" danh sách không được để trống`);
        return;
      }

      // Validate từng item bên trong array (Deep validate)
      if (Array.isArray(value) && fieldConfig.itemSchema) {
        value.forEach((item, index) => {
          Object.entries(fieldConfig.itemSchema).forEach(([subFieldName, subFieldConfig]) => {
            const subValue = item[subFieldName];
            
            // Check required cho sub-field
            if (subFieldConfig.required) {
              const isSubEmpty = subValue === undefined || subValue === null || subValue === '';
              if (isSubEmpty && subValue !== 0 && subValue !== false) {
                errors.push(`${fieldName}[${index}].${subFieldName} là bắt buộc`);
              }
            }
            
            // NOTE: Nếu trong tương lai itemSchema lại có array lồng nhau (nested array),
            // ta cần đệ quy (recursive) đoạn này. Hiện tại 1 cấp là đủ.
          });
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  BLOCK_TYPES,
  BLOCK_SCHEMAS,
  validateBlock
};