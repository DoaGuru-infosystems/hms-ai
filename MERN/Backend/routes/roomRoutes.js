const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.get('/categories', roomController.getAllCategories);
router.post('/categories', roomController.createCategory);
router.put('/category/update', roomController.updateRoomsByCategory);

// Building Routes
router.get('/buildings', roomController.getAllBuildings);
router.post('/buildings', roomController.createBuilding);
router.put('/buildings/:id', roomController.updateBuilding);
router.delete('/buildings/:id', roomController.deleteBuilding);

router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;
