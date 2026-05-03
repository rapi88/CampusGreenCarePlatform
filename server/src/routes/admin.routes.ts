// Admin routes — all protected by auth + adminOnly middleware
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { auth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { upload } from '../middleware/upload';

const router = Router();

// Apply auth + admin guard to all routes in this group
router.use(auth, adminOnly);

// Tree CRUD (photo upload handled separately)
router.post('/trees', adminController.createTree);
router.put('/trees/:id', adminController.updateTree);
router.delete('/trees/:id', adminController.deleteTree);
router.post('/trees/:id/photo', upload.single('photo'), adminController.uploadTreePhoto);

// Tree Suggestions
router.get('/trees/suggestions', adminController.getSuggestions);
router.post('/trees/:id/approve', adminController.approveSuggestion);
router.post('/trees/:id/reject', adminController.rejectSuggestion);



// Reports
router.get('/reports/watering', adminController.getWateringReport);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:userId/score', adminController.getUserScore);

// Dashboard stats
router.get('/stats', adminController.getStats);



export default router;
