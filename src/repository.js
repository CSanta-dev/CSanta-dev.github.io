import seed from "./seed.json";
import { parseImport } from "./domain.js";
const key = "calendario-super:v1";
// Adapter boundary: a future HTTP repository must expose these same methods.
export const promotionRepository = {
  async load() {
    const saved = localStorage.getItem(key);
    return saved === null ? structuredClone(seed) : parseImport(saved);
  },
  async save(promotions) {
    const text = JSON.stringify({ version: 1, promotions });
    parseImport(text);
    localStorage.setItem(key, text);
  },
};
