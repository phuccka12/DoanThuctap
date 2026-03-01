'use strict';
/**
 * ShopController.js — User mua vật phẩm + xem shop + dùng item
 * Routes prefix: /api/shop
 */
const ShopItem  = require('../models/ShopItem');
const Pet       = require('../models/Pet');
const CoinLog   = require('../models/CoinLog');
const { spendCoins, useItem } = require('../services/economyService');

// GET /api/shop  — danh sách vật phẩm đang bán
exports.listShop = async (req, res) => {
  try {
    const { category } = req.query;
    const q = { is_active: true };
    if (category) q.category = category;
    const items = await ShopItem.find(q).sort({ sort_order: 1, category: 1 }).lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/shop/buy  — mua vật phẩm
// body: { itemId, qty }
exports.buyItem = async (req, res) => {
  try {
    const { itemId, qty = 1 } = req.body;
    if (!itemId) return res.status(400).json({ success: false, message: 'Thiếu itemId' });

    const result = await spendCoins(req.userId, itemId, Number(qty) || 1);
    return res.json({
      success: true,
      message: `Mua thành công ${result.qty}x ${result.item.name}`,
      data: {
        coins_left: result.pet.coins,
        inventory:  result.pet.inventory,
        pet:        result.pet,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/shop/use  — dùng vật phẩm từ inventory
// body: { itemId, qty }
exports.useItemHandler = async (req, res) => {
  try {
    const { itemId, qty = 1 } = req.body;
    if (!itemId) return res.status(400).json({ success: false, message: 'Thiếu itemId' });

    const result = await useItem(req.userId, itemId, Number(qty) || 1);
    return res.json({
      success: true,
      message: 'Đã dùng vật phẩm',
      data: {
        appliedEffects: result.appliedEffects,
        pet:            result.pet,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/shop/inventory  — túi đồ của user
exports.getInventory = async (req, res) => {
  try {
    const pet = await Pet.findOne({ user: req.userId });
    if (!pet) return res.json({ success: true, data: [] });

    // Populate item info
    const itemIds = pet.inventory.map(i => i.itemId);
    const items   = await ShopItem.find({ _id: { $in: itemIds } }).lean();
    const itemMap = {};
    items.forEach(i => { itemMap[i._id.toString()] = i; });

    const inventory = pet.inventory
      .filter(i => i.qty > 0)
      .map(i => ({
        ...i.toObject(),
        item: itemMap[i.itemId] || null,
      }));

    return res.json({ success: true, data: inventory, coins: pet.coins });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/shop/ranking  — bảng xếp hạng pet level toàn server
exports.getRanking = async (req, res) => {
  try {
    const pets = await Pet.find({})
      .sort({ level: -1, growthPoints: -1 })
      .limit(50)
      .populate('user', 'user_name avatar')
      .populate('speciesRef', 'name species_key base_image_url evolutions')
      .lean();

    const ranking = pets.map((p, idx) => ({
      rank:         idx + 1,
      userId:       p.user?._id,
      user_name:    p.user?.user_name,
      avatar:       p.user?.avatar,
      petLevel:     p.level,
      growthPoints: p.growthPoints,
      coins:        p.coins,
      speciesName:  p.speciesRef?.name || p.petType,
      streakCount:  p.streakCount,
    }));

    return res.json({ success: true, data: ranking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
