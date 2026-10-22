import Adafruit_DHT
import config
import logging

logger = logging.getLogger(__name__)

class SensorReader:
    def __init__(self):
        self.sensor_type = getattr(Adafruit_DHT, config.TEMP_SENSOR_TYPE)
        self.pin = config.TEMP_SENSOR_PIN
        
    def read_temperature_humidity(self):
        """Read temperature and humidity from DHT sensor"""
        try:
            humidity, temperature = Adafruit_DHT.read_retry(self.sensor_type, self.pin)
            
            if humidity is not None and temperature is not None:
                return {
                    'temperature': round(temperature, 1),
                    'humidity': round(humidity, 1)
                }
            else:
                logger.warning("Failed to read from sensor")
                return None
        except Exception as e:
            logger.error(f"Error reading sensor: {e}")
            return None
