// filepath: /Users/akbroc/Desktop/ML/frontend/src/utils/config.js
export const API_BASE =
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL)) ||
  (typeof window !== 'undefined' && window.ENV && window.ENV.API_URL) ||
  'http://127.0.0.1:8000';
