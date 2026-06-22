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

module.exports = { validateEnv };
