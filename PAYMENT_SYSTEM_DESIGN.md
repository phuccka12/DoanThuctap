# 💳 Hệ Thống Thanh Toán - IELTS Learning Platform

## 🎯 Mục Tiêu
Xây dựng hệ thống quản lý thanh toán cho các khóa học IELTS với các gói học khác nhau.

---

## 📦 1. CÁC GÓI HỌC (PACKAGES)

### Gói FREE (Miễn Phí)
- ✅ Truy cập 10 chủ đề cơ bản
- ✅ 100 từ vựng
- ✅ 5 bài listening
- ❌ Không có video lessons
- ❌ Không có mock tests
- ❌ Không có AI chatbot
- **Giá:** 0đ

### Gói BASIC (Cơ Bản)
- ✅ Tất cả nội dung FREE
- ✅ 50 chủ đề
- ✅ 2000 từ vựng
- ✅ 100 bài listening
- ✅ 30 video lessons
- ✅ 10 mock tests
- ❌ Không có AI chatbot
- **Giá:** 299,000đ/tháng hoặc 2,990,000đ/năm

### Gói PREMIUM (VIP)
- ✅ Tất cả nội dung BASIC
- ✅ Không giới hạn chủ đề
- ✅ Không giới hạn từ vựng
- ✅ Không giới hạn listening/video
- ✅ Không giới hạn mock tests
- ✅ AI Chatbot hỗ trợ 24/7
- ✅ Speaking practice với AI
- ✅ Writing correction
- ✅ Chứng chỉ hoàn thành
- **Giá:** 599,000đ/tháng hoặc 5,990,000đ/năm

---

## 🗄️ 2. DATABASE SCHEMA

### Collection: `packages`
```javascript
{
  _id: ObjectId,
  name: "Basic",
  slug: "basic",
  description: "Gói học cơ bản cho người mới bắt đầu",
  features: [
    "50 chủ đề",
    "2000 từ vựng",
    "100 bài listening",
    "30 video lessons",
    "10 mock tests"
  ],
  pricing: {
    monthly: 299000,    // VNĐ
    yearly: 2990000,
    currency: "VND"
  },
  limits: {
    topics: 50,
    vocabulary: 2000,
    listening: 100,
    videos: 30,
    mockTests: 10,
    aiChatbot: false
  },
  is_active: true,
  sort_order: 2,
  created_at: Date,
  updated_at: Date
}
```

### Collection: `subscriptions`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,          // Ref: users
  package_id: ObjectId,        // Ref: packages
  
  // Thông tin thanh toán
  payment_method: "vnpay",     // vnpay, momo, zalopay, card
  billing_cycle: "monthly",    // monthly, yearly, lifetime
  
  // Trạng thái
  status: "active",            // pending, active, expired, cancelled
  
  // Thời gian
  start_date: Date,
  end_date: Date,              // null nếu lifetime
  next_billing_date: Date,
  cancelled_at: Date,
  
  // Thống kê
  auto_renew: true,
  trial_used: false,
  
  created_at: Date,
  updated_at: Date
}
```

### Collection: `transactions`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  subscription_id: ObjectId,
  
  // Thông tin giao dịch
  transaction_code: "VNP20260202123456",  // Mã từ cổng thanh toán
  amount: 299000,
  currency: "VND",
  
  // Phương thức
  payment_method: "vnpay",
  payment_gateway: "vnpay",
  
  // Trạng thái
  status: "success",           // pending, success, failed, refunded
  
  // Chi tiết từ cổng thanh toán
  gateway_response: {
    vnp_TransactionNo: "123456789",
    vnp_BankCode: "NCB",
    vnp_CardType: "ATM",
    vnp_ResponseCode: "00"
  },
  
  // Metadata
  description: "Thanh toán gói Basic - Tháng 02/2026",
  ip_address: "192.168.1.1",
  
  created_at: Date,
  updated_at: Date
}
```

### Thêm vào Collection `users`:
```javascript
{
  // ... existing fields
  
  // Subscription info
  current_subscription: {
    package_id: ObjectId,
    package_name: "Basic",
    status: "active",
    end_date: Date
  },
  
  // Usage tracking
  usage_stats: {
    topics_accessed: 25,
    vocabulary_learned: 500,
    listening_completed: 30,
    videos_watched: 15,
    mock_tests_taken: 3
  }
}
```

---

## 🔧 3. API ENDPOINTS

### A. Package Management (Admin)
```
GET    /api/admin/packages           - Danh sách tất cả gói
POST   /api/admin/packages           - Tạo gói mới
PUT    /api/admin/packages/:id       - Cập nhật gói
DELETE /api/admin/packages/:id       - Xóa gói
```

### B. Subscription Management (User)
```
GET    /api/subscriptions            - Subscription hiện tại của user
POST   /api/subscriptions/subscribe  - Đăng ký gói mới
POST   /api/subscriptions/cancel     - Hủy đăng ký
POST   /api/subscriptions/renew      - Gia hạn
GET    /api/subscriptions/history    - Lịch sử đăng ký
```

### C. Payment Processing
```
POST   /api/payments/create          - Tạo yêu cầu thanh toán
GET    /api/payments/vnpay/return    - VNPay callback (return_url)
POST   /api/payments/vnpay/ipn       - VNPay IPN (webhook)
GET    /api/payments/momo/callback   - Momo callback
POST   /api/payments/momo/ipn        - Momo IPN
```

### D. Transaction History
```
GET    /api/transactions             - Lịch sử giao dịch của user
GET    /api/transactions/:id         - Chi tiết giao dịch
GET    /api/admin/transactions       - Tất cả giao dịch (Admin)
```

---

## 🔐 4. MIDDLEWARE & AUTHORIZATION

### Check Subscription Middleware
```javascript
// middlewares/checkSubscription.js
const checkSubscription = (requiredPackage = 'basic') => {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id)
      .populate('current_subscription.package_id');
    
    // Free users
    if (!user.current_subscription) {
      if (requiredPackage === 'free') return next();
      return res.status(403).json({
        message: 'Vui lòng nâng cấp gói để truy cập nội dung này'
      });
    }
    
    // Check expiration
    const subscription = await Subscription.findOne({
      user_id: user._id,
      status: 'active',
      end_date: { $gt: new Date() }
    });
    
    if (!subscription) {
      return res.status(403).json({
        message: 'Gói học đã hết hạn. Vui lòng gia hạn.'
      });
    }
    
    // Check package level
    const packageLevels = { free: 0, basic: 1, premium: 2 };
    if (packageLevels[subscription.package.slug] < packageLevels[requiredPackage]) {
      return res.status(403).json({
        message: 'Nâng cấp lên gói cao hơn để sử dụng tính năng này'
      });
    }
    
    req.subscription = subscription;
    next();
  };
};
```

### Sử dụng:
```javascript
// Chỉ Premium users
router.get('/api/ai-chatbot', protect, checkSubscription('premium'), getChatbot);

// Basic trở lên
router.get('/api/mock-tests', protect, checkSubscription('basic'), getMockTests);

// Free users
router.get('/api/topics', protect, checkSubscription('free'), getTopics);
```

---

## 💳 5. PAYMENT GATEWAY INTEGRATION

### A. VNPay (Recommended cho VN)

**Ưu điểm:**
- ✅ Phổ biến nhất VN
- ✅ Hỗ trợ ATM, Visa, MasterCard, QR
- ✅ Phí thấp (1.5-2%)
- ✅ Dễ tích hợp

**Flow:**
```
1. User chọn gói → Click "Thanh toán"
2. Backend tạo payment URL với VNPay
3. Redirect user đến VNPay gateway
4. User nhập thông tin thẻ/chọn ngân hàng
5. VNPay xử lý → Redirect về return_url
6. Backend verify signature → Cập nhật subscription
7. VNPay gửi IPN → Backend confirm lại
```

**Code mẫu:**
```javascript
// services/vnpayService.js
const crypto = require('crypto');
const querystring = require('querystring');

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNPAY_TMN_CODE;
    this.vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
    this.vnp_Url = process.env.VNPAY_URL;
    this.vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;
  }

  createPaymentUrl(orderId, amount, orderInfo, ipAddr) {
    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60000));

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    // Sort params
    vnp_Params = this.sortObject(vnp_Params);

    // Create signature
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    return this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  }

  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }
}

module.exports = new VNPayService();
```

### B. Momo (Ví điện tử)

**Ưu điểm:**
- ✅ Phổ biến với giới trẻ
- ✅ Thanh toán nhanh qua app
- ✅ QR code payment

**Flow tương tự VNPay**

---

## 🎨 6. FRONTEND COMPONENTS

### A. Package Selection Page
```jsx
// pages/Subscription/Packages.jsx
const Packages = () => {
  const packages = [
    {
      name: "Free",
      price: 0,
      features: ["10 chủ đề", "100 từ vựng", "5 bài listening"]
    },
    {
      name: "Basic",
      price: 299000,
      features: ["50 chủ đề", "2000 từ vựng", "100 bài listening", "30 videos"]
    },
    {
      name: "Premium",
      price: 599000,
      features: ["Không giới hạn", "AI Chatbot", "Speaking practice"]
    }
  ];

  return (
    <div className="packages-grid">
      {packages.map(pkg => (
        <PackageCard key={pkg.name} package={pkg} />
      ))}
    </div>
  );
};
```

### B. Payment Checkout
```jsx
// components/PaymentCheckout.jsx
const PaymentCheckout = ({ package, billingCycle }) => {
  const handlePayment = async (method) => {
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package_id: package._id,
        billing_cycle: billingCycle,
        payment_method: method
      })
    });

    const { paymentUrl } = await response.json();
    window.location.href = paymentUrl; // Redirect to VNPay
  };

  return (
    <div className="payment-methods">
      <button onClick={() => handlePayment('vnpay')}>
        <img src="/vnpay.png" /> Thanh toán qua VNPay
      </button>
      <button onClick={() => handlePayment('momo')}>
        <img src="/momo.png" /> Thanh toán qua Momo
      </button>
    </div>
  );
};
```

### C. Subscription Status Badge
```jsx
// components/SubscriptionBadge.jsx
const SubscriptionBadge = ({ user }) => {
  const subscription = user.current_subscription;
  
  if (!subscription) {
    return <span className="badge badge-gray">Free</span>;
  }

  const colors = {
    basic: 'badge-blue',
    premium: 'badge-purple'
  };

  return (
    <span className={`badge ${colors[subscription.package_name.toLowerCase()]}`}>
      {subscription.package_name}
      {subscription.end_date && (
        <small> - Hết hạn {formatDate(subscription.end_date)}</small>
      )}
    </span>
  );
};
```

---

## 🔄 7. BACKGROUND JOBS

### A. Check Expired Subscriptions (Daily)
```javascript
// jobs/checkExpiredSubscriptions.js
const cron = require('node-cron');

// Chạy mỗi ngày lúc 00:00
cron.schedule('0 0 * * *', async () => {
  const expiredSubscriptions = await Subscription.find({
    status: 'active',
    end_date: { $lt: new Date() }
  });

  for (const sub of expiredSubscriptions) {
    sub.status = 'expired';
    await sub.save();

    // Update user
    await User.findByIdAndUpdate(sub.user_id, {
      'current_subscription.status': 'expired'
    });

    // Send email notification
    await sendEmail({
      to: sub.user.email,
      subject: 'Gói học đã hết hạn',
      template: 'subscription-expired'
    });
  }
});
```

### B. Auto Renewal (Daily)
```javascript
// jobs/autoRenewal.js
cron.schedule('0 1 * * *', async () => {
  const subsToRenew = await Subscription.find({
    status: 'active',
    auto_renew: true,
    next_billing_date: {
      $gte: new Date(),
      $lt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  for (const sub of subsToRenew) {
    // Create new transaction
    // Call payment gateway
    // If success, extend subscription
  }
});
```

---

## 📊 8. ADMIN DASHBOARD

### Revenue Statistics
- Tổng doanh thu theo tháng/năm
- Số lượng subscriptions theo gói
- Tỷ lệ chuyển đổi Free → Paid
- Tỷ lệ gia hạn (renewal rate)
- Top users theo doanh thu

### Transaction Management
- Danh sách tất cả giao dịch
- Filter theo trạng thái, phương thức
- Export Excel/CSV
- Refund processing

---

## 🚀 9. IMPLEMENTATION PLAN

### Phase 1: Database & Models (1 ngày)
- [ ] Tạo Package model
- [ ] Tạo Subscription model
- [ ] Tạo Transaction model
- [ ] Update User model

### Phase 2: Backend API (2-3 ngày)
- [ ] Package CRUD (Admin)
- [ ] Subscription APIs
- [ ] VNPay integration
- [ ] Payment processing
- [ ] Middleware (checkSubscription)

### Phase 3: Frontend (3-4 ngày)
- [ ] Package selection page
- [ ] Payment checkout flow
- [ ] Subscription dashboard
- [ ] Transaction history
- [ ] Admin management UI

### Phase 4: Testing & Deployment (1-2 ngày)
- [ ] Test VNPay sandbox
- [ ] Test subscription flow
- [ ] Test expiration & renewal
- [ ] Deploy to production

**Total: ~7-10 ngày**

---

## 📝 10. NOTES

### VNPay Sandbox
- Đăng ký tài khoản test tại: https://sandbox.vnpayment.vn/
- Sử dụng thẻ test: `9704198526191432198` (NCB)
- OTP test: `123456`

### Security Considerations
- ✅ Verify signature từ payment gateway
- ✅ Validate amount trước khi cập nhật subscription
- ✅ Log tất cả transactions
- ✅ Implement idempotency (tránh duplicate payments)
- ✅ Rate limiting cho payment endpoints

### User Experience
- ✅ Show clear pricing comparison
- ✅ Highlight "Most Popular" package
- ✅ Allow free trial (7 ngày) cho Premium
- ✅ Easy cancellation process
- ✅ Email notifications cho mọi thay đổi

---

Bạn muốn tôi bắt đầu implement từ đâu? 🚀
