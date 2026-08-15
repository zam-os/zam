# ZAM 0.32.0 — Pick a cell, say what you already know, and get an offer instead of a wall

This release adds the first complete learning path built from a shared
curriculum cell rather than from cards you made yourself. You choose a cell,
ZAM builds the queue, and the parts that used to be decisions on paper — what
to do about prerequisites you already know, what happens when the day's work
runs out, what to do with knowledge just outside your curriculum — are things
you can now actually do.

## Choose a cell instead of building a deck

Four bundled cells ship with this release: Optik for Realschule Bayern 7/8,
Gymnasium 8, a Realschule extension, and the quantitative BOS variant. You pick
one and get a queue.

There is no file picker and no URL field, on purpose. These cells come from the
repository and nothing else can be loaded yet — the trust, signature and
provenance work that arbitrary content would need is not built, and shipping a
door before its lock is how content nobody vouched for reaches a learner.

Each cell's curriculum claims are resolved against the official LehrplanPLUS
learning areas, and a test refuses to ship a cell whose bindings are not in its
own source list. The Bavarian source pages named are 65643 (Physik 7, Zweig I),
65854 (Physik 8, II/III) and 119285 (BOS Vorklasse).

**Installing a cell enrols nobody.** Content and enrolment stay two steps
underneath, so a shared library can hold every cell while your queue holds only
what you chose.

## "I already know that" defers a question — it does not delete it

A cell brings its prerequisites. If four of them stand between you and the
first real question, answering all four before starting is a wall.

So you can say you already have one. The card is deferred, not removed: three
weeks later it is asked for real, because a claim nobody ever checks is not
knowledge, it is a note. Decline several and they come back spread out rather
than all on the same day.

Nothing about a self-assessment touches your scheduling state. You did not
retrieve anything, so nothing is recorded as if you had — the card simply waits.
Saying "I want to learn it" instead puts it straight back in the queue.

## When the day's work is done, you decide whether to continue

An empty queue now offers to keep going, and admits what the daily limit held
back. It is an offer, not an automatic top-up: a limit that quietly ignores
itself teaches you the number is decoration.

What you get is the curriculum you have not reached yet — not the prerequisites
you just set aside.

## An offer at the edge of what you can do

Once you genuinely hold the foundations of something adjacent to your
curriculum, ZAM can offer it: what it rests on, what it opens, and nothing
else. You can accept it or ignore it, and either way your due work is
unchanged. It is never scheduled for you, never scored, and never counted.

An atom is only offered when its foundations were actually retrieved.
Enrolment alone does not count, and neither does saying you already know
something.

## One-tap checks, in an order you cannot memorise

Tier-1 items are answered with a tap instead of typed. The options are
reordered per card: every authored check stores the correct answer first, and
shown that way you would learn the position instead of the physics — and the
rating that followed would be evidence of nothing while scheduling ran on it.
The order is fixed while you answer and different the next time the card comes
round.

## The curriculum wizard offers the reviewed cell first

If you walk the curriculum import wizard to a position a cell already covers,
it names that cell before its own topic list. A cell carries checked sources,
the order things build on each other, and questions someone went through; a
generic import carries the text of a curriculum page. Both remain available —
the reviewed one is simply what gets named first.

## Also in this release

- The review log records which version of a question earned each rating, so a
  later change to the knowledge base can tell an unchanged item from a revised
  one instead of guessing.
- A published practice item can declare what it replaces, and only that
  declaration moves your card and history to a new id. Where a learner holds
  both, ZAM refuses rather than merging two histories into one.
- On mobile, a card's title no longer appears under the question before you
  reveal the answer. For imported cards it was often the first sentence of the
  answer.

## Known limits

- Curriculum import still exists only on the desktop. A phone or tablet can
  select a bundled cell, but a position no cell covers yet needs the desktop.
- The four cells are pilot content, not a public catalogue. Their identifiers
  may change when the central knowledge base arrives; your review history is
  what is designed to survive that, and it will not be transferred across an
  uncertain match.
