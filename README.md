# 🖼️ Asistente de Impresión de Imágenes

Una aplicación web para manipular, organizar e imprimir imágenes usando Fabric.js.

## 📁 Estructura del Proyecto

```
imprimir_imagenes_fabric/
├── 📁 public/                    # Archivos públicos
│   └── index.html               # HTML principal de la aplicación
│
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
│   ├── 📁 events/              # Eventos específicos del canvas
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
- **Canvas**: Fabric.js v5.3.1
- **UI**: SweetAlert2 para alertas
- **Icons**: Font Awesome 6.0
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

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Navegar al directorio
cd imprimir_imagenes_fabric

# Servir los archivos (ejemplo con Python)
python -m http.server 8000
# o con Node.js
npx serve public
```

### Uso
1. Abrir `http://localhost:8000` en el navegador
2. Cargar imágenes usando el botón "Cargar imágenes" o drag & drop
3. Manipular las imágenes usando las herramientas de la barra lateral
4. Configurar el tamaño de papel y orientación según necesites
5. Imprimir usando el botón "Imprimir"

## 🤝 Contribución

Para contribuir al proyecto:

1. Seguir la estructura modular existente
2. Colocar nuevas funcionalidades en el directorio apropiado
3. Mantener las importaciones relativas correctas
4. Documentar nuevas funciones y módulos
5. Probar en diferentes navegadores y tamaños de papel

## 📝 Notas de Desarrollo

- **ES6 Modules**: Todos los archivos usan imports/exports de ES6
- **Fabric.js**: La aplicación depende de Fabric.js para manipulación del canvas
- **Responsive**: La UI es adaptable a diferentes tamaños de pantalla
- **Accesibilidad**: Incluye funciones de accesibilidad para usuarios con discapacidades
- **Navegadores**: Compatible con navegadores modernos que soporten ES6 modules 