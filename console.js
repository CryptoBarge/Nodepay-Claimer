//disables mouse
process.env.TERM = 'linux';

const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Nodepay-Claimer',
});

const { consecutiveClaim } = require('./bin/ConsecutiveClaim');
const { multiSendNC } = require('./bin/MultiSendNC');
const { closeAccountBatch } = require('./bin/CloseAccount');
const { claimTokenBatch } = require('./bin/ClaimToken');
const { TokenChecker } = require('./bin/TokenChecker');
const { logMessage, LogLevel } = require('./bin/Logger')

const logger = require("node-color-log");

const logBox = blessed.box({
  top: 'top',
  left: 'left',
  width: '100%',
  height: '55%',
  content: `
███╗░░██╗░█████╗░██████╗░███████╗██████╗░░█████╗░██╗░░░██╗░░░░░░░█████╗░██╗░░░░░░█████╗░██╗███╗░░░███╗███████╗██████╗░
████╗░██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗░██╔╝░░░░░░██╔══██╗██║░░░░░██╔══██╗██║████╗░████║██╔════╝██╔══██╗
██╔██╗██║██║░░██║██║░░██║█████╗░░██████╔╝███████║░╚████╔╝░█████╗██║░░╚═╝██║░░░░░███████║██║██╔████╔██║█████╗░░██████╔╝
██║╚████║██║░░██║██║░░██║██╔══╝░░██╔═══╝░██╔══██║░░╚██╔╝░░╚════╝██║░░██╗██║░░░░░██╔══██║██║██║╚██╔╝██║██╔══╝░░██╔══██╗
██║░╚███║╚█████╔╝██████╔╝███████╗██║░░░░░██║░░██║░░░██║░░░░░░░░░╚█████╔╝███████╗██║░░██║██║██║░╚═╝░██║███████╗██║░░██║
╚═╝░░╚══╝░╚════╝░╚═════╝░╚══════╝╚═╝░░░░░╚═╝░░╚═╝░░░╚═╝░░░░░░░░░░╚════╝░╚══════╝╚═╝░░╚═╝╚═╝╚═╝░░░░░╚═╝╚══════╝╚═╝░░╚═╝

Channel: {cyan-fg}https://t.me/BargeCrypto{/cyan-fg}
GitHub:  {cyan-fg}https://github.com/CryptoBarge{/cyan-fg}
Donate:  {cyan-fg}arBNpAWLXsWrQqBEAZQhKNbUXwsHFfq9KcwkHML5HaM{/cyan-fg}
`,
  tags: true,
  align: 'left',
  border: {
    type: 'bg',
  },
  style: {
    fg: 'white',
    border: {
      fg: 'blue',
    },
  },
});

const list = blessed.list({
  top: '45%',
  left: 'left',
  width: '45%',
  height: '30%',
  items: [
    '1. MultiSend $NC',
    '2. Consecutive-Claim',
    '3. Claim $NC',
    '4. ClaimYourSol',
    '5. TokenChecker',
    '   Exit',
  ],
  keys: true,
  vi: true,
  style: {
    fg: 'bright-magenta',
    selected: {
      bg: 'green',
      fg: 'silver',
    },
  },
  border: {
    type: 'bg',
    fg: 'blue',
  },
});

list.on('select', async (item, index) => {
  screen.destroy();
  console.clear();

  logMessage(LogLevel.INFO, `You selected: ${item.getText()}`);
  switch (index) {
    case 0:
      logMessage(LogLevel.INFO, 'Starting process...');
      await multiSendNC();
      break;
    case 1:
      logMessage(LogLevel.INFO, 'Starting claiming process...');
      await consecutiveClaim();
      break;
    case 2:
      logMessage(LogLevel.INFO, 'Starting process...');
      await claimTokenBatch();
      break;
    case 3:
      logMessage(LogLevel.INFO, 'Starting process...');
      await closeAccountBatch();
      break;
    case 4:
      logMessage(LogLevel.INFO, 'Starting process...');
      await TokenChecker.filterByWalletBalance();
      break;
    case 5:
      logMessage(LogLevel.INFO, 'Exiting...');
      process.exit(0);
    default:
      logMessage(LogLevel.INFO, 'Invalid selection!');
  }
});

screen.append(logBox);
screen.append(list);

list.focus();

screen.key(['escape', 'C-c'], () => process.exit(0));

screen.render();