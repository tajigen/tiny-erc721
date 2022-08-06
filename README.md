## Overview

TinyERC721 is an ERC721-compliant smart contract with a focus on gas-optimization.

| mint # | gas usage |
| ------ | --------- |
| 1      | 51,297    |
| 2      | 53,296    |
| 3      | 55,319    |
| 4      | 57,361    |
| 5      | 59,362    |

For more information, please read our [blog](https://mirror.xyz/tajigen.eth/fraoPkDEYf1U5yOmke3SdFny5EnA6fZwiupaWMX3Yeg).

### Installation

```console
$ npm install --save-dev tiny-erc721
```

### Usage

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.0;

import 'tiny-erc721/contracts/TinyERC721.sol';

contract Tajigen is TinyERC721 {
  // third constructor argument is maximum batch size, 0 for no limit
  constructor() TinyERC721('Citizens of Tajigen', 'TAJIGEN', 0) {}

  // second argument for _mint is quantity instead of token id
  function mint(uint256 quantity) external payable {
    _mint(msg.sender, quantity);
  }
}

```

## Contribute

We really appreciate and value contributions to TinyERC721. If you have a suggestion that would make this better, please fork the repo and create a pull request.

### Local development

```console
$ npm run test
$ npm run test:gas
```

## License

TinyERC721 is released under the [MIT License](LICENSE).

## Contact

wkm - [@wakemi18](https://twitter.com/wakemi18)

Project Link: [https://github.com/tajigen/tiny-erc721](https://github.com/tajigen/tiny-erc721)
