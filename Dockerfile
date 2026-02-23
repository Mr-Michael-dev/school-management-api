FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Development stage ----
# Runs nodemon, bind-mounts source
# Uses the built-in 'node' user (UID/GID 1000) that ships with node:alpine
FROM base AS development
RUN npm install
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Production stage ----
# Runs node directly, no bind mount, no devDependencies (no nodemon)
FROM base AS production
RUN npm install --omit=dev
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
