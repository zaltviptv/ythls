import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

// Health check
app.get("/", (req, res) => {
  res.send("YT Live Proxy Running...");
});

// Proxy theo VIDEO ID
app.get("/video/:id.m3u8", (req, res) => {
  const id = req.params.id;

  const ytHls = `https://manifest.googlevideo.com/api/manifest/hls_playlist/id/${id}`;

  res.redirect(ytHls);
});

// Proxy theo CHANNEL ID
app.get("/channel/:id.m3u8", async (req, res) => {
  const channelId = req.params.id;
  res.send(`
    Channel live proxy:
    https://www.youtube.com/channel/${channelId}/live
    (Render free không auto fetch live video id được)
  `);
});

app.listen(PORT, () => {
  console.log("Proxy server running on port", PORT);
});
