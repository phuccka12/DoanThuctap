'use strict';
/**
 * AdminShop.js — CRUD vật phẩm cửa hàng + upload ảnh Cloudinary
 * Routes prefix: /api/admin/shop
 */
const ShopItem = require('../models/ShopItem');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper upload buffer → Cloudinary
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET /api/admin/shop
exports.listItems = async (req, res) => {
  try {
    const { category, active, page = 1, limit = 50 } = req.query;
    const q = {};
    if (category) q.category = category;
    if (active !== undefined) q.is_active = active === 'true';
    const total = await ShopItem.countDocuments(q);
    const items = await ShopItem.find(q)
      .sort({ sort_order: 1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('created_by', 'user_name email');
    return res.json({ success: true, data: items, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/shop   (multipart/form-data với field "image")
exports.createItem = async (req, res) => {
  try {
    const { name, description, category, price, effects, is_active, sort_order } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu name / category / price' });
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Giá không hợp lệ' });
    }

    let effectsParsed = {};
    if (effects) {
      try { effectsParsed = typeof effects === 'string' ? JSON.parse(effects) : effects; }
      catch { return res.status(400).json({ success: false, message: 'effects phải là JSON hợp lệ' }); }
    }

    let image_url = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'shop_items',
        transformation: [{ width: 128, height: 128, crop: 'pad', background: 'transparent' }],
      });
      image_url = result.secure_url;
    }

    const item = await ShopItem.create({
      name, description, category, price: priceNum,
      effects: effectsParsed, image_url,
      is_active: is_active !== undefined ? is_active === 'true' || is_active === true : true,
      sort_order: Number(sort_order) || 0,
      created_by: req.userId,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/shop/:id
exports.getItem = async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id).populate('created_by', 'user_name email');
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy vật phẩm' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/shop/:id   (có thể upload ảnh mới)
exports.updateItem = async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy vật phẩm' });

    const { name, description, category, price, effects, is_active, sort_order } = req.body;
    if (name       !== undefined) item.name        = name;
    if (description!== undefined) item.description  = description;
    if (category   !== undefined) item.category     = category;
    if (price      !== undefined) item.price        = Number(price);
    if (sort_order !== undefined) item.sort_order    = Number(sort_order);
    if (is_active  !== undefined) item.is_active     = is_active === 'true' || is_active === true;
    if (effects    !== undefined) {
      try { item.effects = typeof effects === 'string' ? JSON.parse(effects) : effects; }
      catch { return res.status(400).json({ success: false, message: 'effects phải là JSON hợp lệ' }); }
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'shop_items',
        transformation: [{ width: 128, height: 128, crop: 'pad', background: 'transparent' }],
      });
      item.image_url = result.secure_url;
    }

    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/shop/:id  (soft delete: is_active = false)
exports.deleteItem = async (req, res) => {
  try {
    const item = await ShopItem.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy vật phẩm' });
    return res.json({ success: true, message: 'Đã ẩn vật phẩm', data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/shop/:id/hard  (xóa thật)
exports.hardDeleteItem = async (req, res) => {
  try {
    const item = await ShopItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy vật phẩm' });
    return res.json({ success: true, message: 'Đã xóa vật phẩm vĩnh viễn' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
