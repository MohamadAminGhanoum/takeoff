# Nephthys for Takeoff

[Nephthys](https://github.com/hackclub/nephthys) is Hack Club's Slack support bot. It watches a help channel,
turns each question into a ticket, tags it, and lets helpers claim and close it.

Takeoff uses it in two ways:

- **Support tab** on the org dashboard: open, in-progress and closed counts, first-reply and resolution times,
  the oldest unanswered question, top helpers, and the tickets waiting right now.
- **Help tickets panel** on each project's reviewer page: tickets opened by that project's author.

Takeoff only reads numbers, ticket titles, tags and Slack IDs from Nephthys' public API. It never sends an API key,
so Slack message text is never returned. This is on purpose, because of
[Hack Club's Slack scraping policy](https://news.hackclub.com/news/scraping-use-policy/).

Nothing here runs Nephthys for you. Nephthys is a separate app (Python and PostgreSQL). Steps 1 to 4 are for whoever
runs it. Step 5 is the only part inside Takeoff.

## 1. Get an instance

Creating the Slack app needs a Hack Club Slack workspace admin (Nephthys' own deployment guide says so), and Hack Club
hosts instances at addresses like `something.nephthys.hackclub.com`. So ask the people who run Nephthys, or open an
issue on its repo, and send them steps 2 and 3.

## 2. Make the channels

| Channel | Public? | Used for |
| --- | --- | --- |
| Help channel | Public | Where participants ask questions |
| Ticket channel | Private | Where unresolved threads are kept |
| Team channel | Private | Helpers' channel, also used for permission checks and daily stats |
| Heartbeat channel | Private | Debug messages from the bot |

Write down each channel's ID (it starts with `C`).

## 3. Add a Takeoff program to Nephthys

Each program has a "transcript" file with its channel IDs and messages. `PROGRAM` has to match one, and there is no
Takeoff one yet. Add `nephthys/transcripts/transcripts/takeoff.py` to a fork, or open a pull request to hackclub/nephthys:

```python
from nephthys.transcripts.transcript import Transcript


class Takeoff(Transcript):
    """Transcript for Takeoff"""

    program_name: str = "Takeoff"
    program_owner: str = "U_REPLACE_ME"  # Slack ID of whoever runs support

    help_channel: str = "C_REPLACE_ME"
    ticket_channel: str = "C_REPLACE_ME"
    team_channel: str = "C_REPLACE_ME"

    faq_link: str = "https://REPLACE_WITH_YOUR_FAQ_LINK"
    resolve_ticket_button: str = "resolved!"
    not_allowed_channel: str = f"hm, you're not supposed to be in that channel. ask <@{program_owner}> if that's wrong"
```

Replace every `REPLACE_ME` and the FAQ link. The other messages fall back to sensible defaults. Then register it in
`nephthys/transcripts/__init__.py`: add `from nephthys.transcripts.transcripts.takeoff import Takeoff` with the other
imports, and add `Takeoff,` to the `transcripts` list.

## 4. Run it

Follow Nephthys' `docs/deployment.md`, and in its environment set `PROGRAM="takeoff"` (the program name in lower case),
plus the channel, Slack and database values from its `.env.sample`. For AI ticket titles, Hack Club AI is free for
Hack Clubbers: set `HACK_CLUB_AI_API_KEY`.

Check it works by opening `https://YOUR-INSTANCE/api/stats_v2` in a browser. You should see JSON with `all_time` in it.

## 5. Connect Takeoff

Add this to `.env.local` and to the Vercel project's environment variables, then restart or redeploy:

```
NEPHTHYS_URL=https://YOUR-INSTANCE.nephthys.hackclub.com
```

Only an `https://` address is accepted (plus `http://localhost` for testing). Open **Org, then Support** to see the numbers.

## What to know

- **Matching tickets to projects** compares the ticket opener's Slack ID with the project's author ID. It only works
  when a project's author ID is a Slack ID. If it's an email or a Hack Club account ID, the Project column stays empty
  and the project page says so.
- **Titles** are short AI-written summaries of each question. They only appear to signed-in org and reviewer users.
- **Speed:** results are kept for 60 seconds, and if Nephthys is unreachable Takeoff stops trying for 30 seconds so
  pages don't slow down.
- **Tests:** `npx tsx scripts/test-nephthys.ts` (offline).
