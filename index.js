import express from "express";

const app = express();

// Cache đơn giản (Lưu ý: Trên Vercel cache này sẽ bị reset thường xuyên, nhưng vẫn đỡ được phần nào)
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

// Danh sách Backend API của Piped chuẩn
const PIPED_LIST = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.smnz.de",
  "https://api.piped.projectsegfau.lt",
  "https://piped-api.garudalinux.org",
  "https://pipedapi.in.projectsegfau.lt"
];

// Health check
app.get("/", (req, res) => {
  res.send("✅ YT Live Proxy Running on Vercel (PIPED MODE)...");
});

// Hàm gọi Piped có fallback (Dùng native fetch của Node 18+, không cần import node-fetch)
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
    if (cache[id] && Date.now() - cache[id].time < CACHE_TTL) {
      return res.redirect(cache[id].m3u8);
    }
    const data = await fetchWithFallback(`/streams/${id}`);
    if (!data.hls) return res.status(404).send("❌ Không có HLS");

    cache[id] = { m3u8: data.hls, time: Date.now() };
    res.redirect(data.hls);
  } catch (e) {
    res.status(500).send("❌ Lỗi Piped");
  }
});

// ====== CHANNEL → LIVE → M3U8 ======
app.get("/channel/:id.m3u8", async (req, res) => {
  const channelId = req.params.id;
  try {
    const ch = await fetchWithFallback(`/channels/${channelId}`);
    const live = ch.relatedStreams?.find(
      (s) => s.type === "stream" || s.duration === -1
    );

    if (!live) return res.status(404).send("❌ Channel không live");

    const videoId = live.url.split("v=")[1];

    if (cache[videoId] && Date.now() - cache[videoId].time < CACHE_TTL) {
      return res.redirect(cache[videoId].m3u8);
    }

    const st = await fetchWithFallback(`/streams/${videoId}`);
    if (!st.hls) return res.status(500).send("❌ Không lấy được HLS");

    cache[videoId] = { m3u8: st.hls, time: Date.now() };
    res.redirect(st.hls);
  } catch (e) {
    res.status(500).send("❌ Piped lỗi");
  }
});

// Quan trọng nhất cho Vercel: Export app ra thay vì dùng app.listen()
export default app;
