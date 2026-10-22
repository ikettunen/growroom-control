#!/usr/bin/env python3
import time
import logging
import signal
import sys
from sensor_reader import SensorReader
from relay_controller import RelayController
from api_client import APIClient
import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('growroom.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class GrowRoomService:
    def __init__(self):
        self.sensor = SensorReader()
        self.relay = RelayController()
        self.api = APIClient()
        self.running = True
        
        # Track current relay states
        self.relay_states = {
            'light': False,
            'fan_in': False,
            'fan_out': False,
            'pump': False,
            'humidity': False
        }
        
    def handle_shutdown(self, signum, frame):
        """Handle graceful shutdown"""
        logger.info("Shutdown signal received")
        self.running = False
        
    def _set_relay(self, name, state):
        """Set a relay and track its state, only on state change"""
        if self.relay_states[name] != state:
            self.relay.set_relay(name, state)
            self.relay_states[name] = state
        
    def apply_control_logic(self, sensor_data, settings):
        """Apply control logic based on sensor data and settings"""
        if not sensor_data or not settings:
            return
            
        temp = sensor_data['temperature']
        humidity = sensor_data['humidity']
        
        # Light control. The backend computes 'light_on' from the room's
        # light cycle schedule (lightCycleHours / lightOnAt); fall back to
        # the simple intensity boolean when the schedule is unavailable.
        light_on = settings.get('light_on')
        if light_on is None:
            light_on = settings['light'] > 0
        self._set_relay('light', light_on)
        
        # Temperature control with fans
        target_temp = settings['temperature']
        if target_temp > 0:
            if temp > target_temp + 2:
                # Too hot - turn on exhaust fan
                self._set_relay('fan_out', True)
            elif temp < target_temp - 2:
                # Too cold - turn off fans
                self._set_relay('fan_out', False)
            else:
                # In range - exhaust off, run intake
                self._set_relay('fan_out', False)
                self._set_relay('fan_in', True)
        
        # Humidity control (dehumidifier on dedicated relay, hysteresis band).
        # ON when humidity > target + band, OFF when humidity < target - band;
        # inside the band the current state is kept to prevent relay chatter.
        # Note: too-dry air is only logged - wire a humidifier relay to act on it.
        target_humidity = settings.get('humidity') or 0
        if target_humidity > 0:
            band = config.HUMIDITY_HYSTERESIS
            if humidity > target_humidity + band:
                if not self.relay_states['humidity']:
                    logger.info(f"Humidity {humidity}% above target {target_humidity}% +{band}, dehumidifier ON")
                self._set_relay('humidity', True)
            elif humidity < target_humidity - band:
                self._set_relay('humidity', False)
                if humidity < target_humidity - 2 * band:
                    logger.warning(f"Humidity {humidity}% well below target {target_humidity}% (no humidifier relay wired)")
            # inside band: keep current state
        
        # Irrigation control
        irrigation_on = settings['irrigation']
        self._set_relay('pump', irrigation_on)
    
    def run(self):
        """Main service loop"""
        logger.info("GrowRoom service started")
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        
        try:
            while self.running:
                # Read sensor data
                sensor_data = self.sensor.read_temperature_humidity()
                
                if sensor_data:
                    # Send to backend
                    self.api.send_sensor_data(
                        sensor_data['temperature'],
                        sensor_data['humidity']
                    )
                    
                    # Get control settings
                    settings = self.api.get_control_settings()
                    
                    # Apply control logic
                    self.apply_control_logic(sensor_data, settings)
                
                # Wait before next poll
                time.sleep(config.POLL_INTERVAL)
                
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            logger.info("Cleaning up...")
            self.relay.cleanup()
            logger.info("Service stopped")

if __name__ == '__main__':
    service = GrowRoomService()
    service.run()
