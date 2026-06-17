function fmtOdds(n) {
  return n > 0 ? `+${n}` : String(n);
}

function fmtDate(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildMessage(alert) {
  const books = alert.prices.slice(0, 8).map(p => `• ${p.bookTitle}: **${fmtOdds(p.price)}**`).join('\n');
  return {
    embeds: [{
      title: `🚨 Soccer Odds Difference +${alert.diff}`,
      description: `**${alert.awayTeam} @ ${alert.homeTeam}**\n${fmtDate(alert.commenceTime)} CT`,
      fields: [
        { name: 'Market', value: `${alert.market} — **${alert.label}**`, inline: false },
        { name: 'Best', value: `${alert.best.bookTitle} **${fmtOdds(alert.best.price)}**`, inline: true },
        { name: 'Lowest', value: `${alert.worst.bookTitle} **${fmtOdds(alert.worst.price)}**`, inline: true },
        { name: 'Books', value: books || 'No books', inline: false }
      ],
      timestamp: new Date().toISOString()
    }]
  };
}

async function postDiscord(webhookUrl, payload) {
  if (!webhookUrl) {
    console.log('DISCORD_WEBHOOK_URL missing; skipping Discord post');
    return;
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord webhook failed ${res.status}: ${text}`);
  }
}

module.exports = { buildMessage, postDiscord };
