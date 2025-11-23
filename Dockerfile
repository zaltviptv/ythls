FROM node:20-alpine

WORKDIR /app

# Cài ffmpeg + python
RUN apk update && apk add --no-cache \
  ffmpeg \
  python3 \
  py3-pip \
  curl \
  bash

COPY . .

RUN npm install

EXPOSE 10000

CMD ["npm", "start"]
