# Integración futura: Java, Spring Boot y Redis

Primera versión: localStorage. Este documento es una propuesta de integración, no un servicio implementado.

## Contrato del adaptador

`load(): Promise<Promotion[]>` y `save(promotions: Promotion[]): Promise<void>` son el límite actual de persistencia. Para migrar, un adaptador HTTP puede implementar `load` con `GET /api/v1/promotions` y `save` con una operación de reemplazo atómica `PUT /api/v1/promotions`, usando versión/ETag e `If-Match` para evitar sobrescrituras concurrentes. En un entorno multiusuario conviene evolucionar la interfaz hacia operaciones individuales POST/PATCH/DELETE, con autenticación y permisos de edición.

El payload JSON versión 1 contiene `version: 1` y `promotions: []`. Cada promoción tiene id, bank, store, card, payment, weekdays (0 domingo–6 sábado), percent (0–100), minimum/cap (número no negativo o null), conditions, start (YYYY-MM-DD), end (fecha o null), status (pending/verified/reported), provisional (boolean), source y original opcional. El backend debe repetir todas las validaciones; no confiar en el cliente. `original` solo es trazabilidad, nunca contenido ejecutable.

## Servicios previstos

- Java 21 + Spring Boot: API, validación, autenticación, permisos y auditoría de cambios. Fechas `LocalDate`, importes `BigDecimal`, zona `America/Argentina/Cordoba`.
- Base persistente (por decidir, por ejemplo PostgreSQL): promociones, fuentes y revisiones. Redis funciona como caché con TTL e invalidación tras cambios; no debe ser el único almacén de información verificada.
- Spring Scheduler: futuras actualizaciones desde fuentes autorizadas; registrar URL, fecha de consulta, contenido original y discrepancias. Las novedades se guardan pendientes hasta validación. No extender vencimientos automáticamente ni convertir datos inferidos en verificados.
- GitHub Pages sigue sirviendo el frontend. El backend requiere alojamiento separado con HTTPS y CORS limitado al origen publicado; cualquier credencial permanece en el servidor.

## Migración

Exportar JSON local antes de migrar. Validar e importar al servidor conservando IDs y fuentes, mantener copia de respaldo, y activar después el adaptador HTTP. Acordar manejo de conflictos y auditoría antes de sincronización automática. Normalizar entidad, tarjeta y canal con identificadores separados únicamente cuando se verifiquen los descriptores ambiguos del HTML original.
