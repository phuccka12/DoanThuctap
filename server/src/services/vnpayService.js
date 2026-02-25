const crypto = require('crypto');
const qs     = require('qs');

/**
 * 1. HÀM SẮP XẾP VÀ ENCODE CHUẨN VNPAY
 * Bắt buộc phải mã hóa URI và chuyển khoảng trắng thành dấu '+'
 */
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

/**
 * 2. HÀM LẤY GIỜ CHUẨN GMT+7 (VN)
 * Tránh lỗi sai múi giờ khi deploy lên server thật (Render, AWS, VPS...)
 */
function formatVnTime(date) {
  // Ép múi giờ về Asia/Ho_Chi_Minh
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const pad = (n) => String(n).padStart(2, '0');
  
  return (
    tzDate.getFullYear().toString() +
    pad(tzDate.getMonth() + 1) +
    pad(tzDate.getDate()) +
    pad(tzDate.getHours()) +
    pad(tzDate.getMinutes()) +
    pad(tzDate.getSeconds())
  );
}

/**
 * 3. TẠO URL THANH TOÁN
 */
exports.createPaymentUrl = ({ txnRef, amount, orderInfo, ipAddr, locale = 'vn', returnUrl }) => {
  const VNPAY_TMN_CODE    = process.env.VNPAY_TMN_CODE;
  const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
  const VNPAY_URL         = process.env.VNPAY_URL;
  // Ưu tiên returnUrl được truyền vào, fallback về env
  const VNPAY_RETURN_URL  = returnUrl || process.env.VNPAY_RETURN_URL;

  const date       = new Date();
  const createDate = formatVnTime(date);
  // Hết hạn sau 15 phút
  const expireDate = formatVnTime(new Date(date.getTime() + 15 * 60 * 1000));

  const params = {
    vnp_Amount:     String(amount * 100),
    vnp_Command:    'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode:   'VND',
    vnp_ExpireDate: expireDate,
    vnp_IpAddr:     ipAddr,
    vnp_Locale:     locale,
    vnp_OrderInfo:  orderInfo,
    vnp_OrderType:  'other',
    vnp_ReturnUrl:  VNPAY_RETURN_URL,
    vnp_TmnCode:    VNPAY_TMN_CODE,
    vnp_TxnRef:     String(txnRef),
    vnp_Version:    '2.1.0',
  };

  // Sort và Encode dữ liệu
  const sorted = sortObject(params);

  // Hash dữ liệu (dùng encode: false vì đã xử lý ở hàm sortObject)
  const signData   = qs.stringify(sorted, { encode: false });
  const secureHash = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  // Gắn Hash vào URL (cũng dùng encode: false)
  const urlQuery = qs.stringify(sorted, { encode: false }) + `&vnp_SecureHash=${secureHash}`;

  console.log('[VNPay] TmnCode:', VNPAY_TMN_CODE);
  console.log('[VNPay] Tạo URL thành công cho mã đơn:', txnRef);

  return `${VNPAY_URL}?${urlQuery}`;
};

/**
 * 4. XÁC MINH CHỮ KÝ RETURN / IPN
 */
exports.verifyReturn = (query) => {
  const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
  
  // Tách secureHash ra khỏi các tham số còn lại
  let { vnp_SecureHash, vnp_SecureHashType, ...params } = query;

  // Sắp xếp và encode lại y như lúc tạo URL
  const sorted   = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });

  // Tính toán lại chữ ký
  const checkHash = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const isValid = checkHash === vnp_SecureHash;

  console.log('[VNPay verify] Hợp lệ:', isValid, '| Mã phản hồi:', query.vnp_ResponseCode);

  return {
    isValid:      isValid,
    responseCode: query.vnp_ResponseCode,
    txnRef:       query.vnp_TxnRef,
    amount:       Number(query.vnp_Amount) / 100,
    orderInfo:    query.vnp_OrderInfo,
    bankCode:     query.vnp_BankCode,
    transDate:    query.vnp_PayDate,
    vnpTxnNo:     query.vnp_TransactionNo,
  };
};      

//debug
const test=() => {
      console.log('[VNPay Return] isValid:', result.isValid, '| responseCode:', result.responseCode, '| txnRef:', result.txnRef);   
};


