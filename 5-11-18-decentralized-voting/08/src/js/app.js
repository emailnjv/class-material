var candidateSelect = $('#candidateSelect');
var newCandName = $('#newCandName');
var addCandidate = $('#addCandidate');
var candidateAdditionInfo = $('#candidateAdditionInfo');

var voters = [];
var candidates = [];

function lowerSpaceToDash(str){
    return str.replace(/\s+/g, '-').toLowerCase();
}

function voterLi(voter){
    var li = $('<li>');
    li.text(voter);
    return li;
}

function addVotersToPage(vs, id){

    var liTag;

    for (var i=0; i<vs.length; i++){
        liTag = voterLi(vs[i]);

        $(id).append(liTag);
    }
}

function addTransactionToDOM(ob, transactionsDiv) {
    //start a virtual unordered list (list with bullets - no numbers)
    var ul = $('<ul>');

    //the tx is in a key in ob, so we get to it directly
    var firstLi = $('<li>');
    var txTerm = $('<span>').html('<strong>tx</strong>').addClass('right-margin-5');
    var txVal = $('<span>').html(ob.tx);
    firstLi.append(txTerm);
    firstLi.append(txVal);

    ul.append(firstLi);

    //the rest of the data are grand childs of ob in ob.receipt

    var li, term, val;

    for (key in ob.receipt) {
        li = $('<li>');
        term = $('<span>').html(`<strong>${key}</strong>`).addClass('right-margin-5');
        val = $('<span>').html(ob.receipt[key]);

        li.append(term)
        li.append(val);

        ul.append(li);
    }

    //we add the virtual unordered list onto the html
    transactionsDiv.append(ul);
}

function thCreate(val) {
    return $('<th>').text(val);
}

function trForBodyCreate(cand, votes) {
    var tr = $('<tr>').attr('id', lowerSpaceToDash(cand));
    var tdC = $('<td>');
    tdC.text(cand);
    var tdV = $('<td>');
    tdV.text(votes);
    tr.append(tdC, tdV);

    return tr;
}

function createTable(cands, res) {
    for (var i = 0; i < cands.length; i++) {
        cands[i].votes = res[i].c[0];
    }

    var table = $('<table>').addClass('table table-bordered');
    var tHead = $('<thead>');
    var topTr = $('<tr>');

    topTr.append(thCreate('candidate')).append(thCreate('votes'));

    tHead.append(topTr);

    table.append(tHead);

    var tBody = $('<tbody>');

    var tr;

    for (var i = 0; i < cands.length; i++) {
        tBody.append(trForBodyCreate(web3.toAscii(cands[i].name), cands[i].votes));
    }

    table.append(tBody);

    return table;
}

function createSelect(cands, id) {
    var sel = $('<select>');

    sel.attr('id', id);

    var op;

    var candName;

    for (var i = 0; i < cands.length; i++) {
        candName = web3.toAscii(cands[i].name);

        op = $('<option>').val(candName).text(candName);
        sel.append(op);
    }

    return sel;
}

App = {
    web3Provider: null,
    contracts: {},

    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
            web3 = new Web3(App.web3Provider);
        }

        return App.initContract();
    },

    initContract: function() {
        $.getJSON('Voting.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var VotingArtifact = data;
            App.contracts.Voting = TruffleContract(VotingArtifact);

            // Set the provider for our contract.
            App.contracts.Voting.setProvider(App.web3Provider);

            return App.bindEvents();

        });
    },
    bindEvents: function() {
        $(document).on('click', '#vote', App.castVote);
        $(document).on('click', '#addCandidate', App.addCandidate);

        //add your address to the page
        var yA = $('#yourAddress');
        var p = $('<p>');
        var sp = $('<strong>').text('Your Address: ');
        var add = $('<span>').text(web3.eth.accounts[0]);

        p.append(sp);
        p.append(add);
        yA.append(p);

        return App.grabState();
    },
    grabAddresses: function() {
        var VotingInstance;

        App.contracts.Voting.deployed().then(function(instance) {
            VotingInstance = instance;

            return VotingInstance.getVotersLen.call();
            
            
        }).then(function(result) {
            var numVoters = result.c[0];

            var promises = [];

            for (var i = 0; i < numVoters; i++) {
                promises.push(VotingInstance.voters.call(i));
            }

            return Promise.all(promises);
        }).then(function(res){
            console.log('line 194', res);
            
            voters = res;

            //add voters to the page
            addVotersToPage(res, $('#voters'));

        }).catch(function(err) {
            $('#errors').text(err.message);
        });
    },
    grabState: function() {
        var VotingInstance;

        App.contracts.Voting.deployed().then(function(instance) {
            VotingInstance = instance;

            return VotingInstance.getCandidateListLen.call();

        }).then(function(result) {
            var numCandidates = result.c[0];

            var promises = [];

            for (var i = 0; i < numCandidates; i++) {
                promises.push(VotingInstance.candidateList.call(i));
            }

            return Promise.all(promises);
        }).then(function(result) {
            candidates = result.map(function(n) {
                return { name: n, votes: undefined }
            })

            var promises = [];

            for (var i = 0; i < result.length; i++) {
                promises.push(VotingInstance.votesReceived.call(result[i]));
            }

            return Promise.all(promises);

        }).then(function(result) {

            var table = createTable(candidates, result);

            $('#candidates').append(table);

            var candSelect = createSelect(candidates, 'candidateSelect');

            var button = $('<button>');

            button.text('vote for candidate').attr('id', 'vote');

            $('#voting').append(candSelect, button);

            var VotingInstance;

            //grab addresses
            App.grabAddresses();

            //add event to watch for new candidates being added to the contract
            App.contracts.Voting.deployed().then(function(instance) {
                VotingInstance = instance;

                return VotingInstance.NewCandidate().watch(function(err, res){
                    if (err) console.log(err);

                    var newCName = web3.toAscii(res.args.name);
                    console.log('NewCandidate event triggered');
                    $('tbody').append(trForBodyCreate(newCName, 0));
                });

            }).catch(function(err) {
                $('#errors').text(err.message);
            });

            //add another event to watch
            //add event to watch for new candidates being added to the contract
            App.contracts.Voting.deployed().then(function(instance) {
                VotingInstance = instance;

                return VotingInstance.NewVote().watch(function(err, res){
                    if (err) console.log(err);

                    var cName = web3.toAscii(res.args.name);
                    var cVoter = res.args.voter;
                    var newVotes = res.args.totalVotes.c[0];

                    console.log('NewVote event triggered');
                    
                    if (cVoter != undefined && !voters.includes(cVoter)) {
                        $('#voters').append(voterLi(cVoter))
                    };

                    var candNameTran = lowerSpaceToDash(cName);

                    //this updates the votes
                    // it should just be
                    var trToChange = '#' + candNameTran;
                    
                    $(trToChange).children('td').eq(1).text(newVotes);
                    
                    $('table').find('tr').each(function(index, el){
                      if ($(el).attr('id') == candNameTran){
                        $(el).children('td').eq(1).text(newVotes);
                      }
                    })
                });

            }).catch(function(err) {
                $('#errors').text(err.message);
            });

        }).catch(function(err) {
            $('#errors').text(err.message);
        });
    },
    castVote: function(event) {
        event.preventDefault();

        var VotingInstance;

        App.contracts.Voting.deployed().then(function(instance) {
            VotingInstance = instance;

            var cVal = $('#candidateSelect').val();

            return VotingInstance.voteForCandidate(cVal);
        }).then(function(result) {
          addTransactionToDOM(result, $('#transactions'));
        }).catch(function(err) {
            $('#errors').text(err.message);
        });
    },
    addCandidate(event) {
        event.preventDefault();

        var ncn = newCandName.val();

        var VotingInstance;

        App.contracts.Voting.deployed().then(function(instance) {
            VotingInstance = instance;

            return VotingInstance.addCandidate(ncn);
        }).then(function(result) {
          $('#candidateAdditionInfo').text('candidate added!')
          addTransactionToDOM(result, $('#transactions'));
        }).catch(function(err) {
            $('#errors').text(err.message);
        });
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});