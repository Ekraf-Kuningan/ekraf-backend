"use client"; // Komponen ini perlu dijalankan di sisi client

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css"; // Impor CSS untuk Swagger UI

// Perhatikan: URL untuk swagger.json adalah path relatif dari root domain Anda.
// Jika API swagger.json Anda ada di /api/swagger, maka URL-nya adalah /api/swagger
const swaggerUrl = "/api/swagger"; // URL ke API route yang menyajikan swagger.json

const SwaggerPage = () => {
  return (
    <>
      <div id="swagger-ui-container" style={{ marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Komponen SwaggerUI akan merender UI di sini */}
      </div>
      {/* Memastikan SwaggerUI dirender di client setelah container siap */}
      {typeof window !== 'undefined' && (
        <SwaggerUI url={swaggerUrl} docExpansion="list" />
      )}
    </>
  );
};

export default SwaggerPage;