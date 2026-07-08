# 课堂状态检测后端

Python Flask + OpenCV，读取摄像头/RTSP 监控流，做人脸检测并画框，前端纯显示。

## 安装

```bash
pip install -r requirements.txt
```

YuNet 人脸检测模型首次运行会自动加载（需提前下载到 `~/.cache/opencv/`）：

```bash
mkdir -p ~/.cache/opencv
curl -L -o ~/.cache/opencv/face_detection_yunet_2023mar.onnx \
  https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
```

## 启动

### 本机摄像头

```bash
python3 server.py
```

如果本机有多个摄像头，可以切换编号：

```bash
CAMERA_INDEX=1 python3 server.py
```

macOS 上建议从“终端 Terminal”启动，并在：

```text
系统设置 -> 隐私与安全性 -> 摄像头
```

允许 Terminal / Python 使用摄像头。

### RTSP 监控流

**macOS / Linux：**

```bash
STREAM_URL="rtsp://10.180.34.7:5540/ch1" python3 server.py
```

**Windows：**

```cmd
set STREAM_URL=rtsp://10.180.34.7:5540/ch1
python server.py
```

## 访问

- 本机：http://localhost:5001/
- 局域网其他电脑：`http://<后端电脑IP>:5001/`

如果页面能打开但视频区域显示摄像头错误，说明后端已启动，问题在视频输入源：

- 本机摄像头：检查摄像头权限，或尝试 `CAMERA_INDEX=1 python3 server.py`
- 监控 RTSP：确认运行后端的电脑本身能打开 `STREAM_URL`

## 接口

| 路径 | 说明 |
|------|------|
| `GET /` | 前端页面 |
| `GET /video` | MJPEG 视频流（带检测框） |
| `GET /api/status` | 课堂状态 JSON |
| `GET /api/health` | 健康检查 |

### /api/status 返回格式

```json
{
  "deviceId": "camera-01",
  "classId": 1,
  "capturedAt": "2026-07-08T12:00:00.000Z",
  "windowSeconds": 1,
  "frameInfo": { "fps": 25, "width": 1280, "height": 720 },
  "summary": {
    "total": 5, "headUp": 3, "desk": 1, "sleepLike": 0, "unknown": 1
  },
  "people": [
    {
      "personId": "person-1",
      "state": "head_up",
      "confidence": 0.89,
      "visible": true,
      "durationSeconds": 1,
      "box": { "x": 0.42, "y": 0.21, "width": 0.13, "height": 0.28 }
    }
  ]
}
```

## 状态码

| state | 含义 | 框颜色 |
|-------|------|--------|
| `head_up` | 抬头 | 🟢 绿 |
| `desk` | 看桌面 | 🔵 蓝 |
| `sleep_like` | 疑似睡觉 | 🟠 橙 |
| `unknown` | 无法判断 | ⚪ 灰 |

## 当前限制

⚠️ **仅使用 YuNet 人脸检测**，只能检测正脸。大教室场景（多人、侧脸、远距离、低头）需要升级为 YOLO 人体/头部检测模型。

## 下一步

1. 替换 `STREAM_URL` 为实际 RTSP 地址，验证流读取
2. 安装 YOLO：`pip install ultralytics`
3. 替换 `detect()` 函数为 YOLO person/head 检测
4. 增加肩部关键点判断抬头/低头
