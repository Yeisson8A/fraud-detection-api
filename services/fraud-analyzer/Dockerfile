# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Definimos el directorio de trabajo en el contenedor
WORKDIR /app

# 1. Copiamos los archivos de dependencias de la raíz (donde está el package.json principal)
COPY package*.json ./

# 2. Instalamos las dependencias (incluyendo kafkajs, ioredis, joi, etc.)
RUN npm install --production

# 3. Copiamos la carpeta shared (necesaria para la configuración de Kafka y constantes)
COPY shared/ ./shared/

# 4. Copiamos el código específico de este microservicio
COPY services/fraud-analyzer/ ./services/fraud-analyzer/

# Definimos variables de entorno por defecto (pueden ser sobrescritas por el .env)
ENV NODE_ENV=production

# Comando para arrancar el worker
# Apuntamos a la ruta relativa desde la raíz /app
CMD ["node", "services/fraud-analyzer/worker.js"]