const namehash = require("eth-ens-namehash");

async function deployENS(hre) {
  const { ethers } = hre;
  const [deployer, alice, bob, charlie] = await ethers.getSigners();

  console.log("Deploying ENS contracts...");
  console.log("Deployer:", deployer.address);

  // Deploy ENS Registry
  const ENSRegistry = await ethers.getContractFactory("ENSRegistry");
  const ensRegistry = await ENSRegistry.deploy();
  await ensRegistry.waitForDeployment();
  console.log("ENS Registry deployed to:", await ensRegistry.getAddress());

  // Deploy Public Resolver
  const PublicResolver = await ethers.getContractFactory("PublicResolver");
  const publicResolver = await PublicResolver.deploy(
    await ensRegistry.getAddress(),
  );
  await publicResolver.waitForDeployment();
  console.log(
    "Public Resolver deployed to:",
    await publicResolver.getAddress(),
  );

  // Deploy Reverse Registrar
  const ReverseRegistrar = await ethers.getContractFactory("ReverseRegistrar");
  const reverseRegistrar = await ReverseRegistrar.deploy(
    await ensRegistry.getAddress(),
    await publicResolver.getAddress(),
  );
  await reverseRegistrar.waitForDeployment();
  console.log(
    "Reverse Registrar deployed to:",
    await reverseRegistrar.getAddress(),
  );

  // Set up reverse registrar in registry
  // First claim the 'reverse' node by creating it under the root (0x0)
  const reverseNodeTx = await ensRegistry.setSubnodeOwner(
    ethers.ZeroHash,
    ethers.keccak256(ethers.toUtf8Bytes("reverse")),
    deployer.address,
  );
  await reverseNodeTx.wait();

  // Now set the 'addr' subnode owner to the reverse registrar
  const addrNodeTx = await ensRegistry.setSubnodeOwner(
    namehash.hash("reverse"),
    ethers.keccak256(ethers.toUtf8Bytes("addr")),
    await reverseRegistrar.getAddress(),
  );
  await addrNodeTx.wait();

  // Create the 'eth' TLD node
  const ethNodeTx = await ensRegistry.setSubnodeOwner(
    ethers.ZeroHash,
    ethers.keccak256(ethers.toUtf8Bytes("eth")),
    deployer.address,
  );
  await ethNodeTx.wait();
  console.log("Created 'eth' TLD");

  // Register test ENS names
  const testNames = [
    { name: "alice.eth", owner: alice.address },
    { name: "bob.eth", owner: bob.address },
    { name: "charlie.eth", owner: charlie.address },
  ];

  for (const { name, owner } of testNames) {
    const label = name.split(".")[0];
    const node = namehash.hash(name);

    // Register the name
    await ensRegistry.setSubnodeRecord(
      namehash.hash("eth"),
      ethers.keccak256(ethers.toUtf8Bytes(label)),
      owner,
      await publicResolver.getAddress(),
      0,
    );

    // Set the address record - must be called by the owner of the name
    await publicResolver
      .connect(await ethers.getSigner(owner))
      .setAddr(node, owner);

    // Set reverse record (claim the reverse node for the address)
    const reverseTx = await reverseRegistrar
      .connect(await ethers.getSigner(owner))
      .setName(name);
    await reverseTx.wait();

    // Compute the reverse node for this address
    // reverseNode = keccak256(ADDR_REVERSE_NODE + sha3HexAddress(address))
    // sha3HexAddress is the keccak256 of the hex address without 0x prefix
    const addrHex = owner.slice(2).toLowerCase();
    const addrHash = ethers.keccak256(ethers.toUtf8Bytes(addrHex));
    const addrReverseNode = await reverseRegistrar.ADDR_REVERSE_NODE();
    const reverseNode = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [addrReverseNode, addrHash],
      ),
    );

    // Set the name on the reverse resolver - must be called by the owner of the reverse node
    await publicResolver
      .connect(await ethers.getSigner(owner))
      .setName(reverseNode, name);

    console.log(`Registered ${name} -> ${owner}`);
  }

  // Also register a name for the deployer
  const deployerLabel = "deployer";
  const deployerNode = namehash.hash("deployer.eth");
  await ensRegistry.setSubnodeRecord(
    namehash.hash("eth"),
    ethers.keccak256(ethers.toUtf8Bytes(deployerLabel)),
    deployer.address,
    await publicResolver.getAddress(),
    0,
  );
  await publicResolver
    .connect(deployer)
    .setAddr(deployerNode, deployer.address);
  console.log(`Registered deployer.eth -> ${deployer.address}`);

  return {
    ensRegistry,
    publicResolver,
    reverseRegistrar,
  };
}

module.exports = { deployENS };

// Only run main if this file is executed directly (not imported)
if (require.main === module) {
  deployENS(hre)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
