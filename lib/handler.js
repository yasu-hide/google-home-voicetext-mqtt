'use strict';
const url = require('url');

// 必須環境変数を検証する。未設定があれば Error を throw する。
function validateEnv() {
    if (!process.env['SERVER_ADDRESS']) {
        throw new Error('SERVER_ADDRESS required.');
    }
    if (!process.env['DEVICE_ADDRESS']) {
        throw new Error('DEVICE_ADDRESS required.');
    }
    if (!process.env['MQTT_ADDRESS']) {
        throw new Error('MQTT_ADDRESS required.');
    }
    if (!process.env['MQTT_TOPIC']) {
        throw new Error('MQTT_TOPIC required.');
    }
}

// 送信先 HTTP エンドポイント URL を組み立てる。
function buildEndpointUrl() {
    return url.format({
        protocol: 'http',
        port: process.env['SERVER_PORT'] || 8080,
        hostname: process.env['SERVER_ADDRESS'],
        pathname: process.env['DEVICE_ADDRESS'],
    }).toString();
}

// MQTT_ADDRESS を検証・解析し、資格情報を剥がした URL と接続オプションを返す。
function parseMqttAddress() {
    if (!process.env['MQTT_ADDRESS'].startsWith('mqtt://')) {
        throw new Error("MQTT_ADDRESS should start with 'mqtt://'.");
    }
    const mqtturl = new URL(process.env['MQTT_ADDRESS']);
    const mqtt_user = process.env['MQTT_USER'] || mqtturl.username;
    const mqtt_pass = process.env['MQTT_PASS'] || mqtturl.password;
    mqtturl.username = '';
    mqtturl.password = '';

    const options = {};
    if (mqtt_user) {
        options.username = mqtt_user;
    }
    if (mqtt_pass) {
        options.password = mqtt_pass;
    }
    return { url: mqtturl.toString(), options };
}

// 受信メッセージを解析し、text を endpointUrl に POST する。
// JSON.parse を try 内に入れ、不正メッセージは console.error でログしてプロセスを継続させる。
async function handleMessage(message, endpointUrl) {
    try {
        const body = new URLSearchParams({
            text: JSON.parse(message).data.toString(),
        });
        const res = await fetch(endpointUrl, { method: 'POST', body });
        const text = await res.text();
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
        }
        console.log(text);
    } catch (err) {
        console.error(err);
    }
}

module.exports = { validateEnv, buildEndpointUrl, parseMqttAddress, handleMessage };
