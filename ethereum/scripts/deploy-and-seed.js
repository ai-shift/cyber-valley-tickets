/**
 * Unified Deployment and Seeding Script
 * 
 * This script combines contract deployment, entity creation, and ticket minting
 * into a single pipeline. It eliminates the need for hardcoded event IDs and
 * removes the incorrect assumption that tickets must be minted after indexing.
 * 
 * Architecture:
 * 1. Deploy contracts (EventManager, EventTicket, ERC20, RevenueSplitter, ENS)
 * 2. Create places and events on-chain (returns actual IDs)
 * 3. Mint tickets using returned event IDs (no hardcoding)
 * 4. Indexer (started separately) will process all events
 * 
 * Key Principle: Contract is source of truth, indexer just syncs to DB.
 * Tickets can be minted immediately after events are created on-chain.
 */

import fs from "node:fs";
import path from "node:path";
import bs58 from "bs58";
import ERC20Module from "../ignition/modules/ERC20";
import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";
import RevenueSplitterModule from "../ignition/modules/RevenueSplitter";
import { deployENS } from "./deploy-ens";

const MASTER_EOA = "0x2789023F36933E208675889869c7d3914A422921";
const DEV_TEAM_EOA = MASTER_EOA;
const API_HOST = process.env.PUBLIC_API_HOST;
const BACKEND_PORT = process.env.BACKEND_PORT || "8000";
const BACKEND_HOST = `http://127.0.0.1:${BACKEND_PORT}`;
const IPFS_HOST = process.env.IPFS_PUBLIC_HOST;

// Cache for auth tokens
const tokenCache = new Map();

// ============================================================================
// Helpers
// ============================================================================

async function setBlockchainTime(targetDate) {
  const timestamp = Math.floor(targetDate.getTime() / 1000);
  await network.provider.send("evm_mine", [timestamp]);
  console.log(`Blockchain time set to: ${targetDate.toISOString()}`);
}

function getWeekDates(weeksAgo = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysSinceMonday);
  currentMonday.setHours(0, 0, 0, 0);

  const targetMonday = new Date(currentMonday);
  targetMonday.setDate(currentMonday.getDate() - (weeksAgo * 7));

  return targetMonday;
}

function getBytes32FromMultiash(multihash) {
  const decoded = bs58.decode(multihash);
  return {
    digest: `0x${Buffer.from(decoded.slice(2)).toString("hex")}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

async function getAuthToken(address) {
  if (tokenCache.has(address)) {
    return tokenCache.get(address);
  }
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

// ============================================================================
// Phase 1: Contract Deployment
// ============================================================================

async function deployContracts() {
  console.log("\n=== PHASE 1: Deploying Contracts ===\n");

  // Deploy ENS contracts first
  const { ensRegistry, publicResolver, reverseRegistrar } = await deployENS(hre);

  // Calculate week start dates for time travel
  const prevWeekStart = getWeekDates(2);
  
  // Deploy contracts with initialOffset set to past date (2 weeks ago)
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
        initialOffset: Math.floor(prevWeekStart.getTime() / 1000),
      },
    },
  });
  await eventTicket.setEventManagerAddress(await eventManager.getAddress());

  const { splitter } = await hre.ignition.deploy(RevenueSplitterModule, {
    parameters: {
      DynamicRevenueSplitter: {
        usdt: await erc20.getAddress(),
        cyberiaDAO: MASTER_EOA,
        cvePtPma: DEV_TEAM_EOA,
        admin: MASTER_EOA,
      },
    },
  });

  // Setup roles and configuration
  const [
    master,
    creatorSlave,
    completeSlave,
    verifiedShaman,
    localProvider,
    backend,
  ] = await hre.ethers.getSigners();

  await eventManager
    .connect(master)
    .setRevenueSplitter(await splitter.getAddress());

  // Setup default profile
  await splitter
    .connect(master)
    .createDistributionProfile([localProvider.address], [10000]);
  await splitter.connect(master).setDefaultProfile(1);

  await eventManager.connect(master).grantLocalProvider(localProvider.address);

  // Grant BACKEND_ROLE to backend test signer
  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  await eventManager.connect(master).grantRole(BACKEND_ROLE, backend.address);

  // Grant VERIFIED_SHAMAN_ROLE to verifiedShaman
  const VERIFIED_SHAMAN_ROLE = await eventManager.VERIFIED_SHAMAN_ROLE();
  await eventManager
    .connect(backend)
    .grantRole(VERIFIED_SHAMAN_ROLE, verifiedShaman.address);

  console.log("Contracts deployed successfully");
  console.log(`  EventManager: ${await eventManager.getAddress()}`);
  console.log(`  EventTicket: ${await eventTicket.getAddress()}`);
  console.log(`  ERC20: ${await erc20.getAddress()}`);

  return {
    eventManager,
    eventTicket,
    erc20,
    splitter,
    ensRegistry,
    publicResolver,
    reverseRegistrar,
    signers: { master, creatorSlave, completeSlave, verifiedShaman, localProvider, backend },
  };
}

// ============================================================================
// Phase 2: Create Places
// ============================================================================

async function createPlaces(eventManager, master, verifiedShaman, localProvider) {
  console.log("\n=== PHASE 2: Creating Event Places ===\n");

  const prevWeekStart = getWeekDates(2);
  await setBlockchainTime(prevWeekStart);

  const placeConfigs = [
    {
      title: "Beach Venue",
      geometry: {
        type: "Point",
        coordinates: [{ lat: -8.291059, lng: 115.0841631 }],
      },
    },
    {
      title: "Mountain Retreat",
      geometry: {
        type: "Point",
        coordinates: [{ lat: -8.299827, lng: 115.098407 }],
      },
    },
    {
      title: "City Center Hall",
      geometry: {
        type: "Point",
        coordinates: [{ lat: -8.285, lng: 115.09 }],
      },
    },
    {
      title: "Riverside Garden",
      geometry: {
        type: "Point",
        coordinates: [{ lat: -8.295, lng: 115.08 }],
      },
    },
  ];

  const places = [];

  for (const cfg of placeConfigs) {
    // Upload metadata to IPFS
    const body = new FormData();
    body.append("title", cfg.title);
    body.append("description", "A beautiful venue for events");
    body.append("geometry", JSON.stringify(cfg.geometry));
    
    const resp = await fetch(`${BACKEND_HOST}/api/ipfs/places/meta`, {
      body,
      method: "PUT",
      headers: { Authorization: `Token ${master.address}` },
    });
    
    if (!resp.ok) {
      throw new Error(`Failed to upload place metadata: ${await resp.text()}`);
    }
    
    const result = await resp.json();
    const mh = getBytes32FromMultiash(result.cid);

    // Submit event place request as verified shaman
    const submitTx = await eventManager
      .connect(verifiedShaman)
      .submitEventPlaceRequest(
        100, 20, 5, 1, 1, true,
        mh.digest, mh.hashFunction, mh.size
      );
    
    const submitReceipt = await submitTx.wait();
    const newEventPlaceRequestEvent = submitReceipt.logs
      .filter((e) => e.fragment?.name === "NewEventPlaceRequest")
      .find((e) => e);
    
    if (!newEventPlaceRequestEvent) {
      throw new Error("NewEventPlaceRequest event not found");
    }
    
    const placeId = newEventPlaceRequestEvent.args.id;

    // Approve event place as local provider
    await eventManager.connect(localProvider).approveEventPlace(placeId, 100);

    places.push({ id: placeId, ...cfg, cid: result.cid });
    console.log(`Created place: ${cfg.title} (ID: ${placeId})`);
  }

  return places;
}

// ============================================================================
// Phase 3: Create Events
// ============================================================================

async function createEvents(eventManager, erc20, places, signers) {
  console.log("\n=== PHASE 3: Creating Events ===\n");

  const { master, creatorSlave, verifiedShaman, localProvider } = signers;
  const prevWeekStart = getWeekDates(2);
  const currentWeekStart = getWeekDates(0);

  // Previous week events - created while time is at prevWeekStart
  const prevWeekEventConfigs = [
    {
      title: "Summer Festival - Prev Week",
      description: "Previous week festival",
      website: "https://example.com/festival",
      placeIndex: 0,
      price: 100,
      startDate: new Date(prevWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      daysAmount: 3,
      cover: "seed-data/event-covers/event-1-onepiece.jpg",
      creator: creatorSlave,
      socials: { network: "telegram", value: "@prev-week-creator" },
      categories: [{ name: "General", discount: 0, quota: 0, unlimited: true }],
    },
    {
      title: "Tech Conference - Prev Week",
      description: "Previous week conference",
      website: "https://example.com/conference",
      placeIndex: 1,
      price: 50,
      startDate: new Date(prevWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
      daysAmount: 2,
      cover: "seed-data/event-covers/event-2-game.jpg",
      creator: creatorSlave,
      socials: { network: "telegram", value: "@prev-week-conf" },
      categories: [{ name: "General", discount: 0, quota: 0, unlimited: true }],
    },
  ];

  // Current week events - created after moving time to current week
  const currentWeekEventConfigs = [
    {
      title: "ThE fIrSt eVeNt",
      description: "GuR sVeFg rIrAg",
      website: "https://example.com/first",
      placeIndex: 0,
      price: 100,
      startDate: new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      daysAmount: 3,
      cover: "seed-data/event-covers/event-1-onepiece.jpg",
      creator: creatorSlave,
      socials: { network: "telegram", value: "@john-doe" },
      categories: [
        { name: "Women", discount: 2000, quota: 30, unlimited: false },
        { name: "Locals", discount: 1000, quota: 50, unlimited: false },
        { name: "Families", discount: 5000, quota: 0, unlimited: true },
      ],
    },
    {
      title: "let it be the other one",
      description: "yrg vg or gur bgure bar",
      website: "https://example.com/other",
      placeIndex: 1,
      price: 50,
      startDate: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
      daysAmount: 2,
      cover: "seed-data/event-covers/event-2-game.jpg",
      creator: creatorSlave,
      socials: { network: "telegram", value: "@clare-doe" },
      categories: [
        { name: "Early Bird", discount: 1500, quota: 25, unlimited: false },
        { name: "Students", discount: 2500, quota: 0, unlimited: true },
      ],
    },
    {
      title: "pending pending pending",
      description: "la lala lalalala",
      website: "https://example.com/pending",
      placeIndex: 1,
      price: 69,
      startDate: new Date(currentWeekStart.getTime() + 10 * 24 * 60 * 60 * 1000),
      daysAmount: 5,
      cover: "seed-data/event-covers/event-3-sample.png",
      creator: creatorSlave,
      socials: { network: "telegram", value: "@michael-doe" },
      categories: [{ name: "General", discount: 0, quota: 0, unlimited: true }],
      skipApproval: true,
    },
  ];

  const events = [];

  // Create previous week events (time is already at prevWeekStart from createPlaces)
  console.log("Creating previous week events...");
  for (const cfg of prevWeekEventConfigs) {
    const event = await createSingleEvent(eventManager, erc20, places, cfg, events.length, verifiedShaman, localProvider);
    events.push(event);
  }

  // Move time to current week
  await setBlockchainTime(currentWeekStart);

  // Create current week events
  console.log("Creating current week events...");
  for (const cfg of currentWeekEventConfigs) {
    const event = await createSingleEvent(eventManager, erc20, places, cfg, events.length, verifiedShaman, localProvider);
    events.push(event);
  }

  return events;
}

// Helper function to create a single event
async function createSingleEvent(eventManager, erc20, places, cfg, eventId, verifiedShaman, localProvider) {
  // Get actual place ID from the places array
  const placeId = places[cfg.placeIndex].id;

  // Upload socials
  const socialsResponse = await fetch(
    `${BACKEND_HOST}/api/ipfs/users/socials`,
    {
      method: "PUT",
      body: JSON.stringify(cfg.socials),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${cfg.creator.address}`,
      },
    }
  );
  if (!socialsResponse.ok) {
    throw new Error(`Failed to upload socials: ${await socialsResponse.text()}`);
  }
  const socials = await socialsResponse.json();

  // Upload event metadata
  const imgBuffer = fs.readFileSync(path.join(__dirname, cfg.cover));
  const imgBlob = new Blob([imgBuffer]);

  const body = new FormData();
  body.set("title", cfg.title);
  body.set("description", cfg.description);
  body.set("website", cfg.website || "");
  body.set("cover", imgBlob, "image.jpg");
  body.set("socials_cid", socials.cid);

  const eventMetaResponse = await fetch(
    `${BACKEND_HOST}/api/ipfs/events/meta`,
    {
      body,
      method: "PUT",
      headers: { Authorization: `Token ${cfg.creator.address}` },
    }
  );
  if (!eventMetaResponse.ok) {
    throw new Error(`Failed to upload event metadata: ${await eventMetaResponse.text()}`);
  }
  const eventMeta = await eventMetaResponse.json();
  const mh = getBytes32FromMultiash(eventMeta.cid);

  // Mint tokens and approve
  await erc20.connect(cfg.creator).mint(100);
  await erc20.connect(cfg.creator).approve(await eventManager.getAddress(), 100);

  // Submit event request
  await eventManager.connect(cfg.creator).submitEventRequest(
    placeId,
    cfg.price,
    Math.floor(cfg.startDate / 1000),
    cfg.daysAmount,
    mh.digest,
    mh.hashFunction,
    mh.size
  );

  // Create categories
  for (const cat of cfg.categories) {
    await eventManager
      .connect(verifiedShaman)
      .createCategory(
        eventId,
        cat.name,
        cat.discount,
        cat.quota,
        cat.unlimited
      );
  }

  // Approve event (unless skipApproval is set)
  if (!cfg.skipApproval) {
    await eventManager.connect(localProvider).approveEvent(eventId);
  }

  console.log(`Created event: ${cfg.title} (ID: ${eventId}, Place: ${placeId})`);

  return {
    id: eventId,
    ...cfg,
    placeId,
    cid: eventMeta.cid,
  };
}

// ============================================================================
// Phase 4: Mint Tickets
// ============================================================================

async function mintTickets(eventManager, erc20, events, signers) {
  console.log("\n=== PHASE 4: Minting Tickets ===\n");

  const { completeSlave } = signers;

  // Ticket configs reference events by INDEX in the events array
  // NOT by hardcoded on-chain ID
  const ticketConfigs = [
    // Event 0 (prev week) - Multiple tickets
    { eventIndex: 0, categoryId: 0, socials: { network: "instagram", value: "@buyer1_event0" } },
    { eventIndex: 0, categoryId: 0, socials: { network: "telegram", value: "@buyer2_event0" } },
    { eventIndex: 0, categoryId: 0, socials: { network: "discord", value: "@buyer3_event0" } },
    // Event 1 (prev week) - Single ticket
    { eventIndex: 1, categoryId: 0, socials: { network: "discord", value: "@buyer_event1" } },
  ];

  for (const cfg of ticketConfigs) {
    // Get the actual event from the array using the index
    const event = events[cfg.eventIndex];
    const price = event.price;

    // Upload order metadata
    const orderResponse = await fetch(`${BACKEND_HOST}/api/ipfs/orders/meta`, {
      method: "PUT",
      body: JSON.stringify({
        event_id: event.id, // Use actual event ID from the event object
        buyer_address: completeSlave.address,
        socials: cfg.socials,
        tickets: [{
          categoryId: cfg.categoryId,
          categoryName: "Standard",
          price: price,
          quantity: 1,
        }],
        total_tickets: 1,
        total_price: price,
        currency: "USDC",
        referral_data: "",
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${await getAuthToken(completeSlave.address)}`,
      },
    });

    if (!orderResponse.ok) {
      throw new Error(`Failed to upload order meta: ${await orderResponse.text()}`);
    }

    const order = await orderResponse.json();
    const mh = getBytes32FromMultiash(order.cid);

    // Mint ERC20 and approve
    await (await erc20.connect(completeSlave).mint(price)).wait();
    await (await erc20.connect(completeSlave).approve(await eventManager.getAddress(), price)).wait();

    // Mint ticket using ACTUAL event ID (not hardcoded)
    await (await eventManager
      .connect(completeSlave)
      .mintTickets(
        event.id, // ← Dynamic: from events array, not hardcoded
        cfg.categoryId,
        1,
        mh.digest,
        mh.hashFunction,
        mh.size,
        ""
      )).wait();

    console.log(`Minted ticket for event: ${event.title} (Event ID: ${event.id})`);
  }

  console.log("\nAll tickets minted successfully");
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("============================================================");
  console.log("Cyber Valley Tickets - Deploy and Seed");
  console.log("============================================================");
  console.log("\nArchitecture:");
  console.log("  1. Deploy contracts");
  console.log("  2. Create places & events on-chain");
  console.log("  3. Mint tickets on-chain (using returned event IDs)");
  console.log("  4. Indexer (started separately) processes all events");
  console.log("\nNote: Contract is source of truth. Indexer syncs to DB.");
  console.log("      Tickets can be minted immediately after event creation.");
  console.log("============================================================\n");

  // Validation
  if (!API_HOST) throw new Error("PUBLIC_API_HOST env var is missing");
  if (!IPFS_HOST) throw new Error("IPFS_PUBLIC_HOST env var is missing");

  // Phase 1: Deploy contracts
  const { eventManager, eventTicket, erc20, splitter, signers } = await deployContracts();

  // Phase 2: Create places (returns places with IDs)
  const places = await createPlaces(
    eventManager,
    signers.master,
    signers.verifiedShaman,
    signers.localProvider
  );

  // Phase 3: Create events (returns events with IDs)
  const events = await createEvents(eventManager, erc20, places, signers);

  // Phase 4: Mint tickets (uses returned event objects, not hardcoded IDs)
  await mintTickets(eventManager, erc20, events, signers);

  // Output contract addresses for env
  console.log("\n=== Deployment Complete ===\n");
  console.log("Contract Addresses:");
  console.log(`export PUBLIC_ERC20_ADDRESS=${await erc20.getAddress()}`);
  console.log(`export PUBLIC_EVENT_TICKET_ADDRESS=${await eventTicket.getAddress()}`);
  console.log(`export PUBLIC_EVENT_MANAGER_ADDRESS=${await eventManager.getAddress()}`);
  console.log(`export PUBLIC_REVENUE_SPLITTER_ADDRESS=${await splitter.getAddress()}`);
  console.log("\nNext step: Start the indexer to sync on-chain state to database");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
