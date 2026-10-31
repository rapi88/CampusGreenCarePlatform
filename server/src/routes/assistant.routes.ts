import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/ask', auth, assistantController.ask);

export default router;
