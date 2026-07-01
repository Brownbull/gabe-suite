# examples.md — three worked myopic walks

These show the output shape and, more importantly, the *reasoning voice*: staying dumb, tracking
the information state, and catching the mattress. Abridged for length; a real WALK shows the full
step ledger.

---

## Example 1 — SaaS onboarding wizard (WALK)

**Target (described flow):** 1) pick a plan · 2) name your workspace · 3) invite teammates ·
4) pick a template · 5) land in the empty dashboard.
**Goal:** get to a usable workspace.

### Panel result
```
| User  | Fatal step | What breaks them                                              |
|-------|-----------|---------------------------------------------------------------|
| @1    | 1         | plan tiers ask them to predict usage they can't see yet       |
| @1.5  | 3         | invites teammates before there's anything to invite them to   |
| @2    | 4         | template choice silently locks features gated by the plan @1  |
```

### Selected findings
**[HIGH] 🛏️ Step 1 — Plan choice gates step-4 features, invisibly.**
- *What the myopic user does:* "Free is fine, I'll upgrade later," clicks Free, moves on. At step 4
  the template they want is greyed out with a lock icon and no explanation of *which* earlier choice
  caused it.
- *Why it's beyond horizon:* the consequence of the plan choice lands **3 steps later**. Even @2
  (two moves ahead at step 1) can't see the template grid yet.
- *Who it catches:* @1 ✓ · @1.5 ✓ · @2 ✓ → and irreversible-feeling (they'd have to restart) →
  **HIGH, near CRITICAL.**
- *Fix (collapse the horizon):* on the template grid, label locks *"unlocks on Pro — you picked
  Free in step 1 [change]"*. Pull the future consequence into the present, and make the earlier
  choice cheaply reversible from where it bites.

**[HIGH] 🧠🌊 Step 3 — Invite teammates before the workspace has any content.**
- *What the myopic user does:* stares at an email field. They have no idea what they're inviting
  people *to* yet (nothing exists), so they either skip (and never return — the intention is evicted)
  or invite blindly. Also asks for role per person = 🌊 several decisions with zero context.
- *Fix:* move invites to *after* the first template/content exists (recognition, not prediction), or
  make it a one-click "skip, invite later" that resurfaces contextually.

### Handle
"Picks Free in the lobby, finds the door he wanted locked three rooms in."

---

## Example 2 — E-commerce checkout (TRAP mode — mattresses only)

**Target:** cart → shipping address → shipping method → payment → review → place order.
Only foresight traps; overwhelm/recall skipped by design of TRAP mode.

**[CRITICAL] 🛏️ Step 2 → bites at Step 3.** Address country is collected as a plain field on step 2;
on step 3 half the shipping methods vanish because the country doesn't support them — with no
message tying it back. The user picked a country reactively (@1 behavior) and can't see it pruned
their options one step later. *Fix:* show "ships to {country}: 2 of 4 methods available" on the
address step itself.

**[CRITICAL] 🛏️🚪 Step 4 → bites at Step 5.** A discount code field lives on **payment** (step 4),
but the order total that the user mentally committed to was shown on **review** (step 5, after
payment is entered). A myopic user enters payment, reaches review, realizes the code went
unused, and there's no way back to step 4 without re-entering card details. *Fix:* surface the code
field on review (where the total is), or carry payment state through a back navigation.

### Handle
"Braces for the total on the review page — the discount door was two rooms back and already locked."

---

## Example 3 — App settings / permissions (STEP mode, first-person, 2 turns shown)

**Target:** a "sharing & permissions" settings page with: link access (Off / Anyone-with-link /
Public), a role dropdown (Viewer/Editor), and an "advanced" toggle that reveals domain
restrictions.

> **@1.5, step 1 (thinking out loud):**
> "I just want to send this to one coworker. There's an 'Anyone with the link' option — that sounds
> like the way to share a link. I'll pick that and grab the link." *(Reactive, locally optimal: the
> label matches the immediate intent. The consequence — the doc is now reachable by anyone the link
> ever leaks to — is invisible; 'anyone with the link' reads as 'anyone I send the link to.')*
> **🛏️ flag: the security consequence lands whenever the link is forwarded — indefinitely later,
> never on this screen.**

> **@1.5, step 2:**
> "It defaulted the role to 'Editor.' I don't know what that changes and I'm here to share, not to
> study roles, so I'll leave it." *(Overwhelm-adjacent: an unowned decision left at a risky default.
> A myopic user does not price 'Editor = they can delete my stuff' three steps from now.)*
> **🛏️ flag: default grants more than the user's 1-step intent ('let them see it') implies.**

*Fix (both):* rename to consequence-language ("Anyone with the link **can find and open** this"),
default role to the *least* privilege that satisfies the visible intent (Viewer), and preview
"who can reach this" in place so the future is shown in the present.

### Handle
"Clicks 'share with a coworker,' quietly publishes to the whole internet."
