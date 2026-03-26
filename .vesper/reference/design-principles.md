# Design Taste — Fundamentals

Distilled from studying the work and thinking of Jhey Tompkins (@jh3yy), Pixel Janitor
(@PixelJanitor), Will King (@willking), Emil Kowalski (@emilkowalski_), and Jakub Jirak
(jakub.kr). Not a catalogue of examples — a set of principles that explain why their
work feels the way it does.

---

## 1. Motion is communication, not decoration

**The principle:** Every animation carries meaning. It tells the user what happened, what
will happen, or what the relationship is between two states. Animation that exists purely
to look impressive fails as communication.

**In practice:**
- Transition direction should match spatial logic. Something sliding in from the right
  implies it came from somewhere to the right. Breaking this is disorienting.
- Duration should match the weight of the action. Destructive actions benefit from
  slightly slower transitions — the friction is intentional. Micro-interactions (hover
  states, toggles) should be instant or near-instant (80–150ms). Page-level transitions
  can breathe (200–350ms).
- Easing is not cosmetic. Ease-out feels natural for elements entering (decelerating into
  place). Ease-in for elements leaving (accelerating out). Linear motion feels mechanical
  and wrong for UI.
- Physics-based motion (spring, momentum) feels more alive than duration-based curves
  because it responds to context — a heavier element settles differently than a light one.
- The best interactions feel inevitable in retrospect. When you move your cursor and
  something responds with exactly the right behaviour, you don't notice the animation —
  you just feel like the interface understood you.

**What to avoid:** Animation that delays access to content. Looping decorative animations
that the eye can't stop tracking. Transitions that play on every minor state change and
train users to ignore them.

---

## 2. Micro-interaction quality separates good from great

**The principle:** The gap between a competent UI and one that feels crafted lives almost
entirely in the micro-interactions. These are the moments most UIs skip: the hover state,
the click response, the loading state, the empty state, the error recovery.

**In practice:**
- Every interactive element should acknowledge input immediately — within one frame.
  The user needs confirmation that the system received their intent.
- Hover states should feel like the element is meeting you halfway. Subtle scale, a shift
  in shadow depth, a colour step — not a jarring state change.
- Active/pressed states should compress slightly. This mirrors physical button behaviour
  and gives tactile feedback through a flat screen.
- Focus states must be visible and intentional — not an afterthought `outline: 2px solid`.
  Designed focus rings that match the component's visual language.
- Loading states should be proportional to expected wait time. A spinner for a 4-second
  network request. A skeleton for a content-shaped hole. Nothing for sub-200ms operations
  (optimistic UI instead).
- Error states should tell you what went wrong and what to do next. Never just red.

---

## 3. Spatial consistency over arbitrary spacing

**The principle:** Space is not empty — it carries meaning. The amount of space between
two elements says something about their relationship. Consistent spatial logic across an
interface creates a feeling of intentionality even when users can't articulate why.

**In practice:**
- Space within a component (padding) should be tighter than space between components.
  This groups related elements and separates distinct ones.
- Related items share a spacing unit. Unrelated items have more distance between them.
  This is gestalt proximity made systematic.
- A spacing scale (4px base, powers of 2 or a ratio) means you never invent a value.
  12px between these two elements and 11px between those two immediately looks wrong to
  a trained eye — even if the viewer can't name why.
- Vertical rhythm matters on text-heavy interfaces. When line heights and spacing share
  a common unit, text feels settled. When they don't, it looks like an accident.
- Optical spacing vs mathematical spacing: equal padding around an icon looks bottom-heavy
  because of cap height. Equal padding around text looks off when the ascenders and
  descenders break the visual centre. Trust your eyes over the numbers.

---

## 4. Typography does most of the work

**The principle:** In most interfaces, type is 80% of the visual experience. Getting it
right — size, weight, line height, tracking, measure — is more impactful than any other
single design decision.

**In practice:**
- Hierarchy comes from contrast, not just size. Weight contrast (Regular vs Bold) is
  often more legible than size contrast. Using both simultaneously is redundant and
  weakens each.
- Line length (measure) should stay between 60–80 characters for body text. Shorter for
  UI labels. Longer for nothing.
- Line height scales inversely with font size. Small text needs more breathing room
  (1.6–1.8). Large display text needs to be tighter (1.0–1.2) or the whitespace between
  lines competes with the content.
- Tracking (letter-spacing) should be negative or zero for large text, slightly positive
  for all-caps labels and small UI text. Positive tracking on large text looks stretched
  and amateur.
- A type system with 4–6 named styles (display, heading, body, label, caption) is more
  useful than 12 arbitrary sizes. Fewer options force better decisions.
- Pairing typefaces: one job per typeface. If you need a second typeface, it should
  contrast clearly in texture or weight — not be a similar font with minor differences.

---

## 5. Colour carries intent, not just aesthetics

**The principle:** Every colour decision should have a reason beyond "it looks good."
Colour communicates state, hierarchy, brand, and emotion. An interface with arbitrary
colour is unpredictable to navigate.

**In practice:**
- Surface colours should create depth hierarchy. The background is furthest, cards are
  closer, popovers are closest. This parallels physical depth and is immediately readable.
- Interactive elements need a consistent signal. One primary action colour. Users learn
  what is clickable and what isn't by its colour. Mixing clickable colours creates
  confusion.
- Semantic colours (error, warning, success, info) must be consistent across the entire
  product. Red for error only means error. Never use red for a decorative accent.
- Contrast is not optional. 4.5:1 minimum for body text, 3:1 for large text and UI
  components. Low contrast isn't a style — it's an accessibility failure.
- Dark mode is not `color: white; background: black`. It requires rethinking every
  colour decision. Shadows become less useful; surface elevation uses colour instead.
  Saturated colours need to be desaturated at lower brightness levels or they vibrate.
- Transparency and blur (frosted glass) work when there is something worth seeing through.
  Applied to a flat background it is just visual noise.

---

## 6. Detail density should match context

**The principle:** How much information a surface holds should match what the user needs
at that moment. Dashboards can be dense. Onboarding should be sparse. Pushing the wrong
density for context creates cognitive friction.

**In practice:**
- Breathing room is not wasted space. Generous padding around important elements directs
  attention to them. Tight padding on everything means nothing is important.
- Progressive disclosure: show the minimum needed to act. Reveal more on demand. Never
  make users filter through information they didn't ask for.
- Empty states are prime real estate. An empty list is an opportunity to explain what
  would be there, how to create it, and why it matters. A blank screen with "No items"
  is a failure of design.
- Information hierarchy within a component: one thing should be the clear primary. One
  secondary. Everything else is supporting detail. If two things fight for primary
  attention, both lose.

---

## 7. Consistency is trustworthiness

**The principle:** An inconsistent interface feels unpredictable. Users build mental
models from patterns. When a pattern breaks unexpectedly, it costs trust. Consistency
is not about uniformity — it's about predictability.

**In practice:**
- The same action should look the same everywhere. A destructive action is always red.
  A primary CTA is always the same colour and weight.
- Component variants should share a vocabulary. If `size="sm"` means one thing in
  a button, it should mean the same thing in an input.
- Icon usage should be systematic. Icons paired with labels vs icons alone vs labels
  alone should each have a rule. Mixing them arbitrarily creates noise.
- Interaction patterns should be consistent. If cards are clickable, they should all
  respond the same way to hover and click. Users generalise from one example to all
  similar elements.
- When you do break a pattern intentionally, it should be so a critical element stands
  out. The inconsistency is itself communicating importance.

---

## 8. The interface should feel inevitable

**The principle:** The highest praise for a well-designed interface is "of course it works
like this." Every decision should feel like the only reasonable choice, even though dozens
of other choices were possible. This is the result of following user mental models closely.

**In practice:**
- Match platform conventions unless you have a compelling reason not to. Users already
  know how a dropdown works. Reinventing it creates learning cost without benefit.
- Affordances should be legible. Buttons look pressable. Inputs look fillable. Drag
  handles look draggable. These cues should be visible before interaction, not discovered.
- Feedback should be proportional and immediate. A small action gets a small response.
  A large action (deleting data, submitting a form) gets a meaningful response.
- Navigation should reflect how users think about the product, not how the engineering
  is structured. The fact that two features share a database table is irrelevant to
  where they live in the nav.
- Error prevention over error correction. Disable a button when an action is unavailable
  rather than letting the user take the action and then telling them it failed.

---

## 9. Craft shows in what you don't see

**The principle:** Most of the work in high-quality frontend is invisible to the user —
until it's missing. Performance, accessibility, edge cases, empty states, error states,
loading states, responsive behaviour at unusual viewport sizes. The visible tip of the
iceberg is supported by this invisible mass.

**In practice:**
- Every component should be tested at its content limits: one word, one sentence, twenty
  sentences. A component that breaks at unexpected content lengths is not finished.
- Responsive behaviour should be designed, not discovered. At what width does the layout
  need to change? What is the narrowest acceptable version of this component?
- Keyboard navigability is not an add-on. If it can't be operated without a mouse, it
  is not complete.
- Performance is a design value. A 3-second load is a design failure regardless of how
  beautiful the result is. Skeleton screens, optimistic updates, and lazy loading are
  design decisions as much as engineering ones.
- The component you hand off should handle its own edge cases. Overflow with ellipsis.
  Long words that break layout. Zero items. One item. Maximum items.

---

## 10. Systems thinking over one-off solutions

**The principle:** Every individual design decision is an opportunity to either reinforce
or erode the system. A one-off value, a special-case colour, a new component that almost
but not quite duplicates an existing one — these compound. A codebase reflects the
accumulated design decisions of everyone who touched it.

**In practice:**
- Before adding a new component, ask whether an existing one can be extended. Before
  adding a new token, ask whether an existing value is close enough and whether using
  it would compromise the design.
- Naming things well is half the work. A token named `--color-surface-raised` is more
  useful than `--color-gray-100` because it communicates intent, not value.
- The component registry is a design artefact as much as an engineering one. Every entry
  documents a decision. Gaps in the registry are gaps in the system.
- Technical debt in a UI codebase is usually design debt in disguise — inconsistencies
  that accumulated because individual decisions weren't held to a system.
- The best time to maintain a system is continuously, in small increments. The worst
  time is after two years of drift, in a big refactor that nobody has time for.
