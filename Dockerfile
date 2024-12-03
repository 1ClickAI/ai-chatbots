# Etapa 1: Build do React
FROM node:20-alpine AS build

# Atualize os pacotes e instale o FFmpeg
RUN apk update && apk add --no-cache ffmpeg

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o manager do React
COPY src/manager ./src/manager

# Copiar os arquivos da API
COPY package.json package-lock.json ./
RUN npm install

# Copiar o código do backend
COPY . .

# Expôr a porta
EXPOSE 3000

# Comando para rodar o backend
CMD ["node", "server.js"]
