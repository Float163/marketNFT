// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract mERC1155 is ERC1155, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory _uri) ERC1155(_uri) {}

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
    return
        interfaceId == type(IERC1155).interfaceId ||
        interfaceId == type(IERC1155MetadataURI).interfaceId ||
        super.supportsInterface(interfaceId);
    }
    
    function setURI(string memory newuri) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not a minter");
        _setURI(newuri);
    }

    function uri(uint256 _tokenId) override public view returns (string memory) {
        return string(abi.encodePacked(super.uri(_tokenId), Strings.toString(_tokenId)));
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return string(abi.encodePacked(super.uri(_tokenId), Strings.toString(_tokenId)));
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
    {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mintBatch(to, ids, amounts, data);
    }
}