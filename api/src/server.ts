import express from "express";

const app = express();
const PORT = 4000;

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "aylix-api",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});