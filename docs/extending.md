# Extending

## Local Provider - New Role

The current `Master` role is being renamed to `LocalProvider` and retains all of its authorities. At the smart contract level, multiple `LocalProvider`s may exist, each with **their own distinct** share percentage.

Meanwhile, the `Master` role is only capable of adding and removing `LocalProvider`s, which contain the following data:
- EOA (Externally Owned Account)
- Telegram username
- Share percentage

**Questions**:
- If there are multiple `LocalProvider`s, how should shares be calculated for them? (This is crucial for smart contract development)
    - Each `LocalProvider` receives a share for events from `VerifiedShaman`s they have approved
    - There is a general share of the total income that is divided among all `LocalProvider`s (i.e., the sum of all their shares equals 1)
- Telegram bots are forbidden to send messages to users who haven't sent any messages to them. So `LocalProvider` would not work properly (receive any notifications from the bot) until they send the `/start` command
    - We may implement a message queue at the DB level and send all unreceived notifications when `LocalProvider` contacts the bot
    - We may forbid registering new `LocalProvider`s until they contact the bot
    - We may simply ignore the issue for now and delegate it to our future selves    

**Tasks**:
1. **Rename `Master` to `LocalProvider` role** (~2 hours)
    - Update backend user model and migrations
    - Update smart contract role constants
    - Update frontend role-based components and permissions
2. **Add new `Master` role to the smart contract** (~3 hours)
    - Implement multi-LocalProvider share management in contract
    - Add LocalProvider registration/removal functions
    - Update role-based access controls
3. **Implement LocalProvider management system** (~8 hours)
    - Create LocalProvider model with telegram/share fields (1h)
    - Back-end CRUD endpoints for LocalProvider management (2h)
    - Front-end LocalProvider management page (3h)
    - Form validation and error handling (2h)
4. **Implement Telegram message queue system** (~4 hours)
    - Database model for queued messages
    - Queue management service
    - Integration with existing notification system

## Verified Shaman - New Role

The `Apply new event space` button now redirects to the Telegram bot with the following sequence:

```mermaid
sequenceDiagram
    actor Shaman
    participant TelegramBot
    actor LocalProvider
    
    Shaman->>TelegramBot: /start command
    TelegramBot->>Shaman: Provide the following list of documents
    Shaman->>TelegramBot: Uploads documents
    Note over Shaman,TelegramBot: All documents should be uploaded in a single message
    TelegramBot--))LocalProvider: New verification request
    TelegramBot-->>Shaman: Request sent
```

After that, the `LocalProvider` validates the payload and clicks either the `approve` or `decline` button, then confirms their decision:

```mermaid
sequenceDiagram
    actor LocalProvider
    participant TelegramBot
    actor Shaman
    participant Database

    TelegramBot-->>LocalProvider: New verification request
    LocalProvider-->>TelegramBot: Decision
    TelegramBot-->>LocalProvider: Are you super duper puper sure?
    LocalProvider-->>TelegramBot: Confirmation
    TelegramBot--))Shaman: Notify about decision
    alt Request was approved
        TelegramBot-->>Database: Grant "request event space" authority
    else
        Note over TelegramBot,Shaman: Unluck
    end
```

When a `Shaman` becomes a `VerifiedShaman`, they can request a new `EventPlace` from the `Manage` page in the navigation bar. This form is migrated from the `Master`'s `Manage` page.

**Tasks**:
1. **Add new `VerifiedShaman` role** (~4 hours)
    - Back-end role enumeration and migration (1h)
    - Update role-based permissions and views (1h)
    - Migrate `Manage` page from Master to VerifiedShaman (2h)
2. **Implement Telegram bot verification flow** (~12 hours)
    - Document upload handler and validation (3h)
    - Verification request workflow with approval/decline (4h)
    - LocalProvider notification and decision system (3h)
    - Database integration for role granting (2h)
3. **Create verification request management UI** (~3 hours)
    - LocalProvider dashboard for pending requests
    - Document viewer and decision interface

## Map Integration

The event list page now contains a map that looks similar to the one from Booking.com. It represents CyberValley and contains multiple layers:

1. Upcoming events
2. Points of interest
3. Zone plots

For detailed implementation of this feature, further research of Google's API was done [here](./google-cloud-maps-api.md).

The API was massively improved this spring and provides a wide variety of drawing plots, creating and grouping markers, managing multiple layers and styling different parts of the map. In conclusion, it seems like a great piece of work and all currently requested features may be implemented without much difficulty.

**Tasks**:
1. **Setup Google Maps integration** (~4 hours)
    - Configure Google Maps API and authentication
    - Setup dynamic library loading and map initialization
    - Create base map component with responsive design
2. **Implement upcoming events map view** (~6 hours)
    - Event markers with custom styling and clustering (3h)
    - Event info windows with booking integration (2h)
    - Real-time event filtering and search (1h)
3. **Implement points of interest layer** (~5 hours)
    - POI data management and custom markers (2h)
    - Category-based filtering and toggle controls (2h)
    - Info windows and interaction handling (1h)
4. **Implement zone plots layer** (~8 hours)
    - Zone boundary drawing and polygon management (4h)
    - Interactive zone selection for event placement (2h)
    - Zone availability and conflict detection (2h)
5. **Implement layer management system** (~3 hours)
    - Layer toggle controls and visibility management
    - Performance optimizations for multiple layers

## Shares Rework

For each event, shares can be set up independently. The `LocalProvider` chooses their value when approving an event request.

Also, as mentioned in the `LocalProvider` section, the new `Master` role can set share values for each of them.

To prevent potentially cumbersome situations in the future, a setter for the `Master`'s share will also be provided at the contract level.

**Tasks**:
1. **Include share setting in event approval flow** (~4 hours)
    - Update event approval UI with share input (2h)
    - Backend integration for per-event share storage (1h)
    - Smart contract integration for share distribution (1h)
2. **Add Master role management to smart contract** (~3 hours)
    - Implement Master share and address setters (2h)
    - Update contract deployment and migration scripts (1h)
3. **Update payment distribution system** (~4 hours)
    - Modify closeEvent function for multi-LocalProvider shares (2h)
    - Update indexer to sync share changes (1h)
    - Add share calculation validation (1h)

## Event Request Updates

Due to the previous features, the event request flow should/could be improved in two main ways:
1. Add a new field that requires the `Shaman` to place a marker on one of the provided zone plots where their event will be located
2. Notify the `LocalProvider` not only through in-app notifications, but also via the Telegram bot about new requests

**Questions**:
- Should the `Shaman` choose only one marker, or could they place multiple markers on single/multiple zones?

**Tasks**:
1. **Add zone marker selection to event form** (~5 hours)
    - Integrate map component into event creation form (2h)
    - Implement zone marker placement and validation (2h)
    - Store zone coordinates in event model (1h)
2. **Add Telegram bot notifications for event requests** (~3 hours)
    - Extend notification system to support Telegram (1h)
    - Integrate with LocalProvider notification flow (1h)
    - Add notification preferences and settings (1h)
3. **Update event validation with zone requirements** (~2 hours)
    - Frontend and backend validation for zone selection
    - Error handling and user feedback

## Telegram integration

Because of tight Telegram integration, it's possible to move social selection to the account page and get rid of it in the new event flow. Here are two possible cases:
1. `Shaman` was registered via In-App wallet with Telegram -> we potentially know their Telegram info and can save it, so it would not be requested
2. `Shaman` logged in another way
    1. They started verification -> the same thing as in p.1
    2. They requested an event -> so we ask for Telegram in priority and mention that they can receive notifications there as well, but other social platforms are still available

**Tasks**:
1. **Move social selection to account page** (~4 hours)
    - Create account settings page with social management (2h)
    - Remove social selection from event creation flow (1h)
    - Update event creation to use stored socials (1h)
2. **Implement smart Telegram detection** (~3 hours)
    - Detect Telegram registration source (1h)
    - Auto-populate Telegram info for verified users (1h)
    - Fallback flow for missing Telegram info (1h)

## Total Estimated Time

**Summary by Feature:**
- **Local Provider System**: ~17 hours
- **Verified Shaman System**: ~19 hours  
- **Map Integration**: ~26 hours
- **Shares Rework**: ~11 hours
- **Event Request Updates**: ~10 hours
- **Telegram Integration**: ~7 hours

**Total Estimated Development Time**: ~90 hours
