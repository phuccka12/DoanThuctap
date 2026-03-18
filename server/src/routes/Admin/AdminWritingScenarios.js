const express = require('express');
const router = express.Router();
const writingScenarioController = require('../../controllers/WritingScenario');
const { protect } = require('../../middlewares/authMiddleware');
const requireAdmin = require('../../middlewares/requireAdmin');

// Tất cả routes này yêu cầu đăng nhập và quyền admin
router.use(protect, requireAdmin);

// Lấy danh sách scenarios (Admin version - đầy đủ data + filter)
router.get('/', writingScenarioController.getAllScenariosAdmin);

// Lấy thống kê
router.get('/stats', writingScenarioController.getScenarioStats);

// Lấy chi tiết một kịch bản
router.get('/:id', writingScenarioController.getScenarioById);

// Tạo mới kịch bản
router.post('/', writingScenarioController.createScenario);

// Cập nhật kịch bản
router.put('/:id', writingScenarioController.updateScenario);

// Xóa kịch bản
router.delete('/:id', writingScenarioController.deleteScenario);

// Xóa hàng loạt
router.post('/bulk-delete', writingScenarioController.bulkDeleteScenarios);

module.exports = router;
