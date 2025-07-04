import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerDefinition from '../../../lib/swaggerDef'; // Path ke definisi swagger Anda

export async function GET() {
  const options = {
    swaggerDefinition,
    // Path ke file API yang berisi anotasi JSDoc untuk Swagger
    // Pastikan path ini sesuai dengan struktur proyek Anda
    apis: ['./app/api/**/route.ts', './app/api/**/route.js'], // Mencakup semua route.ts dan route.js di dalam app/api
  };

  try {
    const swaggerSpec = swaggerJsdoc(options);
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Gagal menghasilkan spesifikasi Swagger:', error);
    return NextResponse.json(
      { message: 'Gagal menghasilkan spesifikasi Swagger' },
      { status: 500 }
    );
  }
}
