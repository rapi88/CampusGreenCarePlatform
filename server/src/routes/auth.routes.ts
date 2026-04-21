// Auth routes
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.get('/me', auth, authController.me);
router.post('/push-token', auth, authController.registerPushToken);

export default router;
