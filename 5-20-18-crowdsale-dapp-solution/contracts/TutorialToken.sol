//this standard is based on ethereum
//https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md 
pragma solidity ^0.4.17;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract TutorialToken is StandardToken {
	//optional fields
		string public name = 'Tom Cruise Token';
		string public symbol = 'TCT';

		/*
			//good practice to put in 18 here
			
			https://github.com/ethereum/EIPs/issues/724
		*/
		uint8 public decimals = 18;

	//needed because totalSupply eventually uses it. The totalSupply function lives in BasicToken which StandardToken inherits from
	uint public INITIAL_SUPPLY = 100000000;

	function TutorialToken() public {
	  totalSupply_ = INITIAL_SUPPLY;
	  balances[msg.sender] = totalSupply_;
	}
}