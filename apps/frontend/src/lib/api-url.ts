declare const __WHOMI_BUILD_ENV__: {
  apiUrl?: string;
  websocketUrl?: string;
};

// Bun's production build injects these values. The `typeof` guard keeps the
// browser dev server on localhost without requiring a process polyfill.
const buildEnv = typeof __WHOMI_BUILD_ENV__ === "undefined" ? undefined : __WHOMI_BUILD_ENV__;

export const API_URL = buildEnv?.apiUrl || "http://localhost:3001/api/v1";
export const WEBSOCKET_URL = buildEnv?.websocketUrl || "ws://localhost:3002";
