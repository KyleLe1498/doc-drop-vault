const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.options("*", cors());

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const fileFilter = (req, file, cb) => {
  const ok = ["application/pdf", "text/plain"].includes(file.mimetype)
          || file.originalname.toLowerCase().endsWith(".pdf")
          || file.originalname.toLowerCase().endsWith(".txt");
  cb(ok ? null : new Error("Only .txt and .pdf files are allowed"), ok);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/upload", upload.array("files"), (req, res) => {
  const files = (req.files || []).map(f => ({
    filename: f.originalname,
    size: f.size,
    url: `/files/${encodeURIComponent(f.originalname)}`
  }));
  res.json({ ok: true, files });
});

app.use("/files", express.static(UPLOAD_DIR));

app.get("/files", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, items) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, files: items });
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({ ok: false, error: err.message });
});

app.listen(PORT, () => console.log(`Upload server listening on http://localhost:${PORT}`));
