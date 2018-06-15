pragma solidity ^0.4.17;

import '../node_modules/zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol';
import '../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Dog is ERC721Token, Ownable{
    //Dogg[] public doggs; //not needed because we have allTokens in ERC721Token.sol
    uint256 public dog_id;

    mapping (uint256 => Dogg) public dog_id_to_struct;

    struct Dogg {
        string image_url;
        string name;
        uint256 dog_id;
        uint8 age;
    }

    //I had to do this or it'll give me this error
    /*
        Error encountered, bailing. Network state unknown. Review successful transactions manually.
        Error: The contract code couldn't be stored, please check your gas amount.
    */
    function Dog(string _name, string _symbol) ERC721Token(_name, _symbol) Ownable() public{ }

    //not needed because we have totalSupply in ERC721Token.sol
        // function getDogsLen() view external returns(uint256){
        //     return doggs.length;
        // }

    function mint(string _image_url, string _name, uint8 _age) external onlyOwner{
        dog_id++;

        //First we define an in memory dogg variable. In memory means that lifespan of this variable will be limited by the execution scope (it lives just inside this function)
        Dogg memory dogg = Dogg({ image_url: _image_url, name: _name, age: _age, dog_id: dog_id});

        dog_id_to_struct[dog_id] = dogg;
        
        //not needed because this happpens for us in _mint of ERC721Token.sol
        //our dog_id gets pushed into allTokens (an array of token ids) in ERC721Token.sol
            //doggs.push(dogg); 
        
        //Checks that the recipient address is valid (not 0), otherwize throws an error
        //Creates a token and assigns it an owner
        //Fires Transfer event.
        _mint(msg.sender, dog_id);
    }
}