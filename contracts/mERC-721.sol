// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract mERC721 is ERC721, AccessControl  {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdCounter;

    string public m_uri;

    constructor(string memory _name, string memory _symbol, string memory _uri) ERC721(_name, _symbol) {
        m_uri = _uri;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setMinter (address _minter) public {
        _setupRole(MINTER_ROLE, _minter);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return 
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IAccessControl).interfaceId ||            
            super.supportsInterface(interfaceId);
    }

    function safeMint(address to) public returns (uint256) { 
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        return string(abi.encodePacked(baseTokenURI(), Strings.toString(_tokenId)));
    }

    function baseTokenURI() public view returns (string memory) {
        return m_uri;
    } 

}