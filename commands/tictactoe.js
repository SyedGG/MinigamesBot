module.exports = {
  name: 'tictactoe',
  description: 'Play Tic-tac-toe against someone else!',
  options: [{
    type: 6,
    name: 'opponent',
    description: 'The user to play against; they will be O',
    required: true
  }],

  async run(cmd) {
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

    let collector = cmd.client.createComponentCollector({
      users: users.map(u => u.id),
      interaction: cmd,
      idle: 6e4
    });
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
}