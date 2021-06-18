const InteractionResponses = require('./InteractionResponses');

class MessageComponentInteraction {
  constructor(client, res, data) {
    Object.assign(this, {client, res});
    Object.assign(this, data);
    this.user = this.member.user;
    this.custom_id = this.data.custom_id;
  }
}

InteractionResponses.applyToClass(MessageComponentInteraction);

module.exports = MessageComponentInteraction;