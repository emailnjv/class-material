var $errors = $('#errors');
var $donators = $('#donators');
var $ownerSees = $('#ownerSees');
var $transactions = $('#transactions');
var $transferToAddress = $('#transferToAddress');
var $ownerAddress = $('#ownerAddress');
var $ownerSeesAdditionalInfo = $('#ownerSeesAdditionalInfo');
var $balance = $('#balance');
var $donationAmount = $('#donationAmount');
var $donationInfo = $('#donationInfo');
var $yourAddress = $('#yourAddress');
var $yourETHAmount = $('#yourETHAmount');

/*  
    //https://etherconverter.online/
    
    1 ether equals 10^18 wei. 
    
    //https://github.com/ethereum/web3.js/blob/0.15.0/lib/utils/utils.js#L40

    var unitMap = {
        'wei':          '1',
        'kwei':         '1000',
        'ada':          '1000',
        'femtoether':   '1000',
        'mwei':         '1000000',
        'babbage':      '1000000',
        'picoether':    '1000000',
        'gwei':         '1000000000',
        'shannon':      '1000000000',
        'nanoether':    '1000000000',
        'nano':         '1000000000',
        'szabo':        '1000000000000',
        'microether':   '1000000000000',
        'micro':        '1000000000000',
        'finney':       '1000000000000000',
        'milliether':   '1000000000000000',
        'milli':        '1000000000000000',
        'ether':        '1000000000000000000',
        'kether':       '1000000000000000000000',
        'grand':        '1000000000000000000000',
        'einstein':     '1000000000000000000000',
        'mether':       '1000000000000000000000000',
        'gether':       '1000000000000000000000000000',
        'tether':       '1000000000000000000000000000000'
    };
*/
function balanceConvert(bal, from, to){
    //https://github.com/ethereum/wiki/wiki/JavaScript-API#web3towei
    if (from == 'wei') return web3.fromWei(bal, to);
}

function liGen(val){
    var li = $('<li>');
    li.text(val);
    return li;
}

function addLisToPage(list, $id){

    var liTag;

    $id.empty();

    for (var i=0; i<list.length; i++){
        liTag = liGen(list[i]);

        $id.append(liTag);
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
        $.getJSON('Donate.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var DonateArtifact = data;
            App.contracts.Donate = TruffleContract(DonateArtifact);

            // Set the provider for our contract.
            App.contracts.Donate.setProvider(App.web3Provider);

            return App.bindEvents();

        });
    },
    bindEvents: function() {
        $(document).on('click', '#transferOwnership', App.transferOwnership);
        $(document).on('click', '#makeDonation', App.donate);
        $(document).on('click', '#withdrawFunds', App.withdrawFunds)

        //add your address to the page
            var account = web3.eth.accounts[0];

            $yourAddress.text(account);

        var balance;

        web3.eth.getBalance(account, function(err, bal){
            balance = web3.fromWei(bal.toNumber());
            //add how much you have to the page
            $yourETHAmount.text(balance);
        });

        var accountInterval = setInterval(function() {

            //if the account changes then re-run App.init
                var acc = web3.eth.accounts[0];

                if (account !== acc) {
                    account = web3.eth.accounts[0];

                    //reset elements on the page
                    $errors.empty();
                    $transactions.empty();
                    $donationInfo.empty();
                    $ownerSees.addClass('hide');
                    $ownerSeesAdditionalInfo.empty();
                    $donationAmount.val('');
                    $transferToAddress.val('');

                    App.init();
                }

            //if the balance changed of the account then update the page with the new balance of the account
                web3.eth.getBalance(account, function(err, bal){
                    if (balance !== web3.fromWei(bal.toNumber())){
                        balance = web3.fromWei(bal.toNumber());
                        //add how much you have to the page
                        $yourETHAmount.text(balance);
                    }
                });
        }, 100);

        return App.grabState();
    },
    grabState: function() {
        var DonateInstance;

        App.contracts.Donate.deployed().then(function(instance) {
            DonateInstance = instance;

            return DonateInstance.getDonatorsLen.call();

        }).then(function(result){
            var donatorListLen = result.c[0];

            var promises = [];

            promises.push(DonateInstance.owner.call(), DonateInstance.getBalance());

            for (var i = 0; i < donatorListLen; i++) {
                promises.push(DonateInstance.donators.call(i));
            }

            return Promise.all(promises);

        }).then(function(result) {

            //show the owner admin section if the person here is the owner
            if (web3.eth.accounts[0] == result[0]) $ownerSees.removeClass('hide');

            $ownerAddress.text(result[0]);
            $balance.text(result[1].c[0]);

            addLisToPage(result.slice(2), $donators)

            //we'll set up watching events here

            //watch for a new owner from the ownable contract
                var DonateInstance;

                //watch for a solidity event
                App.contracts.Donate.deployed().then(function(instance) {
                    DonateInstance = instance;

                    return DonateInstance.OwnershipTransferred().watch(function(err, res){
                        if (err) console.log(err);
                        console.log(res.args.newOwner, res.args.previousOwner);
                        $('#ownerAddress').text(res.args.newOwner);
                    });

                }).catch(function(err) {
                    $errors.prepend(err.message);
                });


            //watch for donators updating
                var DonateInstance;

                //watch for a solidity event to watch
                App.contracts.Donate.deployed().then(function(instance) {
                    DonateInstance = instance;

                    return DonateInstance.NewDonator().watch(function(err, res){
                        if (err) console.log(err);
                        var li = liGen(res.args.donator);

                        $donators.append(li);
                    });

                }).catch(function(err) {
                    $errors.prepend(err.message);
                });

            //watch for the balance updating
                var DonateInstance;

                //watch for a solidity event to watch
                App.contracts.Donate.deployed().then(function(instance) {
                    DonateInstance = instance;

                    return DonateInstance.BalanceUpdate().watch(function(err, res){
                        if (err) console.log(err);
                        $balance.text(balanceConvert(res.args.balance, 'wei', 'ether'));
                    });

                }).catch(function(err) {
                    $errors.prepend(err.message);
                });

        }).catch(function(err) {
            $errors.prepend(err.message);
        });
    },
    transferOwnership: function(event) {
        event.preventDefault();

        var DonateInstance;

        App.contracts.Donate.deployed().then(function(instance) {
            DonateInstance = instance;

            var tAddressVal = $transferToAddress.val();

            return DonateInstance.transferOwnership(tAddressVal);
        }).then(function(result) {
          addTransactionToDOM(result, $transactions);

          $ownerSeesAdditionalInfo.append($('<p>').text('ownership has been transferred to address provided.'));

        }).catch(function(err) {
            $errors.prepend(err.message);
        });
    },
    donate: function(event){
        event.preventDefault();
        var amount = web3.toWei(parseFloat($donationAmount.val()), 'ether');

        var DonateInstance;

        App.contracts.Donate.deployed().then(function(instance) {
            DonateInstance = instance;
            
            return DonateInstance.deposit(amount, {from: web3.eth.accounts[0], value: amount});

        }).then(function(result) {
        
          addTransactionToDOM(result, $transactions);

          $donationInfo.text('donation successfully made');

        }).catch(function(err) {
            $errors.prepend(err.message);
        }); 
    },
    withdrawFunds: function(event){
        event.preventDefault();

        var DonateInstance;

        App.contracts.Donate.deployed().then(function(instance) {
            DonateInstance = instance;
            
            return DonateInstance.withdraw();

        }).then(function(result) {
        
          addTransactionToDOM(result, $transactions);

          $ownerSeesAdditionalInfo.text('withdrawl successfully made');

        }).catch(function(err) {
            $errors.prepend(err.message);
        }); 
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});