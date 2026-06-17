# SportsGameOdds Odds Difference Bot

Compares soccer player prop odds across every available sportsbook from SportsGameOdds and posts Discord alerts when the American odds gap is at least `MIN_ODDS_DIFF`.

Example rule:

```txt
Best book +1600 vs worst book +135 = difference 1465 -> alert
```

## Railway variables

Add these in Railway > Variables. Do not commit secrets to GitHub.

```env
SPORTSGAMEODDS_API_KEY=your_key
DISCORD_WEBHOOK_URL=your_discord_webhook
MIN_ODDS_DIFF=300
SCAN_INTERVAL_MINUTES=5
LEAGUE_IDS=INTERNATIONAL_SOCCER,MLS,EPL,UEFA_CHAMPIONS_LEAGUE
EVENT_LIMIT=50
INCLUDE_ALT_LINES=true
BOOKMAKER_IDS=
TARGET_STATS=offsides,shots,shots_onGoal,assists,passes_attempted,tackles
FINALIZED=false
```

`BOOKMAKER_IDS` empty means compare all books. To limit books, use comma-separated IDs like:

```env
BOOKMAKER_IDS=draftkings,fanatics,fanduel,betmgm,caesars
```

## Local test

```bash
npm install
cp .env.example .env
npm run scan
```

## Railway deploy

1. Create GitHub repo.
2. Upload these files.
3. Connect repo to Railway.
4. Add variables above.
5. Deploy.

Railway will run:

```bash
npm start
```

## Notes

This parser is defensive because odds APIs sometimes vary market object names. It targets SportsGameOdds `/v2/events`, reads each event `odds` object, groups matching props by player/stat/line/side, then compares all bookmaker prices inside each group.
