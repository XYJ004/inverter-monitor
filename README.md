# 逆变器监控平台

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)
![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)

**专业的太阳能逆变器 Web 监控系统**

[功能特性](#功能特性) • [快速开始](#快速开始) • [API文档](#api文档) • [部署](#部署)

</div>

---

## 功能特性

### 核心监控
- ☀️ **太阳能发电** - 实时功率、电压、电流监控
- 🔋 **电池管理** - SOC、SOH、温度、充放电状态
- 🔌 **电网交互** - 电压、频率、购电/卖电功率
- 🏠 **负载监控** - 实时用电负载统计

### 数据分析
- 📊 24小时功率曲线
- 📈 历史数据趋势
- 💰 能源统计（日/月/年）
- 📉 效率分析报告

### 告警系统
- ⚠️ 阈值告警
- 🔔 实时通知
- 📝 告警历史记录

### 用户界面
- 🌙 暗色主题
- 📱 响应式设计
- ⚡ 实时数据刷新（2秒）
- 🎨 现代化 UI 设计

---

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端

```bash
cd backend
pip install flask flask-cors
python server.py
```

API 运行在 http://localhost:3002

---

## API 文档

### 实时数据
```
GET /api/data
```
返回当前逆变器所有实时数据

### 历史数据
```
GET /api/history
```
返回过去24小时的历史数据点

### 系统状态
```
GET /api/status
```
返回系统运行状态信息

### 每日统计
```
GET /api/stats/daily
```
返回今日能源统计数据

### 每月统计
```
GET /api/stats/monthly
```
返回本月能源统计数据

---

## 技术栈

**前端**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts (图表)
- Framer Motion (动画)
- Lucide React (图标)

**后端**
- Python 3.12
- Flask
- Flask-CORS

---

## 部署

### Docker 部署（推荐）

```bash
docker-compose up -d
```

### 手动部署

1. 克隆仓库
```bash
git clone https://github.com/XYJ004/inverter-monitor.git
cd inverter-monitor
```

2. 启动后端
```bash
cd backend
pip install -r requirements.txt
python server.py
```

3. 启动前端
```bash
cd frontend
npm install
npm run build
npm run preview
```

---

## 开发计划

- [ ] 多设备管理
- [ ] 用户权限系统
- [ ] 数据库持久化
- [ ] WebSocket 实时推送
- [ ] 移动端 App
- [ ] 发电预测算法
- [ ] 电费优化建议
- [ ] 第三方系统集成

---

## License

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！
