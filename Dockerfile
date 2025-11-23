FROM node:20-slim

WORKDIR /app

# Cài ffmpeg (Render cho phép)
RUN apt-get update && apt-get install -y \
  ffmpeg \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Cài yt-dlp dạng binary (không cần pip)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp

COPY . .

RUN npm install

EXPOSE 10000
CMD ["node", "index.js"]
