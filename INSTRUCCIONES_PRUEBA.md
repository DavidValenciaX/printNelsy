# 🧪 Instrucciones de Prueba - Nueva UI Profesional

## 📋 Lista de Verificación Rápida

### ✅ Antes de Empezar
- [ ] Servidor de desarrollo iniciado (`npm run dev` o equivalente)
- [ ] Navegador moderno abierto (Chrome, Firefox, Edge, Safari)
- [ ] Consola del navegador abierta (F12) para ver logs
- [ ] Archivos de prueba (imágenes) preparados

---

## 🎯 Pruebas Funcionales del Sistema de Tabs

### 1️⃣ Panel Izquierdo - Navegación de Tabs

#### **Probar Tab "Config"**
1. Al cargar la página, el tab "Config" debe estar activo por defecto
2. Verificar que se muestran:
   - Botones de Orientación (Vertical/Horizontal)
   - Botones de Tamaño de Papel (CARTA/OFICIO/A4)
3. Hacer clic en un botón de orientación → debe activarse visualmente
4. Hacer clic en un botón de tamaño → debe activarse visualmente

#### **Probar Tab "File"**
1. Hacer clic en el tab "File"
2. Verificar transición suave (fade in/out)
3. Comprobar que se muestran:
   - Botón "Cargar imágenes"
   - Grupo "Página Actual" (PDF, PNG, Imprimir)
   - Grupo "Todas las Páginas" (PDF, PNG, Imprimir)
4. Hacer clic en "Cargar imágenes" → debe abrir selector de archivos

#### **Probar Tab "Page"**
1. Hacer clic en el tab "Page"
2. Verificar que se muestran:
   - Botón "Nueva página"
   - Navegación de páginas (Anterior/Siguiente)
   - Botón "Eliminar página" (debe estar deshabilitado inicialmente)
3. Hacer clic en "Nueva página" → debe crear una nueva página

### 2️⃣ Panel Derecho - Navegación de Tabs

#### **Probar Tab "Arrange"**
1. El tab "Arrange" debe estar activo por defecto
2. Verificar que se muestran:
   - Botones de organización (Cuadrícula, Collages)
   - Controles de Cuadrícula (Filas, Columnas, Espaciado)
   - Botones de Orientación (Filas/Columnas)
   - Botones de Orden (Adelante/Atrás)
3. Probar aumentar/disminuir filas y columnas
4. Mover el slider de espaciado → debe mostrar el valor actualizado

#### **Probar Tab "Edit"**
1. Hacer clic en el tab "Edit"
2. Verificar transición suave
3. Comprobar que se muestran todos los grupos:
   - Recorte (2 botones)
   - Rotar (2 botones + checkbox)
   - Centrar (2 botones)
   - Voltear (2 botones)
   - Escalar (2 botones)

#### **Probar Tab "Advanced"**
1. Hacer clic en el tab "Advanced"
2. Verificar que se muestran:
   - Agrupar/Desagrupar (deben estar deshabilitados sin selección)
   - Inputs de Tamaño en cm
   - Checkbox "Mantener aspecto"
   - Botón "Blanco y Negro"
   - Botones Copiar/Pegar
   - Botones Restablecer/Eliminar

---

## ⌨️ Pruebas de Atajos de Teclado

### **Navegación de Tabs**
1. **Ctrl/Cmd + Tab**: Cambiar a la siguiente tab
   - Presionar varias veces → debe ciclar por todas las tabs
   - Verificar en ambos paneles (izquierdo y derecho)

2. **Ctrl/Cmd + Shift + Tab**: Cambiar a la tab anterior
   - Presionar varias veces → debe ciclar en reversa

3. **Ctrl/Cmd + 1**: Ir a la primera tab
   - Debe saltar inmediatamente a la primera tab

4. **Ctrl/Cmd + 2**: Ir a la segunda tab
   - Debe saltar inmediatamente a la segunda tab

### **Operaciones de Edición**
1. Cargar una imagen
2. Seleccionar la imagen
3. **Ctrl/Cmd + C**: Copiar la imagen
4. **Ctrl/Cmd + V**: Pegar la imagen
5. **Delete**: Eliminar la imagen seleccionada

---

## 🎨 Pruebas Visuales y de Estilo

### **Estados de Botones**
Para cada tipo de botón, verificar:

1. **Estado Normal**
   - [ ] Color correcto (púrpura/azul: #667eea)
   - [ ] Sombra visible
   - [ ] Icono y texto alineados

2. **Estado Hover**
   - [ ] Color más oscuro (#5568d3)
   - [ ] Elevación (translateY -2px)
   - [ ] Sombra más pronunciada
   - [ ] Transición suave (0.3s)

3. **Estado Active/Pressed**
   - [ ] Color aún más oscuro (#4451b8)
   - [ ] Sin elevación
   - [ ] Feedback visual claro

4. **Estado Disabled**
   - [ ] Opacidad reducida (0.5)
   - [ ] Cursor "not-allowed"
   - [ ] No responde a hover

### **Botones Outline (Tamaño de Papel, Orientación)**
1. **Estado Inactivo**
   - [ ] Fondo transparente
   - [ ] Borde púrpura
   - [ ] Texto púrpura

2. **Estado Hover**
   - [ ] Fondo ligeramente coloreado (rgba)
   - [ ] Borde más oscuro

3. **Estado Activo (.active)**
   - [ ] Fondo con gradiente
   - [ ] Texto blanco
   - [ ] Sin borde visible

### **Botones de Peligro (Eliminar)**
1. [ ] Color rojo (#dc3545)
2. [ ] Hover más oscuro (#c82333)
3. [ ] Sombra roja
4. [ ] Icono de basura visible

---

## 🖱️ Pruebas de Interacción

### **Carga de Imágenes**
1. Hacer clic en "Cargar imágenes"
2. Seleccionar 1 imagen → debe aparecer en el canvas
3. Seleccionar múltiples imágenes (Ctrl+Click) → todas deben cargarse
4. Arrastrar imágenes al canvas → debe funcionar (drag & drop)

### **Organización de Imágenes**
1. Cargar 6 imágenes
2. Click en "Cuadrícula"
3. Ajustar filas a 2
4. Ajustar columnas a 3
5. Verificar que las imágenes se organizan en cuadrícula 2x3
6. Ajustar espaciado → debe actualizar en tiempo real

### **Edición de Imágenes**
1. Seleccionar una imagen
2. Click en "Rotar 90° derecha" → debe rotar
3. Click en "Voltear Horizontal" → debe voltear
4. Click en "Escalar Ampliar" → debe crecer
5. Click en "Centrar Vertical" → debe centrarse verticalmente
6. Click en "Centrar Horizontal" → debe centrarse horizontalmente

### **Agrupar/Desagrupar**
1. Cargar 3 imágenes
2. Seleccionar 2 imágenes (Shift+Click)
3. Botón "Agrupar" debe habilitarse
4. Click en "Agrupar" → las imágenes se agrupan
5. Seleccionar el grupo
6. Botón "Desagrupar" debe habilitarse
7. Click en "Desagrupar" → el grupo se separa

### **Establecer Tamaño**
1. Seleccionar una imagen
2. Ir a tab "Advanced"
3. Ingresar "10" en Ancho
4. Ingresar "15" en Alto
5. Marcar "Mantener aspecto"
6. Click en "Establecer tamaño"
7. Verificar que la imagen cambia de tamaño

---

## 📱 Pruebas de Responsividad

### **Pantalla Grande (>1800px)**
1. Abrir en pantalla completa
2. Verificar que:
   - [ ] Paneles laterales visibles completamente
   - [ ] Canvas centrado
   - [ ] No hay scroll horizontal
   - [ ] Controles de zoom visibles (esquina inferior derecha)

### **Pantalla Mediana (1200-1800px)**
1. Reducir ventana del navegador
2. Verificar que:
   - [ ] Paneles se ajustan proporcionalmente
   - [ ] Tabs siguen siendo legibles
   - [ ] Canvas se adapta al espacio disponible

### **Pantalla Pequeña (<1200px)**
1. Reducir ventana a tamaño tablet
2. Verificar que:
   - [ ] Layout sigue siendo usable
   - [ ] Puede aparecer scroll horizontal (esperado)
   - [ ] Tabs mantienen funcionalidad

---

## 🔍 Pruebas de Zoom

### **Controles Flotantes**
1. Localizar botones de zoom (esquina inferior derecha)
2. Click en "🔍+" → debe hacer zoom in
3. Click en "🔍-" → debe hacer zoom out
4. Verificar que:
   - [ ] Botones siempre visibles (position: fixed)
   - [ ] Animación suave en hover
   - [ ] Funcionalidad correcta

---

## 💾 Pruebas de Persistencia

### **LocalStorage - Última Tab Activa**
1. Cambiar a tab "File" en panel izquierdo
2. Cambiar a tab "Edit" en panel derecho
3. Recargar la página (F5)
4. Verificar que:
   - [ ] Tab "File" sigue activa en panel izquierdo
   - [ ] Tab "Edit" sigue activa en panel derecho

### **Estado de la Aplicación**
1. Crear varias páginas
2. Cargar imágenes
3. Organizar en cuadrícula
4. Recargar la página
5. Verificar que se mantiene el estado (si está implementado)

---

## 🐛 Pruebas de Errores

### **Sin Imágenes Cargadas**
1. Abrir aplicación sin cargar imágenes
2. Verificar que:
   - [ ] No hay errores en consola
   - [ ] Botones se muestran correctamente
   - [ ] Botones que requieren selección están deshabilitados

### **Selección Vacía**
1. Click en el canvas (área vacía)
2. Verificar que:
   - [ ] Botones de edición se deshabilitan
   - [ ] No hay errores en consola

### **Múltiples Clicks Rápidos**
1. Hacer clicks rápidos en diferentes tabs
2. Verificar que:
   - [ ] No hay errores
   - [ ] Transiciones no se rompen
   - [ ] Siempre hay una tab activa

---

## 📊 Pruebas de Rendimiento

### **Carga Inicial**
1. Abrir DevTools → Network
2. Recargar página
3. Verificar que:
   - [ ] Tiempo de carga < 3 segundos
   - [ ] No hay recursos fallidos (404)
   - [ ] CSS y JS se cargan correctamente

### **Cambio de Tabs**
1. Abrir DevTools → Performance
2. Grabar performance
3. Cambiar entre tabs varias veces
4. Detener grabación
5. Verificar que:
   - [ ] FPS se mantiene estable (60fps)
   - [ ] No hay caídas significativas
   - [ ] Memoria estable

### **Muchas Imágenes**
1. Cargar 20+ imágenes
2. Cambiar entre tabs
3. Verificar que:
   - [ ] UI sigue respondiendo
   - [ ] Transiciones suaves
   - [ ] No hay lag visible

---

## ✅ Checklist Final de Validación

### **Funcionalidad Core**
- [ ] Todas las tabs son accesibles
- [ ] Todos los botones funcionan
- [ ] Atajos de teclado operativos
- [ ] Persistencia de preferencias funciona

### **Estética**
- [ ] Colores consistentes con la paleta
- [ ] Transiciones suaves
- [ ] Sombras apropiadas
- [ ] Iconos correctos y alineados

### **UX**
- [ ] Feedback visual claro en todas las interacciones
- [ ] Estados disabled visibles
- [ ] No hay scroll innecesario
- [ ] Tooltips informativos (si están implementados)

### **Accesibilidad**
- [ ] Navegación por teclado funciona
- [ ] Focus states visibles
- [ ] Colores con contraste suficiente
- [ ] ARIA labels correctos

### **Cross-Browser**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (si disponible)

---

## 🎓 Casos de Uso Completos

### **Caso 1: Usuario Nuevo**
1. Abrir aplicación por primera vez
2. Cargar 4 imágenes
3. Cambiar tamaño de papel a A4
4. Organizar en cuadrícula 2x2
5. Exportar a PDF
6. ✓ Todo debe funcionar sin confusión

### **Caso 2: Edición Avanzada**
1. Cargar 1 imagen
2. Recortar la imagen
3. Rotar 90°
4. Establecer tamaño específico (8x10 cm)
5. Convertir a blanco y negro
6. Centrar vertical y horizontal
7. Exportar a PNG
8. ✓ Todas las ediciones deben aplicarse

### **Caso 3: Múltiples Páginas**
1. Crear 3 páginas
2. Cargar imágenes diferentes en cada página
3. Navegar entre páginas
4. Exportar todas las páginas a PDF
5. ✓ Todas las páginas deben exportarse correctamente

---

## 📝 Reporte de Bugs

Si encuentras algún problema, documenta:

```
🐛 TÍTULO DEL BUG
-----------------
Descripción: [Qué ocurrió]
Pasos para reproducir:
  1. [Paso 1]
  2. [Paso 2]
  3. [Paso 3]
Resultado esperado: [Qué debería pasar]
Resultado actual: [Qué pasó realmente]
Navegador: [Chrome 120 / Firefox 119 / etc.]
Consola de errores: [Copiar errores si hay]
Captura de pantalla: [Si es posible]
```

---

## 🎉 ¡Prueba Completada!

Si todos los tests pasan: **¡La nueva UI está lista para producción!** 🚀

Si hay problemas: Revisa los archivos:
- `src/ui/style.css` - Para problemas de estilo
- `src/ui/tabManager.js` - Para problemas de funcionalidad de tabs
- `index.html` - Para problemas de estructura
- `src/core/script.js` - Para problemas de inicialización

---

**Fecha de creación**: 2024  
**Versión**: 1.0  
**Última actualización**: Al crear la nueva UI