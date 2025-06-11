'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { LockClosedIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

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

        if (password.length < 8) {
            setError('Password minimal harus 8 karakter.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/auth/reset-password', {
                token: token,
                password: password,
            });

            if (response.status === 200) {
                setSuccess('Password Anda telah berhasil direset. ');
                // setTimeout(() => {
                //     window.location.href = '/login';
                // }, 3000);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Token tidak valid atau telah kedaluwarsa. Silakan coba lagi.');
            } else {
                setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg">
                <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-800">Berhasil!</h1>
                <p className="mt-2 text-gray-600">{success}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">Atur Ulang Password</h1>
                <p className="mt-2 text-sm text-gray-500">Buat password baru yang kuat dan mudah Anda ingat.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="relative">
                    <label className="sr-only" htmlFor="password">Password Baru</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 shadow-sm transition duration-300 ease-in-out focus:border-[#F2A307] focus:ring-2 focus:ring-[#F2A307]/50"
                        placeholder="Password Baru"
                        required
                    />
                </div>
                
                <div className="relative">
                    <label className="sr-only" htmlFor="confirm-password">Konfirmasi Password Baru</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 shadow-sm transition duration-300 ease-in-out focus:border-[#F2A307] focus:ring-2 focus:ring-[#F2A307]/50"
                        placeholder="Konfirmasi Password Baru"
                        required
                    />
                </div>

                {error && (
                    <div className="rounded-md border border-red-400 bg-red-50 p-4">
                        <p className="text-center text-sm font-medium text-red-700">{error}</p>
                    </div>
                )}
                
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#F2A307] px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-300 ease-in-out hover:bg-[#D99006] focus:outline-none focus:ring-2 focus:ring-[#F2A307] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-orange-300"
                    >
                        {loading && <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />}
                        {loading ? 'Sedang Memproses...' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}