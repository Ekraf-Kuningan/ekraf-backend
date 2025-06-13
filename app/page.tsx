// import { readFile } from 'fs/promises';
// import path from 'path';
// import yaml from 'js-yaml';
import type { OpenAPIV3 } from 'openapi-types';
import SwaggerUIComponent from './SwaggerUIComponent';

export const metadata = {
  title: {
    default: 'Dokumentasi API Gratis',
    template: '%s | Dokumentasi API',
  },
  description:
    'Dokumentasi lengkap untuk API gratis kami dengan contoh request, parameter, dan response.',
  keywords:
    'API gratis, dokumentasi API, REST API, integrasi API, nextjs, openapi, swagger',
  openGraph: {
    title: 'Dokumentasi API Gratis',
    description:
      'Dokumentasi lengkap untuk API gratis kami dengan contoh request, parameter, dan response.',
    images: [
      {
        url: '/api-docs-og.png',
        width: 1200,
        height: 630,
      },
    ],
  },
};

async function getOpenApiSpec(): Promise<OpenAPIV3.Document> {
  const res = await fetch('http://localhost:3000/api/swagger');
  if (!res.ok) {
    throw new Error('Gagal mengambil spesifikasi OpenAPI dari /api/swagger');
  }
  const spec = await res.json();
  return spec as OpenAPIV3.Document;
  // const fileContent = await readFile(filePath, 'utf8');
  // const spec = yaml.load(fileContent) as OpenAPIV3.Document;

  if (!spec.openapi?.startsWith('3.0.')) {
    throw new Error('Hanya mendukung OpenAPI versi 3.0.x');
  }

  return spec;
}

export default async function OpenApiDocsPage() {
  try {
    const openApiSpec = await getOpenApiSpec();
    return (
      <main className="api-docs-container">
        <SwaggerUIComponent spec={openApiSpec} />
      </main>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Terjadi kesalahan yang tidak diketahui.';
    return (
      <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#d32f2f' }}>⚠️ Gagal Memuat Dokumentasi</h1>
        <p style={{ color: '#555', fontSize: '1.1rem' }}>{errorMessage}</p>
        <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block' }}>
            <p>Silakan coba langkah berikut:</p>
            <ul style={{ listStylePosition: 'inside' }}>
                <li>Refresh halaman ini.</li>
                <li>Pastikan file `public/OpenApi.yaml` ada dan formatnya benar.</li>
                <li>Hubungi administrator jika masalah berlanjut.</li>
            </ul>
        </div>
      </div>
    );
  }
}