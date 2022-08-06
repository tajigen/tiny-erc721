// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../TinyERC721.sol';

contract TinyERC721Mock is TinyERC721 {
  constructor(string memory name, string memory symbol) TinyERC721(name, symbol, 0) {}

  function baseURI() public view returns (string memory) {
    return _baseURI();
  }

  function exists(uint256 tokenId) public view returns (bool) {
    return _exists(tokenId);
  }

  function mint(address to, uint256 quantity) public {
    _mint(to, quantity);
  }

  function safeMint(address to, uint256 quantity) public {
    _safeMint(to, quantity);
  }

  function safeMint(
    address to,
    uint256 quantity,
    bytes memory _data
  ) public {
    _safeMint(to, quantity, _data);
  }
}
