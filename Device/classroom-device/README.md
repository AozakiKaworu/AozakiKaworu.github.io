# 课堂状态检测设备端

这个目录是从 `../face-detection.html` 拆出来的模块化版本。原来的单文件版本已经保留，方便回退和对照。

## 文件说明

- `index.html`：页面结构和后端接口配置。
- `classroom-device.css`：页面样式。
- `classroom-device.js`：摄像头采集、MediaPipe 识别、状态判断、数据上传。
- `../face-detection.html`：原始单文件版本，暂时保留。

## 运行方式

建议用本地服务器打开，不要直接双击 HTML 文件。

```bash
cd "/Users/apple/Desktop/大二下/小学期"
python3 -m http.server 8765
```

然后在浏览器打开：

```text
http://localhost:8765/Device/classroom-device/
```

## 设备端职责

设备端只应该负责：

- 打开摄像头。
- 识别人脸/人体姿态。
- 判断每个人当前状态：`抬头`、`看桌面`、`疑似睡觉`、`无法判断`。
- 把当前帧结果和简单统计数据发送给后端。

长期统计、数据库保存、课堂报告、展示大屏，建议交给后端和展示前端完成。

## 配置后端接口

打开 `index.html`，修改：

```html
<script>
    window.CLASSROOM_DEVICE_CONFIG = {
        backendStatusEndpoint: "http://10.180.22.127:8000/api/realtime/status"
    };
</script>
```

如果 `backendStatusEndpoint` 为空，页面只在本地识别和展示，不会上传数据。

## 上传给后端的数据

设备端会定时向 `backendStatusEndpoint` 发送 `POST` 请求，`Content-Type` 是 `application/json`。

数据结构大致如下：

```json
{
  "timestamp": "2026-07-08T10:30:00.000Z",
  "mode": "normal",
  "video": {
    "width": 1280,
    "height": 720
  },
  "summary": {
    "total": 2,
    "up": 1,
    "desk": 1,
    "sleep": 0,
    "unknown": 0
  },
  "analytics": {
    "summary": {
      "total": 2,
      "up": 1,
      "desk": 1,
      "sleep": 0,
      "unknown": 0,
      "totalSeen": 2
    },
    "people": [
      {
        "id": "person-1",
        "active": true,
        "state": "抬头",
        "visibleMs": 12000,
        "durations": {
          "抬头": 9000,
          "看桌面": 2000,
          "疑似睡觉": 0,
          "无法判断": 1000
        }
      }
    ]
  },
  "people": [
    {
      "id": "person-1",
      "analyticsId": "person-1",
      "source": "face",
      "state": "抬头",
      "confidence": 0.82,
      "detectionClass": "reliable",
      "box": {
        "x": 120,
        "y": 80,
        "width": 60,
        "height": 90
      },
      "normalizedBox": {
        "x": 0.0938,
        "y": 0.1111,
        "width": 0.0469,
        "height": 0.125
      }
    }
  ]
}
```

## 建议后端接口

后端同学可以先实现这几个接口：

```text
POST /api/realtime/status
```

接收设备端实时状态。

```text
GET /api/realtime/status/latest
```

给展示前端读取最新课堂状态。

```text
GET /api/classroom/sessions/:sessionId
```

读取某节课的历史统计。

## 注意事项

- 当前 `person-1` 这类 ID 是基于画面位置追踪出来的，不是真正身份识别。
- 如果两个人交叉遮挡，ID 可能交换。
- 正式版本建议让后端按时间窗口重新累计状态时长，设备端只上传实时观测结果。
- 大教室场景下，摄像头分辨率、安装高度、焦距比代码阈值更关键。
