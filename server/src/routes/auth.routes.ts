// Auth routes
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

import { upload } from '../middleware/upload';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verify-code', authController.verifyCode);
router.post('/resend-code', authController.resendCode);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.get('/me', auth, authController.me);
router.post('/push-token', auth, authController.registerPushToken);
router.put('/avatar', auth, upload.single('avatar'), authController.uploadAvatar);
router.put('/profile', auth, authController.updateProfile);

export default router;
