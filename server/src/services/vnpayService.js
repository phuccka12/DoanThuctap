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

/**
 * 5. QUERY TRANSACTION STATUS (VNPay querydr API)
 * Dùng để Admin đồng bộ trạng thái giao dịch VNPay
 */
exports.queryTransaction = async ({ txnRef, transDate, ipAddr }) => {
  const https  = require('https');
  const VNPAY_TMN_CODE    = process.env.VNPAY_TMN_CODE;
  const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
  const VNPAY_API_URL     = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

  const requestTime = formatVnTime(new Date());
  const txDate      = formatVnTime(new Date(transDate));

  const params = {
    vnp_RequestId:   `${Date.now()}`,
    vnp_Version:     '2.1.0',
    vnp_Command:     'querydr',
    vnp_TmnCode:     VNPAY_TMN_CODE,
    vnp_TxnRef:      String(txnRef),
    vnp_OrderInfo:   `Query ${txnRef}`,
    vnp_TransDate:   txDate,
    vnp_CreateDate:  requestTime,
    vnp_IpAddr:      ipAddr,
  };

  const signStr = [
    params.vnp_RequestId, params.vnp_Version, params.vnp_Command,
    params.vnp_TmnCode, params.vnp_TxnRef, params.vnp_TransDate,
    params.vnp_CreateDate, params.vnp_IpAddr, params.vnp_OrderInfo,
  ].join('|');

  params.vnp_SecureHash = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signStr, 'utf-8'))
    .digest('hex');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(params);
    const url  = new URL(VNPAY_API_URL);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res2) => {
      let data = '';
      res2.on('data', (c) => { data += c; });
      res2.on('end', () => {
        // Nếu VNPay trả về HTML (403/5xx gateway error) thay vì JSON
        if (data.trim().startsWith('<')) {
          const httpStatus = res2.statusCode;
          reject(new Error(`VNPay Query API trả về HTTP ${httpStatus}. Tài khoản sandbox có thể chưa được cấp quyền Query API.`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('VNPay response không hợp lệ: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', (e) => reject(new Error('Không thể kết nối VNPay Query API: ' + e.message)));
    req.write(body);
    req.end();
  });
};
