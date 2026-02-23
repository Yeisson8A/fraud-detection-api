# ./services/producer-api/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiamos archivos de dependencias desde la raíz del contexto
COPY package*.json ./
COPY shared/ ./shared/
COPY services/producer-api/ ./services/producer-api/

# Instalamos dependencias
RUN npm install

# Exponemos el puerto
EXPOSE 3000

# Ejecutamos
CMD ["node", "services/producer-api/index.js"]