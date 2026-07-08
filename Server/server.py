"""
课堂状态检测后端
- 输入: 本机摄像头 或 RTSP 监控流 (STREAM_URL 环境变量)
- 检测: YuNet 人脸检测 (当前版本仅人脸，大教室场景需升级 YOLO)
- 输出: MJPEG 视频流 + JSON 状态 API
"""
import cv2
import os
import time
import platform
import threading
import numpy as np
from datetime import datetime, timezone
from flask import Flask, Response, jsonify, send_from_directory

app = Flask(__name__, static_folder=".")

# ========== 配置 ==========
STREAM_URL = os.getenv("STREAM_URL", "").strip()
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
MODEL_DIR = os.path.expanduser("~/.cache/opencv")
yunet_path = os.path.join(MODEL_DIR, "face_detection_yunet_2023mar.onnx")
DETECT_EVERY_N = 4
MAX_RECONNECT_DELAY = 5
DEFAULT_WIDTH = 1280
DEFAULT_HEIGHT = 720

# ========== 检测模型加载 ==========
face_detector = None
if os.path.exists(yunet_path):
    face_detector = cv2.FaceDetectorYN_create(
        yunet_path, "", (640, 480),
        score_threshold=0.5, nms_threshold=0.3, top_k=5000
    )
    print(f"✅ YuNet 人脸检测模型已加载")
else:
    print("⚠️ YuNet 模型未找到，人脸检测不可用")

print(f"📡 STREAM_URL: {STREAM_URL if STREAM_URL else '(本机摄像头)'}")
print("⚠️ 当前版本仅人脸检测，大教室场景需升级为 YOLO/人体检测")

# ========== 全局状态 ==========
state_lock = threading.Lock()
latest_frame = None   # JPEG bytes (带框)
latest_status = {
    "deviceId": "camera-01", "classId": 1, "capturedAt": "",
    "windowSeconds": 1, "frameInfo": {"fps": 0, "width": 0, "height": 0},
    "summary": {"total": 0, "headUp": 0, "desk": 0, "sleepLike": 0, "unknown": 0},
    "people": []
}
fps_times = []
connection_ok = False

# ========== 摄像头管理 ==========
def open_capture():
    if STREAM_URL:
        print(f"📡 正在连接视频流: {STREAM_URL}")
        cap = cv2.VideoCapture(STREAM_URL, cv2.CAP_FFMPEG)
    else:
        print(f"📷 正在打开本机摄像头: CAMERA_INDEX={CAMERA_INDEX}")
        if platform.system() == "Darwin":
            cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_AVFOUNDATION)
        else:
            cap = cv2.VideoCapture(CAMERA_INDEX)
    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, DEFAULT_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, DEFAULT_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, 25)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


def now_utc_z():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def publish_placeholder(message, width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT):
    global latest_frame, latest_status

    frame = np.zeros((height, width, 3), dtype=np.uint8)
    lines = [
        message,
        "If using Mac local camera, start server.py from Terminal after granting camera permission.",
        "If using classroom camera, set STREAM_URL to the RTSP address and run on the computer that can open it.",
    ]
    y = height // 2 - 48
    for line in lines:
        cv2.putText(frame, line, (60, y), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (230, 230, 230), 2, cv2.LINE_AA)
        y += 42

    ok, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
    if not ok:
        return

    with state_lock:
        latest_frame = jpeg.tobytes()
        latest_status = {
            "deviceId": "camera-01",
            "classId": 1,
            "capturedAt": now_utc_z(),
            "windowSeconds": 1,
            "frameInfo": {"fps": 0, "width": width, "height": height},
            "summary": {"total": 0, "headUp": 0, "desk": 0, "sleepLike": 0, "unknown": 0},
            "people": []
        }

# ========== 检测 ==========
def detect(frame, w, h):
    """返回 people 列表，每个包含 personId/state/confidence/box"""
    people = []
    pid = 0

    if face_detector is None:
        return people

    detect_w, detect_h = 640, 480
    sx, sy = w / detect_w, h / detect_h
    face_detector.setInputSize((detect_w, detect_h))
    small = cv2.resize(frame, (detect_w, detect_h))
    _, faces = face_detector.detect(small)

    if faces is None or len(faces) == 0:
        return people

    for f in faces:
        fx = int(f[0] * sx)
        fy = int(f[1] * sy)
        fw = int(f[2] * sx)
        fh = int(f[3] * sy)
        conf = float(f[14]) if len(f) > 14 else 0.8

        pid += 1
        # 简易状态：人脸在画面上半部=抬头，下半部偏下=看桌面
        face_center_y = fy + fh / 2
        if face_center_y < h * 0.55:
            state = "head_up"
        elif face_center_y < h * 0.75:
            state = "desk"
        else:
            state = "unknown"

        # clamp box 到 0-1
        bx = max(0.0, min(1.0, fx / w))
        by = max(0.0, min(1.0, fy / h))
        bw = max(0.0, min(1.0, fw / w))
        bh = max(0.0, min(1.0, fh / h))

        people.append({
            "personId": f"person-{pid}",
            "state": state,
            "confidence": round(conf, 2),
            "visible": True,
            "durationSeconds": 1,
            "box": {"x": round(bx, 3), "y": round(by, 3),
                    "width": round(bw, 3), "height": round(bh, 3)}
        })
    return people


# ========== 画框 ==========
STATE_COLORS = {
    "head_up":   (0, 184, 148),   # 绿色
    "desk":      (9, 132, 227),   # 蓝色
    "sleep_like":(253, 126, 20),  # 橙色
    "unknown":   (99, 110, 114),  # 灰色
}
STATE_LABELS = {
    "head_up": "抬头", "desk": "看桌面",
    "sleep_like": "疑似睡觉", "unknown": "未知"
}

def draw_boxes(frame, people, w, h):
    """在 frame 上画框和标签（轻量线条）"""
    for p in people:
        box = p["box"]
        x1 = int(box["x"] * w)
        y1 = int(box["y"] * h)
        x2 = int((box["x"] + box["width"]) * w)
        y2 = int((box["y"] + box["height"]) * h)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        state = p.get("state", "unknown")
        color = STATE_COLORS.get(state, STATE_COLORS["unknown"])
        label = f"{p['personId']} {STATE_LABELS.get(state, state)} {int(p['confidence']*100)}%"

        # 细框 2px
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        # 标签背景
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        label_y = y1 - 6
        if label_y < th + 4:
            label_y = y1 + th + 4
        cv2.rectangle(frame, (x1, label_y - th - 4), (x1 + tw + 6, label_y + 2), color, -1)
        cv2.putText(frame, label, (x1 + 3, label_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    return frame


# ========== 采集 + 检测线程 ==========
def capture_loop(initial_cap=None):
    global latest_frame, latest_status, fps_times, connection_ok

    cap = initial_cap if initial_cap is not None else open_capture()
    reconnect_wait = 1
    frame_idx = 0
    cached_people = []
    t0 = time.time()

    while True:
        # ---- 断线重连 ----
        if not cap.isOpened():
            connection_ok = False
            if not STREAM_URL:
                publish_placeholder("Cannot open local camera.")
                print("⚠️ 本机摄像头未打开。请检查 macOS 摄像头权限，或尝试 CAMERA_INDEX=1。")
                time.sleep(1)
                continue
            print(f"⏳ 正在连接... (等待 {reconnect_wait}s)")
            time.sleep(reconnect_wait)
            reconnect_wait = min(reconnect_wait * 2, MAX_RECONNECT_DELAY)
            cap.release()
            cap = open_capture()
            continue

        ret, frame = cap.read()
        if not ret:
            connection_ok = False
            # 连续读取失败计数
            frame_idx += 1
            if frame_idx % 30 == 0:
                print(f"⚠️ 读取失败 (frame {frame_idx})，尝试重连...")
                if STREAM_URL:
                    cap.release()
                    cap = open_capture()
                    reconnect_wait = 1
                else:
                    publish_placeholder("Local camera read failed.")
            time.sleep(0.05)
            continue

        connection_ok = True
        reconnect_wait = 1
        frame_idx += 1
        h, w = frame.shape[:2]

        # ---- 检测 (每 N 帧) ----
        if frame_idx % DETECT_EVERY_N == 0:
            cached_people = detect(frame.copy(), w, h)

        # ---- 画框到当前帧（不是旧截图） ----
        annotated = draw_boxes(frame.copy(), cached_people, w, h)

        # ---- 统计 ----
        head_up = sum(1 for p in cached_people if p["state"] == "head_up")
        desk = sum(1 for p in cached_people if p["state"] == "desk")
        sleep_like = sum(1 for p in cached_people if p["state"] == "sleep_like")
        unknown = sum(1 for p in cached_people if p["state"] == "unknown")

        # ---- FPS ----
        t1 = time.time()
        fps_times.append(t1 - t0)
        t0 = t1
        if len(fps_times) > 30:
            fps_times = fps_times[-30:]
        avg_fps = round(len(fps_times) / max(sum(fps_times), 0.001))

        # ---- 编码 ----
        _, jpeg = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 78])

        # ---- 更新全局状态 ----
        with state_lock:
            latest_frame = jpeg.tobytes()
            latest_status = {
                "deviceId": "camera-01",
                "classId": 1,
                "capturedAt": now_utc_z(),
                "windowSeconds": 1,
                "frameInfo": {"fps": avg_fps, "width": w, "height": h},
                "summary": {
                    "total": len(cached_people),
                    "headUp": head_up,
                    "desk": desk,
                    "sleepLike": sleep_like,
                    "unknown": unknown
                },
                "people": cached_people
            }


# ========== Flask 路由 ==========
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/video')
def video_feed():
    def generate():
        while True:
            with state_lock:
                fb = latest_frame
            if fb is None:
                time.sleep(0.05)
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + fb + b'\r\n')
            time.sleep(0.03)
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def api_status():
    with state_lock:
        return jsonify(latest_status)

@app.route('/api/health')
def api_health():
    with state_lock:
        s = latest_status
    return jsonify({
        "ok": connection_ok,
        "source": STREAM_URL if STREAM_URL else "local-camera",
        "connected": connection_ok,
        "fps": s["frameInfo"]["fps"]
    })


# ========== 启动 ==========
if __name__ == '__main__':
    print("=" * 55)
    print("🎓 课堂状态检测后端")
    print("=" * 55)
    print(f"📡 视频源: {STREAM_URL if STREAM_URL else '本机摄像头'}")
    print(f"🔍 检测: YuNet 人脸 (⚠️ 仅人脸，大教室需 YOLO)")
    print(f"🌐 地址: http://localhost:5001/")
    print(f"📋 状态: http://localhost:5001/api/status")
    print(f"💚 健康: http://localhost:5001/api/health")
    print("=" * 55)

    initial_cap = None
    if not STREAM_URL:
        # macOS camera authorization must be requested from the main thread.
        initial_cap = open_capture()
        if not initial_cap.isOpened():
            publish_placeholder("Cannot open local camera.")
            print("⚠️ 本机摄像头打开失败。请检查系统设置里的摄像头权限，或尝试 CAMERA_INDEX=1 python3 server.py")

    t = threading.Thread(target=capture_loop, args=(initial_cap,), daemon=True)
    t.start()
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
