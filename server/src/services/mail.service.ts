import nodemailer from "nodemailer";
import { config } from "../config/env";
import { AppError } from "../utils/errors";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const smtpFrom =
  process.env.SMTP_FROM ||
  `"Campus Green Care" <${smtpUser}>`;
// publicApiUrl removed as links are no longer used

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
  async sendVerificationCode(to: string, code: string) {
    const textMessage = `
Campus Green Care Platform'a kayıt olduğunuz için teşekkürler.

Hesabınızı doğrulamak için doğrulama kodunuz:
${code}

Bu kod 10 dakika boyunca geçerlidir. 
Eğer bu kaydı siz yapmadıysanız bu mesajı görmezden gelebilirsiniz.
    `.trim();

    if (!transporter) {
      console.warn(
        "[Email] SMTP is not configured. Verification code was not sent.",
      );
      throw new AppError("E-posta gönderimi yapılandırılmamış.", 500);
    }

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: "Doğrulama Kodunuz - Campus Green Care 🌿",
        text: textMessage,
      });
      console.log(`[Email] Verification code successfully sent to: ${to} (MessageID: ${info.messageId})`);
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

  async sendPasswordResetCode(to: string, code: string) {
    const textMessage = `
Campus Green Care hesabınız için şifre sıfırlama isteği aldık.

Şifrenizi sıfırlamak için onay kodunuz:
${code}

Bu kod 10 dakika boyunca geçerlidir.
Eğer bu isteği siz yapmadıysanız bu mesajı görmezden gelebilirsiniz.
    `.trim();

    if (!transporter) {
      console.warn(
        "[Email] SMTP is not configured. Password reset code was not sent.",
      );
      throw new AppError("E-posta gönderimi yapılandırılmamış.", 500);
    }

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: "Şifre Sıfırlama Kodu - Campus Green Care",
        text: textMessage,
      });
      console.log(`[Email] Password reset code successfully sent to: ${to} (MessageID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error("[Email] Error sending password reset code:", error);
      if (
        (error as any)?.code === "EAUTH" ||
        (error as any)?.responseCode === 535
      ) {
        throw new AppError("Gmail kullanıcı adı kabul edilmedi.", 500);
      }
      throw new AppError("Şifre sıfırlama kodu gönderilemedi.", 500);
    }
  },
};
