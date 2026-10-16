# Pass: animate

Add or fix motion. The rules are DESIGN.md "Motion" (jobs, timing table, `--ease-out`, reduced motion, the shelf as the focal moment); this pass is the process.

1. **Find the job.** Review the motion that already exists, the states, the devices and the budget. Animate only where motion acknowledges an action, shows a change of state, keeps continuity when something moves, or is the focal moment.
2. **Write the motion plan before code:** the focal moment (if any), the changes that need explaining, which controls get feedback, the budget (what is expensive and how often it runs), and what reduced motion shows instead.
3. **Choose the material by meaning:** `transform` and `opacity` for movement; colour for state; a bounded shadow for depth (the cover settling). FLIP or View Transitions only when continuity is the point. One strong idea, not stacked effects. CSS transitions/keyframes for declarative states; the Web Animations API only for interruption and sequencing. No new dependency.
4. **Build:** content visible without the animation; exits faster than entrances; `will-change` only during a known animation; a second click mid-animation lands in the right end state.
5. **Reduced motion:** fewer and gentler, not nothing: remove the movement, keep colour and state changes and clear confirmation.

## Avoid
Generic fade-and-rise reveals, hover lifts, parallax, scroll reveals, staggering every section, bounce or elastic curves, animating `width`/`height`/`top`/`left`/margins, `transition: all`, page-load choreography on Operate screens, motion users must wait through.

## Check
Record it or take frames at 0/50/100% (browser-check skill), again with `reducedMotion: 'reduce'`, on desktop and phone, with repeated and interrupted use. Removing each animation must lose meaning or character, not just decoration. Then `polish`.
