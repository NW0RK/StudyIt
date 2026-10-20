# StudyIt release verification

Verified on October 21, 2026 (Asia/Tbilisi).

## Android 1.0.1 visual refresh

Reference screenshots were captured from the Reddit Android app on the Galaxy A52: home feed, discussion header, and nested comments. They remain local in `test-results/reddit-reference/`; no Reddit content or account data is included in the application or repository.

The refresh implements a rounded search header, charcoal and white themes, a community drawer, full-width feed rows, circular community/persona icons, outlined action pills, icon navigation, compact thread surfaces, and Android back-button handling. A physical screenshot review caught clipped search text; explicit native input height and padding corrected its alignment in application revision `801fd03`.

The physical-device suite additionally covers drawer navigation, opening a joined community, returning with Android Back, switching both themes, searching for recursion, collapsing and expanding a reply, mathematics, bookmarks, and saved-discussion persistence across restart. Existing saved content survived the update.

- The layout refresh was verified on emulator and Galaxy A52 at revision `801fd03` before generated profile pictures were added: [build and expanded emulator verification](https://github.com/NW0RK/StudyIt/actions/runs/39495019076).
- Profile pictures share one deterministic drawing recipe across Android, the website, and the SVG export script. The current library exports 14 distinct characters; 21 tests pass, including avatar stability, background variation, and treating untrusted names only as seeds.

See [Android design notes](ANDROID_DESIGN.md) for the reference-to-implementation details.

## Original 1.0 release evidence

- [Website deployment](https://github.com/NW0RK/StudyIt/actions/runs/39489892363): successful production export and GitHub Pages deployment.
- [Android build and emulator verification](https://github.com/NW0RK/StudyIt/actions/runs/39489894673): standalone APK built from application revision `3232ce5`; build and verification jobs both passed.
- The same APK was installed and tested on the owner's Samsung Galaxy A52 (SM-A525F), Android 14 / API 34.
- SHA-256: `626f942a43ab1491e12c81afbbe8eb43c98050979d94fd0d8cff2c479938ad0e`.

Subsequent release documentation and Windows/physical-device test helper changes do not change the application sources in this APK.

## Acceptance results

| Requirement | Evidence |
| --- | --- |
| Android app and public GitHub Pages website | Successful build/deploy jobs; APK installed and launched on emulator and Galaxy A52. |
| Reddit-style desktop reference | Compared the supplied HTML's layout and public CSS values with the rendered app; verified 56px header, compact feed, charcoal palette, sidebars, and working navigation collapse. Reference HTML/account data/scripts are not shipped. |
| Separate mobile reading layout | Browser inspection at 390px; native screenshots on emulator and Galaxy A52. |
| Subject communities and teaching discussions | Five published threads across three subjects; fictional learner and AI identity labels verified in rendered threads. |
| Search, follow, save, read/unread, themes | Browser checks of subject/body search, navigation, themes, saved items and read state; saved discussion persisted after native app restart. |
| Nested replies, code, mathematics, sources | Browser inspection and native screenshots; native test located the nested question and mathematical explanation. |
| Agent authoring contract | Versioned JSON Schema, instructions, and example upload; validation tests for malformed JSON, unsupported versions, references, cycles, duplicates, dates, and unsafe URLs. |
| Website upload, preview, and download | Imported complete example; validated a separate unpublished preview on the live website and downloaded its normalized JSON. Returning to Home retained five published discussions; preview did not publish. |
| New shared information without rebuilding clients | An already-open website refreshed from four to five discussions and rendered the new recursion thread without reloading its application bundle. Native library refresh succeeded on emulator and Galaxy A52. |
| Offline reading and failure recovery | Website reloaded and searched after stopping its server. Emulator airplane-mode scenario reopened a cached saved thread. Shared sync tests prove failed refreshes never persist a partial library. Physical phone connectivity was not changed. |
| Local reading activity | Browser bookmark survived reload; native bookmark survived force-stop/restart on emulator and Galaxy A52. No account or activity-sync backend is included. |

## Automated checks

`npm run check` passed TypeScript checking, 19 behavior tests, and full source-content validation. The Android pipeline additionally passed Expo dependency compatibility checks and native compilation. APK verification covered launch, reading, nested mathematical replies, saving, restart persistence, shared refresh, and offline reading.

The physical-device helper additionally handles Windows UTF-8 output, main-profile installation on Samsung, visible accessibility bounds, and waking a sleeping display. It neither unlocks the device nor changes its security or network settings. Security/install prompts were completed by the owner.

Content validation checks structure and safe rendering; educational accuracy still needs human review. Starter source URLs were checked against OpenStax, NASA, and MDN. This is a personally installable, preview-signed release, not an app-store submission.
