module.exports = function(cmd) {
  //cmd.reply({flags: 64, content: `You clicked on ${cmd.data.custom_id}!`});
  //let newcmd = Object.assign({}, cmd, {client: 'stuff', res: 'stuff'});
  //cmd.reply({flags: 64, content: require('util').inspect(newcmd, {depth: 0}).slice(0,2000)});
  setTimeout(() => cmd.replied || cmd.deferred || cmd.reply({
    content: 'This button was not handled on time.',
    ephemeral: true
  }), 2222);
};