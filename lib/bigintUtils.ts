/**
 * Utility functions to handle BigInt serialization for JSON responses
 */

/**
 * Recursively converts BigInt values to Numbers in an object
 * @param obj - The object to convert
 * @returns The object with BigInt values converted to Numbers
 */
export function convertBigIntToNumber<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj) as T;
  }
  
  // Don't process Date objects, leave them as-is
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted as T;
  }
  
  return obj;
}

/**
 * Recursively converts BigInt values to Strings in an object
 * @param obj - The object to convert
 * @returns The object with BigInt values converted to Strings
 */
export function convertBigIntToString<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return String(obj) as T;
  }
  
  // Don't process Date objects, leave them as-is
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted as T;
  }
  
  return obj;
}

/**
 * Safely converts a single BigInt value to Number
 * @param value - The BigInt value to convert
 * @returns The Number value or the original value if not BigInt
 */
export function bigintToNumber(value: unknown): unknown {
  return typeof value === 'bigint' ? Number(value) : value;
}

/**
 * Prepares data for JSON response by converting BigInt values to Numbers
 * @param data - The data to prepare
 * @returns The data with BigInt values converted to Numbers
 */
export function prepareForJsonResponse<T>(data: T): T {
  return convertBigIntToNumber(data);
}

/**
 * Prepares data for JSON response by converting BigInt values to Strings
 * @param data - The data to prepare
 * @returns The data with BigInt values converted to Strings
 */
export function prepareForJsonResponseAsString<T>(data: T): T {
  return convertBigIntToString(data);
}
