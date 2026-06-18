import nodemailer from "nodemailer";
import { config } from "../config/env";
import { AppError } from "../utils/errors";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const smtpFrom =
  process.env.SMTP_FROM ||
  '"Campus Green Care" <noreply@campusgreencare.gtu.edu.tr>';
const publicApiUrl =
  process.env.VERCEL_API_URL ||
  process.env.PUBLIC_API_URL ||
  process.env.API_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${config.port || 3000}`);

const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export const mailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verifyLink = `${publicApiUrl.replace(/\/$/, "")}/api/auth/verify?token=${encodeURIComponent(token)}`;

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #2E7D32; font-size: 24px; margin-bottom: 20px;">Campus Green Care Platform'a Hoş Geldiniz! 🌿</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Kayıt olduğunuz için teşekkür ederiz. Kampüsümüzün yeşillenmesine katkıda bulunmak için son bir adım kaldı. Lütfen hesabınızı doğrulamak için aşağıdaki butona tıklayın:</p>
        <a href="${verifyLink}" style="display: inline-block; background-color: #2E7D32; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 16px; border-radius: 8px; margin-top: 25px; margin-bottom: 25px; font-weight: bold; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.2);">E-postamı Doğrula</a>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0 20px;" />
        <p style="font-size: 12px; color: #999;">Bu otomatik bir mesajdır, lütfen cevaplamayın. Eğer bu e-postayı yanlışlıkla aldıysanız, dikkate almayabilirsiniz.</p>
      </div>
    `;

    if (!transporter) {
      console.warn(
        "[Email] SMTP is not configured. Verification email was not sent.",
      );
      throw new AppError("E-posta gönderimi yapılandırılmamış.", 500);
    }

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: "Hesabınızı Doğrulayın - Campus Green Care 🌿",
        html: htmlTemplate,
      });
      console.log("[Email] Verification email sent: %s", info.messageId);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error("[Email] Error sending verification email:", error);
      if (
        (error as any)?.code === "EAUTH" ||
        (error as any)?.responseCode === 535
      ) {
        throw new AppError("Gmail kullanıcı adı kabul edilmedi.", 500);
      }
      throw new AppError("Doğrulama e-postası gönderilemedi.", 500);
    }
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${publicApiUrl.replace(/\/$/, "")}/api/auth/reset-password?token=${encodeURIComponent(token)}`;

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #2E7D32; font-size: 24px; margin-bottom: 20px;">Şifre Sıfırlama</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Campus Green Care hesabınız için şifre sıfırlama isteği aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #2E7D32; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 16px; border-radius: 8px; margin-top: 25px; margin-bottom: 25px; font-weight: bold; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.2);">Şifremi Sıfırla</a>
        <p style="font-size: 14px; color: #777;">Bu bağlantı 1 saat geçerlidir. Bu isteği siz yapmadıysanız, bu e-postayı yok sayabilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0 20px;" />
        <p style="font-size: 12px; color: #999;">Bu otomatik bir mesajdır, lütfen cevaplamayın.</p>
      </div>
    `;

    if (!transporter) {
      console.warn(
        "[Email] SMTP is not configured. Password reset email was not sent.",
      );
      throw new AppError("E-posta gönderimi yapılandırılmamış.", 500);
    }

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: "Şifre Sıfırlama - Campus Green Care",
        html: htmlTemplate,
      });
      console.log("[Email] Password reset email sent: %s", info.messageId);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error("[Email] Error sending password reset email:", error);
      if (
        (error as any)?.code === "EAUTH" ||
        (error as any)?.responseCode === 535
      ) {
        throw new AppError("Gmail kullanıcı adı kabul edilmedi.", 500);
      }
      throw new AppError("Şifre sıfırlama e-postası gönderilemedi.", 500);
    }
  },
};
