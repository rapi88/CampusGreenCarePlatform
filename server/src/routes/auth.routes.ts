// Auth routes
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

import { upload } from '../middleware/upload';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/verify', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.resetPasswordPage);
router.post('/reset-password', authController.resetPassword);
router.get('/me', auth, authController.me);
router.post('/push-token', auth, authController.registerPushToken);
router.put('/avatar', auth, upload.single('avatar'), authController.uploadAvatar);

export default router;
