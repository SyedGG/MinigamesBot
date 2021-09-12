
const config = require('./config');
const fetch = require('node-fetch');
const fs = require('fs');
const port = process.env.PORT || 3000;
const util = require('util');

const express = require('express');
const app = express();

const Discord = require('./interactions');
const client = new Discord.Client({
  applicationID: config.APPLICATION_ID,
  publicKey: config.PUBLIC_KEY,
  accessToken: process.env.accessToken
});
const commands = fs.readdirSync('commands').map(file => require(`./commands/${file}`));

function reload(mod) {
  delete require.cache[require.resolve(mod)];
  return require(mod);
}

process.stdin.on('data', cmd => {
  let ops = {};
  try {
    console.dir(global.$_ = eval(cmd.toString().trim()), ops);
  } catch(err) {
    console.error(err);
  }
})

client.on('interaction', interaction => {
  if (interaction.type === 2) {
    const cmd = commands.find(cmd => cmd.name === interaction.commandName);
    if (!cmd) return interaction.reply('This command has not been implemented yet. Please try later.');
    return cmd.run(interaction);
  }
  if (interaction.type === 3)
    setTimeout(() => interaction.replied || interaction.deferred || interaction.reply({
      content: 'This button was not handled on time.',
      ephemeral: true
    }), 2500);
});


app.post('/api/interactions', client.handleRequest());

// For testing
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