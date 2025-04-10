const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const CyberValleyEventManager = contract.fromArtifact('CyberValleyEventManager');
const CyberValleyEventTicket = contract.fromArtifact('CyberValleyEventTicket');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

require('chai').should();

describe('CyberValleyEventManager', function () {
  const [owner, master, staff, creator, customer, devTeam] = accounts;

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const EVENT_DATA_CID = 'QmWATWQmAWAmegNmUjVuF4ffLYsjyKtUFxYR27pS3CcU6V';

  const TICKET_PRICE = new BN('100');
  const DEV_TEAM_PERCENTAGE = new BN('10');
  const MASTER_PERCENTAGE = new BN('5');

  let eventManager;
  let eventTicket;
  let usdtToken;

  beforeEach(async function () {
    // Deploy ERC20 Mock
    usdtToken = await ERC20Mock.new('Tether', 'USDT', 6, { from: owner });

    // Deploy Event Manager
    eventManager = await CyberValleyEventManager.new(usdtToken.address, DEV_TEAM_PERCENTAGE, MASTER_PERCENTAGE, { from: owner });

    // Deploy Event Ticket
    eventTicket = await CyberValleyEventTicket.new('CyberValleyEventTicket', 'CVT', eventManager.address, { from: owner });
    await eventManager.setCyberValleyTicketContract(eventTicket.address, { from: owner });

    // Grant master role
    await eventManager.grantRole(await eventManager.MASTER_ROLE(), master, { from: owner });

    // Mint USDT for customer
    await usdtToken.mint(customer, TICKET_PRICE, { from: owner });

    // Approve Event Manager to spend USDT
    await usdtToken.approve(eventManager.address, TICKET_PRICE, { from: customer });

  });

  describe('Roles', function () {
    it('should allow the owner to grant the master role', async function () {
      await eventManager.grantRole(await eventManager.MASTER_ROLE(), master, { from: owner });
      (await eventManager.hasRole(await eventManager.MASTER_ROLE(), master)).should.be.equal(true);
    });

    it('should allow the owner to grant the staff role', async function () {
      await eventManager.grantRole(await eventManager.STAFF_ROLE(), staff, { from: owner });
      (await eventManager.hasRole(await eventManager.STAFF_ROLE(), staff)).should.be.equal(true);
    });

    it('should revert if a non-owner tries to grant a role', async function () {
      await expectRevert(
        eventManager.grantRole(await eventManager.MASTER_ROLE(), master, { from: customer }),
        'AccessControl: sender must be an admin to grant'
      );
    });
  });

  describe('Event Place Management', function () {
    const MAX_TICKETS = new BN('100');
    const MIN_TICKETS = new BN('10');
    const MIN_PRICE = new BN('50');
    const MIN_DAYS = new BN('7');

    it('should allow the master to create an event place', async function () {
      const { logs } = await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });

      expectEvent.inLogs(logs, 'NewEventPlaceAvailable', {
        eventPlaceId: new BN('0'),
        maxTickets: MAX_TICKETS,
        minTickets: MIN_TICKETS,
        minPrice: MIN_PRICE,
        minDays: MIN_DAYS
      });

      const eventPlace = await eventManager.eventPlaces(0);
      eventPlace.maxTickets.should.be.bignumber.equal(MAX_TICKETS);
      eventPlace.minTickets.should.be.bignumber.equal(MIN_TICKETS);
      eventPlace.minPrice.should.be.bignumber.equal(MIN_PRICE);
      eventPlace.minDays.should.be.bignumber.equal(MIN_DAYS);
    });

    it('should revert if a non-master tries to create an event place', async function () {
      await expectRevert(
        eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: customer }),
        'Must have master role'
      );
    });

    it('should allow the master to update an event place', async function () {
      await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });

      const NEW_MAX_TICKETS = new BN('150');
      const NEW_MIN_TICKETS = new BN('15');
      const NEW_MIN_PRICE = new BN('75');
      const NEW_MIN_DAYS = new BN('10');

      const { logs } = await eventManager.updateEventPlace(0, NEW_MAX_TICKETS, NEW_MIN_TICKETS, NEW_MIN_PRICE, NEW_MIN_DAYS, { from: master });

      expectEvent.inLogs(logs, 'EventPlaceUpdated', {
        eventPlaceId: new BN('0'),
        maxTickets: NEW_MAX_TICKETS,
        minTickets: NEW_MIN_TICKETS,
        minPrice: NEW_MIN_PRICE,
        minDays: NEW_MIN_DAYS
      });

      const eventPlace = await eventManager.eventPlaces(0);
      eventPlace.maxTickets.should.be.bignumber.equal(NEW_MAX_TICKETS);
      eventPlace.minTickets.should.be.bignumber.equal(NEW_MIN_TICKETS);
      eventPlace.minPrice.should.be.bignumber.equal(NEW_MIN_PRICE);
      eventPlace.minDays.should.be.bignumber.equal(NEW_MIN_DAYS);
    });

    it('should revert if a non-master tries to update an event place', async function () {
      await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });

      const NEW_MAX_TICKETS = new BN('150');
      const NEW_MIN_TICKETS = new BN('15');
      const NEW_MIN_PRICE = new BN('75');
      const NEW_MIN_DAYS = new BN('10');

      await expectRevert(
        eventManager.updateEventPlace(0, NEW_MAX_TICKETS, NEW_MIN_TICKETS, NEW_MIN_PRICE, NEW_MIN_DAYS, { from: customer }),
        'Must have master role'
      );
    });
  });

  describe('Event Request Management', function () {
    const MAX_TICKETS = new BN('100');
    const MIN_TICKETS = new BN('10');
    const MIN_PRICE = new BN('50');
    const MIN_DAYS = new BN('7');
    const START_TIMESTAMP = new BN(Math.floor(Date.now() / 1000) + 86400); // Tomorrow

    beforeEach(async function () {
      await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });
    });

    it('should allow a user to submit an event request', async function () {
      const { logs } = await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });

      expectEvent.inLogs(logs, 'EventRequestSubmitted', {
        eventRequestId: new BN('0'),
        creator: creator,
        eventPlaceId: new BN('0'),
        startTimestamp: START_TIMESTAMP
      });

      const eventRequest = await eventManager.eventRequests(0);
      eventRequest.creator.should.be.equal(creator);
      eventRequest.eventPlaceId.should.be.bignumber.equal(new BN('0'));
      eventRequest.startTimestamp.should.be.bignumber.equal(START_TIMESTAMP);
    });

    it('should allow the master to approve an event request', async function () {
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });

      const { logs } = await eventManager.approveEventRequest(0, EVENT_DATA_CID, { from: master });

      expectEvent.inLogs(logs, 'NewEventAvailable', {
        eventId: new BN('0'),
        creator: creator,
        eventDataCID: EVENT_DATA_CID
      });

      expectEvent.inLogs(logs, 'EventRequestApproved', {
        eventRequestId: new BN('0'),
        eventId: new BN('0')
      });

      const event = await eventManager.events(0);
      event.creator.should.be.equal(creator);
      event.eventDataCID.should.be.equal(EVENT_DATA_CID);

      const eventRequest = await eventManager.eventRequests(0);
      eventRequest.creator.should.be.equal(ZERO_ADDRESS); // Check if request is deleted
    });

    it('should revert if a non-master tries to approve an event request', async function () {
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });

      await expectRevert(
        eventManager.approveEventRequest(0, EVENT_DATA_CID, { from: customer }),
        'Must have master role'
      );
    });

    it('should allow the master to decline an event request', async function () {
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });

      const { logs } = await eventManager.declineEventRequest(0, { from: master });

      expectEvent.inLogs(logs, 'EventRequestDeclined', {
        eventRequestId: new BN('0')
      });

      const eventRequest = await eventManager.eventRequests(0);
      eventRequest.creator.should.be.equal(ZERO_ADDRESS); // Check if request is deleted
    });

    it('should revert if a non-master tries to decline an event request', async function () {
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });

      await expectRevert(
        eventManager.declineEventRequest(0, { from: customer }),
        'Must have master role'
      );
    });
  });

  describe('Event Management', function () {
    const MAX_TICKETS = new BN('100');
    const MIN_TICKETS = new BN('10');
    const MIN_PRICE = new BN('50');
    const MIN_DAYS = new BN('7');
    const START_TIMESTAMP = new BN(Math.floor(Date.now() / 1000) + 86400); // Tomorrow

    beforeEach(async function () {
      await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });
      await eventManager.approveEventRequest(0, EVENT_DATA_CID, { from: master });
    });

    it('should allow the master to update an event', async function () {
      const NEW_EVENT_DATA_CID = 'QmXWATWQmAWAmegNmUjVuF4ffLYsjyKtUFxYR27pS3CcU6Z';

      const { logs } = await eventManager.updateEvent(0, NEW_EVENT_DATA_CID, { from: master });

      expectEvent.inLogs(logs, 'EventWasUpdated', {
        eventId: new BN('0'),
        eventDataCID: NEW_EVENT_DATA_CID
      });

      const event = await eventManager.events(0);
      event.eventDataCID.should.be.equal(NEW_EVENT_DATA_CID);
    });

    it('should revert if a non-master tries to update an event', async function () {
      const NEW_EVENT_DATA_CID = 'QmXWATWQmAWAmegNmUjVuF4ffLYsjyKtUFxYR27pS3CcU6Z';

      await expectRevert(
        eventManager.updateEvent(0, NEW_EVENT_DATA_CID, { from: customer }),
        'Must have master role'
      );
    });

    it('should allow the master to cancel an event', async function () {
      const { logs } = await eventManager.cancelEvent(0, { from: master });

      expectEvent.inLogs(logs, 'EventCancelled', {
        eventId: new BN('0')
      });

      const event = await eventManager.events(0);
      event.cancelled.should.be.equal(true);
    });

    it('should revert if a non-master tries to cancel an event', async function () {
      await expectRevert(
        eventManager.cancelEvent(0, { from: customer }),
        'Must have master role'
      );
    });

    it('should allow the master to close an event', async function () {
      // Fund the contract with some ETH to simulate event balance
      await web3.eth.sendTransaction({ from: owner, to: eventManager.address, value: web3.utils.toWei('1', 'ether') });

      const initialDevTeamBalance = await web3.eth.getBalance(devTeam);
      const initialMasterBalance = await web3.eth.getBalance(master);
      const initialCreatorBalance = await web3.eth.getBalance(creator);

      const { logs } = await eventManager.closeEvent(0, { from: master });

      expectEvent.inLogs(logs, 'EventClosed', {
        eventId: new BN('0')
      });

      const event = await eventManager.events(0);
      event.closed.should.be.equal(true);

      // Check balances
      const finalDevTeamBalance = await web3.eth.getBalance(devTeam);
      const finalMasterBalance = await web3.eth.getBalance(master);
      const finalCreatorBalance = await web3.eth.getBalance(creator);

      const devTeamCut = web3.utils.toWei('1', 'ether') * DEV_TEAM_PERCENTAGE / 100;
      const masterCut = web3.utils.toWei('1', 'ether') * MASTER_PERCENTAGE / 100;
      const creatorCut = web3.utils.toWei('1', 'ether') - devTeamCut - masterCut;

      assert.approximately(Number(finalDevTeamBalance), Number(initialDevTeamBalance) + Number(devTeamCut), Number(web3.utils.toWei('0.001', 'ether')));
      assert.approximately(Number(finalMasterBalance), Number(initialMasterBalance) + Number(masterCut), Number(web3.utils.toWei('0.001', 'ether')));
      assert.approximately(Number(finalCreatorBalance), Number(initialCreatorBalance) + Number(creatorCut), Number(web3.utils.toWei('0.001', 'ether')));
    });

    it('should revert if a non-master tries to close an event', async function () {
      await expectRevert(
        eventManager.closeEvent(0, { from: customer }),
        'Must have master role'
      );
    });
  });

  describe('Ticket Management', function () {
    const MAX_TICKETS = new BN('100');
    const MIN_TICKETS = new BN('10');
    const MIN_PRICE = new BN('50');
    const MIN_DAYS = new BN('7');
    const START_TIMESTAMP = new BN(Math.floor(Date.now() / 1000) + 86400); // Tomorrow

    beforeEach(async function () {
      await eventManager.createEventPlace(MAX_TICKETS, MIN_TICKETS, MIN_PRICE, MIN_DAYS, { from: master });
      await eventManager.submitEventRequest(0, START_TIMESTAMP, TICKET_PRICE, { from: creator });
      await eventManager.approveEventRequest(0, EVENT_DATA_CID, { from: master });

      // Grant staff role
      await eventManager.grantRole(await eventManager.STAFF_ROLE(), staff, { from: owner });
    });

    it('should allow a customer to buy a ticket', async function () {
      const { logs } = await eventManager.buyTicket(0, { from: customer });

      const ticketId = new BN('0');

      expectEvent.inLogs(logs, 'TicketBought', {
        eventId: new BN('0'),
        buyer: customer,
        ticketId: ticketId
      });

      // Verify ticket ownership
      (await eventTicket.ownerOf(ticketId)).should.be.equal(customer);

      // Verify event balance
      const event = await eventManager.events(0);
      event.balance.should.be.bignumber.equal(TICKET_PRICE);
    });

    it('should allow staff to verify a ticket', async function () {
      await eventManager.buyTicket(0, { from: customer });
      (await eventManager.verifyTicket(0, 0, { from: staff })).should.be.equal(true);
    });

    it('should revert if a non-staff tries to verify a ticket', async function () {
      await eventManager.buyTicket(0, { from: customer });
      await expectRevert(
        eventManager.verifyTicket(0, 0, { from: customer }),
        'Must have staff role'
      );
    });
  });
});
