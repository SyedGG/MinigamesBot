const { inspect } = require('util');

module.exports = {
  name: 'eval',
  description: 'Evaluate code (bot owner only)',
  options: [
    {
      type: 3,
      name: 'code',
      description: 'Code to evaluate',
      required: true
    },
    {
      type: 3,
      name: 'flags',
      description: 'Extra flags for evaluation: a (async), e (ephemeral), n (no return)'
    },
    {
      type: 3,
      name: 'options',
      description: 'A JSON object to pass on to inspect. This will be defined as $options.'
    }
  ],

  async run(cmd) {
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
    global.$_ = $result;
  }
}