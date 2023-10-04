// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//=============================================================//
//                           IMPORTS                           //
//=============================================================//
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


/**
 * @author Emanuele B. (@emanueleb88)
 * @title  Network node contract
 * @notice A network node can aggregate received ETH to a single address (aggregator node)
 *         or disgregate it among multiple addresses (disgregator node) depending on how
 *         the node is initialized
 */
contract NetworkNode is
    OwnableUpgradeable
{
    using Address for address payable;

    //=============================================================//
    //                           STORAGE                           //
    //=============================================================//
    
    /// Output addresses
    address payable[] public outputAddresses;

    //=============================================================//
    //                           ERRORS                            //
    //=============================================================//

    /**
     * Error raised if output addresses are empty
     */
    error EmptyOutputAddressesError();

    /**
     * Error raised if null output address
     */
    error NullOutputAddressError();

    //=============================================================//
    //                         FUNCTIONS                           //
    //=============================================================//

    /**
     * Initialize contract with single addresses (aggregator)
     * @param outputAddress_ Output address
     */
    function initAsAggregator(
        address payable outputAddress_
    ) public initializer {
        if (outputAddress_ == payable(address(0))) {
            revert NullOutputAddressError();
        }
        outputAddresses = [outputAddress_];
        __Ownable_init();
    }

    /**
     * Initialize contract with multiple addresses (disgregator)
     * @param outputAddresses_ Output addresses
     */
    function initAsDisgregator(
        address payable[] memory outputAddresses_
    ) public initializer {
        if (outputAddresses_.length == 0) {
            revert EmptyOutputAddressesError();
        }
        for (uint256 i = 0; i < outputAddresses_.length; i++) {
            if (outputAddresses_[i] == payable(address(0))) {
                revert NullOutputAddressError();
            }
        }

        outputAddresses = outputAddresses_;
        __Ownable_init();
    }

    /**
     * Get the number of output addresses
     * @return Number of output addresses
     */
    function outputAddressesNum() external view returns (uint256) {
        return outputAddresses.length;
    }

    /**
     * Get if the node is an aggregator
     * @return True if an aggregator, false otherwise
     */
    function isAggregator() public view returns (bool) {
        return outputAddresses.length == 1;
    }

    /**
     * Get if the node is an disgregator
     * @return True if a disgregator, false otherwise
     */
    function isDisgregator() public view returns (bool) {
        return outputAddresses.length > 1;
    }

    /*
     * Transfer msg.value to `outputAddresses`
     */
    function __transferMsgValue() private {
        if (outputAddresses.length == 0) {
            revert EmptyOutputAddressesError();
        }

        if (isAggregator()) {
            __aggregateAmount();
        }
        else {
            __disgregateAmount();
        }
    }

    /**
     * Aggregate `msg.value` to a single address
     */
    function __aggregateAmount() private {
        outputAddresses[0].sendValue(msg.value);
    }

    /**
     * Disgregate `msg.value` among a multiple addresses
     */
    function __disgregateAmount() private {
        uint256 rem_amount = msg.value % outputAddresses.length;
        uint256 split_amount = msg.value / outputAddresses.length;

        // Transfer the split amount plus the remainder to the first address 
        outputAddresses[0].sendValue(split_amount + rem_amount);
        // Transfer the split amount to all others
        for (uint256 i = 1; i < outputAddresses.length; i++) {
            outputAddresses[i].sendValue(split_amount);
        }
    }

    //=============================================================//
    //                         FALLBACKS                           //
    //=============================================================//

    /**
     * Receive
     */
    receive() external payable {
        __transferMsgValue();
    }

    /**
     * Fallback
     */
    fallback() external payable {
        __transferMsgValue();
    }
}
