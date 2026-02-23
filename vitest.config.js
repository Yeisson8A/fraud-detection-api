import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 1. Entorno de ejecución (Node es perfecto para microservicios)
    environment: 'node',
    
    // 2. Reportes y visualización
    globals: true, // Permite usar 'describe', 'it', 'expect' sin importarlos
    
    // 3. Inclusión de archivos
    include: ['**/*.{test,spec}.{js,ts}'],
    
    // 4. Configuración de cobertura (opcional pero recomendada)
    coverage: {
      provider: 'v8', 
      enabled: true, // Fuerza a que siempre intente generar coverage
      include: ['services/**/*.js'], // Asegura que busque dentro de las subcarpetas
      exclude: [
        'node_modules/**',
        '**/*.test.js',
        '**/*.config.js',
        'shared/constants.js', // Opcional: excluir archivos que son solo datos
        'shared/schemas/transaction.js'
      ],
      reporter: ['text', 'html'],
      all: true, // 🚩 CLAVE: Muestra archivos aunque no tengan tests o no se importen
    },

    // 5. Alias de rutas (Para que coincida con la estructura de Docker)
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    },

    env: {
      KAFKAJS_NO_PARTITIONER_WARNING: '1',
      NODE_ENV: 'test'
    },
  },
});