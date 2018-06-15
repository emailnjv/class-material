pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract Sale is Crowdsale, Ownable {
  uint256 public deployed_time;

  function Sale(uint256 _rate, address _wallet, ERC20 _token) public Crowdsale(_rate, _wallet, _token) Ownable(){
    deployed_time = now;
  }

  function tokens_sold() view external returns (uint256){
    return _getTokenAmount(weiRaised);
  }

  function end_sale() public onlyOwner{
      // Send unsold tokens to the owner.
      require(token.transfer(owner, token.balanceOf(this)));

      // Destroy this contract, sending all collected ether to the owner.
      selfdestruct(owner);
  }
}
