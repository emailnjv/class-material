var Dog = artifacts.require("Dog");
var Sale = artifacts.require("Sale");

module.exports = function(deployer) {
	deployer.deploy(Dog, "DogToken", "DOG").then(function(dogToken){
		return deployer.deploy(Sale, dogToken.address);
	});
};