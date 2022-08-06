require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')

if (process.env.REPORT_GAS) {
  require('hardhat-gas-reporter')
}

module.exports = {
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    showTimeSpent: true,
  },
  plugins: ['solidity-coverage'],
}
