"use client"; // Tambahkan directive ini untuk menandakan komponen client

import { useState, useEffect } from 'react';
import type { OpenAPIV3 } from 'openapi-types';
import SwaggerUIComponent from './SwaggerUIComponent';

export default function OpenApiDocsPage() {
  const [openApiSpec, setOpenApiSpec] = useState<OpenAPIV3.Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getOpenApiSpec() {
      try {
        // Gunakan NEXT_PUBLIC_API_URL untuk fleksibilitas di berbagai lingkungan
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; 
        // Jika kamu ingin HARDCODE localhost hanya untuk development, 
        // kamu bisa menggunakan ini, tapi ini tidak disarankan untuk produksi
        // const res = await fetch(`http://localhost:4097/api/swagger`);
        
        // Pilihan terbaik: gunakan variabel lingkungan
        const fetchUrl = apiUrl ? `${apiUrl}/api/swagger` : `http://localhost:4097/api/swagger`; // Fallback ke localhost jika NEXT_PUBLIC_API_URL kosong

        const res = await fetch(fetchUrl);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Gagal mengambil spesifikasi OpenAPI dari ${fetchUrl}. Status: ${res.status}, Respon: ${errorText}`);
        }
        const spec = await res.json();

        if (!spec.openapi?.startsWith('3.0.')) {
          throw new Error('Hanya mendukung OpenAPI versi 3.0.x');
        }
        setOpenApiSpec(spec as OpenAPIV3.Document);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan yang tidak diketahui.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    getOpenApiSpec();
  }, []); // Array dependensi kosong agar hanya berjalan sekali saat komponen di-mount

  if (isLoading) {
    return (
      <div className="loading-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#555', fontSize: '1.2rem' }}>Memuat dokumentasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#d32f2f' }}>⚠️ Gagal Memuat Dokumentasi</h1>
        <p style={{ color: '#555', fontSize: '1.1rem' }}>{error}</p>
        <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block' }}>
          <p>Silakan coba langkah berikut:</p>
          <ul style={{ listStylePosition: 'inside' }}>
            <li>Refresh halaman ini.</li>
            <li>Pastikan server API berjalan dan dapat diakses dari browser Anda.</li>
            <li>Hubungi administrator jika masalah berlanjut.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!openApiSpec) {
    // Ini seharusnya tidak terjadi jika loading dan error sudah dihandle
    return (
      <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#555', fontSize: '1.1rem' }}>Spesifikasi API tidak ditemukan setelah dimuat.</p>
      </div>
    );
  }

  return (
    <main className="api-docs-container">
      <SwaggerUIComponent spec={openApiSpec} />
    </main>
  );
}