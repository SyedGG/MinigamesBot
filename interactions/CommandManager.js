const Collection = require('@discordjs/collection');

async function getHeaders(manager) {
  return {authorization: 'Bearer ' + manager.client.accessToken || await manager.client.requestToken()}
}

// Allows differentiating between a guild command request and a global command request
function getLocation(manager, guildID) {
  let path = manager.client.api.applications(manager.client.applicationID);
  return guildID == null ? path : path.guilds(guildID);
}

function required() {
  throw new Error('Insufficient arguments supplied');
}

class CommandManager {
  constructor(client) {
    this.client = client;
    this.cache = new Collection();
  }

  async fetchAll(guildID) {
    let cmds = await getLocation(this, guildID).commands.get({headers: await getHeaders(this)});
    cmds.forEach(cmd => this.cache.set(cmd.id, cmd));
    return cmds;
  }

  async create(guildID, data = required()) {
    let cmd = await getLocation(this, guildID).commands.post({
      data,
      headers: await getHeaders(this)
    });
    this.cache.set(cmd.id, cmd);
    return cmd;
  }

  async fetch(guildID, commandID = required()) {
    let cmd = await getLocation(this, guildID).commands(commandID).get({headers: await getHeaders(this)});
    this.cache.set(cmd.id, cmd);
    return cmd;
  }

  async edit(guildID, commandID = required(), data = required()) {
    let cmd = await getLocation(this, guildID).commands(commandID).patch({
      data,
      headers: await getHeaders(this)
    });
    this.cache.set(cmd.id, cmd);
    return cmd;
  }

  async delete(guildID, commandID = required()) {
    let cmd = await getLocation(this, guildID).commands(commandID).delete({headers: await getHeaders(this)});
    this.cache.delete(commandID);
  }

  async bulkOverwrite(guildID, data = required()) {
    let cmds = await getLocation(this, guildID).commands.put({
      data,
      headers: await getHeaders(this)
    })
  }

  async updatePermissions(guildID = required(), commandID = required(), permissions = required()) {
    return getLocation(this, guildID).commands(commandID).permissions.put({
      data: {permissions},
      headers: await getHeaders(this)
    });
  }
}

module.exports = CommandManager;