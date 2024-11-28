const { google } = require("googleapis");
const { uploadFile } = require("../../helper/file_helper");
const File = require("../../model/File");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const { NoMeals } = require("@mui/icons-material");

// Khởi tạo OAuth2 client với các thông tin từ .env
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Route xác thực OAuth2.0 - Chuyển hướng người dùng đến Google login
module.exports.authController = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Để nhận được refresh_token
    scope: ["https://www.googleapis.com/auth/drive.file"], // Quyền truy cập vào Google Drive
  });

  // Chuyển hướng người dùng đến Google để đăng nhập
  res.redirect(authUrl);
};

// Route xử lý callback từ Google và lấy access token
module.exports.authCallback = async (req, res) => {
  const { code } = req.query; // Mã xác thực trả về từ Google

  if (!code) {
    return res.status(400).json({
      code: "error",
      msg: "Không nhận được mã xác thực từ Google",
    });
  }

  try {
    // Đổi mã xác thực lấy token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Lưu token vào file để sử dụng sau này
    const tokenPath = path.join(__dirname, "../../tokens.json");
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));

    res.json({
      code: "success",
      msg: "Token đã được lấy thành công",
      tokens, // Trả về token cho người dùng hoặc ứng dụng
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: "error",
      msg: "Đã xảy ra lỗi khi lấy token",
    });
  }
};

// Kiểm tra và làm mới token nếu cần
const authorize = async () => {
  const tokenPath = path.join(__dirname, "../../tokens.json");

  if (fs.existsSync(tokenPath)) {
    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    oauth2Client.setCredentials(tokens);

    // Làm mới token nếu cần
    if (oauth2Client.isTokenExpiring()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      fs.writeFileSync(tokenPath, JSON.stringify(credentials));
    }
  } else {
    throw new Error("Token chưa được cấu hình. Vui lòng thực hiện luồng xác thực OAuth 2.0");
  }

  return oauth2Client;
};

// Đếm số trang trong file PDF
async function countPdfPages(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  console.log(`Số trang trong PDF là: ${data.numpages}`);
  return data.numpages;
}

// Lấy danh sách các file
module.exports.getFileController = async (req, res) => {
  try {
    const files = await File.find({
      accountId: res.locals.account.id,
    }).sort({
      updatedAt: 1,
    });

    res.json({
      code: "success",
      msg: "Lấy file thành công",
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: "error",
      msg: "Đã xảy ra lỗi khi lấy danh sách file",
    });
  }
};

// Xóa file
module.exports.deleteFileController = async (req, res) => {
  const fileId = req.params.id;

  if (!fileId) {
    return res.status(400).json({
      code: "error",
      msg: "Lỗi: Không tìm thấy ID của file",
    });
  }

  try {
    const result = await File.deleteOne({ _id: fileId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        code: "error",
        msg: "Không tìm thấy file để xóa",
      });
    }

    res.status(200).json({
      code: "success",
      msg: "Xóa file thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: "error",
      msg: "Đã xảy ra lỗi khi xóa file",
    });
  }
};

// Tải lên file lên Google Drive
// Tải lên file lên Google Drive
module.exports.fileController = async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: "No file uploaded" });
  }

  try {
    const auth = await authorize();
    const filePath = req.file.path;
    console.log("File path:", filePath); // Kiểm tra đường dẫn tệp
    // Tải file lên Google Drive
    const file = await uploadFile(auth, filePath);

    //console.log("File uploaded to Google Drive:", file.id); // Kiểm tra file đã được tải lên Google Drive


    if (!file || !file.data.id) {
      //console.error('Failed to upload file:', file);
      return res.json({
        code: "error",
        msg: "Tải file lên Google Drive không thành công hoặc không nhận được id từ Google Drive",
      });
    }

    // Đếm số trang của file PDF
    const pages = await countPdfPages(filePath);
    //console.log("ID:", file);
    // Lưu thông tin file vào cơ sở dữ liệu
    const data = {
      name: req.file.filename,  // Đổi từ path thành filename cho phù hợp
      link: `https://drive.google.com/file/d/${file.data.id}`,
      linkPath: filePath,
      pages: pages,
      accountId: "res.locals.account.id"

    };
    console.log("Number of pages in PDF:", pages); 

    console.log("Data to be saved in MongoDB:", data);

    const record = await File(data);
    await record.save(); // Lưu dữ liệu vào MongoDB

    res.json({
      code: "success",
      msg: "Upload file thành công",
      file: record,
    });
  } catch (error) {
    console.error("Lỗi khi upload file:", error);
    res.status(500).json({
      code: "error",
      msg: "Đã xảy ra lỗi khi upload file",
      error: error.message,  // Thêm thông tin lỗi chi tiết vào response
    });
  }
};
