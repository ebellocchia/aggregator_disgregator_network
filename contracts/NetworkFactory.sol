// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//=============================================================//
//                           IMPORTS                           //
//=============================================================//
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NetworkNode.sol";


/**
 * @author Emanuele Bellocchia (ebellocchia@gmail.com)
 * @title  Factory for network nodes
 * @notice It create a network of NetworkNode contracts
 */
contract NetworkFactory is 
    Ownable 
{
    //=============================================================//
    //                          CONSTANTS                          //
    //=============================================================//

    /// Minimum layers multiplier
    uint256 constant private LAYERS_MUL_MIN = 1;

    //=============================================================//
    //                           STORAGE                           //
    //=============================================================//

    /// Parent node
    address public parentNode;

    //=============================================================//
    //                             EVENTS                          //
    //=============================================================//

    /**
     * Event emitted when an aggregator node contract is cloned
     * @param cloneAddress  Cloned contract address
     * @param outputAddress Output address
     */
    event AggregatorNodeCloned(
        NetworkNode cloneAddress,
        address payable outputAddress
    );

    /**
     * Event emitted when an aggregator layer contract is created
     * @param cloneAddresses  Cloned contracts addresses
     * @param outputAddresses Output address
     * @param layersMul       Layer multiplier
     */
    event AggregatorLayerCreated(
        NetworkNode[] cloneAddresses,
        address payable[] outputAddresses,
        uint256 layersMul
    );

    /**
     * Event emitted when a disgregator node contract is cloned
     * @param cloneAddress    Cloned contract address
     * @param outputAddresses Output addresses
     */
    event DisgregatorNodeCloned(
        NetworkNode cloneAddress,
        address payable[] outputAddresses
    );

    /**
     * Event emitted when an disgregator layer contract is created
     * @param cloneAddresses  Cloned contracts addresses
     * @param outputAddresses Output address
     * @param layersMul       Layer multiplier
     */
    event DisgregatorLayerCreated(
        NetworkNode[] cloneAddresses,
        address payable[] outputAddresses,
        uint256 layersMul
    );

    //=============================================================//
    //                           ERRORS                            //
    //=============================================================//

    /**
     * Error raised if failing to create parent contract
     */
    error ParentContractError();

    /**
     * Error raised if creating a network with an invalid layers multiplier
     */
    error InvalidLayersMulError();

    /**
     * Error raised if creating a network with an invalid number of nodes
     */
    error InvalidNodesNumError();

    //=============================================================//
    //                         FUNCTIONS                           //
    //=============================================================//
    
    /** 
     * Constructor
     */
    constructor() {
        __createParentContract();
    }

    /**
     * Create an aggregator layer
     * @param outputAddresses_ Output addresses
     * @param layersMul_       Layers multiplier
     * @return List of addresses of created contracts
     */
    function createAggregatorLayer(
        address payable[] memory outputAddresses_,
        uint256 layersMul_
    ) public onlyOwner returns (NetworkNode[] memory) {
        if (layersMul_ < LAYERS_MUL_MIN) {
            revert InvalidLayersMulError();
        }
        if (outputAddresses_.length == 0) {
            revert InvalidNodesNumError(); 
        }

        uint256 tot_nodes = outputAddresses_.length * layersMul_;
        NetworkNode[] memory layer = new NetworkNode[](tot_nodes);
        for (uint256 i = 0; i < tot_nodes; i++) {
            layer[i] = __cloneAggregatorNode(outputAddresses_[i / layersMul_]);
        }

        emit AggregatorLayerCreated(
            layer,
            outputAddresses_,
            layersMul_
        );

        return layer;
    }

    /**
     * Create an disgregator layer
     * @param outputAddresses_ Output addresses
     * @param layersMul_       Layers multiplier
     * @return List of addresses of created contracts
     */
    function createDisgregatorLayer(
        address payable[] memory outputAddresses_,
        uint256 layersMul_
    ) public onlyOwner returns (NetworkNode[] memory) {
        if (layersMul_ < LAYERS_MUL_MIN) {
            revert InvalidLayersMulError();
        }

        uint256 tot_nodes = outputAddresses_.length / layersMul_;
        if (tot_nodes == 0) {
           revert InvalidNodesNumError(); 
        }

        NetworkNode[] memory layer = new NetworkNode[](tot_nodes);
        for (uint256 i = 0; i < tot_nodes; i++) {
            layer[i] = __cloneDisgregatorNode(outputAddresses_);
        }

        emit DisgregatorLayerCreated(
            layer,
            outputAddresses_,
            layersMul_
        );

        return layer;
    }

    /**
     * Clone an aggregator node with the given `outputAddress_`
     * @param outputAddress_ Output addresses
     * @return Contract address
     */
    function cloneAggregatorNode(
        address payable outputAddress_
    ) public onlyOwner returns (NetworkNode) {
        NetworkNode node = __cloneAggregatorNode(outputAddress_);

        emit AggregatorNodeCloned(node, outputAddress_);

        return node;
    }

    /**
     * Clone a disgregator node with the given `outputAddresses_`
     * @param outputAddresses_ Output addresses
     * @return Contract address
     */
    function cloneDisgregatorNode(
        address payable[] memory outputAddresses_
    ) public onlyOwner returns (NetworkNode) {
        NetworkNode node = __cloneDisgregatorNode(outputAddresses_);

        emit DisgregatorNodeCloned(node, outputAddresses_);

        return node;
    }

    /**
     * Clone an aggregator node with the given `outputAddress_`
     * @param outputAddress_ Output addresses
     * @return Contract address
     */
    function __cloneAggregatorNode(
        address payable outputAddress_
    ) private returns (NetworkNode) {
        NetworkNode node = NetworkNode(__cloneNetworkNode());
        node.initAsAggregator(outputAddress_);

        return node;
    }

    /**
     * Clone a disgregator node with the given `outputAddresses_`
     * @param outputAddresses_ Output addresses
     * @return Contract address
     */
    function __cloneDisgregatorNode(
        address payable[] memory outputAddresses_
    ) private returns (NetworkNode) {
        NetworkNode node = NetworkNode(__cloneNetworkNode());
        node.initAsDisgregator(outputAddresses_);

        return node;
    }

    /**
     * Clone a network node
     * @return Contract address
     */
    function __cloneNetworkNode() private returns (address payable) {
        return payable(
            Clones.clone(parentNode)
        );
    }

    /**
     * Create parent contract
     */
    function __createParentContract() private {
        parentNode = address(new NetworkNode());
        if (parentNode == address(0)) {
            revert ParentContractError();
        }
    }
}
