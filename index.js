import express from "express";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 10000;

// Cache đơn giản
const cache = {};

// Health check
app.get("/", (req, res) => {
  res.send("✅ YT Live Proxy Running...");
});

// Lấy m3u8 theo VIDEO ID
app.get("/video/:id.m3u8", async (req, res) => {
  const id = req.params.id;
  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    // Cache 30 phút
    if (cache[id] && Date.now() - cache[id].time < 30 * 60 * 1000) {
      return res.redirect(cache[id].m3u8);
    }

    const { stdout } = await execAsync(
      `yt-dlp -g -f "best[protocol*=m3u8]" \
  --extractor-args "youtube:player_client=android" \
  --user-agent "com.google.android.youtube/17.36.4" \
  "${url}"`
    );

    const m3u8 = stdout.trim();
    if (!m3u8.includes("m3u8")) {
      return res.status(500).send("❌ Không lấy được m3u8 (video chưa live?)");
    }

    cache[id] = {
      m3u8,
      time: Date.now()
    };

    res.redirect(m3u8);
  } catch (e) {
    console.error(e);
    res.status(500).send("❌ Lỗi lấy stream");
  }
});

// Lấy m3u8 theo CHANNEL ID
app.get("/channel/:id.m3u8", async (req, res) => {
  const channelId = req.params.id;

  // URL channel live
  const url = `https://www.youtube.com/channel/${channelId}`;

  try {
    const { stdout } = await execAsync(
      `yt-dlp -g -f "best[protocol*=m3u8]" \
  --extractor-args "youtube:player_client=android" \
  --user-agent "com.google.android.youtube/17.36.4" \
  "${url}"`
    );

    const m3u8 = stdout.trim();

    if (!m3u8 || !m3u8.includes("m3u8")) {
      return res.status(404).send("❌ Channel chưa live hoặc không lấy được stream");
    }

    res.redirect(m3u8);
  } catch (err) {
    console.error("YT ERROR:", err);
    res.status(500).send("❌ yt-dlp lỗi khi lấy channel live");
  }
});

// Chạy server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Proxy running on port ${PORT}`);
});
