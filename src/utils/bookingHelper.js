// src/utils/bookingHelper.js

// 1. Hàm tạo chuỗi địa chỉ hiển thị
const generateLocationSummary = (bookingData) => {
    if (bookingData.from_address && bookingData.to_address) {
        return `${bookingData.from_address} ➝ ${bookingData.to_address}`;
    }
    return bookingData.address || bookingData.location || bookingData.from_address || 'Chưa cập nhật địa chỉ';
};

// 2. Hàm tính thời gian kết thúc
const calculateEndTime = (startTime, durationMinutes) => {
    const start = new Date(startTime);
    return new Date(start.getTime() + durationMinutes * 60000);
};

// 3. Hàm tính giá (Logic động)
const calculateFinalPrice = (service, bookingData) => {
    let finalPrice = Number(service.base_price);
    
    if (Array.isArray(service.layout_config)) {
        const pricingBlock = service.layout_config.find(block => block.type === 'pricing');
        if (pricingBlock?.data?.subservices && bookingData.subservice_id) {
            const selectedPackage = pricingBlock.data.subservices.find(
                pkg => pkg.id === bookingData.subservice_id
            );
            if (selectedPackage) {
                finalPrice = Number(selectedPackage.price);
            }
        }
    }
    return finalPrice;
};

// 4. Hàm validate form động (chuyển từ controller sang)
const validateDynamicFormData = (formSchema, bookingData) => {
    const errors = [];
    if (!formSchema) return errors;

    for (const field of formSchema) {
        const { field_name, field_type, label, required } = field;
        const value = bookingData[field_name];

        if (required && (value === undefined || value === null || value === '')) {
            errors.push({ field: field_name, message: `${label} là bắt buộc` });
            continue;
        }
        if (!value && !required) continue;

        if (field_type === 'number' && isNaN(value)) {
            errors.push({ field: field_name, message: `${label} phải là số` });
        }
    }
    return errors;
};

module.exports = {
    generateLocationSummary,
    calculateEndTime,
    calculateFinalPrice,
    validateDynamicFormData
};