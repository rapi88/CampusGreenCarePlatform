// Tree routes — public tree browsing + authenticated actions
import { Router } from 'express';
import { treeController } from '../controllers/tree.controller';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Public endpoints
router.get('/', treeController.getAll);

// Authenticated endpoints
router.get('/mine', auth, treeController.getMyTrees);
router.get('/:id', treeController.getById);

// Authenticated endpoints
router.post('/suggest', auth, treeController.suggest);
router.post('/:id/photo', auth, upload.single('photo'), treeController.uploadTreePhoto);
router.put('/suggestions/:id/dismiss', auth, treeController.dismissSuggestion);
router.post('/:id/adopt', auth, treeController.adopt);
router.delete('/:id/adopt', auth, treeController.leaveAdoption);
router.post('/:id/water', auth, treeController.water);

export default router;
