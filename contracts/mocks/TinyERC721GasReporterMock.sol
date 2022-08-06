// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../TinyERC721.sol';

contract TinyERC721GasReporterMock is TinyERC721 {
  constructor(string memory name, string memory symbol) TinyERC721(name, symbol, 0) {
    _mint(msg.sender, 1);
  }

  function mint1(address to) public {
    _mint(to, 1);
  }

  function mint2(address to) public {
    _mint(to, 2);
  }

  function mint3(address to) public {
    _mint(to, 3);
  }

  function mint4(address to) public {
    _mint(to, 4);
  }

  function mint5(address to) public {
    _mint(to, 5);
  }

  function safeMint1(address to) public {
    _safeMint(to, 1);
  }

  function safeMint2(address to) public {
    _safeMint(to, 2);
  }

  function safeMint3(address to) public {
    _safeMint(to, 3);
  }

  function safeMint4(address to) public {
    _safeMint(to, 4);
  }

  function safeMint5(address to) public {
    _safeMint(to, 5);
  }
}
