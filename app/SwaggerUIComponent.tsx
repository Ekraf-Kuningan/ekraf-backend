'use client';

import { useEffect, useRef } from 'react';
import type { OpenAPIV3 } from 'openapi-types';
import { useTheme } from 'next-themes';
import 'swagger-ui-dist/swagger-ui.css';
import './swagger-dark.css';
// @ts-expect-error: No official types for swagger-ui-dist bundleaaaaa
import { SwaggerUIBundle } from 'swagger-ui-dist';

interface SwaggerUIComponentProps {
  spec: OpenAPIV3.Document;
}

export default function SwaggerUIComponent({ spec }: SwaggerUIComponentProps) {
  const swaggerUIRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (swaggerUIRef.current && spec) {
      const domNode = swaggerUIRef.current;
      const ui = SwaggerUIBundle({
        spec: spec,
        domNode: domNode,
        deepLinking: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        requestSnippetsEnabled: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: resolvedTheme === 'dark' ? 'monokai' : 'agate',
        },
      });

      return () => {
        if (domNode) {
          domNode.innerHTML = '';
        }
        ui.getSystem().specActions.updateSpec('{}');
      };
    }
  }, [spec, resolvedTheme]);

  return (
    <div
      className={resolvedTheme === 'dark' ? 'dark-theme' : ''}
      ref={swaggerUIRef}
    />
  );
}
