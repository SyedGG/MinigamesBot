const EventEmitter = require('events');

module.exports = class ComponentCollector extends EventEmitter {
  constructor(client, options = {}) {
    // options accepts time (number), idle (number), users (Array<snowflake>), unauthorized (string), and filter (function)
    super();

    this.total = 0;
    let createTimeout = type => options[type] && setTimeout(() => this.emit('end', type), options[type]);
    let timeCheck = createTimeout('time');
    let idleCheck = createTimeout('idle');

    const listener = cmd => {
      if (cmd.type !== 3
        || options.filter && !options.filter(cmd)
        || options.interaction && cmd.message.interaction.id !== options.interaction.id
      ) return;
      if (this.users && !this.users.includes(cmd.user.id)) return cmd.reply({
        content: options.unauthorized || `This ${[,,'button','select menu'][cmd.component_type]} isn't for you.`,
        ephemeral: true
      });
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