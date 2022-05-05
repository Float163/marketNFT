// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../contracts/mERC-721.sol";
import "../contracts/mERC-1155.sol";
//import "../contracts/m63.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract marketNFT {

    address public nftAddress;
    address public tokenAddress;    
    address public owner;    

    mapping (uint256 => address) private _balance;
    mapping (uint256 => uint256) private _listedItems;

    struct Auction {
        uint startDate;
        uint256 currentPrice;
        address currentWinner;
        uint256 count;
        bool exist;
    }

    mapping (uint256 => Auction) private _auction;    

    constructor(address _nftAddres, address _tokenAddress) {
        nftAddress = _nftAddres;
        tokenAddress = _tokenAddress;
        owner = msg.sender;
    }
    
    // - создание нового предмета, обращается к контракту NFT и вызывает функцию mint.
    function createItem(string memory  _tokenURI, address _owner) public returns (uint256) {
        uint256 _tokenID = mERC721(nftAddress).safeMint(_owner);
        _balance[_tokenID] = _owner;
        return _tokenID;
    }

    //- выставление предмета на продажу.    
    function listItem(uint256 _tokenID, uint256 _price) public returns (bool) {
        require(_price > 0, "Price is 0");
        require(_balance[_tokenID] == msg.sender, "Not owner");
        mERC721(nftAddress).transferFrom(msg.sender, address(this), _tokenID);
        _listedItems[_tokenID] = _price;
        return true;
    } 

    //  - покупка предмета.
    function buyItem(uint256 _tokenID) public {
        require(_listedItems[_tokenID] >  0, "Not listed");
        ERC20(tokenAddress).transferFrom(msg.sender, _balance[_tokenID], _listedItems[_tokenID]);
        mERC721(nftAddress).transferFrom(address(this), msg.sender, _tokenID);
        _balance[_tokenID] = msg.sender;
        _listedItems[_tokenID] = 0;
    }

    // - отмена продажи выставленного предмета
    function cancelItem(uint256 _tokenID) public {
        require(_listedItems[_tokenID] >  0, "Not listed");
        require(_balance[_tokenID] == msg.sender, "Not owner");
        mERC721(nftAddress).transferFrom(address(this), msg.sender, _tokenID);        
        _listedItems[_tokenID] = 0;
    }

    // - выставка предмета на продажу в аукционе.
    function listItemOnAuction(uint256 _tokenID, uint256 _minPrice) public {
        require(_balance[_tokenID] == msg.sender, "Not owner");
        require(!_auction[_tokenID].exist, "Already exist");        
        mERC721(nftAddress).transferFrom(msg.sender, address(this), _tokenID);        
        Auction storage a = _auction[_tokenID];
        a.startDate = block.timestamp;
        a.currentPrice = _minPrice;
        a.exist = true;
    }

    // - сделать ставку на предмет аукциона с определенным id.
    function makeBid(uint256 _tokenID, uint256 _price) public {
        require(_auction[_tokenID].exist, "Not exist");
        require(_auction[_tokenID].currentPrice < _price, "Price too small");        
        ERC20(tokenAddress).transferFrom(msg.sender, address(this), _price);        
        if (_auction[_tokenID].count > 0) {
          ERC20(tokenAddress).transfer(_auction[_tokenID].currentWinner, _auction[_tokenID].currentPrice);                    
        }
        _auction[_tokenID].currentPrice = _price;
        _auction[_tokenID].currentWinner = msg.sender;        
        _auction[_tokenID].count++;
    }

    // - завершить аукцион и отправить НФТ победителю
    function finishAuction(uint256 _tokenID) public {
        require(_auction[_tokenID].exist, "Not exist");
        require(_balance[_tokenID] == msg.sender, "Not owner");        
        require((block.timestamp - _auction[_tokenID].startDate) / 60 / 60 /24 > 3 , "Minimum 3 days");
        if (_auction[_tokenID].count > 1) {
            ERC20(tokenAddress).transfer(_balance[_tokenID], _auction[_tokenID].currentPrice);
            mERC721(nftAddress).transferFrom(address(this), _auction[_tokenID].currentWinner, _tokenID);
            _balance[_tokenID] =  _auction[_tokenID].currentWinner;
        } else if (_auction[_tokenID].count == 0) {
            mERC721(nftAddress).transferFrom(address(this), _balance[_tokenID], _tokenID);
        } else {
            ERC20(tokenAddress).transfer(_auction[_tokenID].currentWinner, _auction[_tokenID].currentPrice);            
            mERC721(nftAddress).transferFrom(address(this), _balance[_tokenID], _tokenID);
        }
        _auction[_tokenID].count = 0;
        _auction[_tokenID].exist = false;
    }

    // - отменить аукцион
    function cancelAuction(uint256 _tokenID)  public {
        require(_auction[_tokenID].exist, "Not exist");
        require(_auction[_tokenID].count < 2, "2 or more bids");        
        _auction[_tokenID].count = 0;
        _auction[_tokenID].exist = false;
    } 

}