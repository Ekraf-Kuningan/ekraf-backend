'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface ResetPasswordFormProps {
    token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok.');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal harus 6 karakter.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/auth/reset-password', {
                token: token,
                password: password,
            });

            if (response.status === 200) {
                setSuccess('Password Anda telah berhasil direset. Anda akan segera diarahkan ke halaman login.');
                // Optional: Redirect to login after a few seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
            } else {
                setError('Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
                <h1 className="text-2xl font-bold text-green-600">Berhasil!</h1>
                <p className="mt-4 text-gray-600">{success}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
            <h1 className="mb-6 text-center text-2xl font-bold">Reset Password Anda</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-bold text-gray-700" htmlFor="password">
                        Password Baru
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-bold text-gray-700" htmlFor="confirm-password">
                        Konfirmasi Password Baru
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                        required
                    />
                </div>

                {error && <p className="mb-4 text-center text-xs text-red-500">{error}</p>}
                
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={loading}
                        className="focus:shadow-outline w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
