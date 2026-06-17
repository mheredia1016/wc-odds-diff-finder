# The Odds API Soccer Difference Bot

Compares soccer odds across sportsbooks and posts Discord alerts when the best price is at least `MIN_ODDS_DIFF` higher than the worst price for the same market/player/line.

This version supports **event-level player props**, which are required by The Odds API for markets like player shots and shots on target.

## Railway variables

```env
ODDS_API_KEY=your_key
DISCORD_WEBHOOK_URL=your_webhook
SPORT_KEYS=soccer_fifa_world_cup
REGIONS=us
BOOKMAKERS=draftkings,fanduel,betmgm,betrivers,fanatics
MIN_ODDS_DIFF=300
SCAN_INTERVAL_MINUTES=5
COMMENCE_WITHIN_HOURS=72
MAX_EVENTS_PER_SPORT=20
```

## Player prop markets

Start with:

```env
MARKETS=player_shots,player_shots_on_target,player_goal_scorer_anytime,player_goals_alternate,player_assists,player_tackles_alternate,player_fouls,player_to_receive_card
```

The bot automatically calls:

```txt
/v4/sports/{sportKey}/events
/v4/sports/{sportKey}/events/{eventId}/odds
```

for player markets. This avoids the `INVALID_MARKET` error from the sport-level `/odds` endpoint.

## Normal game markets

You can also scan normal markets:

```env
MARKETS=h2h,spreads,totals,btts,draw_no_bet
```

Normal markets use the sport-level endpoint. If you mix normal and player markets, the bot uses both endpoint types.

## Helpful settings

`EVENT_MARKET_CHUNK_SIZE=1` is safest because some events/books do not support every prop market. It costs more API calls but prevents one invalid market from killing the whole scan.

`BOOKMAKERS` can be blank to scan all books in the selected region, or a comma-separated list:

```env
BOOKMAKERS=draftkings,fanduel,betmgm,betrivers
```

