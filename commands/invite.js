module.exports = {
  name: 'invite',
  description: 'Get a link to be able to add Minigames to your own server.',

  run: cmd => cmd.reply('[Invite me to your server!](<https://discord.com/api/oauth2/authorize?client_id=851602059072634880&scope=applications.commands>)')
}