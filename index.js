const util = require('util');
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const Discord = require('./interactions');
const client = new Discord.Client({
  applicationID: '851602059072634880',
  publicKey: '0b17918836935741f606afd7e863844cc96f816c8910eb0710bce4588aae9871',
  accessToken: process.env.accessToken
});

const interactionHandlers = {
  ApplicationCommand: require('./ApplicationCommand.js'),
  MessageComponent: require('./MessageComponent.js'),
  reload(mod) {
    delete require.cache[require.resolve(`./${mod}.js`)];
    this[mod] = require(`./${mod}.js`);
  }
}
/*
*/
client.on('interaction', cmd => {
  if (cmd.type === 2) {
    if (cmd.commandName === 'reload') {
      interactionHandlers.reload(cmd.options.get('module').value);
      cmd.reply(`Reloaded ${cmd.options.get('module').value}`);
    } else interactionHandlers.ApplicationCommand(cmd);
  }
  if (cmd.type === 3) interactionHandlers.MessageComponent(cmd);
});

app.post('/api/interactions', client.handleRequest());

app.post('/test', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    console.log('Chunk received. Size of chunk: %i, Current size of body: %i', chunk.length, body.length);
  });
  req.on('end', async () => {
    console.log('Request has ended. Data:\n%s', body);
    await new Promise(resolve => res.set('access-control-allow-origin','*').send('Received!').on('close',resolve))
    console.log('Response has been sent.');
  });
});

app.get('/geturl', (req, res) => {
  let url = Object.keys(req.query).find(e=>e.startsWith('http'));
  if (!url) return res.sendStatus(400);
  res.setHeader('access-control-allow-origin', '*');
  fetch(url)
  .then(response => response.ok 
    ? response.body.pipe(res)
    : res.status(response.status).send(`Could not download file; the server responded with a status of ${response.status}.`))
  .catch(err => res.status(500).send(`Your file (${url}) could not be downloaded for the following reason: ${util.inspect(err)}`));
});

console.clear();
app.listen(port, () => console.log(`Server running on port ${port}`));