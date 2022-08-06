const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants')
const { ERC165 } = require('@openzeppelin/test-helpers/src/makeInterfaceId')
const { expect } = require('chai')
const { ethers } = require('hardhat')

const INTERFACES = {
  ERC165: ['supportsInterface(bytes4)'],
  ERC721: [
    'balanceOf(address)',
    'ownerOf(uint256)',
    'approve(address,uint256)',
    'getApproved(uint256)',
    'setApprovalForAll(address,bool)',
    'isApprovedForAll(address,address)',
    'transferFrom(address,address,uint256)',
    'safeTransferFrom(address,address,uint256)',
    'safeTransferFrom(address,address,uint256,bytes)',
  ],
  ERC721Metadata: ['name()', 'symbol()', 'tokenURI(uint256)'],
}

const RECEIVER_MAGIC_VALUE = '0x150b7a02'
const GAS_MAGIC_VALUE = 20000

describe('TinyERC721', function () {
  const name = 'Tiny ERC721'
  const symbol = 'TINY'

  beforeEach(async function () {
    const TinyERC721 = await ethers.getContractFactory('TinyERC721Mock')

    this.token = await TinyERC721.deploy(name, symbol)

    const accounts = await ethers.getSigners()
    this.alice = accounts[0]
    this.bob = accounts[1]
    this.charlie = accounts[2]
  })

  describe('supportsInterface', function () {
    for (const interface in INTERFACES) {
      const interfaceId = ERC165(INTERFACES[interface])
      describe(interface, function () {
        it('supportsInterface uses less than 30k gas', async function () {
          expect(await this.token.estimateGas.supportsInterface(interfaceId)).to.be.lte(30000)
        })

        it('supports interface', async function () {
          expect(await this.token.supportsInterface(interfaceId)).to.be.true
        })
      })
    }
  })

  describe('totalSupply', function () {
    context('with no minted tokens', function () {
      it('returns 0', async function () {
        expect(await this.token.totalSupply()).to.equal(0)
      })
    })

    context('with some minted tokens', function () {
      beforeEach(async function () {
        await this.token.mint(this.alice.address, 2)
        await this.token.mint(this.bob.address, 1)
      })

      it('returns the number of minted tokens', async function () {
        expect(await this.token.totalSupply()).to.equal(3)
      })
    })
  })

  describe('ERC721', function () {
    const mintCount = 10
    beforeEach(async function () {
      await this.token.mint(this.alice.address, mintCount)
    })

    describe('balanceOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        expect(await this.token.balanceOf(this.alice.address)).to.equal(mintCount)
      })

      it('returns 0 when the given address does not own any tokens', async function () {
        expect(await this.token.balanceOf(this.bob.address)).to.equal(0)
      })

      it('reverts when queried for zero address', async function () {
        await expect(this.token.balanceOf(ZERO_ADDRESS)).to.be.reverted
      })
    })

    describe('ownerOf', function () {
      it('returns the owner of the given token ID', async function () {
        expect(await this.token.ownerOf(0)).to.equal(this.alice.address)
      })

      it('reverts when queried for non existent token ID', async function () {
        await expect(this.token.ownerOf(42)).to.be.reverted
      })
    })

    describe('Transfers', function () {
      const tokenId = 7
      beforeEach(async function () {
        this.signer = this.alice
      })

      const testTransfer = function (transferFunction, ...extraArgs) {
        const testSuccessfulTransfer = function () {
          beforeEach(async function () {
            this.transfer = await this.token
              .connect(this.signer)
              [transferFunction](this.alice.address, this.receiver.address, tokenId, ...extraArgs)
          })

          it('transfers the ownership of the given token Id to the receiver', async function () {
            expect(await this.token.ownerOf(tokenId)).to.equal(this.receiver.address)
          })

          it('emits a Transfer event', async function () {
            expect(this.transfer)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.alice.address, this.receiver.address, tokenId)
          })

          it('clears the approval for the token ID', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(ZERO_ADDRESS)
          })

          it('emits an Approval event', async function () {
            expect(this.transfer).to.emit(this.token, 'Approval').withArgs(this.alice.address, ZERO_ADDRESS, tokenId)
          })

          it('decrements senders balance', async function () {
            expect(await this.token.balanceOf(this.alice.address)).to.equal(mintCount - 1)
          })

          it('increments receivers balance', async function () {
            expect(await this.token.balanceOf(this.receiver.address)).to.equal(1)
          })

          it('does not change the owner of the previous token', async function () {
            expect(await this.token.ownerOf(tokenId - 1)).to.equal(this.alice.address)
          })

          it('does not change the owner of the next token', async function () {
            expect(await this.token.ownerOf(tokenId + 1)).to.equal(this.alice.address)
          })
        }

        context('when called by the owner', function () {
          testSuccessfulTransfer()
        })

        context('when called by approved user', function () {
          beforeEach(async function () {
            await this.token.approve(this.bob.address, tokenId)
            this.signer = this.bob
          })
          testSuccessfulTransfer()
        })

        context('when called by the operator', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(this.charlie.address, true)
            this.signer = this.charlie
          })
          testSuccessfulTransfer()
        })

        context('when sent to the owner', function () {
          beforeEach(async function () {
            this.transfer = await this.token
              .connect(this.signer)
              [transferFunction](this.alice.address, this.alice.address, tokenId, ...extraArgs)
          })

          it('keeps ownership of the token', async function () {
            expect(await this.token.ownerOf(tokenId)).to.equal(this.alice.address)
          })

          it('emits a Transfer event', async function () {
            expect(this.transfer)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.alice.address, this.alice.address, tokenId)
          })

          it('clears the approval for the token ID', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(ZERO_ADDRESS)
          })

          it('emits an Approval event', async function () {
            expect(this.transfer).to.emit(this.token, 'Approval').withArgs(this.alice.address, ZERO_ADDRESS, tokenId)
          })

          it('keeps the owner balance', async function () {
            expect(await this.token.balanceOf(this.alice.address)).to.equal(mintCount)
          })
        })

        it('reverts transfer when owner is incorrect', async function () {
          await expect(this.token[transferFunction](this.charlie.address, this.receiver.address, tokenId, ...extraArgs))
            .to.be.reverted
        })

        it('reverts transfer when caller is not authorized', async function () {
          await expect(
            this.token
              .connect(this.bob)
              [transferFunction](this.alice.address, this.receiver.address, tokenId, ...extraArgs)
          ).to.be.reverted
        })

        it('reverts transfer when token id does not exist', async function () {
          await expect(this.token[transferFunction](this.alice.address, this.receiver.address, 42, ...extraArgs)).to.be
            .reverted
        })

        it('reverts transfer to zero address', async function () {
          await expect(this.token[transferFunction](this.alice.address, ZERO_ADDRESS, tokenId, ...extraArgs)).to.be
            .reverted
        })
      }

      const testSafeTransfer = function (transferFunction, ...extraArgs) {
        context('when sending to a user account', async function () {
          beforeEach(function () {
            this.receiver = this.bob
          })

          testTransfer(transferFunction, ...extraArgs)
        })

        context('when sending to a valid receiver contract', function () {
          beforeEach(async function () {
            const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
            this.receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE)
          })

          testTransfer(transferFunction, ...extraArgs)

          const testReceiver = function () {
            const data = extraArgs[0] || '0x'

            beforeEach(async function () {
              this.transfer = await this.token
                .connect(this.signer)
                [transferFunction](this.alice.address, this.receiver.address, tokenId, ...extraArgs)
            })

            it('calls onERC721Received', async function () {
              expect(this.transfer)
                .to.emit(this.receiver, 'Received')
                .withArgs(this.signer.address, this.alice.address, tokenId, data, GAS_MAGIC_VALUE)
            })
          }

          context('when called by the owner', function () {
            testReceiver()
          })

          context('when called by the operator', function () {
            beforeEach(async function () {
              await this.token.setApprovalForAll(this.charlie.address, true)
              this.signer = this.charlie
            })
            testReceiver()
          })
        })

        context('when sending to a receiver contract that returns an unexpected value', function () {
          beforeEach(async function () {
            const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
            this.receiver = await ERC721Receiver.deploy('0x00000042')
          })

          it('reverts', async function () {
            await expect(
              this.token
                .connect(this.signer)
                [transferFunction](this.alice.address, this.receiver.address, tokenId, ...extraArgs)
            ).to.be.reverted
          })
        })

        context('when sending to a contract that does not implement the required function', function () {
          beforeEach(async function () {
            this.receiver = this.token
          })

          it('reverts', async function () {
            await expect(
              this.token
                .connect(this.signer)
                [transferFunction](this.alice.address, this.receiver.address, tokenId, ...extraArgs)
            ).to.be.reverted
          })
        })
      }

      describe('transferFrom', async function () {
        const transferFunction = 'transferFrom(address,address,uint256)'

        context('when sending to a user account', async function () {
          beforeEach(function () {
            this.receiver = this.bob
          })

          testTransfer(transferFunction)
        })

        context('when sending to a valid receiver contract', function () {
          beforeEach(async function () {
            const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
            this.receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE)
          })

          testTransfer(transferFunction)

          it('does not call onERC721Received', async function () {
            expect(await this.token[transferFunction](this.alice.address, this.receiver.address, 7)).to.not.emit(
              this.receiver,
              'Received'
            )
          })
        })
      })

      describe('safeTransferFrom', function () {
        context('without data', function () {
          testSafeTransfer('safeTransferFrom(address,address,uint256)')
        })

        context('with data', function () {
          testSafeTransfer('safeTransferFrom(address,address,uint256,bytes)', '0x42')
        })
      })
    })

    describe('Minting', function () {
      const testMint = function (mintFunction, ...extraArgs) {
        const testSuccessfulMint = function (mintCount) {
          beforeEach(async function () {
            this.previousMintCount = await this.token.totalSupply().then(parseInt)
            this.mint = await this.token[mintFunction](this.receiver.address, mintCount, ...extraArgs)
          })

          it('mints the tokens', async function () {
            expect(await this.token.balanceOf(this.receiver.address)).to.equal(mintCount)

            for (let i = 0; i < mintCount; i++) {
              const tokenId = this.previousMintCount + i
              expect(await this.token.ownerOf(tokenId)).to.equal(this.receiver.address)
            }
          })

          it('emits a transfer event for each minted token', async function () {
            for (let i = 0; i < mintCount; i++) {
              const tokenId = this.previousMintCount + i
              expect(this.mint).to.emit(this.token, 'Transfer').withArgs(ZERO_ADDRESS, this.receiver.address, tokenId)
            }
          })
        }

        context('when minting a single token', function () {
          testSuccessfulMint(1)
        })

        context('when minting multiple tokens', function () {
          testSuccessfulMint(5)
        })

        it('reverts mint to zero address', async function () {
          await expect(this.token[mintFunction](ZERO_ADDRESS, 1)).to.be.reverted
        })

        it('reverts when quantity is 0', async function () {
          await expect(this.token[mintFunction](this.receiver.address, 0)).to.be.reverted
        })
      }

      describe('mint', function () {
        const mintFunction = 'mint(address,uint256)'

        context('when sending to a user account', function () {
          beforeEach(function () {
            this.receiver = this.bob
          })

          testMint(mintFunction)
        })

        context('when sending to a valid receiver contract', function () {
          beforeEach(async function () {
            const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
            this.receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE)
          })

          testMint(mintFunction)

          it('does not call onERC721Received', async function () {
            expect(await this.token[mintFunction](this.receiver.address, 1)).to.not.emit(this.receiver, 'Received')
          })
        })
      })

      describe('safeMint', function () {
        const testSafeMint = function (mintFunction, ...extraArgs) {
          context('when sending to a user account', function () {
            beforeEach(function () {
              this.receiver = this.bob
            })

            testMint(mintFunction, ...extraArgs)
          })

          context('when sending to a valid receiver contract', function () {
            beforeEach(async function () {
              const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
              this.receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE)
            })

            testMint(mintFunction, ...extraArgs)

            const testReceiver = function (mintCount) {
              const data = extraArgs[0] || '0x'

              beforeEach(async function () {
                this.previousMintCount = await this.token.totalSupply().then(parseInt)
                this.mint = await this.token[mintFunction](this.receiver.address, mintCount, ...extraArgs)
              })

              it('calls onERC721Received', async function () {
                for (let i = 0; i < mintCount; i++) {
                  const tokenId = this.previousMintCount + i
                  expect(this.mint)
                    .to.emit(this.receiver, 'Received')
                    .withArgs(this.alice.address, ZERO_ADDRESS, tokenId, data, GAS_MAGIC_VALUE)
                }
              })
            }

            context('when minting a single token', function () {
              testReceiver(1)
            })

            context('when minting multiple tokens', function () {
              testReceiver(5)
            })
          })

          context('when sending to a receiver contract that returns an unexpected value', function () {
            beforeEach(async function () {
              const ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock')
              this.receiver = await ERC721Receiver.deploy('0x00000042')
            })

            it('reverts', async function () {
              await expect(this.token[mintFunction](this.receiver.address, 1, ...extraArgs)).to.be.reverted
            })
          })

          context('when sending to a contract that does not implement the required function', function () {
            beforeEach(async function () {
              this.receiver = this.token
            })

            it('reverts', async function () {
              await expect(this.token[mintFunction](this.receiver.address, 1, ...extraArgs)).to.be.reverted
            })
          })
        }

        context('without data', function () {
          testSafeMint('safeMint(address,uint256)')
        })

        context('with data', function () {
          testSafeMint('safeMint(address,uint256,bytes)', '0x42')
        })
      })
    })

    describe('approve', function () {
      context('successful approval', function () {
        beforeEach(async function () {
          this.approval = await this.token.approve(this.bob.address, 0)
        })

        it('sets approval for the target address', async function () {
          expect(await this.token.getApproved(0)).to.equal(this.bob.address)
        })

        it('emits an approval event', async function () {
          expect(this.approval).to.emit(this.token, 'Approval')
        })
      })

      it('reverts when token id does not exist', async function () {
        await expect(this.token.approve(this.bob.address, 42)).to.be.reverted
      })

      it('reverts when caller is not authorized', async function () {
        await expect(this.token.connect(this.charlie).approve(this.bob.address, 0)).to.be.reverted
      })
    })

    describe('setApprovalForAll', function () {
      context('successful approval', function () {
        beforeEach(async function () {
          this.operatorApproval = await this.token.setApprovalForAll(this.charlie.address, true)
        })

        it('approves the operator', async function () {
          expect(await this.token.isApprovedForAll(this.alice.address, this.charlie.address)).to.be.true
        })

        it('emits an approval event', async function () {
          expect(this.operatorApproval).to.emit(this.token, 'ApprovalForAll')
        })
      })

      it('reverts when called by the operator', async function () {
        await expect(this.token.setApprovalForAll(this.alice.address, true)).to.be.reverted
      })
    })
  })

  describe('ERC721Metadata', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.equal(name)
    })

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.equal(symbol)
    })

    describe('token URI', function () {
      beforeEach(async function () {
        await this.token.mint(this.alice.address, 1)
      })

      it('returns empty string by default', async function () {
        expect(await this.token.tokenURI(0)).to.equal('')
      })

      it('reverts when queried for non existent token ID', async function () {
        await expect(this.token.tokenURI(42)).to.be.reverted
      })
    })
  })
})
