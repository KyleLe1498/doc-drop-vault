const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 3001;

// Allow your Vite dev server (usually 5173) to call this API
app.use(cors({ origin: "http://localhost:5173" }));

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Keep original filename; consider generating unique names in real apps
    cb(null, file.originalname);
  },
});

// Allow only .txt and .pdf
const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "text/plain"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only .txt and .pdf files are allowed"));
};

// 10 MB per file (adjust as needed)
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Upload endpoint (multiple files)
app.post("/upload", upload.array("files"), (req, res) => {
  const saved = (req.files || []).map((f) => ({
    filename: f.originalname,
    size: f.size,
    url: `/files/${encodeURIComponent(f.originalname)}`,
  }));
  res.json({ ok: true, files: saved });
});

// Serve uploaded files statically
app.use("/files", express.static(UPLOAD_DIR));

// List uploaded files
app.get("/files", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, items) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, files: items });
  });
});

app.use((err, req, res, next) => {
  // Multer or other errors
  res.status(400).json({ ok: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`Upload server listening on http://localhost:${PORT}`);
});
