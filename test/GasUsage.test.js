const { ethers } = require('hardhat')

const RECEIVER_MAGIC_VALUE = '0x150b7a02'

describe('TinyERC721 Gas Usage', function () {
  beforeEach(async function () {
    const TinyERC721 = await ethers.getContractFactory('TinyERC721GasReporterMock')
    this.token = await TinyERC721.deploy('Tiny ERC721', 'TINY')

    const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
    this.receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE)

    const accounts = await ethers.getSigners()
    this.alice = accounts[0]
    this.bob = accounts[1]
  })

  describe('Minting', function () {
    const mintCounts = [1, 2, 3, 4, 5]

    for (const mintCount of mintCounts) {
      it(`mint ${mintCount} tokens`, async function () {
        await this.token[`mint${mintCount}(address)`](this.alice.address)
      })

      it(`safe mint ${mintCount} tokens to ERC721Receiver`, async function () {
        await this.token[`safeMint${mintCount}(address)`](this.receiver.address)
      })
    }
  })

  describe('Transfers', function () {
    beforeEach(async function () {
      await this.token.mint5(this.alice.address)
    })

    it(`transfer`, async function () {
      const tokenIds = [2, 4, 1, 3, 5]
      for (const tokenId of tokenIds) {
        await this.token.transferFrom(this.alice.address, this.bob.address, tokenId)
      }
    })
  })
})
