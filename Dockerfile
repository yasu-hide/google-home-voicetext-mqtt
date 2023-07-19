FROM node:16.20.1-bullseye-slim
WORKDIR /tmp
COPY package.json /tmp/package.json
RUN npm config set unsafe-perm true \
    && npm update -y -g npm \
    && npm install \
    && npm config set unsafe-perm false
COPY main.js /tmp/main.js
ENTRYPOINT ["node"]
CMD ["/tmp/main.js"]