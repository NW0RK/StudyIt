# Generated profile pictures

StudyIt generates an original friendly robot profile picture for each AI persona and fictional learner. Backgrounds, clothing, head shapes, expressions, glasses, hats, and antenna details vary from a stable identity seed. These are original drawings inspired by the colorful avatar presentation in Reddit, not Reddit's mascot or assets.

Run `npm run avatars:build` to export every current character as a circular SVG, a manifest, and a browsable gallery in `public/avatars/`. `npm run content:build` runs this automatically, including during website and Android builds. The published gallery is at `/StudyIt/avatars/`.

The app and website render the same drawing recipe directly, without an avatar service or network request. Newly synced discussions receive profile pictures immediately, including offline. The same persona ID and name produce the same character across discussions and devices. Learners use a separate identity namespace. Changing an identity changes its picture; merely reordering discussions does not.

The recipe lives in `src/avatar.ts`; the cross-platform SVG component is `src/ProfileAvatar.tsx`; the export script is `scripts/build-avatars.ts`. Edit the background palette or drawing recipe there to customize the style. No image-generation service, API key, or extra installation step is needed to regenerate the gallery.
