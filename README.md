# **Real-Time Fraud Detection System (Node.js + Kafka + Redis)**
Este proyecto es una implementación de una Arquitectura Orientada a Eventos (EDA) diseñada para procesar y analizar transacciones financieras en tiempo real. Utiliza un dataset real de Kaggle para simular flujos de datos masivos y detectar patrones fraudulentos mediante un motor de reglas asíncrono.

## **Lógica de Detección de Fraude**

El Fraud Analyzer utiliza las siguientes reglas para marcar una transacción como **REJECTED**:
- **Monto Máximo**: Cualquier transacción individual > $5,000.
- **Velocidad (Velocity Check)**: Más de 5 transacciones de un mismo usuario en menos de 60 segundos (gestionado con Redis).
- **Anomalía de Gasto**: Si el monto es 10 veces superior al promedio reciente del usuario.

## **Arquitectura del Sistema**
El sistema se divide en cuatro componentes principales que se comunican de forma asíncrona:

- **Ingestador de Datos (Script)**: Lee el dataset de crédito de Kaggle y emite peticiones HTTP a la API.
- **Producer API (Node.js + Express)**: Recibe las transacciones, las valida y las publica en el topic transaction-pending de Kafka.
- **Fraud Analyzer (Worker)**: El "cerebro". Consume transacciones, consulta el historial en Redis, aplica reglas de negocio y publica el veredicto.
- **Notification Service (Worker)**: El consumidor final. Persiste el resultado en MongoDB y dispara alertas en consola si se detecta fraude.

## **Stack Tecnológico**

- **Runtime**: Node.js (v18+)
- **Mensajería**: Apache Kafka (con Kafkajs)
- **Caché/Estado**: Redis (Análisis de velocidad)
- **Base de Datos**: MongoDB (Histórico de transacciones)
- **Infraestructura**: Docker & Docker Compose

## **Variables de Entorno**

- **KAFKA_BROKERS**: Lista de brokers de Kafka separados por coma. Por ejemplo: kafka:9092
- **REDIS_HOST**: Host del servidor Redis para métricas rápidas. Por ejemplo: redis
- **REDIS_PORT**: Puerto de conexión a Redis. Por ejemplo: 6379
- **MONGO_URI**: URI de conexión para la base de datos MongoDB. Por ejemplo: mongodb://mongodb:27017/fraud_db
- **PORT**: Puerto donde corre la Producer API. Por ejemplo: 3000
- **INGEST_DELAY**: Retraso (ms) entre mensajes en el script de ingesta. Por ejemplo: 100

## **Requisitos Previos**

- Docker y Docker Compose
- Dataset de Kaggle descargado: `https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud`.
- Crear carpeta `data` en la raiz del proyecto y colocar el archivo `creditcard.csv`

## **Levantar proyecto** 

Desde la raíz del proyecto, ejecuta el siguiente comando para construir y levantar todos los contenedores en segundo plano: `docker-compose up --build -d`

Verificar que los servicios están corriendo `docker ps`
Deberías ver contenedores para: kafka, zookeeper, redis, mongodb, producer-api, fraud-analyzer y notification-service.

## **Ejecución y Monitoreo** 

### **Ver los Logs (Análisis en vivo)**

Abre dos terminales para observar cómo interactúan los microservicios:
- Terminal A (Detección): `docker-compose logs -f fraud-analyzer`
- Terminal B (Alertas y Persistencia): `docker-compose logs -f notification-service`

### **Iniciar la Ingesta de Datos** 

En una tercera terminal (en tu máquina local), instala las dependencias y corre el script que leerá el CSV de Kaggle: 
- `npm install`
- `node scripts/ingest-kaggle-data.js`

## **Endpoints de la API**

**POST /v1/transactions**: Punto de entrada para nuevas transacciones.

### **Petición**
````
{
  "userId": "user_123",
  "amount": 450.00,
  "location": "New York",
  "features": [1.2, -0.5, 2.3, ...] 
}
````

### **Respuesta (202 Accepted)**

````
{
  "message": "Transaction received and is being processed",
  "transactionId": "uuid-generado",
  "status": "PENDING"
}
````

## **Herramientas de Inspección** 

- **Kafka UI**: Accede a http://localhost:8080 para ver los topics, mensajes y el lag de los consumidores en una interfaz gráfica.
- **MongoDB**: Puedes conectarte a mongodb://localhost:27017 para ver las transacciones finales procesadas.