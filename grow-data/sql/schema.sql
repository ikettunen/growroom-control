CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    -- Live values, updated automatically from Pi sensor readings (POST /api/rooms/:id/sensors)
    light FLOAT DEFAULT 0,
    humidity FLOAT DEFAULT 0,
    temperature FLOAT DEFAULT 0,
    -- Control setpoints, updated via PUT /api/rooms/:id
    light_setting FLOAT DEFAULT 75,
    humidity_setting FLOAT DEFAULT 60,
    temperature_setting FLOAT DEFAULT 22,
    irrigation_setting TINYINT(1) DEFAULT 0,
    -- Light cycle schedule (photoperiod). lightOn is computed by the backend scheduler.
    light_cycle_hours INT DEFAULT 12,      -- hours of light per day: 0 (off), 12, 18, 24 (always on)
    light_on_at TIME DEFAULT '06:00:00',   -- local time of day the daily on-window starts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    type ENUM('light', 'humidity', 'temperature', 'irrigation') NOT NULL,
    value FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_sensors_room_time (room_id, created_at)
);

CREATE TABLE controls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    light_setting FLOAT,
    humidity_setting FLOAT,
    temperature_setting FLOAT,
    irrigation_setting FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
