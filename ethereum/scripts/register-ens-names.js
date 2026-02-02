const namehash = require("eth-ens-namehash");

async function registerAdditionalNames(hre) {
  const { ethers } = hre;

  // Get the ENS resolver address from environment
  const resolverAddress = process.env.PUBLIC_ENS_RESOLVER_ADDRESS;
  if (!resolverAddress) {
    console.error("PUBLIC_ENS_RESOLVER_ADDRESS not set");
    process.exit(1);
  }

  // Get the registry address from the resolver
  const resolver = await ethers.getContractAt(
    "PublicResolver",
    resolverAddress,
  );
  const registryAddress = await resolver.ens();
  const ensRegistry = await ethers.getContractAt(
    "ENSRegistry",
    registryAddress,
  );

  console.log("Using ENS Registry:", registryAddress);
  console.log("Using Public Resolver:", resolverAddress);

  // Get signers
  const [deployer, creator, customer1, verifiedShaman, localProvider, backend] =
    await ethers.getSigners();

  // Define ENS names for all addresses
  const ensNames = [
    {
      name: "master.eth",
      owner: "0x2789023F36933E208675889869c7d3914A422921",
      signer: deployer,
    },
    {
      name: "creator.eth",
      owner: "0x96e37a0cD915c38dE8B5aAC0db61eB7eB839CeeB",
      signer: creator,
    },
    {
      name: "customer1.eth",
      owner: "0xA84036A18ecd8f4F3D21ca7f85BEcC033571b15e",
      signer: customer1,
    },
    {
      name: "verifiedshaman.eth",
      owner: "0x7617b92b06c4ce513c53Df1c818ed25f95475f69",
      signer: verifiedShaman,
    },
    {
      name: "localprovider.eth",
      owner: "0x9772d9a6A104c162b97767e6a654Be54370A042F",
      signer: localProvider,
    },
    {
      name: "backend.eth",
      owner: "0xEd7f6CA6e91AaA3Ff2C3918B5cAF02FF449Ab3A4",
      signer: backend,
    },
  ];

  // Register each name
  for (const { name, owner, signer } of ensNames) {
    const label = name.split(".")[0];
    const node = namehash.hash(name);

    try {
      // Check if already registered
      const currentOwner = await ensRegistry.owner(node);
      if (currentOwner === ethers.ZeroAddress) {
        // Register the name (must be called by owner of 'eth' node, which is deployer)
        const tx = await ensRegistry.setSubnodeRecord(
          namehash.hash("eth"),
          ethers.keccak256(ethers.toUtf8Bytes(label)),
          owner,
          resolverAddress,
          0,
        );
        await tx.wait();

        // Set the address record (must be called by the owner of the name)
        await resolver.connect(signer).setAddr(node, owner);

        console.log(`Registered ${name} -> ${owner}`);
      } else {
        console.log(`${name} already registered to ${currentOwner}`);
      }

      // Set reverse record (address -> name) - always try to set this
      const addrHex = owner.slice(2).toLowerCase();
      const addrHash = ethers.keccak256(ethers.toUtf8Bytes(addrHex));
      const addrReverseNode =
        "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";
      const reverseNode = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32"],
          [addrReverseNode, addrHash],
        ),
      );

      // Check if reverse record already set
      const currentReverseName = await resolver.name(reverseNode);
      if (currentReverseName) {
        console.log(`  Reverse record already set: ${currentReverseName}`);
        continue;
      }

      // Use ReverseRegistrar to claim the reverse node
      // Get the reverse registrar address from the registry
      const reverseRegistrarAddr = await ensRegistry.owner(addrReverseNode);
      const reverseRegistrar = await ethers.getContractAt(
        "ReverseRegistrar",
        reverseRegistrarAddr,
      );

      // Claim the reverse node (this sets the owner to the caller)
      await reverseRegistrar.connect(signer).setName(name);

      // Set the name on the reverse resolver (must be called by owner of reverse node)
      await resolver.connect(signer).setName(reverseNode, name);

      console.log(`  Set reverse record: ${owner} -> ${name}`);
    } catch (error) {
      console.error(`Failed to process ${name}:`, error.message);
    }
  }

  console.log("\nAll ENS names registered!");
}

registerAdditionalNames(hre)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
