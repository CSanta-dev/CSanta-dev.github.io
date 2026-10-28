export const statuses = {
  pending: "Pendiente de confirmar",
  verified: "Verificada",
  reported: "Reportada",
};
export const payments = {
  "Mercado Pago": ["Tarjeta de crédito", "Dinero en cuenta"],
  BBVA: ["MODO", "Tarjeta de crédito"],
  Santander: ["Tarjeta de crédito", "Tarjeta de débito"],
  "Personal Pay": ["QR", "NFC", "Tarjeta"],
  "Naranja X": ["Tarjeta prepaga"],
};
export const cards = [
  "Sin confirmar",
  "Visa crédito",
  "Visa débito",
  "Mastercard",
  "American Express",
  "Tarjeta prepaga Naranja X",
];
export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function cordobaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return !Number.isNaN(+d) && iso(d) === s;
}
export function matches(p, f = {}) {
  return ["store", "bank", "card", "payment", "status"].every(
    (k) => !f[k] || p[k] === f[k],
  );
}
export function occurs(p, date) {
  return (
    validDate(date) &&
    date >= p.start &&
    (!p.end || date <= p.end) &&
    p.weekdays.includes(new Date(date + "T12:00:00").getDay())
  );
}
export function offersFor(items, date, filters = {}) {
  return items.filter((p) => matches(p, filters) && occurs(p, date));
}
export function validity(p, today = cordobaToday()) {
  return p.end && p.end < today
    ? "Vencida"
    : p.start > today
      ? "Próxima"
      : p.provisional
        ? "Vigencia provisional"
        : "Dentro del período informado";
}
export function validatePromotion(p) {
  if (!p || typeof p !== "object") throw Error("Promoción inválida");
  for (const k of [
    "id",
    "bank",
    "store",
    "card",
    "payment",
    "conditions",
    "source",
  ])
    if (
      typeof p[k] !== "string" ||
      p[k].length > 4000 ||
      (["id", "bank", "store", "card", "payment"].includes(k) && !p[k].trim())
    )
      throw Error(`Campo inválido: ${k}`);
  if (
    !validDate(p.start) ||
    (p.end !== null && !validDate(p.end)) ||
    (p.end && p.end < p.start)
  )
    throw Error("Revisá las fechas de vigencia");
  if (
    !Array.isArray(p.weekdays) ||
    !p.weekdays.length ||
    p.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  )
    throw Error("Seleccioná al menos un día válido");
  if (!Number.isFinite(p.percent) || p.percent < 0 || p.percent > 100)
    throw Error("Porcentaje inválido");
  for (const k of ["minimum", "cap"])
    if (p[k] !== null && (!Number.isFinite(p[k]) || p[k] < 0))
      throw Error("Monto inválido");
  if (!Object.hasOwn(statuses, p.status) || typeof p.provisional !== "boolean")
    throw Error("Estado inválido");
  if (p.status === "verified" && (!p.source.trim() || p.provisional))
    throw Error("Para verificar, indicá una fuente y confirmá la vigencia");
  return p;
}
export function parseImport(text) {
  const data = JSON.parse(text);
  if (
    data.version !== 1 ||
    !Array.isArray(data.promotions) ||
    data.promotions.length > 5000
  )
    throw Error("Formato JSON no compatible (versión 1)");
  data.promotions.forEach(validatePromotion);
  if (new Set(data.promotions.map((p) => p.id)).size !== data.promotions.length)
    throw Error("Hay identificadores duplicados");
  return data.promotions;
}
