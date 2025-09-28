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
        Note: Unluck
    end
```

When a `Shaman` becomes a `VerifiedShaman`, they can request a new `EventPlace` from the `Manage` page in the navigation bar. This form is migrated from the `Master`'s `Manage` page.

## Map Integration

The event list page now contains a map that looks similar to the one from Booking.com. It represents CyberValley and contains multiple layers:

1. Upcoming events
2. Points of interest
3. Zone plots

For detailed implementation of this feature, further research of Google's API is required.

## Shares Rework

For each event, shares can be set up independently. The `LocalProvider` chooses their value when approving an event request.

Also, as mentioned in the `LocalProvider` section, the new `Master` role can set share values for each of them.

To prevent potentially cumbersome situations in the future, a setter for the `Master`'s share will also be provided at the contract level.

## Event Request Updates

Due to the previous features, the event request flow should/could be improved in two main ways:
1. Add a new field that requires the `Shaman` to place a marker on one of the provided zone plots where their event will be located
2. Notify the `LocalProvider` not only through in-app notifications, but also via the Telegram bot about new requests

**Questions**:
- Should the `Shaman` choose only one marker, or could they place multiple markers on single/multiple zones?
