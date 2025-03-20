const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001; // 后端服务端口

// 启用 CORS 中间件，允许跨域请求
app.use(cors());

const binFilesDirectory = 'simulation_world_binary';

// 提供二进制文件的接口
app.get('/simulation_world_binary/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, binFilesDirectory, fileName);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // 设置响应头，告诉浏览器这是一个二进制文件
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="file.bin"');

  // 创建文件流并返回给客户端
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});