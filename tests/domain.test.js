import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  occurs,
  matches,
  offersFor,
  validity,
  parseImport,
  cordobaToday,
} from "../src/domain.js";
const seed = JSON.parse(
  readFileSync(new URL("../src/seed.json", import.meta.url)),
);
test("preserva las 25 promociones originales con fechas provisionales", () => {
  assert.equal(seed.length, 25);
  assert.ok(
    seed.every((p) => p.status === "pending" && p.provisional && p.original),
  );
  assert.equal(
    parseImport(JSON.stringify({ version: 1, promotions: seed })).length,
    25,
  );
});
test("filtros combinados exigen coincidencia de todos los campos", () => {
  const p = seed[0];
  assert.ok(
    matches(p, {
      bank: p.bank,
      store: p.store,
      card: p.card,
      payment: p.payment,
      status: "pending",
    }),
  );
  for (const key of ["bank", "store", "card", "payment", "status"])
    assert.equal(matches(p, { bank: p.bank, [key]: "otra" }), false);
});
test("recurrencia semanal y límites de fechas inclusivos", () => {
  const p = { ...seed[0], start: "2026-10-01", end: "2026-10-31" };
  assert.ok(occurs(p, "2026-10-05"));
  assert.equal(occurs(p, "2026-10-06"), false);
  assert.equal(occurs(p, "2026-09-28"), false);
  assert.equal(occurs(p, "2026-11-02"), false);
  assert.equal(occurs(p, "2026-02-30"), false);
  assert.ok(occurs({ ...p, weekdays: [4] }, p.start));
  assert.ok(occurs({ ...p, weekdays: [6] }, p.end));
});
test("domingo, cambio de año y año bisiesto", () => {
  const p = {
    ...seed[0],
    start: "2024-01-01",
    end: "2027-12-31",
    weekdays: [0, 4],
  };
  assert.ok(occurs(p, "2024-02-29"));
  assert.ok(occurs(p, "2027-01-03"));
  assert.equal(occurs(p, "2027-01-04"), false);
});
test("vencidas no aparecen fuera de su período y conservan estado histórico", () => {
  const p = seed[0];
  assert.equal(offersFor([p], "2026-11-02").length, 0);
  assert.equal(validity(p, "2026-11-01"), "Vencida");
  assert.equal(validity(p, "2026-10-05"), "Vigencia provisional");
});
test("fecha desconocida de fin no inventa vencimiento", () => {
  assert.ok(occurs({ ...seed[0], end: null }, "2027-01-04"));
});
test("importación rechaza datos corruptos, fechas falsas e IDs repetidos", () => {
  const encode = (p) => JSON.stringify({ version: 1, promotions: p });
  assert.throws(() => parseImport(encode([seed[0], seed[0]])));
  assert.throws(() => parseImport(encode([{ ...seed[0], end: "2026-02-30" }])));
  assert.throws(() => parseImport(encode([{ ...seed[0], weekdays: [9] }])));
  assert.throws(() =>
    parseImport(encode([{ ...seed[0], status: "verified" }])),
  );
  assert.throws(() => parseImport("{}"));
});
test("el día actual se calcula en Córdoba al cruzar medianoche UTC", () =>
  assert.equal(cordobaToday(new Date("2026-11-01T01:00:00Z")), "2026-10-31"));
