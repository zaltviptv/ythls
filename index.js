import express from "express";
import ytdlp from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 10000;

// Cache đơn giản
let cache = {};

// Health
app.get("/", (req, res) => {
  res.send("YT Live Proxy Running...");
});

// Lấy m3u8 theo VIDEO ID
app.get("/video/:id.m3u8", async (req, res) => {
  const id = req.params.id;
  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    if (cache[id] && Date.now() - cache[id].time < 1000 * 60 * 30) {
      return res.redirect(cache[id].m3u8);
    }

    const streamUrl = await ytdlp(url, {
      format: "best",
      getUrl: true,
    });

    cache[id] = {
      m3u8: streamUrl.trim(),
      time: Date.now(),
    };

    res.redirect(streamUrl.trim());
  } catch (e) {
    res.status(500).send("Không lấy được M3U8 hoặc video chưa LIVE");
  }
});

// Lấy m3u8 theo CHANNEL ID
app.get("/channel/:id.m3u8", async (req, res) => {
  const channelId = req.params.id;
  const url = `https://www.youtube.com/channel/${channelId}/live`;

  try {
    const streamUrl = await ytdlp(url, {
      format: "best",
      getUrl: true,
    });

    res.redirect(streamUrl.trim());
  } catch (e) {
    res.status(500).send("Channel chưa LIVE");
  }
});

app.listen(PORT, () => {
  console.log("Proxy running on port", PORT);
});
