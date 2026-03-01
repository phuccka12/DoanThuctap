const mongoose = require('mongoose');

/**
 * PetSpecies – Từ điển / Pokedex Thú cưng
 * Admin định nghĩa loài mới, các mốc tiến hóa, và buff.
 *
 * evolutions: mảng các cột mốc tiến hóa theo level
 *   { level: 10, image_url: '...', label: 'Mèo Trưởng Thành' }
 *
 * milestones: mảng EXP cần để lên cấp
 *   { level: 2, required_exp: 100 }
 *   { level: 3, required_exp: 250 }
 *   (Nếu không có entry cho level X → dùng công thức mặc định: 100 * level)
 *
 * buffs: buff tự nhiên của loài
 *   { type: 'exp_bonus_pct', value: 10, skill: 'writing' }
 *   skill = 'all' | 'vocab' | 'speaking' | 'writing' | 'reading' | 'listening'
 */
const petSpeciesSchema = new mongoose.Schema(
  {
    species_key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    base_image_url: { type: String, default: '' },  // ảnh mặc định level 1
    is_active:   { type: Boolean, default: true },
    evolutions: [
      {
        level:     { type: Number, required: true },
        image_url: { type: String, default: '' },
        label:     { type: String, default: '' },
      }
    ],
    milestones: [
      {
        level:        { type: Number, required: true },
        required_exp: { type: Number, required: true },
      }
    ],
    buffs: [
      {
        type:  { type: String, enum: ['exp_bonus_pct', 'coin_bonus_pct', 'hunger_decay_reduce'], required: true },
        value: { type: Number, required: true },
        skill: { type: String, default: 'all' },
      }
    ],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('PetSpecies', petSpeciesSchema);
