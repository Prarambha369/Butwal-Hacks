# Cheating Response Guide

What happens when someone suspects that a project at a Butwal Hacks event was
not built during the event. Adapted from
[MLH's cheating response guide](https://github.com/MLH/mlh-policies/blob/main/cheating-response.md),
which is public and reusable with attribution.

The point of this process is fairness. A project that was built during the
event is an achievement. A project that was brought in ready-made is not, and
it is unfair to everyone else who spent the weekend building. But a wrong
accusation is also unfair — to the team it destroys, and to the community that
learns that accusations are cheap.

## Handle it discreetly

**Concerns about possible cheating must be handled discreetly.** Do not make
public accusations on Discord, in a group chat, on Reddit, in a comment
thread, or on social media. Do not dox anyone. Do not encourage others to
target a team. Do not run a witch hunt.

Public accusations damage the event's atmosphere and can unfairly harm
individuals, especially when the investigation finds no evidence. A concern
raised quietly gets a fair look. A concern shouted in a group chat gets
nothing but a fight.

## How to report

- **Email conduct@butwalhacks.com** with the subject line "cheating report".
- **Use the in-app report form** on the project page. It reaches the same
  maintainer queue, records the report against the project, and needs an
  account — the email channel is the one that needs none.

Include, if you have it: the project, the team, what specifically looks wrong,
and when you noticed. You do not need to be certain. You do not need to prove
anything. A report is a request for a look, not a verdict.

You may ask to stay anonymous. We will not identify you to the team without
your permission.

## Investigation

A maintainer or the event's lead organizer reviews the project themselves.
Where the situation is serious or unclear, they may bring in another
maintainer who was not involved.

The reviewer will:

1. **Look at the repository.** Commit history, timestamps, file structure, and
   the project's own description all tell a story.
2. **Look at the event timeline.** A repository whose meaningful work starts
   months before the event is a different case from one whose commits cluster
   into the event window.
3. **Ask the team questions.** How did you start, what did each person work
   on, what broke first, what did you have to look up? Honest teams have
   uneven answers; teams that assembled something they did not build tend to
   describe it uniformly.
4. **Check the submission.** The data a team entered on its submission form
   is part of the review, and it may say more than the public project page.
5. **Look at the video and demo**, if there is one.

The team gets to answer before a decision is made. An adverse decision is
always put in writing with the reason.

### What is not cheating

- Using an idea you had before the event. Ideas are allowed; implementations
  brought in ready-made are not.
- Using libraries, frameworks, and open source code, with the licence
  respected.
- Using AI tools — as long as the team says so and still understands and
  owns what it built.
- Working on something similar to an existing product.
- Debugging code the team wrote earlier in the weekend.

### What is cheating

- Submitting a project that was substantially built before the event.
- Copying another team's project, or building on it without saying so.
- Hiding the repository to avoid review — including making it private after
  the event.
- Misrepresenting who did the work.
- Falsifying the commit history or the project description to hide when the
  work was done.

### On private repositories

The code needs to be visible to reviewers. It can, and should, still protect
sensitive information: API keys, database credentials, and similar secrets
belong in environment variables and `.gitignore`, not in the repository. The
core project code must be public. Circumventing the review by hiding evidence
is disqualifying on its own.

## Outcome

The reviewer decides, in writing, and works with the team so that everyone
understands the decision. Depending on what they find, the outcome may be:

- **No action.** The concern does not hold up. The team is told, and the
  project stays in the running.
- **A request for more information**, and a second look.
- **Removal from judging**, or the project being hidden from the project
  gallery, while the matter is looked at further.
- **Disqualification** from the event and its prizes.
- **A ban** from future Butwal Hacks events, under
  [DISCIPLINARY_ACTION.md](DISCIPLINARY_ACTION.md).

### After the event

A concern raised after the event is treated the same way, with one addition:
if the project was a prize winner, the prize may be returned and a new winner
is selected. Repeat cheaters, and people who attempt to hide evidence, are
permanently banned from participating in Butwal Hacks events.

## What we will not do

- We will not publish the details of an investigation, or the identity of a
  reporter.
- We will not share a team's private information with people outside the
  people handling the report.
- We will not reach a conclusion from a screenshot alone, or from the fact
  that someone's code "looks too good".

Policy version: 2026-10-21

## See also

- [HACKATHON_RULES.md](HACKATHON_RULES.md) — the rules a project is judged against
- [HACKATHON_RULES.md](HACKATHON_RULES.md) — eligibility and disqualification
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) — how other reports are handled
- [DISCIPLINARY_ACTION.md](DISCIPLINARY_ACTION.md) — sanctions and appeals
