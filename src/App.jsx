import React, { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { promotionRepository } from "./repository";
import {
  iso,
  cordobaToday,
  offersFor,
  matches,
  validity,
  statuses,
  parseImport,
} from "./domain";
import Editor from "./Editor";
import { dayNames } from "./constants";
const money = (n) =>
  n === null
    ? "No informado"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(n);
export default function App() {
  const today = cordobaToday();
  const [date, setDate] = useState(today),
    [month, setMonth] = useState(today.slice(0, 7)),
    [items, setItems] = useState([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [filters, setFilters] = useState({}),
    [editor, setEditor] = useState(null),
    [view, setView] = useState("day"),
    [install, setInstall] = useState(null),
    [update, setUpdate] = useState(null);
  useEffect(() => {
    promotionRepository
      .load()
      .then((x) => {
        setItems(x);
        setReady(true);
      })
      .catch((e) =>
        setError(
          "No se pudieron leer tus datos. No se sobrescribieron. " + e.message,
        ),
      );
    const handler = (e) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const updater = registerSW({
      onNeedRefresh() {
        setUpdate(() => updater);
      },
      onOfflineReady() {
        setNotice("Lista para consultar sin conexión.");
      },
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  async function persist(next) {
    try {
      await promotionRepository.save(next);
      setItems(next);
      setError("");
      return true;
    } catch (e) {
      setError("No se guardaron los cambios: " + e.message);
      return false;
    }
  }
  function move(delta) {
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() + delta);
    setMonth(iso(d).slice(0, 7));
    setDate(iso(d));
  }
  async function importFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5e6) throw Error("El archivo supera 5 MB");
      const incoming = parseImport(await file.text());
      const overlap = incoming.filter((p) =>
        items.some((x) => x.id === p.id),
      ).length;
      if (
        !confirm(
          `Importar ${incoming.length} promociones. Se actualizarán ${overlap} identificadores coincidentes y se conservarán las demás. ¿Continuar?`,
        )
      )
        return;
      const map = new Map(items.map((p) => [p.id, p]));
      incoming.forEach((p) => map.set(p.id, p));
      if (await persist([...map.values()]))
        setNotice("Importación completada.");
    } catch (e) {
      setError(e.message);
    }
  }
  function exportFile() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, promotions: items }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendario-super.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const first = new Date(month + "-01T12:00:00"),
    offset = (first.getDay() + 6) % 7,
    total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const listed =
    view === "day"
      ? offersFor(items, date, filters)
      : items.filter((p) => matches(p, filters));
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <>
      <header>
        <div className="brand">
          <span className="logo">▦</span>
          <div>
            <strong>Calendario Super</strong>
            <small>CÓRDOBA CAPITAL</small>
          </div>
        </div>
        <div className="actions">
          {install && (
            <button
              onClick={async () => {
                await install.prompt();
                setInstall(null);
              }}
            >
              Instalar app
            </button>
          )}
          <button
            className="primary"
            disabled={!ready}
            onClick={() =>
              setEditor({
                id: crypto.randomUUID(),
                bank: "Mercado Pago",
                store: "",
                card: "Sin confirmar",
                payment: "Dinero en cuenta",
                weekdays: [],
                percent: 0,
                minimum: null,
                cap: null,
                conditions: "",
                start: today,
                end: null,
                status: "pending",
                provisional: true,
                source: "",
              })
            }
          >
            ＋ Nueva promoción
          </button>
        </div>
      </header>
      <main>
        <section className="intro">
          <span className="eyebrow">PLANIFICÁ TU PRÓXIMA COMPRA</span>
          <h1>Tu semana, con más ahorro.</h1>
          <p>Consultá los descuentos de supermercados en un solo calendario.</p>
        </section>
        <aside className="warning">
          <strong>Información para confirmar</strong>
          <span>
            Las 25 promociones originales y sus fechas son provisionales.
            Confirmá condiciones y sucursales antes de comprar. Una fecha futura
            no acredita vigencia.
          </span>
        </aside>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {update && (
          <button onClick={() => update(true)}>Actualizar aplicación</button>
        )}
        <section className="filters" aria-label="Filtros">
          {["store", "bank", "card", "payment", "status"].map((k, i) => (
            <label key={k}>
              {
                [
                  "Supermercado",
                  "Banco / entidad",
                  "Tarjeta",
                  "Medio de pago",
                  "Estado",
                ][i]
              }
              <select
                aria-label={
                  [
                    "Supermercado",
                    "Banco / entidad",
                    "Tarjeta",
                    "Medio de pago",
                    "Estado",
                  ][i]
                }
                value={filters[k] || ""}
                onChange={(e) =>
                  setFilters({ ...filters, [k]: e.target.value })
                }
              >
                <option value="">Todos</option>
                {(k === "status"
                  ? Object.keys(statuses)
                  : [...new Set(items.map((p) => p[k]))].sort()
                ).map((v) => (
                  <option key={v} value={v}>
                    {k === "status" ? statuses[v] : v}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="quiet" onClick={() => setFilters({})}>
            Limpiar
          </button>
        </section>
        <div className="workspace">
          <section className="calendar panel">
            <div className="calendar-head">
              <h2>
                {first.toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div>
                <button aria-label="Mes anterior" onClick={() => move(-1)}>
                  ‹
                </button>
                <button
                  onClick={() => {
                    setMonth(today.slice(0, 7));
                    setDate(today);
                  }}
                >
                  Hoy
                </button>
                <button aria-label="Mes siguiente" onClick={() => move(1)}>
                  ›
                </button>
              </div>
            </div>
            <div className="grid">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <span className="weekday" key={d}>
                  {d}
                </span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={"empty" + i} />
              ))}
              {Array.from({ length: total }, (_, i) => {
                const d = month + "-" + String(i + 1).padStart(2, "0"),
                  offers = offersFor(items, d, filters);
                return (
                  <button
                    aria-pressed={date === d}
                    aria-label={`${d}: ${offers.length} promociones registradas`}
                    className={
                      "day " +
                      (date === d ? "selected " : "") +
                      (today === d ? "today" : "")
                    }
                    key={d}
                    onClick={() => {
                      setDate(d);
                      setView("day");
                    }}
                  >
                    <span>{i + 1}</span>
                    {offers.length > 0 && (
                      <>
                        <span className="dots">
                          {[...new Set(offers.map((p) => p.bank))].map((b) => (
                            <i
                              key={b}
                              style={{
                                background:
                                  {
                                    "Mercado Pago": "#21a8ba",
                                    BBVA: "#3270be",
                                    Santander: "#df5e64",
                                    "Personal Pay": "#9763ba",
                                    "Naranja X": "#e99a40",
                                  }[b] || "#195a45",
                              }}
                            />
                          ))}
                        </span>
                        <small>
                          {offers.length}
                          <span className="desktop"> promos</span>
                        </small>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="legend">
              ● Seleccioná un día para ver sus promociones registradas.
            </p>
            <p className="muted">
              Las fechas pasadas muestran el registro histórico, con su estado
              actual.
            </p>
          </section>
          <section className="results">
            <div className="result-head">
              <div>
                <span className="eyebrow">
                  {view === "day" ? "PROMOCIONES DEL DÍA" : "ADMINISTRACIÓN"}
                </span>
                <h2>{view === "day" ? formatted : "Todas las promociones"}</h2>
                <p>{listed.length} resultados con estos filtros</p>
              </div>
              <button onClick={() => setView(view === "day" ? "all" : "day")}>
                {view === "day" ? "Ver todas" : "Ver día"}
              </button>
            </div>
            {!listed.length && (
              <div className="empty panel">
                <span>▦</span>
                <h3>No hay promociones registradas</h3>
                <p>Probá otro día o ajustá los filtros.</p>
              </div>
            )}
            {listed.map((p) => (
              <article className="offer panel" key={p.id}>
                <div className="offer-top">
                  <span className={"badge " + p.status}>
                    {statuses[p.status]}
                  </span>
                  <span className="validity">{validity(p, today)}</span>
                </div>
                <div className="offer-title">
                  <div>
                    <h3>{p.store}</h3>
                    <p>{p.bank}</p>
                  </div>
                  <strong className="discount">
                    {p.percent
                      ? `${p.percent}%`
                      : p.payment === "Cuotas sin tarjeta"
                        ? "Cuotas"
                        : "—"}
                    <small>
                      {p.percent
                        ? "de descuento"
                        : p.payment === "Cuotas sin tarjeta"
                          ? "sin tarjeta"
                          : "ver condiciones"}
                    </small>
                  </strong>
                </div>
                <p>
                  {p.payment} · {p.card}
                </p>
                <dl>
                  <div>
                    <dt>Compra mínima</dt>
                    <dd>
                      {p.minimum === null && p.original
                        ? "Ver condiciones originales"
                        : money(p.minimum)}
                    </dd>
                  </div>
                  <div>
                    <dt>Tope de reintegro</dt>
                    <dd>
                      {p.cap === null && p.original
                        ? "Ver condiciones originales"
                        : money(p.cap)}
                    </dd>
                  </div>
                </dl>
                <p className="conditions">
                  {p.conditions || "Condiciones no informadas"}
                </p>
                <p className="muted">
                  {p.weekdays.map((d) => dayNames[d]).join(", ")}
                  <br />
                  {p.provisional
                    ? "Período provisional"
                    : "Período informado"}: {p.start} →{" "}
                  {p.end || "Fin no informado"}
                </p>
                <details>
                  <summary>Fuente y datos originales</summary>
                  <p>{p.source || "Fuente no informada"}</p>
                  {p.original && (
                    <pre>{JSON.stringify(p.original, null, 2)}</pre>
                  )}
                </details>
                <div className="offer-actions">
                  <button
                    disabled={!ready}
                    onClick={() => setEditor(structuredClone(p))}
                  >
                    Editar
                  </button>
                  <button
                    disabled={!ready}
                    onClick={async () => {
                      if (confirm(`¿Eliminar la promoción de ${p.store}?`))
                        await persist(items.filter((x) => x.id !== p.id));
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
        <footer>
          <span>
            Calendario Super · Córdoba Capital
            <br />
            <small>
              Tus datos se guardan en este dispositivo. Exportá una copia para
              respaldarlos.
            </small>
          </span>
          <div className="actions">
            <button disabled={!ready} onClick={exportFile}>
              ↓ Exportar JSON
            </button>
            <label className="file-button">
              ↑ Importar JSON
              <input
                disabled={!ready}
                type="file"
                accept="application/json,.json"
                onChange={importFile}
              />
            </label>
          </div>
        </footer>
      </main>
      {editor && (
        <Editor
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={async (p) => {
            if (await persist([...items.filter((x) => x.id !== p.id), p]))
              setEditor(null);
          }}
        />
      )}
    </>
  );
}
