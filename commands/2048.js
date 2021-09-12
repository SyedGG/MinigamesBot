const emojis = {
  up: "884943501203222558",
  right: "884943916409974824",
  down: "884943871660924949",
  left: "884943826924478525"
}

const numbers = {
  "0": "386322131291602945",
  "2": "386318495324831746",
  "4": "386318504111898634",
  "8": "386318513591287808",
  "16": "386320075331993601",
  "32": "386320086270476288",
  "64": "386320101202460676",
  "128": "386320109272301569",
  "256": "386320491813797911",
  "512": "386320504014897163",
  "1024": "386320932198940674",
  "2048": "386320939715002379"
}

const blank = Array(5).fill().map((b, i) => ({
  custom_id: '~'+i,
  style: 2,
  emoji: { id: '427371936482328596' },
  disabled: true
}));


module.exports = {
  name: '2048',
  description: 'Join the numbers and try to get the 2048 tile!',
  options: [],
  
  async run(cmd) {
    const game = new Game;
    const directions = ['up', 'right', 'down', 'left'];
    const dirButtons = {};
    directions.forEach(dir => dirButtons[dir] = {custom_id: dir, style: 1, emoji: {id: emojis[dir]}});

    const embeds = [{color: 0x3498DB, footer: {}}];
    const getButtons = () => [
      [blank[0], dirButtons.up, blank[1]],
      [dirButtons.left, blank[2], dirButtons.right],
      [blank[3], dirButtons.down, blank[4]],
    ];
    const updateUI = () => {
      const moveList = game.won ? [] : game.possibleMoves;
      directions.forEach(dir => dirButtons[dir].disabled = !moveList.includes(dir));
      if (moveList.length) embeds[0].footer.text = `Score: ${game.points}`;
      else {
        if (game.won) {
          embeds[0].color = 0x00FF00;
          embeds[0].footer.text = `You won the game! Score: ${game.points}`;
        } else {
          embeds[0].color = 0xED4245;
          embeds[0].footer.text = `You lost the game! Final score: ${game.points}`;
        }
        return true;
      }
    }
    updateUI();

    const m = await cmd.reply({ content: game.toString(), embeds, components: getButtons() });
    const coll = cmd.client.createComponentCollector({users: [cmd.user.id], interaction: cmd, idle: 3e5});

    coll.on('collect', i => {
      game.move(i.custom_id);
      if (updateUI()) coll.stop();      
      i.update({ content: game.toString(), embeds, components: getButtons() });
    });

    coll.on('end', reason => {
      directions.forEach(dir => dirButtons[dir].disabled = true);
      if (reason !== 'idle') return;
      delete embeds[0].color;
      embeds[0].footer.text = `The game stopped due to 5 minutes of inactivity. Your final score is ${game.points}.`;
      if (reason === 'idle') cmd.editReply({
        embeds,
        components: getButtons()
      });
    });
  }
}


class Game {
  constructor() {
    this.grid = Array(4).fill().map(_ => Array(4).fill(0));
    this.points = 0;
    this.won = false;
    this.addRandomTile().addRandomTile();
  }

  toString() {
    return this.grid.map(row => row.map(col => `<:${col}:${numbers[col]}>`).join('')).join('\n');
  }

  addRandomTile() {
    const available = Array(16).fill().map((e, i) => i).filter(e => !this.grid[e/4|0][e%4]);
    const idx = available[Math.random()*available.length|0];
    this.grid[idx/4|0][idx%4] = Math.random() < 0.9 ? 2 : 4;
    return this;
  }

  move(direction) {
    switch (direction) {
      case 'up':
        for (let ci = 0; ci < 4; ci++) {
          const shifted = this.shiftTiles(this.grid.map(row => row[ci]));
          [0,1,2,3].forEach(i => this.grid[i][ci] = shifted[i]);
        }
        break;
      case 'right':
        for (let ri = 0; ri < 4; ri++)
          this.grid[ri] = this.shiftTiles(this.grid[ri].reverse()).reverse();
        break;
      case 'down':
        for (let ci = 0; ci < 4; ci++) {
          const shifted = this.shiftTiles(this.grid.map(row => row[ci]).reverse());
          [3,2,1,0].forEach(i => this.grid[i][ci] = shifted[3-i]);
        }
        break;
      case 'left':
        for (let ri = 0; ri < 4; ri++)
          this.grid[ri] = this.shiftTiles(this.grid[ri]);
    }
    return this.addRandomTile();
  }

  get possibleMoves() {
    const moves = [];
    const check = (grid, ul, dr) => {
      if (grid.some(row => row.some((col, ci) => col && row[ci + 1] === col)))
        moves.push(ul, dr);
      else {
        if (grid.some(row => row.some((col, ci) => !col && row[ci + 1]))) moves.push(ul);
        if (grid.some(row => row.some((col, ci) => !col && row[ci - 1]))) moves.push(dr); 
      }
    }
    check(this.grid, 'left', 'right');
    check([0,1,2,3].map(i => this.grid.map(row => row[i])), 'up', 'down');
    return moves;
  }

  shiftTiles(arr) {
    const i = [0];
    arr.forEach(n=>i[0]?i[0]===n?(this.points+=i[0]*=2,i.unshift(0)):n&&i.unshift(n):i[0]+=n);
    if (i.includes(2048)) this.won = true;
    return i.reverse().concat(Array(4-i.length).fill(0));
  }
}