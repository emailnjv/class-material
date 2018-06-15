var $checkBalanceAddress_INPUT = $('#checkBalanceAddress');
var $balanceOfAddressProvided_SPAN = $('#balanceOfAddressProvided');
var $crowdSaleTokensAvailable_SPAN = $('#crowdSaleTokensAvailable');
var $dateStartOfCrowdSale_SPAN = $('#dateStartOfCrowdSale');
var $addressWhereFundsGoto_SPAN = $('#addressWhereFundsGoto');
var $etherRaised_SPAN = $('#etherRaised');
var $tokensSold_SPAN = $('#tokensSold');
var $rate_SPAN = $('#rate');
var $crowdsaleAddress_SPAN = $('#crowdsaleAddress');
var $tokenAddress_SPAN = $('#tokenAddress');
var $howManyTokens_INPUT = $('#howManyTokens');
var $addressWhereTheTokensShouldGoTo_INPUT = $('#addressWhereTheTokensShouldGoTo');
var $howMuchETHYouShouldHave_SPAN = $('#howMuchETHYouShouldHave');
var $yourAddress_SPAN = $('#yourAddress');
var $yourETHAmount_SPAN = $('#yourETHAmount');

App = {
    rate: null,

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
        $.getJSON('TutorialToken.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var TutorialTokenArtifact = data;
            App.contracts.TutorialToken = TruffleContract(TutorialTokenArtifact);

            // Set the provider for our contract.
            App.contracts.TutorialToken.setProvider(App.web3Provider);

            $.getJSON('Sale.json', function(data) {
                // Get the necessary contract artifact file and instantiate it with truffle-contract.
                var SaleArtifact = data;
                App.contracts.Sale = TruffleContract(SaleArtifact);

                // Set the provider for our contract.
                App.contracts.Sale.setProvider(App.web3Provider);

                //get the balance of erc20 tokens the current user has and put that on the page
                return App.getBalances();
            });
        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '#transferButton', App.handleTransfer);
        $(document).on('click', '#checkBalanceButton', App.checkBalanceOfAddressProvided);
        $(document).on('click', '#purchaseTcT', App.purchaseTct);

        //put the user's address and eth amount onto the page
            //add your address to the page
                var account = web3.eth.accounts[0];

                $yourAddress_SPAN.text(account);

                $addressWhereTheTokensShouldGoTo_INPUT.val(account);

            var balance;

            web3.eth.getBalance(account, function(err, bal){
                balance = web3.fromWei(bal.toNumber());
                //add how much you have to the page
                $yourETHAmount_SPAN.text(balance);
            });

            var accountInterval = setInterval(function() {

                //if the account changes then re-run App.init
                    var acc = web3.eth.accounts[0];

                    if (account !== acc) {
                        account = web3.eth.accounts[0];

                        $yourAddress_SPAN.text(account);
                        $addressWhereTheTokensShouldGoTo_INPUT.val(account);

                        App.init();
                    }

                //if the balance changed of the account then update the page with the new balance of the account
                    web3.eth.getBalance(account, function(err, bal){
                        if (balance !== web3.fromWei(bal.toNumber())){
                            balance = web3.fromWei(bal.toNumber());
                            //add how much you have to the page
                            $yourETHAmount_SPAN.text(balance);
                        }
                    });
            }, 100);

        //watch this input, when it changes update a span on the page
        $(document).on('change keyup paste mouseup', '#howManyTokens', function(){
            var val = 0;

            if ($.isNumeric($(this).val())) { 
                val = $(this).val().trim(); 
            }

            var howMuch = parseFloat(val*App.rate); //borat voice
            $howMuchETHYouShouldHave_SPAN.text(howMuch);
        });
    },
    getBalances: function() {
        console.log('Getting balances...');

        var tutorialTokenInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.TutorialToken.deployed().then(function(instance) {
                tutorialTokenInstance = instance;

                return tutorialTokenInstance.balanceOf(account);
            }).then(function(result) {
                balance = result.toNumber();

                $('#TTBalance').text(balance);

                return App.getCrowdSaleDetails();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },
    getCrowdSaleDetails: function() {

        var tutorialTokenInstance;
        var saleInstance;

        App.contracts.TutorialToken.deployed().then(function(instance) {
            tutorialTokenInstance = instance;

            App.contracts.Sale.deployed().then(function(instance) {
                saleInstance = instance;

                var promises = [];

                var saleAddress = saleInstance.address;

                $crowdsaleAddress_SPAN.text(saleAddress);

                $tokenAddress_SPAN.text(tutorialTokenInstance.address);

                //the first element pushed into promises
                    //is the address of the Sale contract to the balanceOf function in the TutorialToken contract
                promises.push(tutorialTokenInstance.balanceOf(saleAddress), saleInstance.deployed_time(), saleInstance.wallet(), saleInstance.rate(), saleInstance.weiRaised(), saleInstance.tokens_sold());

                return Promise.all(promises);

            }).then(function(result){

                var balance = result[0].toNumber();

                var dateStartOfCrowdSale = new Date(result[1].toNumber()*1000);

                var addressWhereFundsGoto = result[2];

                App.rate = web3.fromWei(result[3].toNumber());

                var etherRaised = web3.fromWei(result[4].toNumber());

                var tokensSold =  result[5].toNumber();

                $crowdSaleTokensAvailable_SPAN.text(balance);

                $dateStartOfCrowdSale_SPAN.text(dateStartOfCrowdSale);

                $addressWhereFundsGoto_SPAN.text(addressWhereFundsGoto);

                $rate_SPAN.text(App.rate);
                
                $etherRaised_SPAN.text(etherRaised);

                $tokensSold_SPAN.text(tokensSold);

            }).catch(function(err) {
                console.log(err.message);
            });
        }).catch(function(err) {
            console.log(err.message);
        });

    },
    handleTransfer: function(event) {
        event.preventDefault();

        var amount = parseInt($('#TTTransferAmount').val());
        var toAddress = $('#TTTransferAddress').val();

        console.log('Transfer ' + amount + ' TT to ' + toAddress);

        var tutorialTokenInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.TutorialToken.deployed().then(function(instance) {
                tutorialTokenInstance = instance;

                return tutorialTokenInstance.transfer(toAddress, amount);
            }).then(function(result) {
                alert('Transfer Successful!');
                return App.getBalances();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },
    checkBalanceOfAddressProvided: function(event) {
        event.preventDefault();

        var tutorialTokenInstance;

        App.contracts.TutorialToken.deployed().then(function(instance) {
            tutorialTokenInstance = instance;

            return tutorialTokenInstance.balanceOf($checkBalanceAddress_INPUT.val());
        }).then(function(result) {
            var balance = result.toNumber();

            $balanceOfAddressProvided_SPAN.text(balance);
        }).catch(function(err) {
            console.log(err.message);
        });

    },
    purchaseTct: function(event) {
        event.preventDefault();

        App.contracts.Sale.deployed().then(function(instance) {
            saleInstance = instance;

            var numBuy = parseFloat($howManyTokens_INPUT.val().trim());

            var addr = $addressWhereTheTokensShouldGoTo_INPUT.val().trim();

            var ethToSend = numBuy*App.rate;

            var weiToSend = web3.toWei(parseFloat(ethToSend), 'ether');

            var ob = {from: web3.eth.accounts[0], value: weiToSend};

            debugger;

            return saleInstance.buyTokens(addr, ob);

        }).then(function(result){
            alert('you bought them');
        }).catch(function(err){
            console.log(err.message);
        });
    }

};

$(function() {
    $(window).load(function() {
        App.init();
    });
});