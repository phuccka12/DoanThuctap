const Pet = require('../models/Pet');
const User = require('../models/User');

// ── GET /admin/pets/stats ──────────────────────────────────────────────────
const getPetStats = async (req, res) => {
  try {
    const [
      totalPets,
      byType,
      avgLevel,
      levelDist,
      topCoins,
      topLevel,
      recentActive,
    ] = await Promise.all([
      Pet.countDocuments(),

      Pet.aggregate([
        { $group: { _id: '$petType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Pet.aggregate([
        { $group: { _id: null, avg: { $avg: '$level' } } },
      ]),

      Pet.aggregate([
        {
          $bucket: {
            groupBy: '$level',
            boundaries: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 99],
            default: '10+',
            output: { count: { $sum: 1 } },
          },
        },
      ]),

      Pet.find()
        .sort({ coins: -1 })
        .limit(10)
        .populate('user', 'user_name email'),

      Pet.find()
        .sort({ level: -1, growthPoints: -1 })
        .limit(10)
        .populate('user', 'user_name email'),

      Pet.countDocuments({
        lastCheckinAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const byTypeMap = {};
    byType.forEach((t) => { byTypeMap[t._id] = t.count; });

    return res.json({
      success: true,
      data: {
        totalPets,
        byType: byTypeMap,
        avgLevel: avgLevel[0]?.avg ? Math.round(avgLevel[0].avg * 10) / 10 : 0,
        levelDistribution: levelDist,
        topCoins,
        topLevel,
        recentActive7d: recentActive,
      },
    });
  } catch (err) {
    console.error('getPetStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /admin/pets ─────────────────────────────────────────────────────────
const getAllPets = async (req, res) => {
  try {
    const { page = 1, limit = 20, petType, minLevel, search } = req.query;
    const query = {};
    if (petType) query.petType = petType;
    if (minLevel) query.level = { $gte: Number(minLevel) };

    let pets;
    if (search) {
      // search by user name/email via populate + filter
      const users = await User.find({
        $or: [
          { user_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.user = { $in: users.map((u) => u._id) };
    }

    const total = await Pet.countDocuments(query);
    pets = await Pet.find(query)
      .populate('user', 'user_name email role')
      .sort({ level: -1, growthPoints: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({
      success: true,
      data: pets,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAllPets error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /admin/pets/:id ──────────────────────────────────────────────────────
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('user', 'user_name email role subscription');
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    return res.json({ success: true, data: pet });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PATCH /admin/pets/:id ─────────────────────────────────────────────────────
const updatePet = async (req, res) => {
  try {
    const allowed = ['level', 'growthPoints', 'coins', 'hunger', 'happiness', 'streakCount'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const pet = await Pet.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('user', 'user_name email');
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    return res.json({ success: true, data: pet });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /admin/pets/:id/grant-coins ─────────────────────────────────────────
const grantCoins = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $inc: { coins: amount } },
      { new: true }
    ).populate('user', 'user_name email');
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    return res.json({ success: true, data: pet, message: `Granted ${amount} coins` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /admin/pets/:id ─────────────────────────────────────────────────────
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    return res.json({ success: true, message: 'Pet deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPetStats, getAllPets, getPetById, updatePet, grantCoins, deletePet };
