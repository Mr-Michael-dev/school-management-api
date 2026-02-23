FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm install

COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

# Port is controlled by USER_PORT env var — this is documentation only
EXPOSE 3000

# Use "npm start" for production (node app.js)
CMD ["npm", "run", "dev"]
