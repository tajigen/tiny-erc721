// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

contract ERC721ReceiverMock is IERC721Receiver {
  bytes4 private immutable _retval;

  event Received(address operator, address from, uint256 tokenId, bytes data, uint256 gas);

  constructor(bytes4 retval) {
    _retval = retval;
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes memory data
  ) public override returns (bytes4) {
    emit Received(operator, from, tokenId, data, 20000);
    return _retval;
  }
}
