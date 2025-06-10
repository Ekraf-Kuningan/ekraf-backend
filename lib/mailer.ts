import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

interface SendEmailParams {
  email: string;
  emailType: "VERIFY" | "RESET";
  userId: number; // ID user dari database
}

export const sendEmail = async ({
  email,
  emailType,
  userId,
}: SendEmailParams) => {
  try {
    // 1. Buat token unik dan tanggal kedaluwarsa (1 jam dari sekarang)
    // Menggunakan userId + salt untuk token yang lebih aman daripada hanya hash userId
    const hashedToken = await bcryptjs.hash(userId.toString(), 10);
    const tokenExpiry = new Date(new Date().getTime() + 3600 * 1000); // 1 jam

    // 2. Simpan token ke database yang sesuai
    if (emailType === "VERIFY") {
      // Untuk verifikasi, kita update tabel user sementara (temp)
      await prisma.tbl_user_temp.update({
        where: { id: userId }, // Di sini userId adalah id dari tbl_user_temp
        data: {
          verificationToken: hashedToken,
          verificationTokenExpiry: tokenExpiry, // Pastikan kolom ini ada di schema.prisma Anda
        },
      });
    } else if (emailType === "RESET") {
      // Untuk reset password, kita update tabel user utama
      await prisma.tbl_user.update({
        where: { id_user: userId }, // Di sini userId adalah id_user dari tbl_user
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordTokenExpiry: tokenExpiry, // Pastikan kolom ini ada di schema.prisma Anda
        },
      });
    }

    // 3. Konfigurasi transporter email
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // 4. Siapkan konten email dinamis berdasarkan tipe
    const isVerify = emailType === "VERIFY";
    const subject = isVerify ? "Verifikasi Email Anda" : "Reset Password Anda";
    const actionText = isVerify ? "memverifikasi email Anda" : "mereset password Anda";
    
    // Link untuk frontend web
    const webUrl = `${process.env.NEXT_PUBLIC_URL}/${isVerify ? 'api/auth/verify' : 'api/auth/reset-password'}?token=${hashedToken}`;
    // Link untuk deep link aplikasi Android/iOSa
    const appUrl = `ekraf://${isVerify ? 'verify-email' : 'reset-password'}?token=${hashedToken}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333;">${subject}</h2>
            <p>Halo,</p>
            <p>Silakan klik tombol di bawah ini untuk ${actionText}.</p>
            <a 
              href="${appUrl}" 
              style="background-color:#007bff; color:white; padding:12px 20px; text-align: center; text-decoration:none; border-radius:5px; display:inline-block; font-weight: bold;"
            >
              Lanjutkan di Aplikasi
            </a>
            <p style="margin-top: 25px; font-size: 0.9em; color: #555;">
              Jika tombol tidak berfungsi, atau Anda ingin membukanya di browser, silakan salin dan tempel link di bawah ini:
            </p>
            <p style="word-break: break-all; font-size: 0.9em;"><a href="${webUrl}">${webUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8em; color: #aaa;">Jika Anda tidak meminta ini, abaikan saja email ini. Link ini akan kedaluwarsa dalam 1 jam.</p>
        </div>`;

    const mailOptions = {
      from: `Notifikasi <noreply@${process.env.MAIL_HOST?.split('.').slice(-2).join('.')}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    const mailresponse = await transporter.sendMail(mailOptions);
    return mailresponse;

  } catch (error: unknown) {
    if (error instanceof Error) {
      // Memberi konteks lebih pada error
      throw new Error(`Gagal mengirim email (${emailType}): ${error.message}`);
    }
    throw error;
  }
};
