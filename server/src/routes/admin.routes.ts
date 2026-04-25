// Admin routes — all protected by auth + adminOnly middleware
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { auth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { upload } from '../middleware/upload';

const router = Router();

// Apply auth + admin guard to all routes in this group
router.use(auth, adminOnly);

// Tree CRUD (supports optional photo upload)
router.post('/trees', upload.single('photo'), adminController.createTree);
router.put('/trees/:id', upload.single('photo'), adminController.updateTree);
router.delete('/trees/:id', adminController.deleteTree);

// Reports
router.get('/reports/watering', adminController.getWateringReport);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:userId/score', adminController.getUserScore);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Leaderboard (also accessible by admin)
router.get('/leaderboard', adminController.getLeaderboard);

export default router;
