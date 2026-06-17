FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

CMD ["npm", "start"]
