# Brand sources

Source artwork kept here so it's backed up without being published: anything in `Apollon/web/public` ships with every build and is downloadable from the site.

- `winged-words-logo.png`: the winged-dog logo, 1192×882, transparent, in its original rust (`#9a330b`) with smooth edges. The largest copy there is; recolour it by using it as a mask (as the site's header does with `logo-mark.png`, which is only 276 px wide). `Apollon/web/public/og-image.png` was made from it on 2026-10-19 (`specs/landing-page.md`).
  - It was cut out of the original artwork (1610×977, 1.4 MB, with a grey-and-white checkerboard painted into its background) by colour: kept where red is well above blue. That original is in this repo's history: `git show da1a194:brand/winged-words-logo.png > original.png`.

The preset avatars are rebuilt from public-domain originals by `Apollon/web/art-sources/build_avatars.py` (`specs/public-domain-avatars.md`); the old AI-made avatar sheets are in Apollon's history.
