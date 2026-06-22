'use strict'
const url = require("url");
const mqtt = require("mqtt");

if(!process.env["SERVER_ADDRESS"]) {
    throw new Error("SERVER_ADDRESS required.");
}
if(!process.env["DEVICE_ADDRESS"]) {
    throw new Error("DEVICE_ADDRESS required.");
}
if(!process.env["MQTT_ADDRESS"]) {
    throw new Error("MQTT_ADDRESS required.");
}
if(!process.env["MQTT_TOPIC"]) {
    throw new Error("MQTT_TOPIC required.");
}

const endpointUrl = url.format({
    protocol: 'http',
    port: process.env["SERVER_PORT"] || 8080,
    hostname: process.env["SERVER_ADDRESS"],
    pathname: process.env["DEVICE_ADDRESS"]
}).toString();

if(!process.env["MQTT_ADDRESS"].startsWith('mqtt://')) {
    throw new Error("MQTT_ADDRESS should start with 'mqtt://'.");
}
const mqtturl = new URL(process.env["MQTT_ADDRESS"]);
const mqtt_user = process.env["MQTT_USER"] || mqtturl.username;
const mqtt_pass = process.env["MQTT_PASS"] || mqtturl.password;
mqtturl.username = '';
mqtturl.password = '';

const mqttopt = {};
if(mqtt_user) {
    mqttopt.username = mqtt_user;
}
if(mqtt_pass) {
    mqttopt.password = mqtt_pass;
}
const mqttclient = mqtt.connect(mqtturl.toString(), mqttopt);

mqttclient.on('connect', () => {
    console.log('subscriber connected.', process.env["MQTT_ADDRESS"]);
    mqttclient.subscribe(process.env["MQTT_TOPIC"], (err, granted) => {
        console.log('subscriber.subscribed.', process.env["MQTT_TOPIC"]);
    });
});

mqttclient.on('message', (topic, message) => {
    const body = new URLSearchParams({
        'text': JSON.parse(message).data.toString()
    });
    fetch(endpointUrl, {
        method: 'POST',
        body
    }).then(async (res) => {
        const text = await res.text();
        if(!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
        }
        return text;
    }).then((text) => {
        console.log(text);
    }).catch((err) => {
        console.error(err);
    });
});