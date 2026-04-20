const AIUsage = require('../models/AIUsage');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Transaction = require('../models/Transaction');

const DEFAULT_QUOTA = {
    speaking_checks_per_day: 100, // Tăng từ 3 lên 100 để test thoải mái
    writing_checks_per_day: 100,  // Tăng từ 3 lên 100 
    ai_chat_messages_per_day: 500,
    ai_roleplay_sessions_per_day: 50,
    reading_passages_access: 'full', // Chuyển sang full để không bị chặn
};

const SUPPORTED_FEATURES = new Set([
    'speaking',
    'writing',
    'conversation',
    'recommendation',
    'translation',
]);

/**
 * Lấy thông tin gói cước hiện tại của người dùng.
 */
async function getActivePlan(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    // 1. Admin: Quyền tối thượng
    if (user.role === 'admin') {
        return { 
            slug: 'admin', 
            quota: {
                ...DEFAULT_QUOTA,
                speaking_checks_per_day: -1, 
                writing_checks_per_day: -1, 
                ai_chat_messages_per_day: -1, 
                ai_roleplay_sessions_per_day: -1,
                reading_passages_access: 'full',
            } 
        };
    }

    // 2. VIP (Pro hoặc Premium): Check Transaction thành công gần nhất hoăc có role vip
    // Nếu role là vip nhưng expire_at bị null (do set tay), vẫn ưu tiên cho qua trong môi trường dev
    const isVip = user.role === 'vip' && (!user.vip_expire_at || user.vip_expire_at > new Date());
    
    if (isVip) {
        const lastTx = await Transaction.findOne({
            user_id: userId,
            status: 'success',
        })
        .populate('plan_id')
        .sort({ created_at: -1 });

        if (lastTx && lastTx.plan_id) {
            return {
                slug: lastTx.plan_id.slug,
                quota: {
                    ...DEFAULT_QUOTA,
                    ...(lastTx.plan_id.quota || {}),
                }
            };
        }
    }

    // 3. Mặc định: Gói Free
    const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
    return {
        slug: 'free',
        quota: {
            ...DEFAULT_QUOTA,
            ...(freePlan?.quota || {}),
        }
    };
}

/**
 * Kiểm tra xem người dùng còn lượt sử dụng AI hay không và dùng mode nào.
 */
async function checkQuota(userId, feature) {
    if (!SUPPORTED_FEATURES.has(feature)) {
        return {
            allowed: false,
            reason: `Tính năng AI không hợp lệ: ${feature}`,
        };
    }

    const plan = await getActivePlan(userId);
    if (!plan) return { allowed: false, reason: 'User or plan not found' };

    // 🔴 1. Chặn tính năng cao cấp cho gói Free
    if (plan.slug === 'free' && feature === 'conversation') {
        return { 
            allowed: false, 
            reason: `Tính năng Hội thoại AI chỉ dành cho tài khoản PRO/PREMIUM. Hãy nâng cấp để trải nghiệm nhé! 💎` 
        };
    }

    // 2. Kiểm tra quota ngày
    const today = new Date().toISOString().split('T')[0];
    let usage = await AIUsage.findOne({ user_id: userId, date: today });

    if (!usage) {
        usage = await AIUsage.create({ user_id: userId, date: today });
    }

    if (usage.ai_blocked) {
        return { allowed: false, reason: usage.blocked_reason || 'AI usage is blocked by admin.' };
    }

    // Map feature to limit
    let limit = 0;
    let currentUsage = 0;

    if (feature === 'speaking') {
        limit = plan.quota.speaking_checks_per_day;
        currentUsage = usage.speaking_checks || 0;
    } else if (feature === 'writing') {
        limit = plan.quota.writing_checks_per_day;
        currentUsage = usage.writing_checks || 0;
    } else if (feature === 'conversation') { // Roleplay
        limit = plan.quota.ai_roleplay_sessions_per_day;
        currentUsage = usage.ai_roleplay_sessions || 0;
    } else if (feature === 'recommendation') { // AI Chat
        limit = plan.quota.ai_chat_messages_per_day;
        currentUsage = usage.ai_chat_messages || 0;
    } else if (feature === 'translation') {
        // Translation cho phép vô hạn vì đã có cơ chế Offline/Online phân tầng
        limit = -1; 
        currentUsage = usage.translation_checks || 0;
    }

    // Determine mode
    const mode = ((feature === 'writing' || feature === 'translation') && plan.slug === 'free') ? 'offline' : 'online';

    // FOR THESIS DEFENSE: Always allow
    return { 
        allowed: true, 
        mode: mode, 
        remaining: 999 
    };
}

/**
 * Ghi nhận một lượt sử dụng AI.
 */
async function incrementUsage(userId, feature) {
    const today = new Date().toISOString().split('T')[0];
    const update = {};
    
    if (feature === 'speaking') update.speaking_checks = 1;
    else if (feature === 'writing') update.writing_checks = 1;
    else if (feature === 'translation') update.translation_checks = 1;
    else if (feature === 'conversation') update.ai_roleplay_sessions = 1;
    else if (feature === 'recommendation') update.ai_chat_messages = 1;

    await AIUsage.findOneAndUpdate(
        { user_id: userId, date: today },
        { $inc: update },
        { upsert: true }
    );
}

module.exports = {
    checkQuota,
    incrementUsage,
    getActivePlan
};
