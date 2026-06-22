'use strict';

// vitest 4 の vi.mock ファクトリは CommonJS の require() を横取りしない
// （ESM import のみ対象。ファクトリ自体が実行されない）。
// main.js は `const mqtt = require('mqtt')` する薄い CJS ラッパーのため、
// Node の require.cache に mqtt のモックを直接注入して横取りする。
const mockClient = { on: vi.fn(), subscribe: vi.fn() };
const mockConnect = vi.fn(() => mockClient);

const mqttPath = require.resolve('mqtt');
const mainPath = require.resolve('../main.js');

describe('main.js 配線 (smoke test)', () => {
    let originalMqttExports;

    beforeEach(() => {
        mockClient.on.mockClear();
        mockClient.subscribe.mockClear();
        mockConnect.mockClear();
        // main.js を毎回読み直すためキャッシュを落とす。
        delete require.cache[mainPath];
        // Node 正規のキャッシュエントリを確保し、元の exports を退避する。
        require('mqtt');
        originalMqttExports = require.cache[mqttPath].exports;
        // require('mqtt') がモックを返すよう exports を差し替える。
        require.cache[mqttPath].exports = { connect: mockConnect };
        vi.stubEnv('SERVER_ADDRESS', '192.168.1.10');
        vi.stubEnv('DEVICE_ADDRESS', '192.168.1.2');
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://alice:secret@broker.local:1883');
        vi.stubEnv('MQTT_TOPIC', 'home/tts');
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        delete require.cache[mainPath];
        // exports を消さず元に戻す（後続テストが実 mqtt を再ロードする副作用を防ぐ）。
        require.cache[mqttPath].exports = originalMqttExports;
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        // このスイート内で global.fetch を立てるのは3番目のテストのみのため、ここで必ず消す。
        delete global.fetch;
    });

    test('資格情報を剥がした URL と options で mqtt.connect を呼ぶ', () => {
        require('../main.js');
        expect(mockConnect).toHaveBeenCalledWith(
            'mqtt://broker.local:1883',
            { username: 'alice', password: 'secret' }
        );
    });

    test('connect イベントで MQTT_TOPIC を subscribe する', () => {
        require('../main.js');
        const connectHandler = mockClient.on.mock.calls.find((c) => c[0] === 'connect')[1];
        connectHandler();
        expect(mockClient.subscribe).toHaveBeenCalledWith('home/tts', expect.any(Function));
    });

    test('message イベントで handleMessage 経由で fetch に委譲する', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('ok') });
        global.fetch = mockFetch;
        require('../main.js');
        const messageHandler = mockClient.on.mock.calls.find((c) => c[0] === 'message')[1];
        messageHandler('home/tts', JSON.stringify({ data: 'hello' }));
        await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
        expect(mockFetch.mock.calls[0][1].body.get('text')).toBe('hello');
    });
});
