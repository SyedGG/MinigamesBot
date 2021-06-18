const InteractionResponses = require('./InteractionResponses')
const Collection = require('@discordjs/collection');

class CommandInteraction {
  constructor(client, res, data) {
    Object.assign(this, {client, res});
    Object.assign(this, data);
    this.user = this.member.user;
    this.commandID = this.data.id;
    this.commandName = this.data.name;
    this.options = new Collection();
    if (this.data.options) this.data.options.forEach(op => this.options.set(op.name, op));
    this.resolved = this.data.resolved;
  }
}
InteractionResponses.applyToClass(CommandInteraction, ['deferUpdate', 'update']);

module.exports = CommandInteraction;