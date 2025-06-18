// app/reset-password/[token]/page.tsx

import ResetPasswordForm from '../ResetPasswordForm';
import { prisma } from '@/lib/prisma';


async function validateToken(token: string) {
    if (!token) return null;

    try {
        const user = await prisma.tbl_user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        return user;
    } catch (error) {
        console.error('Error validating token:', error);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

export default async function ResetPasswordPage({
    params,
}: {
    params: Promise<{ token: string[] }>;
}) {
    const { token } = await params;
    // console.log('Received token:', token);
    const fullToken = decodeURIComponent(token.join('/'));
    // console.log('Full token:', fullToken);
    const user = await validateToken(fullToken);
    // console.log('User found:', user);

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
                    <h1 className="text-2xl font-bold text-red-600">Token Tidak Valid</h1>
                    <p className="mt-4 text-gray-600">
                        Token untuk reset password tidak valid atau sudah kedaluwarsa. Silakan coba minta link reset password lagi.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
            <ResetPasswordForm token={fullToken} />
        </div>
    );
}
