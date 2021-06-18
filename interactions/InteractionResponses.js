'use strict';

// Interface for classes that support shared interaction response types.
// Taken from discord.js/src/structures/interfaces/InteractionResponses.js

function resolveData(options = 'undefined') {
  let data;
  if (typeof options === 'string') data = {content: options};
  else {
    data = options;
    if (data.ephemeral) data.flags = 64;
    if (Array.isArray(data.components) && data.components.every(Array.isArray)) {
      data.components = data.components.map(row => ({
        type: 1,
        components: row.map(column => Object.assign(column, {type: 2}))
      }));
    }
  }
  return data;
}

class InteractionResponses {
  async defer({ ephemeral } = {}) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    this.res.send({
      type: 5,
      data: {
        flags: ephemeral ? 64 : undefined,
      }
    });
    this.deferred = true;
  }

  async reply(options) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');

    this.res.send({
      type: 4,
      data: resolveData(options),
    });
    this.replied = true;
  }

  get webhook() {
    return this.client.api.webhooks(this.client.applicationID, this.token);
  }

  fetchReply() {
    return this.webhook.messages('@original').get();
  }

  editReply(options) {
    return this.webhook.messages('@original').patch({data: resolveData(options)});
  }

  async deleteReply() {
    await this.webhook.messages('@original').delete();
  }

  followUp(options) {
    return this.webhook.post({data: resolveData(options)});
  }

  async deferUpdate() {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');
    this.res.send({type: 6});
    this.deferred = true;
  }

  async update(options) {
    if (this.deferred || this.replied) throw new Error('INTERACTION_ALREADY_REPLIED');

    this.res.send({
      type: 7,
      data: resolveData(options)
    });
    this.replied = true;
  }

  static applyToClass(structure, ignore = []) {
    const props = ['defer', 'reply', 'webhook', 'fetchReply', 'editReply', 'deleteReply', 'followUp', 'deferUpdate', 'update'];
    for (const prop of props) {
      if (ignore.includes(prop)) continue;
      Object.defineProperty(
        structure.prototype,
        prop,
        Object.getOwnPropertyDescriptor(InteractionResponses.prototype, prop)
      );
    }
  }
}

module.exports = InteractionResponses;