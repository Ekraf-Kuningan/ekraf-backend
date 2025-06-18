import type { OpenAPIV3 } from 'openapi-types';
import SwaggerUIComponent from './SwaggerUIComponent';

async function getOpenApiSpec(): Promise<OpenAPIV3.Document> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const fetchUrl = apiUrl ? `${apiUrl}/api/swagger` : `http://localhost:4097/api/swagger`;

  const res = await fetch(fetchUrl, { cache: 'no-store' });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengambil spesifikasi OpenAPI dari ${fetchUrl}. Status: ${res.status}, Respon: ${errorText}`);
  }

  const spec = await res.json();

  if (!spec.openapi?.startsWith('3.0.')) {
    throw new Error('Hanya mendukung OpenAPI versi 3.0.x');
  }

  return spec as OpenAPIV3.Document;
}

export default async function OpenApiDocsPage() {
  let openApiSpec: OpenAPIV3.Document | null = null;
  let error: string | null = null;

  try {
    openApiSpec = await getOpenApiSpec();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan yang tidak diketahui.';
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
