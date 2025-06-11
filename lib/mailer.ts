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
    const tokenExpiry = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 menit

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
    const webUrl = `${process.env.NEXT_PUBLIC_URL}/${isVerify ? 'api/auth/verify' : 'reset-password'}?token=${hashedToken}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 32px 28px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
      <h2 style="color: #2563eb; margin-bottom: 18px; font-size: 1.5em;">${subject}</h2>
      <p style="color: #222; font-size: 1.08em; margin-bottom: 18px;">Halo,</p>
      <p style="color: #444; margin-bottom: 28px;">Silakan klik tombol di bawah ini untuk ${actionText}.</p>
      <a 
        href="${webUrl}" 
        style="background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%); color: #fff; padding: 14px 32px; text-align: center; text-decoration: none; border-radius: 7px; display: inline-block; font-weight: 600; font-size: 1.08em; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(37,99,235,0.08); transition: background 0.2s;"
      >
        Lanjutkan di Aplikasi
      </a>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0 18px 0;" />
      <p style="font-size: 0.92em; color: #888;">Jika Anda tidak meminta ini, abaikan saja email ini.<br/>Link ini akan kedaluwarsa dalam 10 menit.</p>
      </div>
    `;

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
