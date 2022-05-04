// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../contracts/mERC-721.sol";
import "../contracts/mERC-1155.sol";

contract marketNFT {

    address public nft_address;

    mapping (uint256 => address) private _balance;

    mapping (uint256 => uint256) private _listedItems;

    constructor(address _nft_addres) {
        nft_address = _nft_addres;
    }

    // - создание нового предмета, обращается к контракту NFT и вызывает функцию mint.
    function createItem(string memory  _tokenURI, address _owner) public returns (uint256) {
        uint256 _id_token = mERC721(nft_address).safeMint(_owner);
        _balance[_id_token] = _owner;
        return _id_token;
    }

    //- выставление предмета на продажу.    
    function listItem(uint256 _id_token, uint256 _price) public returns (bool) {
        require(_price > 0, "Price is 0");
        require(_balance[_id_token] == msg.sender, "Not owner");
        _listedItems[_id_token] = _price;
        return true;
    } 
    //  - покупка предмета.
    function buyItem(uint256 _id_token) public {
        require(_listedItems[_id_token] >  0, "Not listed");
        // переводим токены
        _listedItems[_id_token] = 0;
    }
    // - отмена продажи выставленного предмета
    function cancelItem(uint256 _id_token) public {
        require(_listedItems[_id_token] >  0, "Not listed");
        require(_balance[_id_token] == msg.sender, "Not owner");
        _listedItems[_id_token] = 0;
    }

function listItemOnAuction() public {}
// - выставка предмета на продажу в аукционе.
function makeBid() public {}
// - сделать ставку на предмет аукциона с определенным id.
function finishAuction() public {}
// - завершить аукцион и отправить НФТ победителю
function cancelAuction()  public {} 
    // - отменить аукцион
}