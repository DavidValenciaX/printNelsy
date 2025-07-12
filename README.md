# 🖼️ Print Nelsy - Asistente de Impresión de Imágenes

Una aplicación web para manipular, organizar e imprimir imágenes usando Fabric.js.

🌐 **Aplicación en línea**: [https://print-nelsy.vercel.app/](https://print-nelsy.vercel.app/)
📦 **Repositorio**: [https://github.com/DavidValenciaX/printNelsy](https://github.com/DavidValenciaX/printNelsy)

## ❤️ Dedicatoria

Este proyecto fue creado y está dedicado con todo mi amor a mi madre, **Maria Nelsy**.

Lo hice como una forma de ayudarla a imprimir más fácilmente en la papelería que teníamos en casa, la **Papelería Nelsy**, que tanto nos ayudó a conseguir los ingresos para subsistir.

**Te quiero mucho, Madre.**

## 📁 Estructura del Proyecto

```bash
imprimir_imagenes_fabric/
├── index.html               # HTML principal de la aplicación
├── 📁 src/                      # Código fuente
│   ├── 📁 core/                 # Módulos principales de la aplicación
│   │   ├── app.js              # Clase principal de la aplicación
│   │   ├── script.js           # Punto de entrada
│   │   ├── domManager.js       # Gestión de elementos DOM
│   │   ├── canvasManager.js    # Gestión del canvas de Fabric.js
│   │   ├── actionManager.js    # Centralización de acciones
│   │   └── eventManager.js     # Gestión de eventos
│   │
│   ├── 📁 canvas/              # Funcionalidades específicas del canvas
│   │   ├── canvasResizeUtils.js     # Redimensionamiento del canvas
│   │   ├── marginRectManager.js     # Gestión de márgenes
│   │   └── constraintUtils.js       # Restricciones de objetos
│   │
│   ├── 📁 image/               # Manipulación y procesamiento de imágenes
│   │   ├── imageUploadUtils.js      # Carga de imágenes
│   │   ├── imageSize.js            # Gestión de tamaños
│   │   ├── imageEffects.js         # Efectos de imagen
│   │   ├── cropUtils.js            # Recorte de imágenes
│   │   └── resetUtils.js           # Restauración de imágenes
│   │
│   ├── 📁 transform/           # Transformaciones de objetos
│   │   ├── scaleUtils.js           # Escalado de objetos
│   │   ├── rotateUtils.js          # Rotación de objetos
│   │   ├── center.js               # Centrado de objetos
│   │   └── arrangeUtils.js         # Arreglo y organización
│   │
│   ├── 📁 layout/              # Layouts y collages
│   │   ├── collageUtils.js         # Creación de collages
│   │   └── layoutSelector.js       # Selección de layouts
│   │
│   ├── 📁 events/              # Eventos específicas del canvas
│   │   ├── movingEvents.js         # Eventos de movimiento
│   │   ├── scalingEvents.js        # Eventos de escalado
│   │   ├── rotatingEvents.js       # Eventos de rotación
│   │   └── skewingEvents.js        # Eventos de skewing/inclinación
│   │
│   ├── 📁 interactions/        # Interacciones del usuario
│   │   ├── clipboardUtils.js       # Copiar/pegar
│   │   ├── deleteUtils.js          # Eliminación de objetos
│   │   └── deactivateObjects.js    # Desactivación de objetos
│   │
│   ├── 📁 output/              # Funciones de salida
│   │   ├── printUtils.js           # Impresión
│   │   └── zoom.js                 # Funciones de zoom
│   │
│   ├── 📁 utils/               # Utilidades generales
│   │   ├── mathUtils.js            # Funciones matemáticas
│   │   └── accessibilityUtils.js   # Funciones de accesibilidad
│   │
│   └── 📁 ui/                  # Interfaz de usuario
│       └── style.css           # Estilos CSS
│
└── README.md                   # Este archivo
```

## 🚀 Funcionalidades

### ✨ Gestión de Imágenes

- **Carga múltiple**: Soporte para drag & drop y selección múltiple
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Organización automática**: Disposición inteligente de imágenes

### 🖼️ Manipulación de Imágenes

- **Redimensionamiento**: Escalado manual y automático
- **Rotación**: 90° o rotación libre
- **Recorte**: Herramienta de recorte interactiva
- **Efectos**: Conversión a escala de grises
- **Centrado**: Centrado horizontal y vertical

### 📐 Configuración de Papel

- **Tamaños estándar**: Carta, Oficio, A4
- **Orientaciones**: Vertical y horizontal
- **Márgenes**: Configurables con restricciones automáticas

### 🎨 Layouts y Collages

- **Collage de columnas**: Organización en columnas tipo masonry
- **Collage de filas**: Organización en filas tipo masonry
- **Collage aleatorio**: Distribución automática optimizada
- **Layouts en grilla**: Organizaciones en filas y columnas

### 📋 Interacciones

- **Copiar/Pegar**: Con soporte para Ctrl+C/Ctrl+V
- **Deshacer cambios**: Restauración de estado original
- **Selección múltiple**: Manipulación de múltiples objetos

### 🖨️ Impresión

- **Vista previa**: Visualización antes de imprimir
- **Optimización**: Preparación automática para impresión
- **Formato**: Mantiene proporciones y calidad

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ Modules)
- **Canvas**: Fabric.js v5.3.1
- **Generación de PDF**: jsPDF v2.5.1
- **UI**: SweetAlert2 v11+ para alertas
- **Iconos**: Font Awesome 6.5.1 y Bootstrap Icons 1.11.3
- **Gestor de Paquetes**: npm

### ⚡ Build Tool: Vite

El proyecto utiliza **Vite** como herramienta de construcción, lo que ofrece una experiencia de desarrollo moderna y un build de producción altamente optimizado. La migración desde un enfoque basado en CDN a Vite ha traído mejoras significativas:

| Aspecto           | Antes (CDN)                    | Ahora (Vite + npm)               |
| :---------------- | :----------------------------- | :------------------------------- |
| **Tiempo de Carga** | Lento (múltiples peticiones)   | Rápido (chunks optimizados)      |
| **Desarrollo**    | Recarga completa de página     | HMR (recarga instantánea)        |
| **Confianza**     | Dependiente de servicios externos | Builds locales y reproducibles     |
| **Seguridad**     | Riesgos de CDN                 | Controlado y verificable         |
| **Rendimiento**   | Optimización manual            | Optimización automática          |

## 🏗️ Arquitectura

### Patrón de Diseño

La aplicación utiliza un patrón modular con separación clara de responsabilidades:

1. **Core**: Gestiona la inicialización y orquestación de módulos.
2. **Gestores especializados**: Cada funcionalidad (canvas, imágenes, etc.) tiene su propio módulo.
3. **Sistema de eventos**: Centralizado para fácil mantenimiento.
4. **Utilidades**: Funciones reutilizables en diferentes módulos.

### Flujo de Datos

1. **Entrada**: El usuario interactúa con la UI.
2. **Eventos**: `EventManager` captura y dirige los eventos a los módulos correspondientes.
3. **Acciones**: `ActionManager` centraliza y ejecuta la lógica de negocio.
4. **Canvas**: `CanvasManager` aplica los cambios visuales en el canvas de Fabric.js.
5. **Renderizado**: La UI se actualiza para reflejar los cambios.

### Alias de Importación para Desarrollo

Para facilitar el desarrollo y la mantenibilidad, el proyecto está configurado con alias de importación a través de Vite. Esto permite importaciones más limpias y desacopladas de la estructura de directorios. Ejemplos: `@/` (src), `@core/` (src/core), `@canvas/` (src/canvas).

## 🔧 Instalación y Uso

### 🌐 Usar la Aplicación en Línea

**La forma más fácil es usar la aplicación directamente en tu navegador:**

👉 **[https://print-nelsy.vercel.app/](https://print-nelsy.vercel.app/)**

### ⚡ Instalación Local (Vite + npm - Para Desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/DavidValenciaX/printNelsy.git

# Navegar al directorio
cd printNelsy

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 🏗️ Comandos Disponibles

```bash
# Desarrollo con HMR
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

### 📋 Instalación Alternativa (Servidor estático)

Si no deseas utilizar Vite para desarrollo, puedes generar los archivos de producción y servirlos con cualquier servidor estático.

```bash
# 1. Generar el build
npm run build

# 2. Servir el directorio dist
npx serve dist
```

### Uso

1. Abrir `http://localhost:3000` (o el puerto que indique Vite) en el navegador.
2. Cargar imágenes usando el botón "Cargar imágenes" o arrastrándolas a la ventana.
3. Manipular las imágenes usando las herramientas de la barra lateral.
4. Configurar el tamaño de papel y orientación según necesites.
5. Imprimir usando el botón "Imprimir".

## 🚀 Despliegue

El proyecto está optimizado para **Vercel** y se despliega automáticamente con cada push a la rama `main`.

### Configuración de Vercel

La configuración se define en `vercel.json` para asegurar despliegues consistentes y optimizados:

- **Framework**: `vite`
- **Comando de Build**: `npm run build`
- **Directorio de Salida**: `dist/`
- **URLs limpias**: Activado (`cleanUrls: true`)

### Métricas de Rendimiento

La aplicación ha sido optimizada para ofrecer una excelente experiencia de usuario, logrando altos puntajes en Lighthouse y tamaños de bundle reducidos.

#### Lighthouse Score (Producción)

- **Performance**: 95+/100
- **Accessibility**: 90+/100
- **Best Practices**: 95+/100

#### Tamaños de Bundle (Gzipped)

- **Fabric.js**: ~88KB
- **jsPDF**: ~116KB
- **SweetAlert2**: ~20KB
- **Código de la aplicación**: ~50KB

### Características de Despliegue Avanzadas

- **Seguridad**: Se incluyen headers de seguridad como `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy` para proteger contra ataques comunes.
- **PWA (Progressive Web App)**: La aplicación cuenta con un manifest y un service worker para permitir la instalación en dispositivos y ofrecer funcionalidad básica sin conexión.
- **CDN Global**: Los assets se distribuyen a través de la red global de Vercel para baja latencia en todo el mundo.
- **Cache Inteligente**: Los assets tienen una estrategia de cache de larga duración (`immutable`), mientras que el HTML se sirve siempre fresco para obtener las últimas actualizaciones.

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio: [https://github.com/DavidValenciaX/printNelsy](https://github.com/DavidValenciaX/printNelsy)
2. Seguir la estructura modular existente
3. Colocar nuevas funcionalidades en el directorio apropiado
4. Mantener las importaciones relativas correctas
5. Documentar nuevas funciones y módulos
6. Probar en diferentes navegadores y tamaños de papel
7. Crear Pull Request con descripción detallada

## 📝 Notas de Desarrollo

- **ES6 Modules**: Todos los archivos usan imports/exports de ES6
- **Fabric.js**: La aplicación depende de Fabric.js para manipulación del canvas
- **Responsive**: La UI es adaptable a diferentes tamaños de pantalla
- **Accesibilidad**: Incluye funciones de accesibilidad para usuarios con discapacidades
- **Navegadores**: Compatible con navegadores modernos que soporten ES6 modules
