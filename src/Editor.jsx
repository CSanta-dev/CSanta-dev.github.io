import React, { useState, useEffect, useRef } from "react";
import { statuses, payments, cards, validatePromotion } from "./domain";
import { dayNames } from "./constants";
export default function Editor({ initial, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [p, setP] = useState(initial),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const set = (k, v) => setP({ ...p, [k]: v });
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <div
      ref={dialogRef}
      className="overlay"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const nodes = [
            ...dialogRef.current.querySelectorAll(
              "button:not(:disabled),input:not(:disabled),select,textarea",
            ),
          ];
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              validatePromotion(p);
              setSaving(true);
              await onSave(p);
            } catch (e) {
              setError(e.message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="calendar-head">
            <h2 id="edit-title">Promoción</h2>
            <button type="button" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
          <p className="muted">
            Completá solamente información conocida. Los campos vacíos quedan
            como no informados.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="form-grid">
            <label>
              Supermercado
              <input
                autoFocus
                required
                value={p.store}
                onChange={(e) => set("store", e.target.value)}
              />
            </label>
            <label>
              Banco / entidad
              <input
                required
                list="banks"
                value={p.bank}
                onChange={(e) => set("bank", e.target.value)}
              />
              <datalist id="banks">
                {Object.keys(payments).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </datalist>
            </label>
            <label>
              Tarjeta
              <input
                required
                list="cards"
                value={p.card}
                onChange={(e) => set("card", e.target.value)}
              />
              <datalist id="cards">
                {cards.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </datalist>
            </label>
            <label>
              Medio de pago
              <input
                required
                list="payments"
                value={p.payment}
                onChange={(e) => set("payment", e.target.value)}
              />
              <datalist id="payments">
                {(payments[p.bank] || []).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </datalist>
            </label>
            {[
              ["percent", "Descuento %"],
              ["minimum", "Compra mínima ($)"],
              ["cap", "Tope ($)"],
            ].map(([k, label]) => (
              <label key={k}>
                {label}
                <input
                  type="number"
                  min="0"
                  max={k === "percent" ? 100 : undefined}
                  step="any"
                  required={k === "percent"}
                  value={p[k] ?? ""}
                  onChange={(e) =>
                    set(
                      k,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
            ))}
            <label>
              Desde
              <input
                required
                type="date"
                value={p.start}
                onChange={(e) => set("start", e.target.value)}
              />
            </label>
            <label>
              Hasta (opcional)
              <input
                type="date"
                min={p.start}
                value={p.end || ""}
                onChange={(e) => set("end", e.target.value || null)}
              />
            </label>
            <label>
              Estado
              <select
                value={p.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {Object.entries(statuses).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Repetir cada semana</legend>
            <div className="checks">
              {dayNames.map((d, i) => (
                <label key={d}>
                  <input
                    type="checkbox"
                    checked={p.weekdays.includes(i)}
                    onChange={(e) =>
                      set(
                        "weekdays",
                        e.target.checked
                          ? [...p.weekdays, i].sort()
                          : p.weekdays.filter((x) => x !== i),
                      )
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="check">
            <input
              type="checkbox"
              checked={p.provisional}
              onChange={(e) => set("provisional", e.target.checked)}
            />{" "}
            Fechas o datos provisionales
          </label>
          <label>
            Condiciones
            <textarea
              value={p.conditions}
              onChange={(e) => set("conditions", e.target.value)}
            />
          </label>
          <label>
            Fuente de verificación
            <input
              value={p.source}
              onChange={(e) => set("source", e.target.value)}
            />
          </label>
          <p className="muted">
            Para marcar como verificada, indicá una fuente y confirmá los datos
            y las fechas.
          </p>
          <div className="actions">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              Guardar promoción
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
