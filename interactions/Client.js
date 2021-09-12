const EventEmitter = require('events');
const CommandManager = require('./CommandManager');
const CommandInteraction = require('./CommandInteraction');
const MessageComponentInteraction = require('./MessageComponentInteraction');
const ComponentCollector = require('./ComponentCollector');
const fetch = require('node-fetch');
const nacl = require('tweetnacl');

async function request(method, route, options) {
  let url = 'https://discord.com/api' + (options && options.version === null ? '' : '/v9') + route;
  let data = {method};
  if (options) {
    data.headers = options.headers || {};
    if (options.data) {
      data.body = JSON.stringify(options.data);
      data.headers['content-type'] = 'application/json';
    } else data.body = options.body;
  }
  let res = await fetch(url, data);
  console.log(res.status);
  console.log(res.headers.get('content-type'));
  let resp = await (res.headers.get('content-type') === 'application/json' ? res.json() : res.buffer());
  console.dir(resp, {depth: null});
  return resp;
}

class Client extends EventEmitter {
  constructor(options) {
    super();
    Object.assign(this, options);
  }
  handleRequest() {
    if (!this.publicKey) throw new Error('Client does not have a public key');
    return (req, res) => {
      const signature = req.header('X-Signature-Ed25519');
      const timestamp = req.header('X-Signature-Timestamp');
      if (!signature || !timestamp) return res.sendStatus(401);
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const isVerified = nacl.sign.detached.verify(
          Buffer.from(timestamp + body),
          Buffer.from(signature, 'hex'),
          Buffer.from(this.publicKey, 'hex')
        );
        console.log(isVerified, new Date().toISOString());
        if (!isVerified) return res.status(401).send('invalid request signature');

        let data = JSON.parse(body);
        switch(data.type) {
          case 1: return res.send({type: 1});
          case 2: return this.emit('interaction', new CommandInteraction(this, res, data));
          case 3: return this.emit('interaction', new MessageComponentInteraction(this, res, data));
        }
      });
    }
  }

  get api() {
    const noop = () => {};
    const methods = ['get', 'post', 'delete', 'patch', 'put'];
    const reflectors = [
      'toString',
      'valueOf',
      'inspect',
      'constructor',
      Symbol.toPrimitive,
      Symbol.for('nodejs.util.inspect.custom'),
    ]
    const route = [''];
    const handler = {
      get(target, prop) {
        if (reflectors.includes(prop)) return () => route.join('/');
        if (methods.includes(prop)) return opts => request(prop, route.join('/'), opts);
        route.push(prop);
        return new Proxy(noop, handler);
      },
      apply(target, _, args) {
        route.push(...args.filter(x => x != null));
        return new Proxy(noop, handler);
      }
    }
    return new Proxy(noop, handler);
  }
  
  async requestToken() {
    let response = await this.api.oauth2.token.post({
      version: null,
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'applications.commands.update'
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'authorization': 'Basic ' + process.env.oauth2_token // btoa([client_id, client_secret].join(':'))
      }
    });
    return this.accessToken = response.access_token;
  }

  commands = new CommandManager(this);

  createComponentCollector(options) {
    return new ComponentCollector(this, options);
  }
}

module.exports = Client;