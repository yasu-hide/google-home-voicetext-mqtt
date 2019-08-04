'use strict'
require("date-utils");
const request = require('request-promise');
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
});

const options = {
    url: endpointUrl.toString(),
    method: 'POST',
    form: {}
};

const mqttopt = {};
if(process.env["MQTT_USER"]) {
    mqttopt.username = process.env["MQTT_USER"];
}
if(process.env["MQTT_PASS"]) {
    mqttopt.password = process.env["MQTT_PASS"];
}
const mqttclient = mqtt.connect(process.env["MQTT_ADDRESS"], mqttopt);

mqttclient.on('connect', () => {
    console.log('subscriber connected.', process.env["MQTT_ADDRESS"]);
    mqttclient.subscribe(process.env["MQTT_TOPIC"], (err, granted) => {
        console.log('subscriber.subscribed.', process.env["MQTT_TOPIC"]);
    });
});

mqttclient.on('message', (topic, message) => {
    options.form = {
        'text': JSON.parse(message).data.toString()
    };
    request(options).then((res) => {
        console.log(res);
    }).catch((err) => {
        console.error(err);
    });
});