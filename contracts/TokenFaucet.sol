// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

/**
 * @title TokenFaucet
 * @notice Public Sepolia ETH faucet. Anyone can call `drip(to)` to send a fixed
 *         amount of ETH to `to`, subject to a per-recipient cooldown.
 *
 *   Owner responsibilities:
 *     - Fund the contract by sending ETH to it (any plain transfer is accepted).
 *     - Optionally adjust `dripAmount` / `cooldown`.
 *     - May `drain(...)` to recover residual ETH.
 *
 *   The caller of `drip` pays the gas; the recipient receives the ETH.
 */
contract TokenFaucet {
    address public immutable owner;
    uint256 public dripAmount;
    uint256 public cooldown;
    mapping(address => uint256) public lastDripAt;

    event Dripped(address indexed to, uint256 amount, address indexed by);
    event Funded(address indexed from, uint256 amount);
    event DripAmountUpdated(uint256 amount);
    event CooldownUpdated(uint256 cooldownSeconds);
    event Drained(address indexed to, uint256 amount);

    error NotOwner();
    error InvalidAddress();
    error CooldownActive(uint256 secondsRemaining);
    error InsufficientBalance();
    error TransferFailed();

    constructor(uint256 _dripAmount, uint256 _cooldownSeconds) {
        owner = msg.sender;
        dripAmount = _dripAmount;       // wei; e.g. 0.1 ether == 1e17
        cooldown   = _cooldownSeconds;  // e.g. 86400 (24h)
    }

    /// @notice Accept ETH from anyone. Counts as funding the faucet.
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    /// @notice Send `dripAmount` to `to`. Anyone may call.
    /// @param to The recipient address.
    function drip(address to) external {
        if (to == address(0)) revert InvalidAddress();

        uint256 next = lastDripAt[to] + cooldown;
        if (block.timestamp < next) revert CooldownActive(next - block.timestamp);

        uint256 amount = dripAmount;
        if (address(this).balance < amount) revert InsufficientBalance();

        lastDripAt[to] = block.timestamp;

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Dripped(to, amount, msg.sender);
    }

    /// @notice Unix timestamp at which `user` next becomes eligible for a drip.
    function nextDripAt(address user) external view returns (uint256) {
        return lastDripAt[user] + cooldown;
    }

    /// @notice Seconds until `user` is eligible (0 if eligible now).
    function secondsUntilNextDrip(address user) external view returns (uint256) {
        uint256 next = lastDripAt[user] + cooldown;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }

    // ── Owner controls ────────────────────────────────────────────────────

    function setDripAmount(uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        dripAmount = amount;
        emit DripAmountUpdated(amount);
    }

    function setCooldown(uint256 cooldownSeconds) external {
        if (msg.sender != owner) revert NotOwner();
        cooldown = cooldownSeconds;
        emit CooldownUpdated(cooldownSeconds);
    }

    /// @notice Withdraw the entire contract balance to `to`.
    function drain(address payable to) external {
        if (msg.sender != owner) revert NotOwner();
        if (to == address(0)) revert InvalidAddress();
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        if (!ok) revert TransferFailed();
        emit Drained(to, bal);
    }
}
