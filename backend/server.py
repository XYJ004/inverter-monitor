#!/usr/bin/env python3
"""
逆变器监控后端 API - 专业版 v2.0
支持完整的模拟数据生成和历史记录
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import math
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any

app = Flask(__name__)
CORS(app)

# ==================== 数据存储 ====================
class DataStore:
    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self.daily_stats: Dict[str, float] = {}
        self.alerts: List[Dict[str, Any]] = []
        self.devices: List[Dict[str, Any]] = [
            {"id": "inv-001", "name": "主逆变器", "model": "SUN-5K", "status": "online"},
            {"id": "inv-002", "name": "备用逆变器", "model": "SUN-3K", "status": "standby"},
        ]
        self._generate_history()
    
    def _generate_history(self):
        """生成过去24小时的历史数据"""
        now = datetime.now()
        for i in range(24 * 6):  # 每10分钟一个点
            t = now - timedelta(minutes=i * 10)
            hour = t.hour + t.minute / 60
            
            # 太阳能发电曲线
            if 6 <= hour <= 18:
                solar_factor = math.sin((hour - 6) / 12 * math.pi)
                solar = 5500 * solar_factor + random.uniform(-300, 300)
            else:
                solar = 0
            
            # 负载曲线
            base_load = 800
            morning_peak = 500 if 7 <= hour <= 9 else 0
            evening_peak = 800 if 18 <= hour <= 22 else 0
            load = base_load + random.uniform(0, 500) + morning_peak + evening_peak
            
            # 电网功率
            grid = load - solar + random.uniform(-200, 200)
            
            # 电池SOC
            base_soc = 50 + 25 * math.sin((hour - 6) / 24 * 2 * math.pi)
            if solar > 2000:
                soc = min(95, base_soc + 15 + random.uniform(-3, 3))
            elif solar < 500:
                soc = max(10, base_soc - 10 + random.uniform(-3, 3))
            else:
                soc = base_soc + random.uniform(-5, 5)
            
            self.history.append({
                "time": f"{t.hour}:{str(t.minute).zfill(2)}",
                "fullTime": t.isoformat(),
                "solar": round(max(0, solar), 1),
                "load": round(load, 1),
                "grid": round(grid, 1),
                "battery": round(max(10, min(95, soc)), 1),
                "efficiency": round(95 + random.uniform(-2, 3), 1),
                "temperature": round(25 + random.uniform(0, 10), 1),
            })
        
        self.history = list(reversed(self.history))
    
    def add_point(self, point: Dict[str, Any]):
        """添加新的数据点"""
        self.history.append(point)
        if len(self.history) > 24 * 6 + 1:
            self.history.pop(0)
    
    def add_alert(self, alert: Dict[str, Any]):
        """添加告警"""
        self.alerts.insert(0, alert)
        if len(self.alerts) > 100:
            self.alerts.pop()

store = DataStore()

# ==================== 数据生成器 ====================
class MockDataGenerator:
    @staticmethod
    def get_solar_power(hour: float) -> float:
        """根据时间计算太阳能功率"""
        if hour < 6 or hour > 18:
            return 0
        progress = (hour - 6) / 12
        curve = math.sin(progress * math.pi)
        return 5500 * curve + random.uniform(-500, 500)
    
    @staticmethod
    def get_battery_soc(hour: float, solar_power: float) -> float:
        """根据时间和太阳能功率计算电池SOC"""
        base_soc = 50 + 25 * math.sin((hour - 6) / 24 * 2 * math.pi)
        if solar_power > 2000:
            return min(95, base_soc + 15 + random.uniform(-3, 3))
        elif solar_power < 500:
            return max(10, base_soc - 10 + random.uniform(-3, 3))
        return base_soc + random.uniform(-5, 5)
    
    @staticmethod
    def get_load_power(hour: float) -> float:
        """根据时间计算负载功率"""
        base_load = 800
        morning_peak = 500 if 7 <= hour <= 9 else 0
        evening_peak = 800 if 18 <= hour <= 22 else 0
        return base_load + random.uniform(0, 500) + morning_peak + evening_peak
    
    @staticmethod
    def generate_realtime() -> Dict[str, Any]:
        """生成实时数据"""
        now = datetime.now()
        hour = now.hour + now.minute / 60
        
        # 太阳能
        solar_power = MockDataGenerator.get_solar_power(hour)
        solar_voltage = 300 + random.uniform(-15, 15)
        solar_current = max(0, solar_power / solar_voltage)
        solar_efficiency = 95 + random.uniform(-3, 3)
        solar_temp = 35 + solar_power / 200 + random.uniform(0, 5)
        
        # 电池
        battery_soc = MockDataGenerator.get_battery_soc(hour, solar_power)
        battery_current = (
            15 + random.uniform(5, 10) if solar_power > 2000 else
            -15 - random.uniform(5, 10) if solar_power < 500 else
            random.uniform(-10, 10)
        )
        battery_status = (
            "charging" if battery_current > 2 else
            "discharging" if battery_current < -2 else "idle"
        )
        
        # 负载
        load_power = MockDataGenerator.get_load_power(hour)
        
        # 电网
        grid_power = load_power - solar_power - battery_current * 48
        grid_voltage = 220 + random.uniform(-5, 5)
        grid_freq = 50 + random.uniform(-0.15, 0.15)
        grid_quality = (
            "good" if abs(220 - grid_voltage) < 5 else
            "warning" if abs(220 - grid_voltage) < 10 else "poor"
        )
        
        # 系统状态
        status = "normal"
        if battery_soc < 15:
            status = "warning"
        elif abs(grid_power) > 2500:
            status = "warning"
        elif grid_quality == "poor":
            status = "warning"
        
        # 生成告警
        if random.random() > 0.95:
            alert = {
                "id": f"alert-{int(datetime.now().timestamp())}",
                "type": random.choice(["info", "warning"]),
                "title": random.choice([
                    "电池温度偏高",
                    "电网电压波动",
                    "通信延迟",
                    "功率波动",
                ]),
                "message": "系统检测到异常，已自动调整运行参数",
                "timestamp": now.isoformat(),
                "acknowledged": False,
            }
            store.add_alert(alert)
        
        return {
            "timestamp": now.isoformat(),
            "solar": {
                "power": round(max(0, solar_power), 1),
                "voltage": round(solar_voltage, 1),
                "current": round(solar_current, 2),
                "efficiency": round(solar_efficiency, 1),
                "temperature": round(solar_temp, 1),
            },
            "battery": {
                "voltage": round(48 + battery_current * 0.05 + random.uniform(-1, 1), 1),
                "current": round(battery_current, 1),
                "soc": round(battery_soc, 1),
                "soh": round(92 + random.uniform(-3, 3), 1),
                "temperature": round(25 + abs(battery_current) * 0.15 + random.uniform(0, 3), 1),
                "cycles": 342,
                "status": battery_status,
            },
            "grid": {
                "voltage": round(grid_voltage, 1),
                "frequency": round(grid_freq, 2),
                "power": round(grid_power, 1),
                "import_export": (
                    "import" if grid_power > 50 else
                    "export" if grid_power < -50 else "idle"
                ),
                "quality": grid_quality,
            },
            "load": {
                "power": round(load_power, 1),
                "voltage": round(220 + random.uniform(-3, 3), 1),
                "current": round(load_power / 220, 2),
            },
            "status": status,
            "temperature": round(35 + random.uniform(0, 10), 1),
            "efficiency": round(97 + random.uniform(-2, 2), 1),
        }

# ==================== API 路由 ====================

@app.route('/api/data')
def api_data():
    """获取实时数据"""
    data = MockDataGenerator.generate_realtime()
    
    # 添加到历史记录
    point = {
        "time": f"{datetime.now().hour}:{str(datetime.now().minute).zfill(2)}",
        "fullTime": data["timestamp"],
        "solar": data["solar"]["power"],
        "load": data["load"]["power"],
        "grid": data["grid"]["power"],
        "battery": data["battery"]["soc"],
        "efficiency": data["efficiency"],
        "temperature": data["temperature"],
    }
    store.add_point(point)
    
    return jsonify(data)

@app.route('/api/history')
def api_history():
    """获取历史数据"""
    hours = request.args.get('hours', 24, type=int)
    points = min(hours * 6, len(store.history))
    return jsonify(store.history[-points:])

@app.route('/api/status')
def api_status():
    """获取系统状态"""
    return jsonify({
        "status": "online",
        "uptime": "13 days, 5 hours, 42 minutes",
        "version": "2.0.0",
        "firmware": "V3.1.5",
        "last_sync": datetime.now().isoformat(),
        "model": "SUN-5K-SG04LP3-EU",
        "serial": "SN2024031500123",
    })

@app.route('/api/stats/daily')
def api_stats_daily():
    """获取今日统计"""
    solar_generated = 32.5 + random.uniform(-3, 3)
    grid_import = 5.2 + random.uniform(-1, 1)
    grid_export = 12.8 + random.uniform(-2, 2)
    load_consumed = solar_generated + grid_import - grid_export
    
    return jsonify({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "solarGenerated": round(solar_generated, 1),
        "gridImport": round(grid_import, 1),
        "gridExport": round(grid_export, 1),
        "batteryCharge": round(18.3 + random.uniform(-2, 2), 1),
        "batteryDischarge": round(15.6 + random.uniform(-2, 2), 1),
        "loadConsumed": round(load_consumed, 1),
        "savings": round(solar_generated * 0.6 + grid_export * 0.45, 2),
        "co2Saved": round(solar_generated * 0.5, 1),
        "peakLoad": round(2500 + random.uniform(-200, 200), 1),
        "avgLoad": round(1200 + random.uniform(-100, 100), 1),
        "minLoad": round(400 + random.uniform(-50, 50), 1),
    })

@app.route('/api/stats/weekly')
def api_stats_weekly():
    """获取本周统计"""
    return jsonify({
        "solarGenerated": 224.5,
        "gridImport": 35.2,
        "gridExport": 86.3,
        "loadConsumed": 173.4,
        "savings": 480.25,
        "co2Saved": 112.3,
    })

@app.route('/api/stats/monthly')
def api_stats_monthly():
    """获取本月统计"""
    return jsonify({
        "month": datetime.now().strftime("%Y-%m"),
        "solarGenerated": round(892.3 + random.uniform(-30, 30), 1),
        "gridImport": round(145.6 + random.uniform(-15, 15), 1),
        "gridExport": round(342.1 + random.uniform(-20, 20), 1),
        "loadConsumed": round(695.8, 1),
        "savings": round(687.50 + random.uniform(-30, 30), 2),
        "co2Saved": round(446 + random.uniform(-15, 15), 1),
        "avgDailySolar": round(28.8, 1),
        "avgDailyLoad": round(22.4, 1),
    })

@app.route('/api/stats/yearly')
def api_stats_yearly():
    """获取年度统计"""
    return jsonify({
        "year": datetime.now().year,
        "solarGenerated": 10234.5,
        "gridImport": 1456.2,
        "gridExport": 3567.8,
        "loadConsumed": 8122.9,
        "savings": 7823.45,
        "co2Saved": 5117.3,
    })

@app.route('/api/alerts')
def api_alerts():
    """获取告警列表"""
    return jsonify(store.alerts[:20])

@app.route('/api/alerts/<alert_id>/acknowledge', methods=['POST'])
def api_acknowledge_alert(alert_id):
    """确认告警"""
    for alert in store.alerts:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/devices')
def api_devices():
    """获取设备列表"""
    return jsonify(store.devices)

@app.route('/api/config')
def api_config():
    """获取系统配置"""
    return jsonify({
        "grid": {
            "voltageNominal": 220,
            "frequencyNominal": 50,
            "voltageMin": 180,
            "voltageMax": 260,
            "frequencyMin": 47,
            "frequencyMax": 53,
        },
        "battery": {
            "type": "Lithium",
            "capacity": 10.0,  # kWh
            "voltageNominal": 48,
            "maxChargeCurrent": 50,
            "maxDischargeCurrent": 50,
            "socMin": 10,
            "socMax": 95,
        },
        "solar": {
            "maxPower": 6000,  # W
            "voltageMin": 100,
            "voltageMax": 500,
            "mpptCount": 2,
        },
    })

# ==================== 启动 ====================
if __name__ == '__main__':
    print("=" * 60)
    print("  逆变器监控后端 API v2.0 - 专业版")
    print("=" * 60)
    print()
    print("  API 端点:")
    print("  ├─ /api/data              实时数据")
    print("  ├─ /api/history           历史数据 (?hours=24)")
    print("  ├─ /api/status            系统状态")
    print("  ├─ /api/stats/daily       今日统计")
    print("  ├─ /api/stats/weekly      本周统计")
    print("  ├─ /api/stats/monthly     本月统计")
    print("  ├─ /api/stats/yearly      年度统计")
    print("  ├─ /api/alerts            告警列表")
    print("  ├─ /api/devices           设备列表")
    print("  └─ /api/config            系统配置")
    print()
    print("  服务地址: http://localhost:3002")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=3002, debug=True, threaded=True)
