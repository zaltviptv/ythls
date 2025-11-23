FROM node:20-slim

WORKDIR /app

# Cài ffmpeg + python + curl
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Cài yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp

COPY . .

RUN npm install

EXPOSE 10000
CMD ["npm", "start"]
