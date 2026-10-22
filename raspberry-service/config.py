import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_URL = os.getenv('API_URL', 'http://localhost:3000')
ROOM_ID = int(os.getenv('ROOM_ID', '1'))
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '30'))

# Sensor Configuration
TEMP_SENSOR_TYPE = os.getenv('TEMP_SENSOR_TYPE', 'DHT22')
TEMP_SENSOR_PIN = int(os.getenv('TEMP_SENSOR_PIN', '4'))

# Relay Configuration (GPIO BCM numbering)
RELAY_LIGHT_PIN = int(os.getenv('RELAY_LIGHT_PIN', '17'))
RELAY_FAN_IN_PIN = int(os.getenv('RELAY_FAN_IN_PIN', '27'))
RELAY_FAN_OUT_PIN = int(os.getenv('RELAY_FAN_OUT_PIN', '22'))
RELAY_PUMP_PIN = int(os.getenv('RELAY_PUMP_PIN', '23'))

# Humidity actuator (dehumidifier) on a dedicated relay
RELAY_HUMIDITY_PIN = int(os.getenv('RELAY_HUMIDITY_PIN', '24'))

# Humidity control hysteresis band (+/- around the target setpoint, % RH).
# The dehumidifier turns ON above target + band and OFF below target - band,
# which prevents relay chatter.
HUMIDITY_HYSTERESIS = float(os.getenv('HUMIDITY_HYSTERESIS', '5'))

# Relay is active LOW (common for relay modules)
RELAY_ACTIVE_LOW = True
