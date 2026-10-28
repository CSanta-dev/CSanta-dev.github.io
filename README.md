# Calendario Super

Aplicación React, mobile-first, para consultar y administrar promociones de supermercados de Córdoba Capital. Primera versión **sin backend**: los datos se guardan en localStorage de cada navegador. No hay sincronización ni actualizaciones automáticas todavía.

## Ejecutar

Requiere Node.js 22.12+ (también compatible con Node 24) y npm.

```sh
npm ci
npm run dev
```

Abrir la URL indicada por Vite. Para producción:

```sh
npm test
npm run build
npm run preview
```

Las pruebas verifican filtros combinados, recurrencias, límites inclusivos de vigencia, domingos, años bisiestos, vencimientos, importaciones y la fecha de Córdoba. La PWA se genera en producción; no se registra un service worker en desarrollo.

## Uso y datos

- Navegar entre meses y seleccionar un día. Los cinco filtros se combinan con AND; se aplican al calendario y al listado.
- «Ver todas» permite administrar también promociones vencidas o que no coinciden con el día seleccionado.
- Crear, editar y eliminar promociones. Marcar los días de repetición semanal; para una promoción de un único día, indicar la misma fecha de inicio y fin y su día de semana.
- Importar/exportar JSON versión 1. La importación valida el archivo completo antes de guardar y combina por ID, actualizando los coincidentes previa confirmación. No elimina los registros ausentes. Exportar copias periódicas: borrar los datos del navegador elimina los cambios.
- Estados: pendiente, reportada y verificada. Para verificar se requiere una fuente y confirmar la información provisional. Esto registra una declaración del usuario; la aplicación no realiza una verificación automática.
- Una promoción vencida no se muestra en días posteriores a su fin. En consultas históricas se conserva con la etiqueta «Vencida» calculada respecto del día actual en Córdoba. Fechas de inicio/fin inclusivas. Un fin desconocido se guarda como `null`; nunca se inventa un vencimiento.
- Un porcentaje 0 en las promociones originales representa la oferta de cuotas, no un descuento porcentual.

### Datos originales

`reference/calendario_super.html` conserva el archivo recibido del repositorio sin cambios. `src/seed.json` conserva sus **25 filas**, incluyendo la fila original completa en `original`. Inicio `2026-10-01` proviene de la regla del HTML, y los fines son los valores **provisionales** del original. Todos los registros iniciales están pendientes y son provisionales.

Los mínimos y topes del HTML se conservan textualmente en `conditions`, incluyendo periodicidad y excepciones; los campos numéricos independientes se dejan en `null` para evitar perder matices o inferir condiciones. «No informado» en esos campos no sustituye el texto de condiciones.

No se transforma «Visa Santander» en crédito o débito, ni «Visa débito Naranja X» en prepaga por suposición. Los descriptores originales se conservan. El formulario ofrece Mercado Pago (crédito/dinero en cuenta), BBVA (Visa/Mastercard), Santander (Visa crédito, Visa débito, American Express), Personal Pay y Naranja X prepaga. Elegir un medio no crea una promoción ni acredita que una tarjeta sea admitida. Los filtros usan los valores registrados exactos; los descriptores ambiguos permanecen diferenciados hasta su verificación.

## PWA y Android

El build genera manifest, íconos PNG de 192/512 y service worker con precaché del HTML, CSS y JavaScript. Tras una primera visita en línea, se puede abrir sin conexión. Los cambios continúan guardándose en localStorage.

Publicar mediante HTTPS (o localhost para desarrollo). En Chrome Android, usar «Instalar app» cuando esté disponible o el menú del navegador → «Agregar a pantalla principal». La instalación y los avisos dependen del navegador; no se promete instalación en navegadores sin soporte. Cuando hay nueva versión, el botón «Actualizar aplicación» permite cargarla.

## GitHub Pages

1. Subir estos archivos a una rama y revisar el cambio. Conservar `calendario_super.html` original en la raíz del repositorio.
2. En Settings → Pages → Build and deployment, seleccionar **GitHub Actions**. La disponibilidad de Pages en repositorios privados depende del plan de GitHub.
3. Al integrar en `main`, `.github/workflows/pages.yml` instala con `npm ci`, ejecuta pruebas, compila y despliega `dist`. Los pull requests solo validan y generan el artefacto, sin publicar.
4. URL esperada para este repositorio: `https://csanta-dev.github.io/Calendario/`, una vez habilitado Pages y completado el workflow.

Vite usa `base: './'` y la PWA usa alcance relativo, para funcionar dentro de `/Calendario/` sin rutas de servidor. No subir `node_modules` ni `dist`. No incluir secretos en variables del frontend.

## Organización y futura arquitectura

- `src/domain.js`: funciones puras de filtros, fechas, recurrencia, estado y validación JSON.
- `src/seed.json`: datos iniciales trazables.
- `src/repository.js`: adaptador asíncrono de persistencia.
- `src/main.jsx`: entrada React.
- `src/App.jsx`: calendario, filtros y listados.
- `src/Editor.jsx`: formulario de administración.
- `src/style.css`: diseño responsive.
- `tests/domain.test.js`: reglas de negocio.

La interfaz consume `promotionRepository.load()` y `save(promotions)`; se puede reemplazar el adaptador local por uno HTTP sin trasladar las reglas de dominio a los componentes. `docs/backend.md` describe el contrato y el plan para Java / Spring Boot / Redis. No se incluyen servidores ficticios ni dependencias de backend en esta versión.

## Límites

Datos locales por navegador, sin cuentas ni colaboración entre dispositivos. No hay verificación automática de comercios, tarjetas o condiciones ni notificaciones. La eliminación se confirma y no tiene deshacer; mantener una exportación. Si localStorage no está disponible o contiene datos inválidos, se muestra un error y no se sobrescriben los datos existentes.
