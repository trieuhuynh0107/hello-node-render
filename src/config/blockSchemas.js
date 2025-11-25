/**
 * Dynamic Block Schemas - UPDATED VERSION
 * Định nghĩa cấu trúc data cho từng loại block
 */

const BLOCK_TYPES = {
  INTRO: 'intro',
  DEFINITION: 'definition',
  PRICING: 'pricing',
  TASK_TAB: 'tasktab',
  PROCESS: 'process',
  BOOKING: 'booking'
};

/**
 * Schema cho từng block type
 * Dùng để validate và generate form trong Admin UI
 */
const BLOCK_SCHEMAS = {
  // Block 1: Intro Section
  [BLOCK_TYPES.INTRO]: {
    name: 'Giới thiệu',
    description: 'Banner với hình ảnh và tiêu đề',
    fields: {
      title: { type: 'text', required: true, label: 'Tiêu đề' },
      banner_image_url: { type: 'image', required: true, label: 'Hình banner' }
    },
    defaultData: {
      title: 'Tiêu đề giới thiệu',
      banner_image_url: ''
    }
  },

  // Block 2: Definition/Features
  [BLOCK_TYPES.DEFINITION]: {
    name: 'Định nghĩa / Đặc điểm',
    description: 'Tiêu đề và nội dung mô tả',
    fields: {
      title: { type: 'text', required: true, label: 'Tiêu đề' },
      content: { type: 'richtext', required: true, label: 'Nội dung' }
    },
    defaultData: {
      title: 'Về dịch vụ',
      content: 'Mô tả chi tiết về dịch vụ...'
    }
  },

  // Block 3: Pricing Table (UPDATED)
  [BLOCK_TYPES.PRICING]: {
    name: 'Bảng giá',
    description: 'Hiển thị service với các subservices và giá',
    fields: {
      service_title: { type: 'text', required: true, label: 'Tên dịch vụ chính' },
      note: { type: 'textarea', required: false, label: 'Ghi chú chung' },
      subservices: {
        type: 'array',
        required: true,
        label: 'Danh sách gói phụ',
        itemSchema: {
          subservice_title: { type: 'text', required: true, label: 'Tên gói' },
          price: { type: 'number', required: true, label: 'Giá (VND)' }
        }
      }
    },
    defaultData: {
      service_title: 'Dọn nhà',
      note: 'Giá đã bao gồm VAT',
      subservices: [
        {
          subservice_title: '2 phòng',
          price: 100000
        },
        {
          subservice_title: '3 phòng',
          price: 200000
        }
      ]
    }
  },

  // Block 4: Task Tabs
  [BLOCK_TYPES.TASK_TAB]: {
    name: 'Tab công việc',
    description: 'Các tab hiển thị chi tiết công việc',
    fields: {
      title: { type: 'text', required: true, label: 'Tiêu đề chung' },
      tabs: {
        type: 'array',
        required: true,
        label: 'Danh sách tab',
        itemSchema: {
          tab_title: { type: 'text', required: true, label: 'Tiêu đề tab' },
          image_url: { type: 'image', required: true, label: 'Hình ảnh' },
          description: { type: 'richtext', required: true, label: 'Mô tả' }
        }
      }
    },
    defaultData: {
      title: 'Quy trình làm việc',
      tabs: [
        {
          tab_title: 'Bước 1',
          image_url: '',
          description: 'Mô tả bước 1...'
        }
      ]
    }
  },

  // Block 5: Process Timeline (UPDATED)
  [BLOCK_TYPES.PROCESS]: {
    name: 'Quy trình',
    description: 'Timeline hiển thị quy trình từng bước',
    fields: {
      title: { type: 'text', required: true, label: 'Tiêu đề chung' },
      steps: {
        type: 'array',
        required: true,
        label: 'Các bước',
        itemSchema: {
          step_title: { type: 'text', required: true, label: 'Tên bước' },
          description: { type: 'textarea', required: true, label: 'Mô tả' },
          image_url: { type: 'image', required: true, label: 'Hình ảnh' }
        }
      }
    },
    defaultData: {
      title: 'Quy trình 4 bước',
      steps: [
        {
          step_title: 'Đặt lịch',
          description: 'Chọn thời gian phù hợp',
          image_url: ''
        }
      ]
    }
  },

  // Block 6: Booking Form (UPDATED)
  [BLOCK_TYPES.BOOKING]: {
    name: 'Form đặt lịch',
    description: 'Khu vực kêu gọi đặt lịch với CTA',
    fields: {
      title: { type: 'text', required: true, label: 'Tiêu đề' },
      image_url: { type: 'image', required: true, label: 'Hình ảnh' }
      // button_text cố định "Book now" - không cần field
    },
    defaultData: {
      title: 'Đặt lịch ngay hôm nay',
      image_url: '',
      button_text: 'Book now' // Cố định
    }
  }
};

/**
 * Validate block data theo schema
 */
const validateBlock = (blockType, blockData) => {
  const schema = BLOCK_SCHEMAS[blockType];
  
  if (!schema) {
    return {
      valid: false,
      errors: [`Block type "${blockType}" không hợp lệ`]
    };
  }

  const errors = [];

  // Validate required fields
  Object.entries(schema.fields).forEach(([fieldName, fieldConfig]) => {
    if (fieldConfig.required && !blockData[fieldName]) {
      errors.push(`Field "${fieldName}" là bắt buộc`);
    }

    // Validate array items
    if (fieldConfig.type === 'array' && blockData[fieldName]) {
      const items = blockData[fieldName];
      
      if (!Array.isArray(items)) {
        errors.push(`Field "${fieldName}" phải là array`);
        return;
      }

      items.forEach((item, index) => {
        Object.entries(fieldConfig.itemSchema).forEach(([itemFieldName, itemFieldConfig]) => {
          if (itemFieldConfig.required && !item[itemFieldName]) {
            errors.push(`${fieldName}[${index}].${itemFieldName} là bắt buộc`);
          }
        });
      });
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