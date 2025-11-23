// utils/priceCalculator.js
// File này chứa logic nghiệp vụ để tính giá dựa trên Mục 9 của WebBE.pdf

/**
 * Tính giá cho dịch vụ Dọn dẹp nhà cửa (theo giờ)
 * @param {string} propertySize - Kích cỡ nhà (ví dụ: 'studio', '1br', '2br'...)
 * @returns {object} - { total: number }
 */
function calculateRegularCleaningPrice(propertySize) {
  // Logic từ Mục 9.1
  const baseHourlyRate = 25.00; // Bạn có thể đổi giá này
  const hoursBySize = {
    'studio': 2,
    '1br': 2.5,
    '2br': 3.5,
    '3br': 4.5,
    '4br_plus': 6
  };

  const hours = hoursBySize[propertySize] || 2; // Mặc định 2 giờ nếu propertySize không khớp
  const subtotal = baseHourlyRate * hours;
  const platformFee = subtotal * 0.10; // 10% phí nền tảng
  const total = subtotal + platformFee;

  return { total: total };
}

/**
 * Tính giá cho dịch vụ Chuyển nhà (trọn gói)
 * @param {string} propertySize - Kích cỡ nhà
 * @returns {object} - { total: number }
 */
function calculateMoveInOutPrice(propertySize) {
  // Logic từ Mục 9.2
  const packagePrices = {
    'studio': 120.00,
    '1br': 120.00,
    '2br': 160.00,
    '3br': 200.00,
    '4br_plus': 240.00
  };

  const subtotal = packagePrices[propertySize] || 120.00; // Mặc định gói thấp nhất
  const platformFee = subtotal * 0.10; // 10% phí nền tảng
  const total = subtotal + platformFee;

  return { total: total };
}

/**
 * Hàm chính: Tính giá dựa trên loại dịch vụ
 * @param {object} service - Toàn bộ đối tượng service (từ database)
 * @param {string} propertySize - Kích cỡ nhà
 * @returns {object} - { total: number }
 */
const calculatePrice = (service, propertySize) => {
  // Chúng ta dựa vào 'slug' (hoặc 'id') để quyết định dùng logic nào
  // Dựa trên script init-db.js:
  // 1: 'regular-cleaning'
  // 2: 'move-in-out-cleaning'
  
  if (service.id === 1 || service.slug === 'regular-cleaning') {
    return calculateRegularCleaningPrice(propertySize);
  } 
  
  if (service.id === 2 || service.slug === 'move-in-out-cleaning') {
    return calculateMoveInOutPrice(propertySize);
  }

  // Trường hợp dự phòng nếu service không khớp
  console.warn(`Không tìm thấy logic tính giá cho service ID: ${service.id}. Sử dụng giá cơ sở.`);
  return { total: service.base_price || 50.00 };
};

// Xuất hàm tính giá chính
module.exports = {
  calculatePrice,
};