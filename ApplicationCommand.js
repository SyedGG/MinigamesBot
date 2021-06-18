const {inspect} = require('util');
let $_;

const commands = {
  async eval(cmd) {
    // Flags: a (async), e (ephemeral), and n (do not return, should be used when code includes cmd.reply)
    // All variables are prefixed with $ to avoid collision with eval.
    let $result;
    let $code = cmd.options.get('code').value;
    let $flags = cmd.options.has('flags') ? cmd.options.get('flags').value : '';
    let $options = null;
    if (cmd.options.has('options')) {
      try {
        $options = JSON.parse(cmd.options.get('options').value);
      } catch(er) {
        cmd.reply({ content: 'Failed to parse options JSON', ephemeral: true });
      }
    }
    try {
      $result = $flags.includes('a')
        ? await eval(`(async function() {\n${$code}\n})()`).catch(er => $result = er)
        : eval($code);
    } catch(er) {$result = er}
    if (!$flags.includes('n') && !cmd.replied && !cmd.deferred) cmd.reply({
      content: inspect($result, $options).replace(/(.{1996}).{5,}/s, '$1\n...'),
      ephemeral: $flags.includes('e')
    });
    $_ = $result;
  },

  invite(cmd) {
    cmd.reply('[Invite me to your server!](https://discord.com/api/oauth2/authorize?client_id=851602059072634880&scope=applications.commands)');
  },

  async tictactoe(cmd) {
    const users = [cmd.user, cmd.resolved.users[cmd.options.get('opponent').value]];
    if (users[1].bot) return cmd.reply({content: 'You cannot play against bots, lmfao.', ephemeral: true});
    const isSelf = users[0].id === users[1].id;
    const baseContent = `**__Tic-Tac-Toe__:** ${isSelf ? users[0].username+' vs. theirself' : users.map(u=>u.username).join(' vs. ')}\n`;
    const board = Array(3).fill().map(()=>Array(3).fill(''));
    const combos = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let currentUser = 0;
    function generateBoard(winner, outOfTime) {
      let content = baseContent + (winner === undefined ? `It's currently **${isSelf?'XO'[currentUser]:users[currentUser].username}**'s turn!`
        : winner === null ? `It's a tie!`
        : outOfTime ? (isSelf?'The game has stopped due to inactivity.':`${users[currentUser].username} didn't respond on time, what a fool. ${winner} wins`)
        : `${winner} won the game! 🎉`);
      let components = board.map((row, rIdx) => row.map((column, cIdx) => ({
        custom_id: rIdx + '' + cIdx,
        style: {'X': 4, 'O': 3, '': 1}[column],
        emoji: {id: {'X': '851201769359147038', 'O': '851201769308291113', '': '427371936482328596'}[column]},
        disabled: winner === null || !!winner || !!column
      })));
      return {content, components};
    }
    await cmd.reply(generateBoard());
    let m = await cmd.fetchReply();
    let collector = cmd.client.createButtonCollector(
      int => users.some(u => int.user.id === u.id) && int.message.id === m.id,
      {idle: 6e4}
    );
    collector.on('collect', int => {
      let winner;
      if (int.user.id !== users[currentUser].id) return int.deferUpdate();
      board[int.custom_id[0]][int.custom_id[1]] = 'XO'[currentUser];
      let inputs = board.flat();
      if (combos.some(c=>c.every((e,i)=>inputs[e]&&inputs[e]===inputs[c[0]])))
        collector.stop(winner = isSelf?'XO'[currentUser]:users[currentUser].username);
      else if (!inputs.includes('')) collector.stop(winner = null);
      else currentUser = 1 - currentUser;
      int.update(generateBoard(winner));
    });
    collector.on('end', reason => reason === 'idle' && cmd.editReply(generateBoard(users[1-currentUser].username, true)));
  }
};

module.exports = function(cmd) {
  let command = commands[cmd.data.name];
  command ? command(cmd) : cmd.reply('This command currently does not have a handler.');
};

/**
 * planned:
 * - have a custom class for sending messages via http response
 *   and if I provide an object that can be resolved to that class,
 *   send that instead of inspecting the object for a string
 * - /reload command with options ApplicationCommand and MessageComponent
 * - /invite command when making this app public
 * - possibly getting a library to simplify everything here so I can focus on production
 * - /say command that returns an ephemeral message and creates a public followUp message, copying the user's pfp and displayName
 */