# Feature Spec — Emoji and light formatting in club chat and club comments

**Status:** written 2026-11-06. Phase 1 built 2026-11-06 (see "As built"). Phase 2 (GIFs) is on hold waiting for Klipy.

## 1. Problem

The club chat and the club discussion comments are plain text. Readers want to react with emoji and to stress a word or quote a line, as they do in other chat apps. Asked 2026-11-06.

## 2. Decisions

- **Where:** the club chat dock, and club discussion posts, replies and edits (`CommentTree`, the thread and buddy-read forms). **Not** reviews, Writings comments or highlight notes: they render plain text, so the marks would show raw.
- **Emoji are ordinary text.** No new column, no upload. The picker is our own small component with a fixed list (no package, no network, nothing to audit). No search, since search words would need five translations.
- **Formatting is a tiny subset of Markdown, stored as typed:** `**bold**`, `*italic*` and a line starting `> ` as a quote. Links keep working as today. We never store or render HTML: the renderer builds React elements from plain text (no `dangerouslySetInnerHTML`), so a message can't inject markup or a script.
- **No backend change for formatting.** The server stores text and the browser draws it. The length limit counts the marks too (1,000 in chat), and an emoji counts as 2 (UTF-16), the same in the browser and in C#.
- **One fix on the server:** the chat's cleanup of invisible characters (`ClubChatService.WithoutInvisibleMarks`) removes U+200D, the joiner inside family, couple and flag emoji (👨‍👩‍👧, 🏳️‍🌈), which would fall apart. It keeps U+200D between two emoji and drops it elsewhere.
- **Italic uses `*` only, not `_`:** underscores appear in usernames and web addresses.
- **A toolbar** (Bold, Italic, Quote, Emoji) sits over the box, so nobody has to know the marks. Bold and italic wrap the selection, or add the marks and put the cursor between them.
- **Out of scope:** pictures (pasted links or uploads), GIFs, reactions, replies-to-a-message, editing a chat message, @mentions.

## 3. Phase 2 — GIFs (on hold)

A GIF picker from Klipy, searched from the reader's browser, with the safe content filter. A message keeps only the GIF's slug. Waiting on Klipy's written answers: is it free for a commercial site and at what size does pricing start, is commercial use allowed, may we keep only the slug, and may the required "Search KLIPY" placeholder be translated. Notes from `https://docs.klipy.com`: requests must come from the reader's browser (no proxy), media must load from Klipy's URLs (`static*.klipy.com`), never stored; search results can't be reordered or filtered by us (filters live in Klipy's Partner Panel); "Search KLIPY" placeholder is required, a "Powered by KLIPY" mark is optional; GIFs only (clips aren't fully rated); the privacy policy needs a line, and the Content-Security-Policy must allow `api.klipy.com` and `static*.klipy.com`.

## 4. Design

**Browser (Phase 1)**
- `lib/richText.ts`: `richBlocks(text)` cuts text into lines (quote or normal), each into runs (text, bold, italic, link). Pure and tested. Marks must touch the words (`2 * 3 * 4` stays plain), and an unclosed mark stays plain.
- `components/RichText.tsx`: draws those runs. Used by `ClubChat` and `CommentTree`.
- `lib/richTextEdit.ts`: the toolbar's text edits (wrap the selection, toggle a quote on the lines, insert at the cursor). Pure and tested.
- `components/EmojiPicker.tsx` + `lib/emojiList.ts`: a button that opens a small panel with groups (Smileys, Gestures, Hearts, Animals, Food, Objects, Symbols). Closes with Escape or a click outside and gives focus back to the box. Each emoji is a button.
- `components/FormatToolbar.tsx`: the four buttons, shared by `ClubChat`'s composer and `CommentForm` (new prop `rich`, on only for club discussion forms).
- Translations in all five languages: the toolbar's labels, the picker's group names.

**Server (Phase 1)**
- `ClubChatService.WithoutInvisibleMarks` keeps a joiner between two emoji.

## 5. Tasks

### Phase 1 — Emoji and formatting (size M; Opus medium)

#### Backend
- [x] Keep U+200D between two emoji in `ClubChatService.WithoutInvisibleMarks`; test that a family emoji survives and a joiner in a web address is still dropped

#### Frontend
- [x] `lib/richText.ts` + tests
- [x] `lib/richTextEdit.ts` + tests
- [x] `RichText` component, used in the chat bubble and in `CommentTree`
- [x] `EmojiPicker` and `FormatToolbar`
- [x] Toolbar in the chat composer and in `CommentForm` (`rich`) on the club discussion forms
- [x] Translations (five languages)

#### Verification
- [x] `npm test` (1,397 pass), `tsc -b`, `npm run lint`; backend: the 17 `ClubChatTests` on a private database
- [ ] The full `dotnet test` and the Vite production build: left to `scripts/precheck.ps1` on the push
- [x] In the browser: type `**bold**`, `*italic*`, a quote and a family emoji in the chat and in a club thread; they render the same after a reload and for another member; a message with `<script>` or `<b>` shows as plain text
- [x] Narrow phone width: the toolbar and the picker fit above the keyboard
- [x] `argos-security` looks at the renderer (user text reaching other readers' screens)

**As built (2026-11-06)**
- **Where it shows:** the chat bubble and every `CommentTree` comment (club threads, replies, highlight notes, buddy reads). The toolbar is on the chat box, the thread and question forms, replies and edits, and the buddy-read box. A thread card's preview shows the text without its marks (`richPlain`).
- **Quote look:** a faint tinted block as wide as its text, not a coloured side bar (DESIGN.md refuses side borders over 1px; the design guards fail on them).
- **Emoji panel:** spans the toolbar's width (max 22rem), so it can't run past the chat window or a phone screen. Found in the browser check: a fixed 19rem panel anchored to its button was cut off at both widths.
- **Cursor:** a box never clicked into reports its cursor at the start, so the toolbar treats it as "at the end" until the box has had focus.
- **Links in club comments are now clickable** (they were plain text). `argos-security` found that comments, unlike chat, don't clean zero-width and text-direction characters, so a link's text could be made to read as another address. A link containing one is now left as plain text (`chatLinks.ts`, tested). Not fixed here, already true before: chat also lets through other blank-looking characters (U+2800, U+3164, tag characters), which could make a message look empty.
- **Joiner rule:** `StrayJoiners` keeps U+200D only between emoji-like characters; an all-joiner message is still refused as empty.

### Phase 2 — GIFs (on hold, waiting on Klipy's answers)
