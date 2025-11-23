FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache \
  ffmpeg \
  python3 \
  py3-pip \
  curl \
  bash

RUN pip3 install -U yt-dlp

ENV PATH="/root/.local/bin:$PATH"

COPY . .

RUN npm install

EXPOSE 10000

CMD ["node", "index.js"]
