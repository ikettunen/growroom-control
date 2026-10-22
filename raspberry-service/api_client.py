import requests
import config
import logging

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self):
        self.base_url = config.API_URL
        self.room_id = config.ROOM_ID
        
    def send_sensor_data(self, temperature, humidity):
        """Send sensor data to backend"""
        try:
            url = f"{self.base_url}/api/rooms/{self.room_id}/sensors"
            data = {
                'temperature': temperature,
                'humidity': humidity,
                'light': 0  # Placeholder, add light sensor if needed
            }
            
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            logger.info(f"Sensor data sent: temp={temperature}°C, humidity={humidity}%")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send sensor data: {e}")
            return False
    
    def get_control_settings(self):
        """Get control settings from backend"""
        try:
            url = f"{self.base_url}/api/rooms/{self.room_id}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            settings = {
                'light': data.get('lightSetting', data.get('light', 0)),
                'temperature': data.get('temperatureSetting', data.get('temperature', 0)),
                'humidity': data.get('humiditySetting', data.get('humidity', 0)),
                'irrigation': bool(data.get('irrigation_setting', data.get('irrigation', False))),
                # Scheduled light state, computed by the backend from the room's
                # light cycle (lightCycleHours + lightOnAt). None when the
                # backend does not provide it -> fallback to intensity boolean.
                'light_on': data.get('lightOn'),
                'light_cycle_hours': data.get('lightCycleHours'),
                'light_on_at': data.get('lightOnAt')
            }
            logger.debug(f"Control settings received: {settings}")
            return settings
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get control settings: {e}")
            return None
