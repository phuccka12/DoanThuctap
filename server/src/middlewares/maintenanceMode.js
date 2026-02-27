const jwt = require('jsonwebtoken');
const SystemConfig = require('../models/SystemConfig');

// ─── Cache ───────────────────────────────────────────────────────────────────
let cachedValue = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 giây

async function isMaintenanceOn() {
  const now = Date.now();
  if (now < cacheExpiry && cachedValue !== null) return cachedValue;
  try {
    const cfg = await SystemConfig.findOne({ key: 'maintenance_mode' }).lean();
    cachedValue = cfg?.value === 'true';
  } catch {
    cachedValue = false; // DB lỗi → không chặn user
  }
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedValue;
}

function invalidateMaintenanceCache() {
  cachedValue = null;
  cacheExpiry = 0;
}

// ─── Đọc role từ JWT (không throw nếu token lỗi/không có) ───────────────────
function getRoleFromToken(req) {
  try {
    let token = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    if (!token) return null;
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    return decoded.role || null; // 'admin' | 'user' | 'vip' | null
  } catch {
    return null; // token hết hạn / không hợp lệ → coi như user thường
  }
}

// ─── Routes luôn được phép (không cần đăng nhập hoặc bắt buộc phải có) ──────
// QUAN TRỌNG: /api/auth/ping có trong list này
// → MaintenancePage dùng ping (không có token) để kiểm tra khi nào bảo trì kết thúc
// → Khi maintenance ON: ping không có token → 503 (vì ping không trong PUBLIC_BYPASS... )
//   NHƯNG: ping CÓ trong PUBLIC_BYPASS → luôn 200 → MaintenancePage auto-retry sẽ redirect khi maintenance TẮT
// → MaintenanceGuard dùng ping có token → nếu là admin → next() → 200
//                                        → nếu là standard/vip → 503 ← bắt ở đây
const PUBLIC_BYPASS = [
  '/api/auth/ping',         // MaintenancePage auto-retry kiểm tra server còn sống không (không cần token)
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/admin',             // Admin panel luôn qua (admin routes có protect + admin middleware riêng)
  '/api/onboarding',        // user mới bắt buộc phải hoàn thành onboarding
  '/api/billing/plans',     // trang Pricing công khai
];

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   SMART LOCK MAINTENANCE MIDDLEWARE                  ║
 * ║   - PUBLIC routes  → luôn qua                       ║
 * ║   - Role ADMIN     → luôn qua (cửa sau)             ║
 * ║   - Role USER/VIP  → chặn 503 khi bảo trì           ║
 * ║   - Không token    → chặn 503 khi bảo trì           ║
 * ╚══════════════════════════════════════════════════════╝
 */
async function maintenanceModeMiddleware(req, res, next) {
  const url = req.originalUrl || req.url;

  // 1️⃣ Public routes → luôn cho qua
  if (PUBLIC_BYPASS.some(prefix => url.startsWith(prefix))) {
    return next();
  }

  // 2️⃣ Kiểm tra maintenance có bật không
  const on = await isMaintenanceOn().catch(() => false);
  if (!on) return next(); // không bảo trì → mọi người đi qua bình thường

  // 3️⃣ Đang bảo trì → xét role
  const role = getRoleFromToken(req);
  if (role === 'admin') {
    return next(); // 🔑 Admin vào cửa sau
  }
  return res.status(503).json({
    maintenance: true,
    message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
  });
}

module.exports = { maintenanceModeMiddleware, invalidateMaintenanceCache };
