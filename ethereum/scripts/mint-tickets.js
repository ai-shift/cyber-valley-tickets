import bs58 from "bs58";
import hre from "hardhat";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_HOST = `http://127.0.0.1:${BACKEND_PORT}`;

// Cache for auth tokens
const tokenCache = new Map();

// Helper to get or create auth token for a user
async function getAuthToken(address) {
  if (tokenCache.has(address)) {
    return tokenCache.get(address);
  }
  // Try to get existing token
  const resp = await fetch(`${BACKEND_HOST}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (resp.ok) {
    const data = await resp.json();
    tokenCache.set(address, data.token);
    return data.token;
  }
  throw new Error(`Failed to get token for ${address}: ${await resp.text()}`);
}

async function main() {
  // Get deployed contracts
  const eventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    process.env.PUBLIC_EVENT_MANAGER_ADDRESS,
  );
  const erc20 = await hre.ethers.getContractAt(
    "SimpleERC20Xylose",
    process.env.PUBLIC_ERC20_ADDRESS,
  );

  // Get signers
  const [_, __, completeSlave] = await hre.ethers.getSigners();

  // Event configurations with prices
  const events = [
    { price: 100 }, // Event 0 (previous week event)
    { price: 50 }, // Event 1 (previous week event)
    { price: 69 }, // Event 2 (not used for tickets)
  ];

  // Ticket configurations
  // Categories are created in deploy-dev.js:
  // - Previous week events (0-1) get "General" categories with IDs 0-1
  // - Current week events (2-3) get categories with IDs 2-6
  const tickets = [
    // Event 0 - Multiple tickets for multi-ticket listing test
    // Event 0 has category 0 ("General" created in deploy-dev.js line 316-328)
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 0, // General category for event 0
      socials: {
        network: "instagram",
        value: "@buyer1_event0",
      },
    },
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 0, // General category for event 0 (same category, multiple tickets)
      socials: {
        network: "telegram",
        value: "@buyer2_event0",
      },
    },
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 0, // General category for event 0 (same category, multiple tickets)
      socials: {
        network: "discord",
        value: "@buyer3_event0",
      },
    },
    // Event 1 - Single ticket
    // Event 1 has category 1 ("General" created in deploy-dev.js line 316-328)
    {
      owner: completeSlave,
      eventId: 1,
      categoryId: 1, // General category for event 1
      socials: {
        network: "discord",
        value: "@buyer_event1",
      },
    },
  ];

  for (const cfg of tickets) {
    // Upload order metadata
    const orderResponse = await fetch(`${BACKEND_HOST}/api/ipfs/orders/meta`, {
      method: "PUT",
      body: JSON.stringify({
        event_id: cfg.eventId,
        buyer_address: cfg.owner.address,
        socials: cfg.socials,
        tickets: [
          {
            categoryId: cfg.categoryId,
            categoryName: "Standard",
            price: events[cfg.eventId].price,
            quantity: 1,
          },
        ],
        total_tickets: 1,
        total_price: events[cfg.eventId].price,
        currency: "USDC",
        referral_data: "",
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${await getAuthToken(cfg.owner.address)}`,
      },
    });

    if (!orderResponse.ok) {
      const body = await orderResponse.text();
      throw new Error(
        `failed to upload order meta with ${body} for config ${JSON.stringify(cfg)}`,
      );
    }

    const order = await orderResponse.json();
    const mh = getBytes32FromMultiash(order.cid);

    // Mint ERC20
    const price = events[cfg.eventId].price;
    await (await erc20.connect(cfg.owner).mint(price)).wait();
    await (
      await erc20
        .connect(cfg.owner)
        .approve(await eventManager.getAddress(), price)
    ).wait();

    // Mint ticket with correct category for the event
    await (
      await eventManager
        .connect(cfg.owner)
        .mintTickets(
          cfg.eventId,
          cfg.categoryId,
          1,
          mh.digest,
          mh.hashFunction,
          mh.size,
          "",
        )
    ).wait();

    console.log(
      "ticket minted",
      "owner",
      cfg.owner.address,
      "event",
      cfg.eventId,
      "category",
      cfg.categoryId,
      "order CID",
      order.cid,
    );
  }

  console.log("All tickets minted successfully");
}

function getBytes32FromMultiash(multihash) {
  const decoded = bs58.decode(multihash);

  return {
    digest: `0x${Buffer.from(decoded.slice(2)).toString("hex")}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
