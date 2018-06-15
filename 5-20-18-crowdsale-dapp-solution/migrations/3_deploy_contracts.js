var Sale = artifacts.require("Sale");

module.exports = function(deployer) {
    deployer.deploy(Sale, 1000000000000000, '0x620C303C77543f66cAff6e6EC92fC163d6703C75', '0x4b9dF80E5646813A08fb10aA171007A7d3354eAd');
};

//0x4b9dF80E5646813A08fb10aA171007A7d3354eAd