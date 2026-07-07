# 课察 ClassInsight 后端 MVP

面向教师的课堂状态分析与教学反馈平台后端。当前版本使用模拟分析结果跑通完整流程，后续可以在 `app/services/analyzer.py` 中替换为 OpenCV + MediaPipe 实际算法。

## 启动

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

服务启动后访问：

- API 文档：http://127.0.0.1:8000/docs
- 健康检查：http://127.0.0.1:8000/health

## 基本流程

1. `POST /api/auth/register` 注册
2. `POST /api/auth/login` 登录，复制返回的 `access_token`
3. 在 Swagger 右上角 Authorize 中填入 `Bearer <access_token>`
4. `POST /api/classes` 创建课堂
5. `POST /api/classes/{class_id}/videos` 上传视频
6. `POST /api/videos/{video_id}/analyze` 触发模拟分析
7. 查询报告、时间线、图表数据和建议

## 数据文件

- SQLite 数据库：`classinsight.db`
- 上传视频：`uploads/`
