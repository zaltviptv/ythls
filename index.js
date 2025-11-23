import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// Cache đơn giản
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

// Danh sách Piped fallback
const PIPED_LIST = [
  "https://piped.video",
  "https://piped.kavin.rocks",
  "https://piped.adminforge.de"
];

// Health check
app.get("/", (req, res) => {
  res.send("✅ YT Live Proxy Running (PIPED MODE)...");
});

// Hàm gọi Piped có fallback
async function fetchWithFallback(path) {
  for (const host of PIPED_LIST) {
    try {
      const r = await fetch(host + path, { timeout: 8000 });
      if (r.ok) {
        return await r.json();
      }
    } catch {}
  }
  throw new Error("All Piped instances failed");
}

// ====== LẤY VIDEO ID → M3U8 ======
app.get("/video/:id.m3u8", async (req, res) => {
  const id = req.params.id;

  try {
    // cache
    if (cache[id] && Date.now() - cache[id].time < CACHE_TTL) {
      return res.redirect(cache[id].m3u8);
    }

    const data = await fetchWithFallback(`/api/v1/streams/${id}`);

    if (!data.hls) {
      return res.status(404).send("❌ Không có HLS");
    }

    cache[id] = {
      m3u8: data.hls,
      time: Date.now()
    };

    res.redirect(data.hls);
  } catch (e) {
    console.error(e);
    res.status(500).send("❌ Lỗi Piped");
  }
});

// ====== CHANNEL → LIVE → M3U8 ======
app.get("/channel/:id.m3u8", async (req, res) => {
  const channelId = req.params.id;

  try {
    const ch = await fetchWithFallback(`/api/v1/channels/${channelId}`);

    const live = ch.relatedStreams?.find(
      (s) => s.type === "stream" || s.duration === -1
    );

    if (!live) {
      return res.status(404).send("❌ Channel không live");
    }

    const videoId = live.url.split("v=")[1];

    // cache theo video
    if (cache[videoId] && Date.now() - cache[videoId].time < CACHE_TTL) {
      return res.redirect(cache[videoId].m3u8);
    }

    const st = await fetchWithFallback(`/api/v1/streams/${videoId}`);

    if (!st.hls) {
      return res.status(500).send("❌ Không lấy được HLS");
    }

    cache[videoId] = {
      m3u8: st.hls,
      time: Date.now()
    };

    res.redirect(st.hls);
  } catch (e) {
    console.error("PIPE ERROR:", e);
    res.status(500).send("❌ Piped lỗi");
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Proxy running on port ${PORT}`);
});
