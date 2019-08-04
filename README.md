# google-home-voicetext-mqtt
MQTTブローカーに書き込んだ内容を、Google Homeに喋らせる仕組みです。

[google-home-voicetext-server](https://github.com/yasu-hide/google-home-voicetext-server)と合わせて使用できます。

# 起動時に設定できる項目 (環境変数)
## SERVER_ADDRESS (必須)
google-home-voicetext-serverが起動しているサーバのIPアドレスです。

```
export SERVER_ADDRESS=192.168.20.140
```

## DEVICE_ADDRESS (必須)
喋らせたいGoogle HomeのIPアドレスです。

```
export DEVICE_ADDRESS=192.168.20.200
```

## MQTT_ADDRESS (必須)
MQTTブローカーのアドレスです。

```
export MQTT_ADDRESS=mqtt://mqtt.beebotte.com
```
## MQTT_TOPIC (必須)
MQTTのトピックを指定します。

```
export MQTT_TOPIC=Google_Home_Voicetext/message
```

## SERVER_PORT (任意)
google-home-voicetext-serverのポート番号です。

デフォルトは __8080__ です。

```
export SERVER_PORT=80
```

## MQTT_USER (任意)
MQTTブローカーのユーザー名です。

```
export MQTT_USER=token_1234567890
```

## MQTT_PASS (任意)
MQTTブローカーのパスワードです。

```
export MQTT_PASS=
```

# k8s
## Secret事前準備 (prepare)
```
kubectl create secret generic google-home-voicetext-mqtt \
  --from-literal=MQTT_USER=token_1234567890 \
  --from-literal=MQTT_PASS=
```
## ConfigMap編集
パラメータを編集します。
```
vi k8s-google-home-voicetext-mqtt.yml
```

## 適用 (apply)
```
$ kubectl apply -f k8s-google-home-voicetext-mqtt.yml
```