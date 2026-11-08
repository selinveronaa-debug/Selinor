# RoomRecall

«Lukk øynene og gå gjennom barndomshjemmet ditt. Du klarer det nå, rom for rom, og du har aldri pugget det. Hjernen er laget for å huske steder. Så vi legger pensumet ditt der. Dette er RoomRecall.»

**Every course gets a house. Every fact gets a place.**

RoomRecall turns any course into a cosy house you can walk through. Each room holds one topic, each piece of furniture holds one exam fact, and Claude writes a vivid picture that ties the fact to the object. You walk the rooms, then recall the route.

Built in one weekend by team **Selinor** for Oslo Sprint 2026 at BI.

## Why it works

RoomRecall is built on the **method of loci**, the technique memory athletes use.

- **Places are easy to remember.** Around 500 BC the poet Simonides could name every guest at a collapsed banquet hall by remembering where each one sat. We store facts in places for the same reason.
- **Weird works.** A fact that moves, smashes or sings on the sofa sticks. A quiet one fades. Every picture is written to be strange but logical, and to show the answer.
- **Recall, then space it.** You test yourself on the route, and each spot comes back on a 1 · 3 · 7 · 14 · 30 day rhythm.
- **Evidence.** In Dresler et al. (*Neuron*, 2017), people who trained the method of loci for 40 days went from about 26 to 62 of 72 words recalled, and kept most of the gain four months later. A meta-analysis of 13 controlled trials found a medium effect over normal study (Twomey & Kroneisen, 2021), and testing yourself beats rereading: 61% vs 40% remembered after a week (Roediger & Karpicke, 2006).

## What you can do

| | |
|---|---|
| **Build a course house** | Pick a cosy home, a home from a favourite series, or upload your own house. Choose 1–6 rooms; unused rooms stay dimmed. |
| **Choose the spots** | Tap furniture to choose spots and their walking order. In your own house, upload a photo per room and tap the objects yourself. |
| **Let Claude furnish it** | Upload a PDF or paste notes. Claude splits the course into one topic per room and writes an exam question, three plausible wrong answers and a picture for every spot. |
| **Slides to house** | Drop lecture slides on the street and a new house builds itself on the next free lot. |
| **Walk room by room** | The camera zooms into each room. Hover any object to see what is stored there. Recall mode hides the answer until you have pictured it. |
| **Write your own picture** | Your own images stick best. Claude rates yours from 1 to 5 and gives one tip. |
| **Memory lights** | Spots glow gold when fresh, dim when due, and pulse red when weak. Houses on the street ring a bell when something is due and fade when neglected. |
| **Active recall** | Route check, full-house quiz, weak-spot review, and a timed exam mixed across every course. |
| **Metro mode** | Pick 3 to 12 stops on an Oslo T-bane line. Claude matches each idea to a stop that sounds like it. |
| **Focus** | Pomodoro timer, rain / fire / brown / white noise, and RoomRecall FM, a generated lo-fi beat. |
| **Together** | Share your street, visit classmates, borrow their houses, walk a house live together, play the weekly challenge, and climb the leaderboards. |
| **Diamonds** | Earn diamonds for recall and spend them on fairy lights, a sleepy cat and more for your houses. |

## How Claude is used

All AI calls go through the claude.ai artifact `sample` capability, so the app needs no API keys and runs on the student's own Claude account.

| Call | What Claude returns |
|---|---|
| Plan topics | One topic per room, in learning order |
| Furnish a room | Per spot: question, answer, 3 distractors, explanation, formula/concept, emoji, picture |
| Find objects in a photo | Objects and their positions in the student's own room photo |
| Make it weirder | A stranger, clearer picture for one spot |
| Rate my picture | A 1–5 score and one tip |
| Metro ride | Concept per stop, a sound-alike hook, picture and 10 questions |

Every prompt asks for strict JSON. Replies are cleaned and validated in `lib/text.js`, and any room that fails falls back to the offline builder in `lib/offline.js`, so a demo never breaks. Pictures follow fixed rules: one scene, at most 40 words, the object takes part, and every key part of the answer appears as a concrete thing.

## Architecture

```
index.html              one page, built from the sources below
src/styles.css          design tokens and all styles (cozy lo-fi night theme)
src/body.html           markup for every screen and dialog
src/js/
  lib/       text.js · offline.js · files.js        pure helpers, no DOM
  data/      metro.js · catalogue.js                lines, stops, houses, demos
  art/       dollhouse.js                           SVG houses and room geometry
  core/      helpers.js · state.js                  storage, state, memory model
  ui/        screens.js                             navigation and the night sky
  street/    street.js                              home street, lots, diamonds
  ai/        claude.js                              prompts, validation, fallback
  build/     build.js · slides-to-house.js          creating a house
  walk/      walk.js · quiz.js                      walking and recall
  commute/   commute.js                             metro mode
  focus/     focus.js · radio.js                    timer, sounds, lo-fi radio
  social/    cities.js · challenge.js · together.js shared streets and live rooms
  extras/    own-picture.js · shop.js               own pictures, diamond shop
  main.js                                           boot
assets/                 illustrated houses, street, train, logo (WebP)
```

The memory model lives in `core/state.js`. Each spot stores right, wrong, streak and last review. From that it is **new**, **fresh**, **due** (the next step of 1 · 3 · 7 · 14 · 30 days has passed) or **weak** (missed last time, or missed more than recalled).

## Data and privacy

- Course notes, houses, photos and memory history stay in the student's own browser.
- Only what a student chooses to share leaves the device: a shared street (course names, room topics and notes), scores, diamonds, and the weekly challenge. These live in the artifact's shared store with per-person write rules.
- Files are read in the browser. Nothing is sent anywhere except the text Claude needs to write questions.

## Run it

Open the published RoomRecall page on claude.ai. Claude features need a signed-in claude.ai account; without one the app runs in offline mode with simpler questions. To rebuild the page from source: `python3 build.py`.

## Sources

- Dresler, M. et al. (2017). Mnemonic training reshapes brain networks to support superior memory. *Neuron*. Summary: https://www.sciencedaily.com/releases/2017/03/170308131236.htm
- Karpicke, J. D., Butler, A. C. & Roediger, H. L. (2009). Metacognitive strategies in student learning: 84% of students report rereading. Summary: https://ctli.vermontstate.edu/teaching-effectiveness-framework/instructional-strategies/leverage-the-testing-effect/
- Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning: 61% vs 40% recall after one week. Summary: https://www.psychologicalscience.org/observer/test-enhanced-learning
- Twomey, C. & Kroneisen, M. (2021). The effectiveness of the loci method as a mnemonic device: meta-analysis of 13 trials. https://journals.sagepub.com/doi/10.1177/1747021821993457
