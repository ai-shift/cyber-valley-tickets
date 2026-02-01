import bs58 from "bs58";
import hre from "hardhat";

const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_HOST = `http://127.0.0.1:${BACKEND_PORT}`;

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
    { price: 100 }, // Event 0
    { price: 50 }, // Event 1
    { price: 69 }, // Event 2 (not used for tickets)
  ];

  // Ticket configurations
  const tickets = [
    // Event 0 - Multiple tickets for multi-ticket listing test
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 0, // Women category for event 0
      socials: {
        network: "instagram",
        value: "@buyer1_event0",
      },
    },
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 1, // Locals category for event 0
      socials: {
        network: "telegram",
        value: "@buyer2_event0",
      },
    },
    {
      owner: completeSlave,
      eventId: 0,
      categoryId: 2, // Families category for event 0
      socials: {
        network: "discord",
        value: "@buyer3_event0",
      },
    },
    // Event 1 - Single ticket
    {
      owner: completeSlave,
      eventId: 1,
      categoryId: 3, // Early Bird category for event 1
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
        Authorization: `Token ${cfg.owner.address}`,
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
