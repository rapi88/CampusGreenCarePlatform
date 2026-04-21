// Tree routes — public tree browsing + authenticated actions
import { Router } from 'express';
import { treeController } from '../controllers/tree.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Public endpoints
router.get('/', treeController.getAll);
router.get('/:id', treeController.getById);

// Authenticated endpoints
router.post('/:id/adopt', auth, treeController.adopt);
router.delete('/:id/adopt', auth, treeController.leaveAdoption);
router.post('/:id/water', auth, treeController.water);
router.post('/:id/report', auth, treeController.reportIssue);

export default router;
