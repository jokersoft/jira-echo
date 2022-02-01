'use strict';

const DEFAULT_PORT = '80';
const PORT = process.env.PORT ?? DEFAULT_PORT;

const controller = require('./controller');
const { authMiddleware, gateway } = require('./controller');
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api', authMiddleware, gateway());
app.get('/health', (request, response) => {
  controller.health(request, response);
});
app.get('/', (request, response) => {
  controller.health(request, response);
});

const server = app.listen(PORT, () => {
  const host = server.address().address
  const port = server.address().port
  console.log("Server is listening at http://%s:%s", host, port)
});
