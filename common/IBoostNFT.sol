// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IBoostNFT is IERC1155 {
   function getMultiplier(address account, uint256 timeFrom, uint256 timeTo ) external view returns (uint256);
   function getLastMultiplier(address account, uint256 timeTo) external view returns (uint256);
}