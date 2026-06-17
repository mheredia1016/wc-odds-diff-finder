# Odds API Soccer Difference Bot

Compares soccer odds across sportsbooks using **The Odds API** and posts Discord alerts when the best available odds are at least `MIN_ODDS_DIFF` higher than the lowest odds for the same event/market/outcome.

This version is for **soccer game lines** first: `h2h`, `spreads`, and `totals`. The Odds API may not have the soccer player props like offsides/shots that started the project.

## Railway Variables

```env
ODDS_API_KEY=your_key_here
DISCORD_WEBHOOK_URL=your_webhook_here
SPORT_KEYS=soccer_epl,soccer_uefa_champs_league,soccer_usa_mls,soccer_spain_la_liga,soccer_italy_serie_a,soccer_germany_bundesliga,soccer_france_ligue_one
MARKETS=h2h,spreads,totals
REGIONS=us
MIN_ODDS_DIFF=300
SCAN_INTERVAL_MINUTES=5
MAX_EVENTS_PER_SPORT=20
COMMENCE_WITHIN_HOURS=72
```

Optional:

```env
BOOKMAKERS=draftkings,fanduel,betmgm,caesars,espnbet,betrivers,fanatics
POST_NO_ALERTS=true
```

Leave `BOOKMAKERS` blank to compare all available books from `REGIONS=us`.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Run one scan only:

```bash
npm run scan
```

## GitHub + Railway

1. Upload these files to a new GitHub repo.
2. Create a Railway project from the repo.
3. Add the Railway variables above.
4. Deploy.

## Notes

- The Odds API counts requests by sport, market, and bookmaker grouping. Keep the sport list short on free tier.
- `SPORT_KEYS=AUTO` will call `/v4/sports` and scan every active soccer sport. This can use credits quickly.
- For soccer, `h2h` includes the draw outcome.
