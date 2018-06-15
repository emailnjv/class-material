pragma solidity ^0.4.18;

contract Voting {
  event NewCandidate(
      bytes32 name
  );

  event NewVote(
      address voter,
      bytes32 name,
      uint totalVotes
  );

  mapping (bytes32 => uint8) public votesReceived;
  bytes32[] public candidateList;
  address owner;

  address[] public voters;

  constructor() {
    owner = msg.sender;

    candidateList.push('Nick West');
    candidateList.push('Nick Vincent');
    candidateList.push('Tyler Rosen');
    candidateList.push('Rich Budek');
    candidateList.push('Mike Salim');
    candidateList.push('Mario Bajric');
    candidateList.push('Edward Yu');
    candidateList.push('Francois Julien Alcaraz');
    candidateList.push('Joshua Hudson');
    candidateList.push('Marc Stephen Soto');
    candidateList.push('Patrick Loughrey');
    candidateList.push('Young Joong Kim');
  }

  function addCandidate(bytes32 cand){
    require(msg.sender == owner);
    candidateList.push(cand);
    emit NewCandidate(cand);
  }

  function getVotersLen() public view returns (uint256) {
      return voters.length;
  }

  function getCandidateListLen() public view returns (uint256) {
      return candidateList.length;
  }

  function totalVotesFor(bytes32 candidate) view public returns (uint8) {
    require(validCandidate(candidate));
    return votesReceived[candidate];
  }

  function voteForCandidate(bytes32 candidate) public {
    require(validCandidate(candidate));
    require(canPersonVote());
    voters.push(msg.sender);
    votesReceived[candidate] += 1;
    emit NewVote(msg.sender, candidate, votesReceived[candidate]);
  }

  function canPersonVote() view public returns (bool) {
    for(uint i = 0; i < voters.length; i++) {
      if (voters[i] == msg.sender) {
        return false;
      }
    }
    return true;
  }

  function validCandidate(bytes32 candidate) view public returns (bool) {
    for(uint i = 0; i < candidateList.length; i++) {
      if (candidateList[i] == candidate) {
        return true;
      }
    }
    return false;
   }
}