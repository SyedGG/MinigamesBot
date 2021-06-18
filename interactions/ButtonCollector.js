const EventEmitter = require('events');

class ButtonCollector extends EventEmitter {
  constructor(client, filter, options = {}) {
    super();

    this.total = 0;
    let createTimeout = type => options[type] && setTimeout(() => this.emit('end', type), options[type]);
    let timeCheck = createTimeout('time');
    let idleCheck = createTimeout('idle');

    const listener = cmd => {
      if (cmd.type !== 3 || !filter(cmd)) return;
      this.total++;
      if (options.idle) {
        clearTimeout(idleCheck);
        idleCheck = createTimeout('idle');
      }
      this.emit('collect', cmd);
      if (options.max === this.total) this.emit('end', 'limit');
    }

    client.on('interaction', listener);
    this.once('end', () => {
      client.off('interaction', listener);
      [timeCheck, idleCheck].forEach(clearTimeout);
    });
  }

  stop(reason) {
    this.emit('end', reason);
  }
}

module.exports = ButtonCollector;