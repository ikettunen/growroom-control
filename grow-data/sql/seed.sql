-- Seed data for 4 rooms (A-D) with typical grow-room setpoints.
-- Live values (light/humidity/temperature on rooms) start in sync with setpoints
-- and are then updated by incoming Pi readings.
-- Grow cycles are staggered so each room is in a different fertilizer week.

INSERT INTO rooms (id, name, light_setting, humidity_setting, temperature_setting,
                   irrigation_setting, light_cycle_hours, light_on_at,
                   cycle_start_date, fertilizer_family,
                   light, humidity, temperature) VALUES
(1, 'Room A', 75, 60, 22, 1, 18, '06:00:00', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'canna-coco', 75, 60, 22),
(2, 'Room B', 80, 55, 24, 0, 12, '06:00:00', DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'canna-coco', 80, 55, 24),
(3, 'Room C', 70, 65, 20, 1, 18, '06:00:00', DATE_SUB(CURDATE(), INTERVAL 50 DAY), 'sensi-coco', 70, 65, 20),
(4, 'Room D', 85, 50, 23, 0, 12, '06:00:00', DATE_SUB(CURDATE(), INTERVAL 80 DAY), 'sensi-coco', 85, 50, 23);

-- One initial reading per room/type so charts have a starting point
INSERT INTO sensors (room_id, type, value) VALUES
(1, 'light', 75), (1, 'humidity', 60), (1, 'temperature', 22),
(2, 'light', 80), (2, 'humidity', 55), (2, 'temperature', 24),
(3, 'light', 70), (3, 'humidity', 65), (3, 'temperature', 20),
(4, 'light', 85), (4, 'humidity', 50), (4, 'temperature', 23);
