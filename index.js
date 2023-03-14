require("dotenv").config();
import express from "express";
import Pulsar from "pulsar-client";
import WebSocket from "ws";

const token = process.env.PULSAR_TOKEN;
const serviceUrl = process.env.TENANT_SERVICE_URL;
const wsEndpoint = process.env.TENANT_WS_URL;
const topicName = process.env.TOPIC_NAME;
const tenantName = process.env.TENANT_NAME;

const PORT = 5050;

const app = express();
require("express-ws")(app);

app.use(express.static("public"));
app.use(express.json());
const authentication = new Pulsar.AuthenticationToken({ token });

// Create Pulsar Client
const client = new Pulsar.Client({
  serviceUrl,
  authentication,
  operationTimeoutSeconds: 30,
  useTls: false,
});

app.post("/stream", async (req, res) => {
  try {
    const producer = await client.createProducer({
      topic: `persistent://${tenantName}/default/${topicName}`,
    });

    await producer.send({
      data: Buffer.from(req.body.message),
      eventTimestamp: Date.now(),
      properties: {
        username: req.body.username || "Anonymous",
      },
    });

    await producer.close();

    res.send({
      status: "message sent",
    });
  } catch (error) {
    console.log(error);

    res.status(400).send({
      error,
    });
  }
});

app.ws("/stream", async (expressWebsocket, req) => {
  const websocket = new WebSocket(
    `${wsEndpoint}/reader/persistent/${tenantName}/default/${topicName}?messageId=latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  websocket.on("message", (message) => {
    const receiveMsg = JSON.parse(message);

    if (receiveMsg) {
      const { payload, properties, publishTime } = receiveMsg;

      expressWebsocket.send(
        JSON.stringify({
          message: Buffer(payload, "base64").toString(),
          properties,
          publishTime,
        })
      );

      const ackMsg = { messageId: receiveMsg.messageId };
      websocket.send(JSON.stringify(ackMsg));
    }
  });

  websocket.on("error", (error) => {
    console.log(error);
    expressWebsocket.close();
  });
});

app.listen(PORT, () => [
  console.log(`API available at http://localhost:${PORT}`),
]);
