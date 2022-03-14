// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @author HY Lim 2022
contract MakeWorldPeace is Initializable, ERC20Upgradeable,ERC20BurnableUpgradeable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {

    uint latestMintedTime;
    uint maxSupplyWithinTimeInterval;
    uint timeIntervalSeconds;      

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public virtual initializer{
        __ERC20_init("MakeWorldPeace", "MWP");
        __ERC20Burnable_init();
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 20220311 * 10 ** decimals());
        // Initialize default value 
        latestMintedTime = block.timestamp;
        timeIntervalSeconds = 3 * 60; // 3 minutes 
        maxSupplyWithinTimeInterval = 10000 * 10 ** decimals();
    }

    function pause() public virtual onlyOwner  {
        _pause();
    }

    function unpause() public virtual onlyOwner  {
        _unpause();
    }

    function mint(address to, uint256 amount) public virtual onlyOwner  {        
        if(block.timestamp < latestMintedTime + timeIntervalSeconds) {
            require(amount <= maxSupplyWithinTimeInterval,"Exceed maximum allowed supply (10,000) within 3 minutes.");
        }
        _mint(to, amount);
        latestMintedTime = block.timestamp;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function burn_supply (uint256 amount) public virtual onlyOwner  {
        require(balanceOf(msg.sender) >= amount,"Failed attempt to burn tokens where requested burn tokens is more than owned tokens");
        burn(amount);
    }
}