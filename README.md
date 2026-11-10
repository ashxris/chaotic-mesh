# chaotic-mesh

A private Dark Studio for mesh gradients. Customize four colors and the mesh ID, add monochrome grain, and export full-resolution PNG, JPEG, or WebP images.

## Run locally

Requires Node.js 20 or later (including the project-local Vercel CLI).

```sh
npm install
npm run dev
```

Open the local address printed by Vite. For a production build, run `npm run build`, then `npm run preview`.

## Create and export

- Change colors using the swatches or six-digit hex fields. Use a mesh ID to recreate a composition.
- Shuffle the composition with the button or the space bar while outside an input or button.
- Choose one of 84 Color Hunt palettes to get started. Reset restores the original palette, mesh ID, and zero grain.
- Adjust grain with the slider or type a whole-number percentage from 0–100. Both controls stay in sync; out-of-range values are clamped.
- Open Export from the header or the button directly below the space-bar hint.
- Grain is a deterministic monochrome finishing layer: 0% leaves the original pixels unchanged.
- Open Export to enter width and height in pixels, choose a preset, lock the aspect ratio, or swap dimensions.
- Presets: HD (1920 × 1080), QHD (2560 × 1440), 4K landscape (3840 × 2160), 4K portrait (2160 × 3840), and square (3000 × 3000).
- PNG is the default. JPEG and WebP offer adjustable encoding quality. Browser format support is checked before saving.
- All downloads include 300-DPI print-density metadata: PNG pHYs, JPEG JFIF, or WebP EXIF. Some viewers ignore print metadata, especially in WebP. Pixel dimensions remain authoritative; printed inches equal pixels divided by 300.
- Each side supports up to 8192 pixels, subject to the graphics hardware limit, with a total limit of 32 megapixels.
- The main and export previews use the same full-resolution rendered image as the download. The composition stays anchored to the 3840 × 2160 landscape. Portrait, square, and other aspect ratios take a centered crop; they never squeeze or stretch the landscape. The crop is rendered directly at the requested pixel dimensions, then grain is applied at that resolution.

## Palette sources

The 84 presets use exact four-color combinations from Color Hunt. Display names are studio names; colors, source references, and mesh IDs are kept together in `src/presets/palettes.js`.

- [Fern light](https://colorhunt.co/palette/fff2b4e5cd82728e6d15370d)
- [Meadow gold](https://colorhunt.co/palette/6a795d8e9162b2bd7ed9d28b)
- [Citrus glow](https://colorhunt.co/palette/ff7e7effa259ffcb56ffedb9)
- [Graphite bloom](https://colorhunt.co/palette/4a4a4ae2b4bdf7d6d0fff5f5)
- [Lagoon light](https://colorhunt.co/palette/c4f7cad8ffc592eeff30afff)
- [Citrus grove](https://colorhunt.co/palette/ff9d4dffde4ea1cb35769826)
- [Pistachio peach](https://colorhunt.co/palette/bbf1d2eef8cdffc5aaff9d9d)
- [Garden party](https://colorhunt.co/palette/689d4b91ae6ef2f2f2d96868)
- [Lavender mist](https://colorhunt.co/palette/424874a6b1e1dcd6f7f4eeff)
- [Sage & sand](https://colorhunt.co/palette/675d50abc4aaf3debaa9907e)
- [Botanical](https://colorhunt.co/palette/e1f0dad4e7c5bfd8af99bc85)
- [Forest floor](https://colorhunt.co/palette/2c39303f4f44a27b5cdcd7c9)
- [Moss garden](https://colorhunt.co/palette/e6f2ddb1d3b988bda4659287)
- [Olive grove](https://colorhunt.co/palette/504b38b9b28aebe5c2f8f3d9)
- [Wildflower](https://colorhunt.co/palette/7469b6ad88c6e1afd1ffe6e6)
- [Sunroom](https://colorhunt.co/palette/f9ed69f08a5db83b5e6a2c70)
- [Terracotta](https://colorhunt.co/palette/f39e60e16a549f52557c444f)
- [Apricot](https://colorhunt.co/palette/fff0beffd6a6ffb399ff9a86)
- [Periwinkle](https://colorhunt.co/palette/eef1ffd2daffaac4ffb1b2ff)
- [Blue hour](https://colorhunt.co/palette/f2efe7c8dfdb66a3bf3368a0)
- [Twilight](https://colorhunt.co/palette/403d888b639baf719df8b2b2)
- [Nightfall](https://colorhunt.co/palette/faf0e6b9b4c75c5470352f44)
- [Golden wheat](https://colorhunt.co/palette/bdb395d5c7a3f2e2b1f6f0f0)
- [Sea glass](https://colorhunt.co/palette/f9f7c9d5f0c1aad9bb80bcbd)

- [Azure depth](https://colorhunt.co/palette/aaccd64382df4647ae112e81)
- [Solar orbit](https://colorhunt.co/palette/e4ff30008bff5b23ff362f4f)
- [Moonlit bay](https://colorhunt.co/palette/ffe3a98ccdeb725cad0b1d51)
- [Iris field](https://colorhunt.co/palette/b5a8d57a73d14d55cc211c84)
- [Lime orchid](https://colorhunt.co/palette/fffbcaaeea94b771e54635b1)
- [Jade & iris](https://colorhunt.co/palette/d5e7b572baa97e5cad474e93)
- [Amethyst](https://colorhunt.co/palette/c2d9ff8e8ffa7752fe190482)
- [Ultraviolet](https://colorhunt.co/palette/e4f1ffaed2ff9400ff27005d)
- [Magenta after dark](https://colorhunt.co/palette/ec53b09d44c04d2db70e21a0)
- [Indigo tide](https://colorhunt.co/palette/8cabff4477ce512b8135155d)
- [Violet storm](https://colorhunt.co/palette/c4b0ff8696fe4942e411009e)
- [Midnight bloom](https://colorhunt.co/palette/d4adfc5c469c1d267d0c134f)
- [Peacock](https://colorhunt.co/palette/77037b210062009fbdf9e2af)
- [Cobalt moon](https://colorhunt.co/palette/3795bd2f58cd4e31aa3a1078)
- [Wisteria ice](https://colorhunt.co/palette/eeeeeebfdce53e54acad7be9)
- [Morning haze](https://colorhunt.co/palette/946d6da290b7b0cde6fdf4d2)
- [Cotton petal](https://colorhunt.co/palette/c5b3d3f5cbcbffe2e2fbefef)
- [Hydrangea](https://colorhunt.co/palette/d9f9dfaee2ffb5baff9fa1ff)
- [Amber violet](https://colorhunt.co/palette/e8ddb4dec384daa464767f9e)
- [Orchard bloom](https://colorhunt.co/palette/84c5b1accfa3f0e9b6744577)
- [Cloud ribbon](https://colorhunt.co/palette/9b8ec7bda6ceb4d3d9f2eae0)
- [Peach dusk](https://colorhunt.co/palette/ffdab3c8aaaa9f8383574964)
- [Petal blue](https://colorhunt.co/palette/f2aebbf5d3c4a7aae1696fc7)
- [Lilac peach](https://colorhunt.co/palette/687fe5ebd6fbfeebf6fcd8cd)
- [Vanilla iris](https://colorhunt.co/palette/898ac4a2aadbc0c9eefff2e0)
- [Orchid dawn](https://colorhunt.co/palette/ffe1e0f49bab9b7ebd7f55b1)
- [Sorbet meadow](https://colorhunt.co/palette/8e7dbea6d6d6f4f8d3f7cfd8)
- [Almond lilac](https://colorhunt.co/palette/fff7f3fad0c4e6b2bac599b6)
- [Lavender grove](https://colorhunt.co/palette/8d77abf9f6e6e1eacdbad8b6)
- [Apricot nebula](https://colorhunt.co/palette/ffd2a0efb6c8a888b58174a0)
- [Emerald canopy](https://colorhunt.co/palette/8bbb922a835f12544f092328)
- [Pine hollow](https://colorhunt.co/palette/2733382b57486187649cb080)
- [Lemon shadow](https://colorhunt.co/palette/1b0c0c313e174c5c2dffde42)
- [Forest dew](https://colorhunt.co/palette/b0e4cc408a71285a48091413)
- [Harvest fern](https://colorhunt.co/palette/ebd5ab8bae666281411b211a)
- [Juniper peach](https://colorhunt.co/palette/f9f6f3f5c9b0a6b28b1c352d)
- [Tangerine fern](https://colorhunt.co/palette/d3eccd06923e212121e67514)
- [Deep forest](https://colorhunt.co/palette/1f7d53255f3827391c18230f)
- [Persimmon grove](https://colorhunt.co/palette/33372c557c56ffe5cfff885b)
- [Marigold moss](https://colorhunt.co/palette/45474b379777f4ce14f5f7f8)
- [Spring midnight](https://colorhunt.co/palette/141e4641b06e8decb4fff5e0)
- [Autumn ember](https://colorhunt.co/palette/bed754e3651d750e21191919)
- [Woodland cream](https://colorhunt.co/palette/fde5d4d6cc99445d48001524)
- [Olive current](https://colorhunt.co/palette/d3d04f8eac5017594a213363)
- [Fern bark](https://colorhunt.co/palette/d2d79f90b77d42855b483838)
- [Linen](https://colorhunt.co/palette/c9b59cd9cfc7efe9e3f9f8f6)
- [Oat milk](https://colorhunt.co/palette/fbf3d1deded1c5c7bcb6ae9f)
- [Sand & sky](https://colorhunt.co/palette/cfab8dd9c4b0eceedfbbdce5)
- [Stone path](https://colorhunt.co/palette/ecebded7d3bfc1baa1a59d84)
- [Cocoa cream](https://colorhunt.co/palette/3b3030664343795757fff0d1)
- [Honey butter](https://colorhunt.co/palette/d8ae7ef8c794ffe0b5fff2d7)
- [Warm parchment](https://colorhunt.co/palette/fff2e1ead8c0d1bb9ea79277)
- [Driftwood](https://colorhunt.co/palette/b2a59bded0b6faeed1607274)
- [Wheat silk](https://colorhunt.co/palette/bbab8cded0b6faeed1fdf7e4)
- [Soft taupe](https://colorhunt.co/palette/776b5db0a695ebe3d5f3eeea)
- [Caramel light](https://colorhunt.co/palette/fae7c9e1c78fb0926a706233)
- [Rosewood](https://colorhunt.co/palette/f9f5e7f8ead8eddbc7a7727d)
- [Mushroom dusk](https://colorhunt.co/palette/f1d3b3c7bca18b7e7465647c)
- [Espresso cream](https://colorhunt.co/palette/594545815b5b9e7676fff8ea)
- [Dune shadow](https://colorhunt.co/palette/eddfb3d8cca3b09b7187805e)

Scroll the palette strip horizontally with a trackpad, touch, Shift + mouse wheel, or the previous/next buttons. The strip is keyboard focusable, and each preset is a normal keyboard-accessible button.

Preset thumbnails are generated locally with the unchanged gradient engine at 4K landscape and zero grain. Only cards near the scroll viewport are generated, one at a time; the current editor settings are restored after each preview. Until a thumbnail is ready, the card shows its four actual colors. No remote images or runtime Color Hunt requests are used.

## Implementation

Built on the existing Svelte + Vite project. The files in `src/core/` are unchanged. UI, grain compositing, format encoding, and print-density metadata are implemented outside the core generator. The original engine keeps the landscape geometry and noise coordinates. An external framing adapter changes only the camera viewing window and output framebuffer to render the centered crop at the requested size; the interface displays a smaller copy.

No ads, donation prompts, external fonts, tracking scripts, or promotional links are loaded. `noindex` and `robots.txt` discourage indexing; they do not provide access control. Keep the repository and any deployment private using your hosting provider's access settings.

## Checks

```sh
npm test
npm run build
```

## Vercel deployment

The Vercel CLI is installed as a project development dependency. `vercel.json` configures the Vite build with `npm ci`, `npm run build`, and output directory `dist`.

```sh
VERCEL_TOKEN_STORAGE=file npx vercel login --global-config .vercel/cli-auth
npx vercel link --project chaotic-mesh --scope ashwinnn --global-config .vercel/cli-auth
```

Before the first deployment, ensure the linked Vercel project uses Vercel Authentication with protection scoped to All Deployments, including production. A private source repository or `noindex` does not protect the website itself.

After project linking and access protection are configured, `npm run deploy` publishes the production deployment to the linked project. The generated `.vercel/` folder, including project-local CLI credentials, is ignored by Git. `.vercelignore` excludes that folder, local environment files, dependencies, and test files from source uploads.

## License and source notices

The original LICENSE and copyright/source notices are retained. The inherited license contains restrictions on modification, reproduction, and commercial use. These customizations do not replace or relicense the original code. See `LICENSE` and the notices in `src/core/`.
