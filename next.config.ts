import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.plugins.push({
      apply: (compiler: import('webpack').Compiler) => {
        compiler.hooks.emit.tap("DisableConsolePlugin", () => {
          if (process.env.NODE_ENV === "production") {
            // Override console methods to no-ops
            ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
              // @ts-expect-error aassigning to console methods
              console[method] = () => {};
            });
          }
        });
      }
    });
    return config;
  }
};

export default nextConfig;
