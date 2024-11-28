const express = require("express");
const router = express.Router();
const multer = require("multer");
const iconv = require("iconv-lite");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const controller = require("../../controller/client/file_controller");
const MiddlewareAuth = require("../../middlewares/client/auth")

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Thư mục lưu trữ tệp
  },
  filename: (req, file, cb) => {
    const originalName = `${Date.now()} - ${file.originalname}`;
    const utf8Name = iconv.decode(Buffer.from(originalName, "latin1"), "utf8");
    const newName = utf8Name.replace(/\s+/g, "-");
    cb(null, newName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Chỉ cho phép tải lên file PDF"), false);
    }
    cb(null, true);
  },
});

// Route xác thực OAuth 2.0
router.get("/auth", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  res.redirect(authUrl); // Chuyển hướng người dùng tới Google để xác thực
});

// Route xử lý callback sau khi xác thực
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Lỗi: Không tìm thấy mã xác thực.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code); // Trao đổi mã xác thực lấy token
    const tokenPath = path.resolve(__dirname, "../../tokens.json");
    fs.writeFileSync(tokenPath, JSON.stringify(tokens)); // Lưu token vào file

    res.send("Xác thực thành công! Token đã được lưu.");
  } catch (error) {
    console.error("Lỗi khi trao đổi mã xác thực:", error);
    res.status(500).send("Lỗi khi xác thực OAuth.");
  }
});

// Các route liên quan đến file
router.get("/", MiddlewareAuth.requireAuth , controller.getFileController);
router.delete("/:id", MiddlewareAuth.requireAuth , controller.deleteFileController);
router.post("/", MiddlewareAuth.requireAuth , upload.single("file"), controller.fileController);

module.exports = router;
