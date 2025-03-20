const fs = require('fs');
const http = require('http');
const path = require('path');

// JSON 文件路径
const jsonFilePath = './binary_file_index.json'; // 替换为你的 JSON 文件路径
const downloadDir = './'; // 下载目录

// 确保下载目录存在
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
}

// 读取 JSON 文件
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

// 遍历 JSON 数据并下载每个 .bin 文件
jsonData.forEach((frame, index) => {
    const downloadUrl = frame[2]; // 索引 2 是下载地址
    const fileName = `file_${index}.bin`; // 生成文件名
    const filePath = path.join(downloadDir, fileName);

    const file = fs.createWriteStream(filePath);

    http.get(downloadUrl, (response) => {
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log(`File ${fileName} downloaded successfully.`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // 删除未完成的文件
        console.error(`Error downloading file ${fileName}: ${err.message}`);
    });
});