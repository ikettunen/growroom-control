# GrowRoom Raspberry Pi Service

Python service for Raspberry Pi to control grow room environment.

## Hardware Requirements

- Raspberry Pi (any model with GPIO)
- DHT22 or DHT11 temperature/humidity sensor
- 4-channel relay module
- Connected devices: lights, fans (in/out), irrigation pump

## Installation

1. Copy files to Raspberry Pi:
```bash
scp -r raspberry-service pi@raspberrypi.local:~/growroom
```

2. SSH into Raspberry Pi:
```bash
ssh pi@raspberrypi.local
cd ~/growroom
```

3. Install dependencies:
```bash
sudo apt-get update
sudo apt-get install -y python3-pip python3-dev
pip3 install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
nano .env
```

Update with your backend API URL and GPIO pin numbers.

## Running

### Manual start:
```bash
python3 main.py
```

### As systemd service:
```bash
sudo cp growroom.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable growroom
sudo systemctl start growroom
```

Check status:
```bash
sudo systemctl status growroom
```

View logs:
```bash
tail -f growroom.log
```

## GPIO Pin Configuration

Default BCM pin numbers:
- DHT22 Sensor: GPIO 4
- Relay 1 (Light): GPIO 17
- Relay 2 (Fan In): GPIO 27
- Relay 3 (Fan Out): GPIO 22
- Relay 4 (Pump): GPIO 23

Adjust in `.env` file as needed.

## Control Logic

- **Light**: ON when backend light setting > 0
- **Temperature**: Fans activate when temp exceeds target ±2°C
- **Irrigation**: ON/OFF based on backend irrigation setting
- **Polling**: Reads sensors and updates every 30 seconds (configurable)
