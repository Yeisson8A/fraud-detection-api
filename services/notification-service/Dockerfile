# Imagen base
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# 1. Dependencias (usando el package.json de la raíz)
COPY package*.json ./
RUN npm install --production

# 2. Copiar código compartido (Kafka client, constantes)
COPY shared/ ./shared/

# 3. Copiar el código del servicio de notificaciones
COPY services/notification-service/ ./services/notification-service/

# Variables de entorno
ENV NODE_ENV=production

# Ejecutar el worker de alertas
CMD ["node", "services/notification-service/alert-worker.js"]