'use strict';

const { validateEnv } = require('../lib/handler');

describe('validateEnv', () => {
    beforeEach(() => {
        vi.stubEnv('SERVER_ADDRESS', 'localhost');
        vi.stubEnv('DEVICE_ADDRESS', '192.168.1.2');
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://broker.local');
        vi.stubEnv('MQTT_TOPIC', 'home/tts');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('全必須 env が揃っている場合はエラーをスローしない', () => {
        expect(() => validateEnv()).not.toThrow();
    });

    test('SERVER_ADDRESS が未設定の場合 "SERVER_ADDRESS required." をスロー', () => {
        vi.stubEnv('SERVER_ADDRESS', '');
        expect(() => validateEnv()).toThrow('SERVER_ADDRESS required.');
    });

    test('DEVICE_ADDRESS が未設定の場合 "DEVICE_ADDRESS required." をスロー', () => {
        vi.stubEnv('DEVICE_ADDRESS', '');
        expect(() => validateEnv()).toThrow('DEVICE_ADDRESS required.');
    });

    test('MQTT_ADDRESS が未設定の場合 "MQTT_ADDRESS required." をスロー', () => {
        vi.stubEnv('MQTT_ADDRESS', '');
        expect(() => validateEnv()).toThrow('MQTT_ADDRESS required.');
    });

    test('MQTT_TOPIC が未設定の場合 "MQTT_TOPIC required." をスロー', () => {
        vi.stubEnv('MQTT_TOPIC', '');
        expect(() => validateEnv()).toThrow('MQTT_TOPIC required.');
    });
});
