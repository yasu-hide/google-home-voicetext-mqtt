'use strict';
const mqtt = require('mqtt');
const { validateEnv, buildEndpointUrl, parseMqttAddress, handleMessage } = require('./lib/handler');

validateEnv();

const endpointUrl = buildEndpointUrl();
const { url: mqttUrl, options: mqttopt } = parseMqttAddress();

const mqttclient = mqtt.connect(mqttUrl, mqttopt);

mqttclient.on('connect', () => {
    console.log('subscriber connected.', process.env['MQTT_ADDRESS']);
    mqttclient.subscribe(process.env['MQTT_TOPIC'], (err, granted) => {
        console.log('subscriber.subscribed.', process.env['MQTT_TOPIC']);
    });
});

mqttclient.on('message', (topic, message) => {
    handleMessage(message, endpointUrl);
});
