import nodemailer from 'nodemailer';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '../app/generated/prisma'; 

const prisma = new PrismaClient();

interface SendEmailParams {
    email: string;
    emailType: "VERIFY" | "RESET";
    userId: number | string;
}

export const sendEmail = async ({ email, emailType, userId }: SendEmailParams) => {
    try {
        const hashedToken = await bcryptjs.hash(userId.toString(), 10)
            await prisma.tbl_user_temp.update({
                where: { id: userId },
                data: {
                    verificationToken: hashedToken,
                }
            });
        

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const mailOptions = {
            from: 'noreply@yourdomain.com',
            to: email,
            subject: emailType === "VERIFY" ? "Verifikasi Email Anda" : "Reset Password Anda",
            html: `<p>Klik <a href="${process.env.NEXT_PUBLIC_URL}/verify-email?token=${hashedToken}">di sini</a> untuk ${emailType === "VERIFY" ? "memverifikasi email Anda" : "mereset password Anda"} atau salin dan tempel link di bawah ini di browser Anda. <br> ${process.env.NEXT_PUBLIC_URL}/verify-email?token=${hashedToken}</p><p>Link ini akan kedaluwarsa dalam 5 menit.</p>`
        }

        const mailresponse = await transporter.sendMail(mailOptions);
        return mailresponse;

    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw error;
    }
}
