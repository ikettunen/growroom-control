INSERT INTO rooms (id, name, light_setting, humidity_setting, temperature_setting, irrigation_setting) VALUES
(1, 'Room A', 75, 60, 22, 1),
(2, 'Room B', 80, 55, 24, 0),
(3, 'Room C', 70, 65, 20, 1),
(4, 'Room D', 85, 50, 23, 0);

INSERT INTO sensors (id, room_id, type, value, timestamp) VALUES
(1, 1, 'light', 75, NOW()),
(2, 1, 'humidity', 60, NOW()),
(3, 1, 'temperature', 22, NOW()),
(4, 2, 'light', 80, NOW()),
(5, 2, 'humidity', 55, NOW()),
(6, 2, 'temperature', 24, NOW()),
(7, 3, 'light', 70, NOW()),
(8, 3, 'humidity', 65, NOW()),
(9, 3, 'temperature', 20, NOW()),
(10, 4, 'light', 85, NOW()),
(11, 4, 'humidity', 50, NOW()),
(12, 4, 'temperature', 23, NOW());