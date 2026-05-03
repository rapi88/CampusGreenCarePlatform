import nodemailer from 'nodemailer';
import { config } from '../config/env';

// Create a transporter. For production, ensure SMTP variables are set in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const mailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verifyLink = `http://localhost:${config.port || 3000}/api/auth/verify?token=${token}`;
    
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #2E7D32; font-size: 24px; margin-bottom: 20px;">Campus Green Care Platform'a Hoş Geldiniz! 🌿</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Kayıt olduğunuz için teşekkür ederiz. Kampüsümüzün yeşillenmesine katkıda bulunmak için son bir adım kaldı. Lütfen hesabınızı doğrulamak için aşağıdaki butona tıklayın:</p>
        <a href="${verifyLink}" style="display: inline-block; background-color: #2E7D32; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 16px; border-radius: 8px; margin-top: 25px; margin-bottom: 25px; font-weight: bold; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.2);">E-postamı Doğrula</a>
        <p style="font-size: 14px; color: #777; margin-top: 10px;">Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:</p>
        <p style="font-size: 14px; color: #2E7D32; word-break: break-all; background-color: #e8f5e9; padding: 10px; border-radius: 6px; margin-top: 10px;">${verifyLink}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0 20px;" />
        <p style="font-size: 12px; color: #999;">Bu otomatik bir mesajdır, lütfen cevaplamayın. Eğer bu e-postayı yanlışlıkla aldıysanız, dikkate almayabilirsiniz.</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: '"Campus Green Care" <noreply@campusgreencare.gtu.edu.tr>',
        to,
        subject: 'Hesabınızı Doğrulayın - Campus Green Care 🌿',
        html: htmlTemplate,
      });
      console.log('[Email] Verification email sent: %s', info.messageId);
      // For ethereal email, we can log the preview URL
      if (!process.env.SMTP_USER) {
         console.log('[Email] Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('[Email] Error sending verification email:', error);
    }
  }
};
