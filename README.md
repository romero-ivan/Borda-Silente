# Borda Silente - Refugio de Montaña

Plataforma integral de reservas y gestión operativa para un refugio boutique en el Valle de Ansó, Pirineos.

---

## Introducción

Borda Silente es un proyecto web diseñado como portal de cara al público y panel de administración interna para un refugio de montaña premium situado a 1.280 metros de altitud en el Pirineo aragonés. La aplicación simula un entorno multiusuario interactivo donde conviven huéspedes, recepcionistas y personal de dirección general.

Este sistema ha sido diseñado con una estética limpia, minimalista y natural, inspirada en la madera, la piedra y la tranquilidad de las cumbres pirenaicas.

---

## Arquitectura del Proyecto y Vistas

La plataforma se divide en tres interfaces independientes conectadas en tiempo real mediante un sistema de sincronización periódica automática (polling a intervalos de 3 segundos).

### 1. Portal del Huésped (ClientView)
Permite al cliente final interactuar con la marca Borda Silente, conocer sus instalaciones y formalizar su reserva de forma autónoma.
- Catálogo de estancias con galería de imágenes en alta resolución, detalles constructivos y precios actualizados.
- Calculadora interactiva de estancias que desglosa el precio neto, tasas ecológicas locales, costes de limpieza e IVA.
- Generador automático de facturas digitales listas para impresión en formato PDF.
- Asistente virtual flotante de mensajería interactiva directa con el mostrador del refugio.

### 2. Mostrador Principal de Recepción (ReceptionistView)
Diseñado para el día a día operativo del refugio.
- Panel de control de estados de estancias (limpieza, ocupada, mantenimiento, disponible) con actualizaciones con un solo clic.
- Sistema de mensajería instantánea para atender dudas y solicitudes de huéspedes alojados o en proceso de reserva.
- Módulo de reservas rápidas (walk-in) para registrar estancias directamente en recepción.
- Analíticas gráficas sobre los canales de entrada de reservas (Web, Booking, Expedia, Teléfono).

### 3. Supervisión de Dirección y Administración (AdminView)
El panel ejecutivo para el control operativo e infraestructura.
- Monitor de constantes vitales del refugio: estado de la base de datos local, temperatura exterior en el Pirineo y nivel de ocupación en tiempo real.
- Simulación de circuito cerrado de televisión (CCTV) con señales en vivo de diferentes zonas (Pasillo de habitaciones, Recepción, Jardín exterior y Despensa de la cocina).
- Control de horas y turnos del personal mediante registro de entrada y salida (clock-in / clock-out) y calendario de vacaciones o bajas médicas.
- Módulo de incidencias para subcontratas: registro, asignación y resolución de tareas de mantenimiento estructural (carpintería de madera, fontanería, electricidad y deshollinadores).

---

## Estancias y Refugios

Borda Silente ofrece diferentes tipos de alojamiento rural, combinando piedra, madera noble y vistas panorámicas.

### Estancia Borda Clásica
Paredes de piedra natural, vigas de abeto visto y ropa de lino orgánico con vistas al valle de Ansó.
![Estancia Borda Clásica](https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80)

### Habitación Valle de Arán
Equipada con chimenea de piedra, mobiliario de roble artesanal y terraza privada hacia el pinar.
![Habitación Valle de Arán](https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80)

### Doble Refugio Bosque
Revestimiento de cedro silvestre, ventanal panorámico al bosque y ducha de agua de lluvia Pirenaica.
![Doble Refugio Bosque](https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80)

### Estudio Ordesa con Bañera de Cedro
Estudio equipado con tina profunda labrada en madera de cedro natural, estufa de pellets ecológica y rincón de tatami con vistas a Monte Perdido.
![Estudio Ordesa con Bañera de Cedro](https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80)

### Loft Ático Monte Perdido
Techo acristalado diseñado para la observación de estrellas, balcón volado y chimenea suspendida de hierro.
![Loft Ático Monte Perdido](https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80)

### Cabaña Silente Exclusiva
Cabaña de estructura independiente construida en madera negra, tina termal exterior sobre roca natural y aislamiento acústico absoluto.
![Cabaña Silente Exclusiva](https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80)

---

## Tecnologías Utilizadas

La solución tecnológica implementada se basa en herramientas de desarrollo web modernas para garantizar fluidez, interactividad y estabilidad en tiempo real.

- **Componente Core**: React 19 y TypeScript 5.8
- **Estilos y Maquetación**: TailwindCSS 4 y Motion (Framer Motion) para microinteracciones fluidas
- **Servidor y API**: Node.js con Express, TSX para ejecución TypeScript nativa en backend
- **Almacenamiento**: Persistencia local basada en JSON estructurado (`db_store.json`)
- **Iconografía**: Lucide React para elementos visuales limpios y unificados

---

## Ejecución Local

Siga los siguientes pasos para poner en marcha el proyecto en su máquina local.

### Prerrequisitos
Debe tener instalado Node.js (versión 18 o superior recomendada) y un gestor de paquetes (npm).

### Pasos de Instalación
1. Instale las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Defina su clave de API de Gemini (en caso de usar integraciones de inteligencia artificial) copiando el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
   Edite el archivo `.env.local` y asigne su token a la variable `GEMINI_API_KEY`.

3. Inicie el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El proyecto estará disponible para su visualización y pruebas en: `http://localhost:5173`.