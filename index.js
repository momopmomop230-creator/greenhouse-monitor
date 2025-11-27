const express = require('express');
const mqtt = require('mqtt');

const app = express();
const port = process.env.PORT || 3000;

// === Данные из dash.wqtt.ru (обязательно замени, если изменились) ===
const mqttOptions = {
  host: 'm1.wqtt.ru',
  port: 17126,
  username: 'u_FJOCY',
  password: 'nq4MyE96O',
};

const client = mqtt.connect(mqttOptions);
let latestData = {};

client.on('connect', () => {
  console.log('✅ Подключён к MQTT-брокеру m1.wqtt.ru');
  client.subscribe('greenhouse/sensors/data');
});

client.on('message', (topic, message) => {
  if (topic === 'greenhouse/sensors/data') {
    try {
      latestData = JSON.parse(message.toString());
      console.log('📥 Получены данные:', latestData);
    } catch (e) {
      console.error('❌ Ошибка парсинга JSON:', e);
    }
  }
});

// Главная страница — интерфейс без авторизации
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌱 Теплица — Облако</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #e0f7fa, #f8f8f8);
      color: #333;
      padding: 15px;
    }
    header { text-align: center; margin-bottom: 20px; padding: 15px; background: #00796b; color: white; border-radius: 12px; }
    h1 { font-size: 1.8em; }
    .status { font-size: 0.9em; opacity: 0.9; margin-top: 5px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .card { background: white; padding: 18px; border-radius: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); text-align: center; }
    .card h3 { color: #00796b; margin-bottom: 10px; font-size: 1.1em; }
    .value { font-size: 1.8em; font-weight: bold; color: #1b5e20; }
    .unit { font-size: 0.9em; color: #555; display: block; margin-top: 4px; }
    .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 20px; }
  </style>
</head>
<body>
  <header>
    <h1>🌱 Интеллектуальная теплица</h1>
    <div class="status" id="lastUpdate">Ожидание данных...</div>
  </header>

  <div class="grid">
    <div class="card"><h3>🌡️ Температура воздуха</h3><div class="value" id="tempAir">--</div><span class="unit">°C</span></div>
    <div class="card"><h3>💧 Влажность воздуха</h3><div class="value" id="humAir">--</div><span class="unit">%</span></div>
    <div class="card"><h3>🌧️ Влажность почвы</h3><div class="value" id="soilHum">--</div><span class="unit">%</span></div>
    <div class="card"><h3>☀️ Освещённость</h3><div class="value" id="light">--</div><span class="unit">лк</span></div>
    <div class="card"><h3>🌬️ CO₂</h3><div class="value" id="eco2">--</div><span class="unit">ppm</span></div>
    <div class="card"><h3>🌫️ TVOC</h3><div class="value" id="tvoc">--</div><span class="unit">ppb</span></div>
    <div class="card"><h3>🌡️ Температура почвы</h3><div class="value" id="soilTemp">--</div><span class="unit">°C</span></div>
    <div class="card"><h3>🔽 Давление</h3><div class="value" id="pressure">--</div><span class="unit">гПа</span></div>
  </div>

  <div class="footer">Данные из облака MQTT • Обновление каждые 5 сек</div>

  <script>
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        document.getElementById('tempAir').textContent = (data.air?.temp_c ?? '--').toFixed(1);
        document.getElementById('humAir').textContent = (data.air?.humidity_pct ?? '--').toFixed(1);
        document.getElementById('soilHum').textContent = (data.soil?.humidity_pct ?? '--').toFixed(0);
        document.getElementById('light').textContent = (data.light_lux ?? '--').toFixed(0);
        document.getElementById('eco2').textContent = data.air?.eco2_ppm ?? '--';
        document.getElementById('tvoc').textContent = data.air?.tvoc_ppb ?? '--';
        document.getElementById('soilTemp').textContent = (data.soil?.temp_c ?? '--').toFixed(1);
        document.getElementById('pressure').textContent = (data.air?.pressure_hpa ?? '--').toFixed(1);
        document.getElementById('lastUpdate').textContent = 'Последнее обновление: ' + new Date().toLocaleTimeString();
      } catch (e) {
        console.error('Ошибка:', e);
      }
    }
    fetchData();
    setInterval(fetchData, 5000);
  </script>
</body>
</html>
  `);
});

// API-точка для получения данных — без авторизации
app.get('/api/data', (req, res) => {
  res.json(latestData);
});

app.listen(port, () => {
  console.log(`🌐 Сервер запущен на порту ${port}`);
});
