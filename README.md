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
│   │   └── rotatingEvents.js       # Eventos de rotación
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

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Build Tool**: Vite 5.0+ (desarrollo y producción)
- **Canvas**: Fabric.js v5.3.1
- **PDF Generation**: jsPDF v2.5.1
- **UI**: SweetAlert2 v11+ para alertas
- **Icons**: Font Awesome 6.5.1 + Bootstrap Icons 1.11.3
- **Package Manager**: npm
- **Arquitectura**: Modular con ES6 modules

## 🏗️ Arquitectura

### Patrón de Diseño

La aplicación utiliza un patrón modular con separación clara de responsabilidades:

1. **Core**: Gestiona la inicialización y orquestación de módulos
2. **Gestores especializados**: Cada funcionalidad tiene su propio módulo
3. **Sistema de eventos**: Centralizado para fácil mantenimiento
4. **Utilidades**: Funciones reutilizables en diferentes módulos

### Flujo de Datos

1. **Entrada**: El usuario interactúa con la UI
2. **Eventos**: `EventManager` captura y dirige eventos
3. **Acciones**: `ActionManager` ejecuta la lógica correspondiente
4. **Canvas**: `CanvasManager` aplica cambios al canvas
5. **Renderizado**: La UI se actualiza automáticamente

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

```bash
# Servir archivos estáticamente
python -m http.server 8000
# o con Node.js
npx serve .
```

### Uso

1. Abrir `http://localhost:3000` en el navegador (Vite) o `http://localhost:8000` (servidor estático)
2. Cargar imágenes usando el botón "Cargar imágenes" o drag & drop
3. Manipular las imágenes usando las herramientas de la barra lateral
4. Configurar el tamaño de papel y orientación según necesites
5. Imprimir usando el botón "Imprimir"

## 🚀 Despliegue

El proyecto está configurado para **Vercel** con optimizaciones automáticas:

- **Framework**: Vite detectado automáticamente
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Cache optimizado**: Assets con hash para cache a largo plazo

### Deploy en Vercel

1. Conecta tu repositorio GitHub a Vercel
2. Vercel detecta automáticamente la configuración
3. Deployments automáticos en cada push a main

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
