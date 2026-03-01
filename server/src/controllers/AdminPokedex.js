'use strict';
/**
 * AdminPokedex.js — Quản lý Từ điển Thú cưng (Pet Pokedex)
 * Routes prefix: /api/admin/pokedex
 */
const PetSpecies = require('../models/PetSpecies');
const cloudinary  = require('../config/cloudinary');
const streamifier = require('streamifier');

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET /api/admin/pokedex
exports.listSpecies = async (req, res) => {
  try {
    const { active } = req.query;
    const q = {};
    if (active !== undefined) q.is_active = active === 'true';
    const list = await PetSpecies.find(q).sort({ created_at: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/pokedex   — tạo species mới
// multipart: image = base image level 1
exports.createSpecies = async (req, res) => {
  try {
    const { species_key, name, description, evolutions, milestones, buffs, is_active } = req.body;
    if (!species_key || !name) {
      return res.status(400).json({ success: false, message: 'Thiếu species_key / name' });
    }

    const exists = await PetSpecies.findOne({ species_key });
    if (exists) return res.status(409).json({ success: false, message: 'species_key đã tồn tại' });

    let base_image_url = '';
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'pet_species' });
      base_image_url = r.secure_url;
    }

    const parseArr = (v) => {
      if (!v) return [];
      try { return typeof v === 'string' ? JSON.parse(v) : v; }
      catch { return []; }
    };

    const species = await PetSpecies.create({
      species_key, name, description, base_image_url,
      evolutions: parseArr(evolutions),
      milestones:  parseArr(milestones),
      buffs:       parseArr(buffs),
      is_active:   is_active !== undefined ? is_active === 'true' || is_active === true : true,
      created_by:  req.userId,
    });

    return res.status(201).json({ success: true, data: species });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/pokedex/:id
exports.getSpecies = async (req, res) => {
  try {
    const s = await PetSpecies.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    return res.json({ success: true, data: s });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/pokedex/:id
exports.updateSpecies = async (req, res) => {
  try {
    const s = await PetSpecies.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const { name, description, evolutions, milestones, buffs, is_active } = req.body;
    const parseArr = (v) => {
      if (!v) return undefined;
      try { return typeof v === 'string' ? JSON.parse(v) : v; }
      catch { return undefined; }
    };

    if (name        !== undefined) s.name        = name;
    if (description !== undefined) s.description  = description;
    if (is_active   !== undefined) s.is_active    = is_active === 'true' || is_active === true;
    const evo = parseArr(evolutions); if (evo !== undefined) s.evolutions = evo;
    const mil = parseArr(milestones); if (mil !== undefined) s.milestones = mil;
    const buf = parseArr(buffs);      if (buf !== undefined) s.buffs      = buf;

    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'pet_species' });
      s.base_image_url = r.secure_url;
    }

    await s.save();
    return res.json({ success: true, data: s });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/pokedex/:id/evolution  — thêm 1 cột mốc tiến hóa + upload ảnh
exports.addEvolution = async (req, res) => {
  try {
    const s = await PetSpecies.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const { level, label } = req.body;
    if (!level) return res.status(400).json({ success: false, message: 'Thiếu level' });

    let image_url = '';
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'pet_species/evolutions' });
      image_url = r.secure_url;
    }

    s.evolutions.push({ level: Number(level), image_url, label: label || '' });
    s.evolutions.sort((a, b) => a.level - b.level);
    await s.save();

    return res.json({ success: true, data: s });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/pokedex/:id
exports.deleteSpecies = async (req, res) => {
  try {
    const s = await PetSpecies.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    return res.json({ success: true, message: 'Đã xóa species' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
