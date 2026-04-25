// Chat routes — tree volunteer group chat
import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/:treeId/chat', auth, chatController.getMessages);
router.post('/:treeId/chat', auth, chatController.sendMessage);

export default router;
