'use strict';

const { validateEnv, buildEndpointUrl, parseMqttAddress, handleMessage } = require('../lib/handler');

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

describe('parseMqttAddress', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('mqtt:// で始まらない場合はエラーをスロー', () => {
        vi.stubEnv('MQTT_ADDRESS', 'tcp://broker.local');
        expect(() => parseMqttAddress()).toThrow("MQTT_ADDRESS should start with 'mqtt://'.");
    });

    test('資格情報なし: options は空、url はそのまま', () => {
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://broker.local:1883');
        const { url, options } = parseMqttAddress();
        expect(url).toBe('mqtt://broker.local:1883');
        expect(options).toEqual({});
    });

    test('URL 埋め込みの資格情報: options に反映し url から剥がす', () => {
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://alice:secret@broker.local:1883');
        const { url, options } = parseMqttAddress();
        expect(options).toEqual({ username: 'alice', password: 'secret' });
        expect(url).toBe('mqtt://broker.local:1883');
        expect(url).not.toContain('alice');
        expect(url).not.toContain('secret');
    });

    test('MQTT_USER / MQTT_PASS env が URL 埋め込みより優先される', () => {
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://alice:secret@broker.local:1883');
        vi.stubEnv('MQTT_USER', 'bob');
        vi.stubEnv('MQTT_PASS', 'token');
        const { options } = parseMqttAddress();
        expect(options).toEqual({ username: 'bob', password: 'token' });
    });

    test('username のみ指定: options に username だけ入る', () => {
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://broker.local:1883');
        vi.stubEnv('MQTT_USER', 'bob');
        const { options } = parseMqttAddress();
        expect(options).toEqual({ username: 'bob' });
    });

    // Codex指摘: URL に user:pass、env に MQTT_USER だけ → 各フィールド独立にフォールバック
    test('URLにuser:pass・envにMQTT_USERのみ: username=env, password=URL', () => {
        vi.stubEnv('MQTT_ADDRESS', 'mqtt://alice:secret@broker.local:1883');
        vi.stubEnv('MQTT_USER', 'bob');
        const { options } = parseMqttAddress();
        expect(options).toEqual({ username: 'bob', password: 'secret' });
    });
});

describe('handleMessage', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    test('正常系: JSON を解析し正しい URL・メソッド・body で fetch を呼ぶ', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue('done'),
        });
        global.fetch = mockFetch;

        await handleMessage(JSON.stringify({ data: 'こんにちは' }), 'http://localhost:8080/dev');

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:8080/dev',
            expect.objectContaining({ method: 'POST', body: expect.any(URLSearchParams) })
        );
        expect(mockFetch.mock.calls[0][1].body.get('text')).toBe('こんにちは');
    });

    test('正常系: レスポンス本文を console.log する', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue('done'),
        });
        await handleMessage(JSON.stringify({ data: 'hi' }), 'http://localhost:8080/dev');
        expect(console.log).toHaveBeenCalledWith('done');
    });

    test('非 ok レスポンス: throw を catch して console.error を呼ぶ', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: vi.fn().mockResolvedValue('boom'),
        });
        await handleMessage(JSON.stringify({ data: 'hi' }), 'http://localhost:8080/dev');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
        expect(console.log).not.toHaveBeenCalled();
    });

    test('ネットワークエラー: catch して console.error を呼ぶ', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('network error'));
        await handleMessage(JSON.stringify({ data: 'hi' }), 'http://localhost:8080/dev');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
        expect(console.log).not.toHaveBeenCalled();
    });

    test('data が数値でも toString() で文字列化して送る', async () => {
        const mf = vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') });
        global.fetch = mf;
        await handleMessage(JSON.stringify({ data: 123 }), 'http://localhost:8080/dev');
        expect(mf.mock.calls[0][1].body.get('text')).toBe('123');
    });

    // CEOレビュー/Codex指摘: 不正メッセージ・追加エッジケース
    test('不正なJSON: fetch は呼ばれず console.error を呼ぶ', async () => {
        const mf = vi.fn();
        global.fetch = mf;
        await handleMessage('not-json', 'http://localhost:8080/dev');
        expect(mf).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    test('data フィールド欠如: console.error を呼び fetch は呼ばれない', async () => {
        const mf = vi.fn();
        global.fetch = mf;
        await handleMessage(JSON.stringify({ foo: 'bar' }), 'http://localhost:8080/dev');
        expect(mf).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    test('data が null: console.error を呼び fetch は呼ばれない', async () => {
        const mf = vi.fn();
        global.fetch = mf;
        await handleMessage(JSON.stringify({ data: null }), 'http://localhost:8080/dev');
        expect(mf).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    test('data が object: toString() で "[object Object]" を送る', async () => {
        const mf = vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') });
        global.fetch = mf;
        await handleMessage(JSON.stringify({ data: { a: 1 } }), 'http://localhost:8080/dev');
        expect(mf.mock.calls[0][1].body.get('text')).toBe('[object Object]');
    });

    test('res.text() が reject: catch して console.error を呼ぶ', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn().mockRejectedValue(new Error('read error')),
        });
        await handleMessage(JSON.stringify({ data: 'hi' }), 'http://localhost:8080/dev');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
        expect(console.log).not.toHaveBeenCalled();
    });
});
