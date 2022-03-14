// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MakeWorldPeaceV2.sol";

/// @author HY Lim 2022
contract MakeWorldPeaceV3 is MakeWorldPeaceV2 {
    
    function burn(uint256 amount) public override onlyRole(BURNER_ROLE){
        super.burn(amount);
    }
    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE){
        super.burnFrom(account, amount);
    }
}