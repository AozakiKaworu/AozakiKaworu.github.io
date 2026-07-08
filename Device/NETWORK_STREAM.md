# 网络摄像头视频流接入说明

浏览器网页不能直接播放 `rtsp://`，需要先把 RTSP 转成浏览器能播放的 HLS/HTTP 视频流。

你的 VLC 里看到的地址类似：

```text
rtsp://10.180.34.7:5540/ch1
```

推荐先用 FFmpeg 转成 HLS。

## 1. 安装 FFmpeg

macOS：

```bash
brew install ffmpeg
```

如果没有 Homebrew，需要先安装 Homebrew，或从 FFmpeg 官网下载。

## 2. 转 RTSP 为 HLS

在项目目录运行：

```bash
cd "/Users/apple/Desktop/大二下/小学期"
mkdir -p Device/stream

ffmpeg -rtsp_transport tcp \
  -i "rtsp://10.180.34.7:5540/ch1" \
  -an \
  -c:v libx264 \
  -preset veryfast \
  -tune zerolatency \
  -f hls \
  -hls_time 1 \
  -hls_list_size 3 \
  -hls_flags delete_segments+omit_endlist \
  -hls_segment_filename "Device/stream/seg_%03d.ts" \
  "Device/stream/stream.m3u8"
```

这个命令会持续运行，不要关掉。

## 3. 启动网页服务

另开一个终端：

```bash
cd "/Users/apple/Desktop/大二下/小学期"
python3 -m http.server 8765
```

## 4. 打开识别网页

方式一：直接用 URL 参数启动网络流：

```text
http://localhost:8765/Device/face-detection.html?stream=/Device/stream/stream.m3u8
```

方式二：先打开网页，再把下面地址填到“网络流”输入框：

```text
/Device/stream/stream.m3u8
```

然后点击“打开网络流”。

## 注意

- 不要直接把 `rtsp://...` 填进网页，浏览器不能直接播放 RTSP。
- 如果网络流来自另一个端口或另一台电脑，需要服务端允许 CORS，否则浏览器能播放但 Canvas 取帧可能失败。
- 最稳的测试方式是让 HLS 文件和识别网页由同一个 `python3 -m http.server 8765` 提供。
- 生成的 `Device/stream/` 是临时视频切片目录，不建议上传 GitHub。
