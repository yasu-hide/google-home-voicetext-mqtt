'use strict';

const { validateEnv, buildEndpointUrl } = require('../lib/handler');

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

describe('buildEndpointUrl', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('SERVER_PORT 指定あり: 正しい URL を返す', () => {
        vi.stubEnv('SERVER_ADDRESS', '192.168.1.10');
        vi.stubEnv('DEVICE_ADDRESS', '192.168.1.2');
        vi.stubEnv('SERVER_PORT', '9090');
        expect(buildEndpointUrl()).toBe('http://192.168.1.10:9090/192.168.1.2');
    });

    test('SERVER_PORT 未指定: デフォルト 8080 を使う', () => {
        vi.stubEnv('SERVER_ADDRESS', '192.168.1.10');
        vi.stubEnv('DEVICE_ADDRESS', '192.168.1.2');
        expect(buildEndpointUrl()).toBe('http://192.168.1.10:8080/192.168.1.2');
    });

    test('hostname にサーバ名: 正しい URL を返す', () => {
        vi.stubEnv('SERVER_ADDRESS', 'google-home-voicetext-server');
        vi.stubEnv('DEVICE_ADDRESS', 'device.local');
        vi.stubEnv('SERVER_PORT', '12080');
        expect(buildEndpointUrl()).toBe('http://google-home-voicetext-server:12080/device.local');
    });
});
