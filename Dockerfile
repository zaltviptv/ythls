FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  curl \
  && pip3 install -U yt-dlp \
  && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

EXPOSE 10000

CMD ["node", "index.js"]
