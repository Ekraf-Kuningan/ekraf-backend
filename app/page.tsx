"use client"; // Komponen ini perlu dijalankan di sisi client

import Head from 'next/head';
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css"; // Impor CSS untuk Swagger UI

// Perhatikan: URL untuk swagger.json adalah path relatif dari root domain Anda.
// Jika API swagger.json Anda ada di /api/swagger, maka URL-nya adalah /api/swagger
const swaggerUrl = "/api/swagger"; // URL ke API route yang menyajikan swagger.json

const SwaggerPage = () => {
  return (
    <>
      <Head>
        <title>Dokumentasi API - Ekraf Kuningan</title>
        <meta name="description" content="Swagger UI untuk dokumentasi API Ekraf Kuningan" />
      </Head>
      <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>Dokumentasi API Ekraf Kuningan</h1>
        <p>
          Ini adalah antarmuka Swagger UI yang dihasilkan secara otomatis dari spesifikasi OpenAPI.
          Anda dapat menjelajahi dan menguji endpoint API di sini.
        </p>
        <div id="swagger-ui-container" style={{ marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Komponen SwaggerUI akan merender UI di sini */}
        </div>
      </div>
      {/* Memastikan SwaggerUI dirender di client setelah container siap */}
      {typeof window !== 'undefined' && (
         <SwaggerUI url={swaggerUrl} docExpansion="list" />
      )}
    </>
  );
};

export default SwaggerPage;