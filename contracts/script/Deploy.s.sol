// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../RewardNFT.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address signerAddress     = vm.envAddress("NFT_SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        SwapperNFT nft = new SwapperNFT(signerAddress);
        console.log("SwapperNFT deployed to:", address(nft));

        vm.stopBroadcast();
    }
}
