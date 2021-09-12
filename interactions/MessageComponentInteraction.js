const InteractionResponses = require('./InteractionResponses');

class MessageComponentInteraction {
  constructor(client, res, data) {
    Object.assign(this, {client, res}, data, data.data);
    this.user = this.member.user;
  }
}

InteractionResponses.applyToClass(MessageComponentInteraction);

module.exports = MessageComponentInteraction;