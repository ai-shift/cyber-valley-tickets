import bs58 from "bs58";
import ERC20Module from "../ignition/modules/ERC20";
import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";

const MASTER_EOA = "0x2789023F36933E208675889869c7d3914A422921";
const DEV_TEAM_EOA = MASTER_EOA;
const API_HOST = process.env.PUBLIC_API_HOST;
const IPFS_HOST = process.env.IPFS_PUBLIC_HOST;

async function main() {
  // Validation
  if (API_HOST == null || API_HOST === "") {
    throw new Error(`PUBLIC_API_HOST env var is missing: ${API_HOST}`);
  }
  if (IPFS_HOST == null || IPFS_HOST === "") {
    throw new Error(`IPFS_PUBLIC_HOST env var is missing: ${IPFS_HOST}`);
  }

  // Deploy contracts
  const { erc20 } = await hre.ignition.deploy(ERC20Module, {});
  const { eventTicket } = await hre.ignition.deploy(EventTicketModule, {
    parameters: { EventTicket: { masterAddress: MASTER_EOA } },
  });
  const { eventManager } = await hre.ignition.deploy(EventManagerModule, {
    parameters: {
      EventManager: {
        masterAddress: MASTER_EOA,
        eventTicket: await eventTicket.getAddress(),
        erc20: await erc20.getAddress(),
      },
    },
  });
  await eventTicket.setEventManagerAddress(await eventManager.getAddress());

  // Seed state
  const [master, creatorSlave, completeSlave, verifiedShaman, localProvider, backend] =
    await hre.ethers.getSigners();
  await eventManager.connect(master).setMasterShare(50);
  await eventManager
    .connect(master)
    .grantLocalProvider(localProvider.address, 100);

  // Grant BACKEND_ROLE to backend test signer and actual backend EOA
  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  await eventManager
    .connect(master)
    .grantRole(BACKEND_ROLE, backend.address);

  // Grant VERIFIED_SHAMAN_ROLE to verifiedShaman (via backend role)
  const VERIFIED_SHAMAN_ROLE = await eventManager.VERIFIED_SHAMAN_ROLE();
  await eventManager
    .connect(backend)
    .grantRole(VERIFIED_SHAMAN_ROLE, verifiedShaman.address);

  console.log(
    "master",
    master.address,
    "creatorSlave",
    creatorSlave.address,
    "completeSlave",
    completeSlave.address,
    "verifiedShaman",
    verifiedShaman.address,
  );

  // Create places
  const places = [
    {
      title: "foo",
      geometry: {
        type: "Point",
        coordinates: [{lat: -8.291059, lng: 115.0841631}],
      },
    },
    {
      title: "bar",
      geometry: {
        type: "Point",
        coordinates: [{lat: -8.299827, lng: 115.098407}],
      },
    },
  ];
  for (const cfg of places) {
    const body = new FormData();
    body.append("title", cfg.title);
    body.append("description", "foo");
    body.append("geometry", JSON.stringify(cfg.geometry));
    const resp = await fetch(`${API_HOST}/api/ipfs/places/meta`, {
      body,
      method: "PUT",
      headers: {
        Authorization: `Token ${master.address}`,
      },
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`failed to upload place's meta with ${body}`);
    }
    const result = await resp.json();
    const mh = getBytes32FromMultiash(result.cid);

    // Submit event place request as verified shaman
    const submitTx = await eventManager
      .connect(verifiedShaman)
      .submitEventPlaceRequest(
        100,
        20,
        5,
        1,
        1,
        true,
        mh.digest,
        mh.hashFunction,
        mh.size,
      );
    const submitReceipt = await submitTx.wait();
    const newEventPlaceRequestEvent = submitReceipt.logs
      .filter((e) => e.fragment?.name === "NewEventPlaceRequest")
      .find((e) => e);
    if (!newEventPlaceRequestEvent) {
      throw new Error("NewEventPlaceRequest event not found");
    }
    const eventPlaceId = newEventPlaceRequestEvent.args.id;

    // Approve event place as local provider
    await eventManager.connect(localProvider).approveEventPlace(eventPlaceId);

    console.log("place created", "config", cfg, "multihash", mh, "id", eventPlaceId.toString());
  }

  // Submit event requests
  const events = [
    {
      title: "ThE fIrSt eVeNt",
      description: "GuR sVeFg rIrAg",
      placeId: 0,
      price: 100,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      daysAmount: 3,
      cover: "https://www.toei-animation.com/wp-content/uploads/2023/12/Egghead-KV_with-copyright-for-website-scaled.jpg",
      creator: creatorSlave,
      socials: {
        network: "telegram",
        value: "@john-doe",
      },
    },
    {
      title: "let it be the other one",
      description: "yrg vg or gur bgure bar",
      placeId: 1,
      price: 50,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      daysAmount: 2,
      cover: "https://images.gog-statics.com/8e401209b82f9a43ff803287e3970e703b1eaeb505ae25c96108499dd7a210e5_product_card_v2_mobile_slider_639.jpg",
      creator: creatorSlave,
      socials: {
        network: "telegram",
        value: "@clare-doe",
      },
    },
    {
      title: "pending pending pending",
      description: "la lala lalalala",
      placeId: 1,
      price: 69,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      daysAmount: 5,
      cover: "https://i.imgur.com/TOHh4OL.png",
      creator: creatorSlave,
      socials: {
        network: "telegram",
        value: "@michael-doe",
      },
    },
  ];
  for (const cfg of events) {
    // Fetch cover with retry logic
    const imgResponse = await fetchWithRetry(cfg.cover);
    const imgBlob = await imgResponse.blob();

    // Upload socials
    const socialsResponse = await fetch(`${API_HOST}/api/ipfs/users/socials`, {
      method: "PUT",
      body: JSON.stringify(cfg.socials),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${cfg.creator.address}`,
      },
    });
    if (!socialsResponse.ok) {
      const body = await socialsResponse.text();
      throw new Error(`failed to upload socials with ${body}`);
    }
    const socials = await socialsResponse.json();

    // Upload even metadata
    const body = new FormData();
    body.set("title", cfg.title);
    body.set("description", cfg.description);
    body.set("website", cfg.website);
    body.set("cover", imgBlob, "image.jpg");
    body.set("socials_cid", socials.cid);
    const eventMetaResponse = await fetch(`${API_HOST}/api/ipfs/events/meta`, {
      body,
      method: "PUT",
      headers: {
        Authorization: `Token ${cfg.creator.address}`,
      },
    });
    if (!eventMetaResponse.ok) {
      const body = await eventMetaResponse.text();
      throw new Error(`failed to upload event's meta with ${body}`);
    }
    const eventMeta = await eventMetaResponse.json();
    cfg.coverCID = eventMeta.cover;
    const mh = getBytes32FromMultiash(eventMeta.cid);
    await erc20.connect(cfg.creator).mint(100);
    await erc20
      .connect(cfg.creator)
      .approve(await eventManager.getAddress(), 100);
    await eventManager
      .connect(cfg.creator)
      .submitEventRequest(
        cfg.placeId,
        cfg.price,
        Math.floor(cfg.startDate / 1000),
        cfg.daysAmount,
        mh.digest,
        mh.hashFunction,
        mh.size,
      );
    console.log("event created", "config", cfg, "multihash", mh);
  }

  // Approve some events
  for (let eventId = 0; eventId < events.length - 1; eventId++) {
    await eventManager.connect(localProvider).approveEvent(eventId);
    console.log("event", events[eventId].title, "approved");
  }

  // Mint tickets
  const tickets = [
    {
      owner: completeSlave,
      eventId: 0,
      socials: {
        network: "instagram",
        value: "@username1",
      },
    },
    {
      owner: completeSlave,
      eventId: 1,
      socials: {
        network: "discord",
        value: "@username2",
      },
    },
  ];
  for (const cfg of tickets) {
    // Upload socials
    const socialsResponse = await fetch(`${API_HOST}/api/ipfs/tickets/meta`, {
      method: "PUT",
      body: JSON.stringify({
        eventid: cfg.eventId,
        socials: cfg.socials,
        // NOTE: Ugly AF, but pausing this script and running indexer is  even worse
        eventcover: `${IPFS_HOST}/ipfs/${events[cfg.eventId].coverCID}`,
        eventtitle: events[cfg.eventId].title,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${cfg.owner.address}`,
      },
    });
    if (!socialsResponse.ok) {
      const body = await socialsResponse.text();
      throw new Error(
        `failed to upload socials with ${body} for config ${JSON.stringify(cfg)}`,
      );
    }
    const socials = await socialsResponse.json();
    const mh = getBytes32FromMultiash(socials.cid);

    // Mint ERC20
    const price = events[cfg.eventId].price;
    await erc20.connect(cfg.owner).mint(price);
    await erc20
      .connect(cfg.owner)
      .approve(await eventManager.getAddress(), price);

    // Mint ticket
    await eventManager
      .connect(cfg.owner)
      .mintTicket(cfg.eventId, mh.digest, mh.hashFunction, mh.size);

    console.log(
      "ticket minted",
      "owner",
      cfg.owner.address,
      "event",
      events[cfg.eventId].title,
      "ticket CID",
      socials.cid,
    );
  }

  // Print deployed addresses
  console.log(`export PUBLIC_ERC20_ADDRESS=${await erc20.getAddress()}`);
  console.log(
    `export PUBLIC_EVENT_TICKET_ADDRESS=${await eventTicket.getAddress()}`,
  );
  console.log(
    `export PUBLIC_EVENT_MANAGER_ADDRESS=${await eventManager.getAddress()}`,
  );
}

async function fetchWithRetry(url, maxRetries = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      if (attempt === maxRetries) {
        const body = await response.text();
        throw new Error(`failed to fetch ${url} after ${maxRetries} attempts: ${body}`);
      }
      console.log(`Attempt ${attempt} failed for ${url}, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`failed to fetch ${url} after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`Attempt ${attempt} failed for ${url} with error: ${error.message}, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, attempt * delayMs));
    }
  }
}

function getBytes32FromMultiash(multihash) {
  const decoded = bs58.decode(multihash);

  return {
    digest: `0x${Buffer.from(decoded.slice(2)).toString("hex")}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

main().catch(console.error);
