// incomplete

'use strict';

const BaseMessageComponent = require('./BaseMessageComponent');
const MessageEmbed = require('./MessageEmbed');
const { RangeError } = require('../errors');
const { MessageComponentTypes } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const MessageFlags = require('../util/MessageFlags');
const Util = require('../util/Util');

// Represents a message to be sent to the API.
// Taken from discord.js/src/structures/APIMessage.js

class APIMessage {
  constructor(target, options) {
    this.target = target;
    this.options = options;
    this.data = null;
  }

  makeContent() {
    let content;
    if (this.options.content === null) {
      content = '';
    } else if (typeof this.options.content !== 'undefined') {
      content = Util.verifyString(this.options.content, RangeError, 'MESSAGE_CONTENT_TYPE', false); // ***
    }

    if (typeof content !== 'string') return content;

    const isCode = typeof this.options.code !== 'undefined' && this.options.code !== false;

    if (content && isCode) {
      const codeName = typeof this.options.code === 'string' ? this.options.code : '';
      content = `\`\`\`${codeName}\n${Util.cleanCodeBlockContent(content)}\n\`\`\``; // ***
    }

    return content;
  }

  resolveData() {
    if (this.data) return this;

    const content = this.makeContent();
    const tts = Boolean(this.options.tts);

    const components = this.options.components && this.options.components.map(c =>
      BaseMessageComponent.create(
        Array.isArray(c) ? { type: MessageComponentTypes.ACTION_ROW, components: c } : c, // ***
      ).toJSON(),
    );

    if (this.options.ephemeral) {
      flags = MessageFlags.FLAGS.EPHEMERAL;
    }

    let allowedMentions =
      typeof this.options.allowedMentions === 'undefined'
        ? this.target.client.options.allowedMentions
        : this.options.allowedMentions;

    if (allowedMentions) {
      allowedMentions = Util.cloneObject(allowedMentions);
      allowedMentions.replied_user = allowedMentions.repliedUser;
      delete allowedMentions.repliedUser;
    }

    let message_reference;
    if (typeof this.options.reply === 'object') {
      const message_id = this.isMessage
        ? this.target.channel.messages.resolveID(this.options.reply.messageReference)
        : this.target.messages.resolveID(this.options.reply.messageReference);
      if (message_id) {
        message_reference = {
          message_id,
          fail_if_not_exists: this.options.reply.failIfNotExists ?? true,
        };
      }
    }

    this.data = {
      content,
      embeds: this.options.embeds?.map(embed => new MessageEmbed(embed).toJSON()),
      components,
      allowed_mentions:
        typeof content === 'undefined' && typeof message_reference === 'undefined' ? undefined : allowedMentions,
      flags,
      message_reference,
    };
    return this;
  }

  static create(target, options, extra = {}) {
    return new this(
      target,
      typeof options !== 'object' || options === null ? { content: options, ...extra } : { ...options, ...extra },
    );
  }
}

module.exports = APIMessage;