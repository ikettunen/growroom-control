import RPi.GPIO as GPIO
import config
import logging

logger = logging.getLogger(__name__)

class RelayController:
    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        self.relays = {
            'light': config.RELAY_LIGHT_PIN,
            'fan_in': config.RELAY_FAN_IN_PIN,
            'fan_out': config.RELAY_FAN_OUT_PIN,
            'pump': config.RELAY_PUMP_PIN,
            'humidity': config.RELAY_HUMIDITY_PIN
        }
        
        # Initialize all relay pins
        for name, pin in self.relays.items():
            GPIO.setup(pin, GPIO.OUT)
            self.set_relay(name, False)  # Start with all off
            
        logger.info("Relay controller initialized")
    
    def set_relay(self, relay_name, state):
        """Set relay state (True=ON, False=OFF)"""
        if relay_name not in self.relays:
            logger.error(f"Unknown relay: {relay_name}")
            return False
            
        pin = self.relays[relay_name]
        
        # Relay modules are typically active LOW: the relay is energized
        # when the GPIO pin is driven LOW.
        if config.RELAY_ACTIVE_LOW:
            gpio_state = GPIO.LOW if state else GPIO.HIGH
        else:
            gpio_state = GPIO.HIGH if state else GPIO.LOW
            
        GPIO.output(pin, gpio_state)
        logger.info(f"Relay {relay_name} set to {'ON' if state else 'OFF'}")
        return True
    
    def cleanup(self):
        """Clean up GPIO on exit"""
        GPIO.cleanup()
        logger.info("GPIO cleanup completed")
