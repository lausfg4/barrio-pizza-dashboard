# Barrio Pizza — Dashboard de Control de Órdenes

Este es un dashboard web interactivo y de alta gama diseñado para la gerente de compras de **Barrio Pizza**. Su propósito es automatizar la revisión de las órdenes de compra de insumos semanales en 10 sucursales de Panamá, evaluando si el pedido de cada sucursal es suficiente, excesivo, o si olvidaron incluir ingredientes clave.

La aplicación está construida sobre un stack moderno y premium de **Next.js (React), TypeScript, TailwindCSS y Recharts**, acompañado de un **Asistente IA integrado** (con la API de Gemini) para realizar consultas inteligentes sobre inventario en lenguaje natural y redactar borradores automáticos de órdenes de compra.

---

## 🚀 Cómo Correr el Proyecto

### Requisitos Previos
* **Node.js** (v18.0.0 o superior)
* **npm** (v9.0.0 o superior) o **yarn**

### Paso 1: Instalar Dependencias
Clona el repositorio, navega al directorio del proyecto y ejecuta el siguiente comando en tu terminal para instalar todas las dependencias necesarias:
```bash
npm install
```

### Paso 2: Configurar la API Key de Gemini (Asistente IA)
Para utilizar la pestaña de **Asistente IA**, necesitas proporcionar una API Key de Google Gemini.

1. **Localmente:**
   - Crea un archivo llamado `.env.local` en la raíz del proyecto.
   - Agrega la siguiente variable de entorno con tu clave:
     ```env
     NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
     ```

2. **En Producción (Vercel):**
   - Agrega una nueva Variable de Entorno en el panel de Vercel con la clave `NEXT_PUBLIC_GEMINI_API_KEY` y tu API Key como valor.

*Nota 1: Por seguridad, se ha deshabilitado el ingreso manual de la API Key a través de la interfaz web, haciendo mandatorio configurarla a través de variables de entorno.*
*Nota 2: Si no posees una clave, el dashboard iniciará de todas formas de forma normal y te permitirá interactuar con el resto de las pestañas locales sin el chat bot.*

### Paso 3: Ejecutar en Modo Desarrollo
Inicia el servidor local de desarrollo:
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver el dashboard.

### Paso 4: Construir para Producción (Opcional)
Para compilar la aplicación optimizada para producción:
```bash
npm run build
npm start
```

---

## 📊 Supuestos y Lógica de Negocio Aplicada

Para cumplir con las metas operativas del negocio, la lógica interna del sistema en [`src/lib/logic.ts`](src/lib/logic.ts) realiza la consolidación de datos bajo los siguientes supuestos técnicos:

### 1. Proyección de Consumo (Próxima Semana)
* **Algoritmo**: Promedio móvil simple. Se calcula sumando el consumo histórico de las últimas 6 semanas (`consumo_historico.csv`) de cada ingrediente en cada sucursal y dividiéndolo por 6.
* **Justificación**: Proporciona una base suavizada y robusta que amortigua picos atípicos en ventas de semanas previas, adecuada para insumos frescos y secos.

### 2. Necesidad Real Física
* **Fórmula**: `Necesidad Real (Unidad Base) = Consumo Proyectado - Inventario Actual`.
* **Corte**: Si el inventario actual cubre por completo o supera el consumo proyectado para la semana, la necesidad real se establece en `0.0 kg/L/U` (no se requiere pedir nada).

### 3. Redondeo en Formatos de Compra
* **Unidad de Medida**: El consumo e inventario se rastrean en unidades base (`kg`, `L`, `unidades`), mientras que los pedidos a proveedores se realizan estrictamente en **Formatos Completos** (por ejemplo, *Saco de 25 kg*, *Caja de 10 kg*).
* **Supuesto de Redondeo**: Para no generar alertas innecesarias, un pedido que excede matemáticamente la necesidad real por **menos de un formato completo** se considera dentro de la holgura del "Redondeo Normal". Solo se marcan como alertas si la diferencia de exceso es mayor o igual a **1.0 unidad de formato**.

### 4. Generación de Alertas Claras y Accionables
El sistema compara el pedido actual de la sucursal (convertido a unidad base) contra la necesidad real física del insumo, clasificándolas en cuatro estados automáticos:

1. **Riesgo de Quiebre (CRÍTICO - Rojo)** 🔴:
   * **Condición**: El pedido actual de la sucursal es menor que el formato recomendado requerido para cubrir la necesidad real.
   * **Mensaje**: `ALERTA: <sucursal> está pidiendo <cantidad> <unidad> de <ingrediente> menos que lo proyectado → riesgo de quiebre.`

2. **Insumo Olvidado (ADVERTENCIA - Naranja)** ⚠️:
   * **Condición**: La sucursal necesita físicamente el insumo (necesidad real > 0), pero la orden de compra tiene cantidad `0` o fue omitida.
   * **Mensaje**: `ALERTA: <sucursal> no incluyó <ingrediente> en el pedido, pero se proyecta una necesidad de <cantidad> <unidad> → riesgo de desabastecimiento.`

3. **Sobre-pedido (EXCESO - Amarillo)** 📦:
   * **Condición**: La sucursal está ordenando al menos **un formato completo extra** sobre la necesidad real.
   * **Mensaje**: `ALERTA: <sucursal> está pidiendo <cantidad> <unidad> de <ingrediente> de más en comparación a lo proyectado (<proyectado> <unidad>) → riesgo de merma.`

4. **Correcto (ÓPTIMO - Verde)** ✅:
   * **Condición**: El pedido de la sucursal cubre de forma exacta la necesidad real, con un residuo de redondeo aceptable menor a un formato de compra.

### 5. Perecibilidad e Indicadores de Desperdicio
* Para los insumos catalogados en `ingredientes.csv` como **Perecederos** (`es_perecedero = 'Si'`), los excedentes de pedido se reflejan en la pestaña de Análisis como **"Desperdicio Estimado" 🗑️** con la etiqueta **"Exceso Perecedero"**.
* Para los insumos **No Perecederos** (`es_perecedero = 'No'`), los excedentes se registran como **"Sobre-stock Estimado" 📦** bajo la etiqueta **"Sobre-stock Seco"**, evitando alertar por mermas en productos no perecederos.

---

## 🛠️ Tecnologías y Librerías Utilizadas
* **Core**: Next.js App Router (React)
* **Lenguaje**: TypeScript
* **Estilizado**: TailwindCSS & Vanilla CSS
* **Gráficos e Indicadores**: Recharts
* **Iconografía**: Lucide React
* **Motor IA**: Google Generative AI SDK (Gemini-3.5-flash)

---

## 🔌 Conexión e Integración con Odoo ERP

Para escalar este Dashboard de Barrio Pizza y conectarlo en tiempo real con **Odoo ERP** (automatizando la ingesta de stocks y el envío de órdenes de compra), se propone la siguiente arquitectura de integración:

### 1. Sincronización de Datos (Lectura desde Odoo)
Actualmente, el dashboard lee archivos CSV estáticos de la carpeta `/datos`. Para conectarse con Odoo:
* **Inventario en Tiempo Real (`stock.quant`):** Se puede programar un servicio en Next.js (por ejemplo, una API Route o un script de sincronización con Cron) que consulte los inventarios físicos de Odoo a través de su protocolo **XML-RPC** o **JSON-RPC**.
* **Catálogo de Insumos (`product.product`):** Sincroniza la lista de ingredientes, formatos de compra y sus equivalencias de unidades de medida directamente de Odoo, eliminando la necesidad de mantener el archivo `ingredientes.csv` manualmente.

### 2. Flujo de Generación de Órdenes de Compra (Escritura hacia Odoo)
En lugar de depender exclusivamente de descargas de archivos Excel o CSV desde la pestaña de **Pedidos por Proveedor**, el dashboard puede interactuar directamente con el módulo de compras de Odoo:
1. **Petición Segura:** Al hacer clic en "Aprobar Orden" (desde la interfaz o mediante el chatbot), se envía una solicitud a una ruta de API de Next.js (`/api/purchase-order`).
2. **Creación en Odoo (`purchase.order`):** El servidor de Next.js se conecta a la API externa de Odoo usando credenciales seguras (usuario, contraseña/API token y base de datos) y crea una orden de compra en estado de **Borrador (Draft PO)**.
3. **Detalle de la Orden (`purchase.order.line`):** Se añade cada línea del pedido con el ID del producto correspondiente en Odoo y la cantidad de formatos de compra recomendados que fueron validados en el dashboard.

### 3. Métodos Técnicos de Conexión
* **Llamadas Directas (XML-RPC):** Odoo expone por defecto endpoints en `/xmlrpc/2/common` (para autenticación) y `/xmlrpc/2/object` (para manipulación de modelos de datos). Es compatible con cualquier cliente HTTP estándar en JavaScript.
* **REST API (Odoo v16+ / Módulos OCA):** Si se dispone de la versión Enterprise de Odoo o del módulo comunitario de REST API (OCA), se pueden realizar llamadas HTTP REST estándar (`GET`, `POST`), lo que simplifica la integración y permite autenticación mediante Bearer Tokens o OAuth.
* **Middleware Intermedio (Opcional):** Si se desea desacoplar el frontend del ERP, se puede construir una pequeña función Serverless en Node.js que actúe como pasarela de comunicación, formateando las solicitudes del dashboard al esquema nativo de Odoo.