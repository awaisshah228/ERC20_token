// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MakeWorldPeace.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// @author HY Lim 2022
contract MakeWorldPeaceV2 is MakeWorldPeace, AccessControlUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bool private upgradedToV2;
    
    function upgradeToV2() public {
        require(!upgradedToV2, "This function can be only called once and should be the first function to be called after the upgrade progress!");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        upgradedToV2 = true;
    }

    function pause() public override onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public override onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public override onlyRole(MINTER_ROLE) {
         if(block.timestamp < latestMintedTime + timeIntervalSeconds) {
            require(amount <= maxSupplyWithinTimeInterval,"Exceed maximum allowed supply (10,000) within 30 seconds.");
        }
        _mint(to, amount);
        latestMintedTime = block.timestamp;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
        
        require(upgradedToV2,"Please contact deployed contract owner to update contract to V2 via function.");

    }

    function burn_supply (uint256 amount) public override onlyRole(BURNER_ROLE) {
        require(balanceOf(msg.sender) >= amount,"Failed attempt to burn tokens where requested burn tokens is more than owned tokens");
        burn(amount);
    }
}