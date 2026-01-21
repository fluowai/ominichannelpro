# Usar uma imagem Node.js leve
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar o Prisma Client
RUN npx prisma generate

# Compilar o projeto (não necessário pois usamos tsx)
# RUN npm run build

# Definir porta padrão (Railway injeta PORT)
ENV PORT=3333
EXPOSE 3333

# Comando para iniciar o servidor
CMD ["npm", "start"]
