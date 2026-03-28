#!/usr/bin/env python3
"""逆变器监控后端 API - 增强版"""
from flask import Flask, jsonify
from flask_cors import CORS
import random
import math
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 模拟历史数据存储
history_data = []

def get_inverter_data():
    """生成模拟逆变器数据"""
    now = datetime.now()
    hour = now.hour + now.minute / 60
    
    # 太阳能发电曲线 (6:00-18:00，峰值在12:00)
    if 6 <= hour <= 18:
        solar_factor = math.sin((hour - 6) / 12 * math.pi)
        base_power = 5500 * solar_factor
        solar_power = base_power + random.uniform(-300, 300)
    else:
        solar_power = 0
    
    # 电池状态
    battery_soc = 40 + 30 * math.sin((hour - 6) / 24 * 2 * math.pi) + random.uniform(-5, 5)
    battery_soc = max(10, min(95, battery_soc))
    
    # 充电/放电逻辑
    if solar_power > 3000:
        battery_current = random.uniform(10, 25)  # 充电
    elif solar_power < 500:
        battery_current = random.uniform(-25, -5)  # 放电
    else:
        battery_current = random.uniform(-10, 10)
    
    # 电网功率
    load = 800 + random.uniform(0, 1500)
    grid_power = load - solar_power - battery_current * 48
    grid_power = max(-3000, min(3000, grid_power + random.uniform(-200, 200)))
    
    # 状态判断
    if battery_soc < 15:
        status = "warning"
    elif abs(grid_power) > 2500:
        status = "warning"
    else:
        status = "normal"
    
    return {
        "timestamp": now.isoformat(),
        "solar": {
            "power": round(max(0, solar_power), 1),
            "voltage": round(300 + random.uniform(-15, 15), 1),
            "current": round(max(0, solar_power / 300 + random.uniform(-1, 1)), 2),
        },
        "battery": {
            "voltage": round(48 + battery_current * 0.05 + random.uniform(-0.5, 0.5), 1),
            "current": round(battery_current, 1),
            "soc": round(battery_soc, 1),
            "temperature": round(25 + abs(battery_current) * 0.2 + random.uniform(0, 3), 1),
        },
        "grid": {
            "voltage": round(220 + random.uniform(-3, 3), 1),
            "frequency": round(50 + random.uniform(-0.1, 0.1), 2),
            "power": round(grid_power, 1),
        },
        "load": {
            "power": round(load, 1),
        },
        "status": status,
        "alerts": [],
    }

@app.route('/api/data')
def api_data():
    """获取实时数据"""
    return jsonify(get_inverter_data())

@app.route('/api/history')
def api_history():
    """获取历史数据 (24小时)"""
    global history_data
    now = datetime.now()
    
    # 生成或更新历史数据
    if len(history_data) < 24 * 6:
        history_data = []
        for i in range(24 * 6):
            t = now - timedelta(minutes=i * 10)
            hour = t.hour + t.minute / 60
            
            if 6 <= hour <= 18:
                solar_factor = math.sin((hour - 6) / 12 * math.pi)
                solar = 5500 * solar_factor + random.uniform(-300, 300)
            else:
                solar = 0
            
            load = 800 + random.uniform(0, 1500)
            grid = (load - solar) * random.uniform(0.8, 1.2)
            battery = 40 + 30 * math.sin((hour - 6) / 24 * 2 * math.pi) + random.uniform(-5, 5)
            
            history_data.append({
                "time": f"{t.hour}:{String(t.minute).padStart(2, '0')}" if False else f"{t.hour}:{str(t.minute).zfill(2)}",
                "solar": round(max(0, solar), 1),
                "load": round(load, 1),
                "grid": round(grid, 1),
                "battery": round(max(10, min(95, battery)), 1),
            })
        history_data = list(reversed(history_data))
    
    return jsonify(history_data)

@app.route('/api/status')
def api_status():
    """系统状态"""
    return jsonify({
        "status": "online",
        "uptime": "13 days, 5 hours",
        "version": "2.0.0",
        "firmware": "V3.1.5",
        "last_sync": datetime.now().isoformat(),
    })

@app.route('/api/stats/daily')
def api_stats_daily():
    """今日统计"""
    return jsonify({
        "solar_total": 32.5,  # kWh
        "grid_import": 5.2,
        "grid_export": 12.8,
        "battery_charge": 18.3,
        "battery_discharge": 15.6,
        "load_total": 28.4,
    })

@app.route('/api/stats/monthly')
def api_stats_monthly():
    """本月统计"""
    return jsonify({
        "solar_total": 892.3,
        "grid_import": 145.6,
        "grid_export": 342.1,
        "savings": 687.50,  # 元
    })

if __name__ == '__main__':
    print("=" * 50)
    print("逆变器监控后端 API v2.0")
    print("=" * 50)
    print("API 端点:")
    print("  - http://localhost:3002/api/data      实时数据")
    print("  - http://localhost:3002/api/history   历史数据")
    print("  - http://localhost:3002/api/status    系统状态")
    print("  - http://localhost:3002/api/stats/daily   今日统计")
    print("  - http://localhost:3002/api/stats/monthly 本月统计")
    print("=" * 50)
    app.run(host='0.0.0.0', port=3002, debug=True, threaded=True)
