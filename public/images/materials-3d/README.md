# Imágenes 3D de Materiales - Módulo de Joyería

Este directorio contiene las imágenes 3D vectoriales (SVG) que se asignan automáticamente a los materiales según su categoría.

## Imágenes Disponibles

| Categoría | Archivo | Descripción |
|-----------|---------|-------------|
| Metal | `metal.svg` | Lingote de oro con efecto metálico dorado |
| Piedra | `piedra.svg` | Diamante/gema con facetas y brillos rosados |
| Hilo | `hilo.svg` | Carrete de hilo azul con hilo enrollado |
| Broche | `broche.svg` | Broche de langosta metálico plateado |
| Empaque | `empaque.svg` | Caja de regalo con moño rojo |
| Herramienta | `herramienta.svg` | Alicates de joyería con mangos de madera |
| Otro | `otro.svg` | Caja genérica morada con símbolo de interrogación |

## Características

- **Formato**: SVG (Scalable Vector Graphics)
- **Dimensiones**: 400x400px
- **Efectos**: Gradientes, sombras, brillos y perspectiva 3D
- **Optimización**: Vectoriales, se escalan sin pérdida de calidad

## Uso Automático

Las imágenes se asignan automáticamente cuando:

1. **Crear un nuevo material**: Si no se sube una imagen personalizada, se asigna la imagen 3D de su categoría
2. **Cambiar categoría**: Si el material no tiene imagen personalizada, se actualiza a la imagen 3D de la nueva categoría
3. **Visualización**: Siempre se muestra la imagen 3D si no hay imagen personalizada

## Personalización

Los usuarios pueden:
- Subir su propia imagen personalizada que reemplazará la imagen 3D
- Volver a la imagen 3D eliminando la imagen personalizada
- La imagen 3D se actualiza automáticamente al cambiar la categoría (si no hay imagen personalizada)

## Implementación Técnica

Las imágenes se gestionan mediante:
- `src/lib/jewelry-material-images.ts`: Funciones helper para mapeo y gestión
- `src/components/jewelry/MateriaPrimasList.tsx`: Componente que usa las imágenes

### Funciones Disponibles

```typescript
// Obtiene la imagen 3D de una categoría
getMaterial3DImage(categoria: string): string

// Obtiene la imagen a mostrar (personalizada o 3D)
getMaterialDisplayImage(categoria: string, imagenUrl: string | null): string

// Verifica si tiene imagen personalizada
hasCustomImage(imagenUrl: string | null): boolean
```

## Colores y Estilos

Cada imagen usa una paleta de colores específica:

- **Metal**: Dorado (#FFD700, #FFA500, #FF8C00)
- **Piedra**: Rosa/Magenta (#FF1493, #C71585, #8B008B)
- **Hilo**: Azul (#4169E1, #1E90FF, #0066CC)
- **Broche**: Plateado (#C0C0C0, #A8A8A8, #808080)
- **Empaque**: Marrón y Rojo (#8B4513, #DC143C)
- **Herramienta**: Gris y Marrón (#708090, #8B4513)
- **Otro**: Morado (#9370DB, #8A2BE2, #6A1B9A)

## Actualización

Para actualizar o agregar nuevas imágenes:

1. Crear el archivo SVG en este directorio
2. Actualizar el mapeo en `src/lib/jewelry-material-images.ts`
3. Si es una nueva categoría, actualizar también `JWL_CATEGORIAS_MATERIAL` en `src/lib/types/jewelry.types.ts`
