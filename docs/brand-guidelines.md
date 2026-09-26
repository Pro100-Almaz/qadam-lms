# Qadam brand guidelines

The single source of truth for how the Qadam brand is implemented in this app.
Tokens live in `src/assets/main.css`; this document explains how to use them.
If the two disagree, fix whichever is wrong and update the other.

## 1. Names

| What | ru | kz | en | i18n key |
|---|---|---|---|---|
| Product | Qadam LMS | Qadam LMS | Qadam LMS | `app.name` |
| School | Школа Qadam | Qadam мектебі | Qadam School | `app.school` |
| Tagline | Система управления обучением | Оқу үдерісін басқару жүйесі | Learning Management System | `app.tagline` |

- Always render names through `t('app.name')` / `t('app.school')`. Never hardcode them in templates, titles or reports.
- "Qadam" is always Latin script, capital Q, in every language.
- Never "Qadam Analytics" or any other invented product name. Analytics is a feature of Qadam LMS, not a product.

## 2. Logo

Files in `public/images/logo/` (plus the favicon):

| File | Artwork | Use it on |
|---|---|---|
| `logo.svg` | Gradient mark, wordmark `#232323` | Light backgrounds: expanded sidebar and header in light mode |
| `logo-dark.svg` | Gradient mark, white wordmark | Dark backgrounds: sidebar and header in dark mode, the sign-in brand panel, the dark report header (`ReportPage.vue`) |
| `logo-icon.svg` | Mark only, on a `#383838` rounded square (36x36) | Collapsed sidebar and other small square slots |
| `public/favicon.svg` | Same artwork as `logo-icon.svg` (dark rounded square, `qa` mark) | Browser tab icon (`index.html`) |

Rules:
- The gradient `#FF3D36` → `#EAE43D` belongs to the logo. You may also use it for sign-in page decoration (`Signin.vue`). Never use it as a UI colour for buttons, links, charts or badges.
- Alt text is always `alt="Qadam School"`. When a light and a dark variant sit side by side (`dark:hidden` / `hidden dark:block`), both get the alt text.
- Clear space: leave at least the height of the bowl of the "q" empty on every side of the logo. Don't crowd it with text or icons.
- Don't recolour, stretch, rotate, outline, add shadows, or put the light logo on a dark surface (or the other way round). Scale it proportionally, setting only `width` or only `height`.
- `public/favicon.ico` is a legacy raster fallback; regenerate it from `logo-icon.svg` if it ever drifts from the SVG.

## 3. Colour

### Brand ramp (`--color-brand-*`)

| Token | Hex | Token | Hex |
|---|---|---|---|
| 25 | `#fff8f3` | 500 | `#d96a2f` (canonical brand orange) |
| 50 | `#fff1e6` | 600 | `#b5511e` |
| 100 | `#ffe0c8` | 700 | `#a3471a` |
| 200 | `#fcc49a` | 800 | `#843a16` |
| 300 | `#f5a46e` | 900 | `#6b3015` |
| 400 | `#e87c43` | 950 | `#3d1a0b` |

### Usage rules

| Need | Light mode | Dark mode |
|---|---|---|
| Solid fill behind white text (primary button, active pill) | `bg-brand-600`, hover `bg-brand-700` | same |
| Orange text or link | `text-brand-600` or darker | `text-brand-400` / `text-brand-300` |
| Tinted active state (menu item, chip) | `bg-brand-50 text-brand-600` | `bg-brand-500/[0.12] text-brand-400` |
| Borders, focus rings, icons, decorative dots and indicators | `brand-500` | `brand-500` / `brand-400` |

`brand-500` is the colour people recognise as the brand, but it fails as text colour on white. Use it only where text contrast rules don't apply.

### Contrast (WCAG 2.x)

| Pair | Ratio | Verdict |
|---|---|---|
| brand-500 `#d96a2f` on white | 3.47 | Fails for body text; OK for icons, borders and large text only |
| brand-600 `#b5511e` on white | 5.05 | AA text |
| brand-600 on brand-50 `#fff1e6` | 4.56 | AA text |
| white on brand-600 | 5.05 | AA (button labels) |
| brand-700 `#a3471a` on white | 6.05 | AA text |
| brand-400 `#e87c43` on gray-900 `#101828` | 6.25 | AA text (dark mode) |
| brand-300 `#f5a46e` on gray-900 | 8.80 | AAA text (dark mode) |

### Semantic colours

Use these for meaning, never brand orange:
- `success-*` (green, 500 `#12b76a` / 600 `#039855`): passed, present, saved.
- `warning-*` (amber, 500 `#f79009` / 600 `#dc6803`): late, needs attention. Use warning, not brand orange, so a warning doesn't look like brand decoration.
- `error-*` (red, 500 `#f04438` / 600 `#d92d20`): failed, absent, destructive actions.
- `blue-light-*` (500 `#0ba5ec` / 600 `#0086c9`): neutral information, comparison series.
- `gray-*`: text, surfaces and borders. The dark-mode card surface is `gray-900` `#101828`.

For text, use the `-600` step (or darker) on light surfaces and `-400` or lighter on dark ones.

### Charts

- Take every chart colour from `src/components/analytics/chartTheme.ts` (`SERIES_STUDENT` = success-600, `SERIES_CLASS` = blue-light-600, and the diverging heatmap ramps it provides for light and dark mode).
- Never use TailAdmin's stock blue `#465FFF`. It is not a token here and it is not our brand.
- Don't make colour the only signal: label values, and use legends with both ends labelled.

## 4. Typography

- Typeface: **Manrope**, loaded from Google Fonts (`wght@200..800`) at the top of `main.css`. It covers Cyrillic, including the Kazakh letters ә ғ қ ң ө ұ ү һ і. Don't add a second typeface.
- Token: `font-manrope`, applied on `body`. `--font-*: initial` removes Tailwind's default font stacks, so `font-sans` etc. don't exist.
- Custom sizes (each has a matching line height):

| Token | Size / line height | Typical use |
|---|---|---|
| `text-title-2xl` | 72 / 90 | Hero numbers (rare) |
| `text-title-xl` | 60 / 72 | |
| `text-title-lg` | 48 / 60 | |
| `text-title-md` | 36 / 44 | Page hero, KPI value |
| `text-title-sm` | 30 / 38 | Section title |
| `text-theme-xl` | 20 / 30 | Card title |
| `text-theme-sm` | 14 / 20 | Body, table cells |
| `text-theme-xs` | 12 / 18 | Captions, meta, badges |

Standard Tailwind sizes (`text-sm`, `text-lg`, ...) are still available. Weights in use run from 400 to 700. Keep 200 and 300 for very large display text only.

## 5. Language and voice

- Locales: `ru` (default and fallback), `kz`, `en`. The switcher labels are Русский / Қазақша / English.
- The internal code is `kz` (used for messages, the saved preference and API values such as `ReportLanguage`), but the BCP-47 tag is `kk`. `<html lang>` and every `Intl.*` / `toLocaleString` call must use `currentIntlLocale()` from `src/i18n/index.ts`. Never pass the raw locale code.
- Every UI string goes through vue-i18n. Add each key to all three files (`src/locales/ru.json`, `kz.json`, `en.json`) in the same commit. No hardcoded Russian or English in templates.
- Kazakh word order differs. Don't build sentences by joining fragments; use one key with named placeholders and let each language place them. Example: `pagination.ofTotal` is `из {total} записей` / `of {total} entries` in ru/en, but kz rephrases the whole control around the page-size dropdown: `Бетте [10] · барлығы {total} жазба` ("10 per page · {total} records in total"). Check plurals and case endings with a native speaker.
- Tone: calm, respectful and clear. The audience is teachers, parents and students. Say what happened and what to do next; don't blame the user.
- Address users formally: «Вы» in Russian and «Сіз» in Kazakh.
- No emoji as branding or decoration in UI copy, titles or reports. Use icons from `@/icons`.

## 6. School houses (sub-brand)

Four house badges live in `/public`, each 335x243 PNG on a dark gradient background:

| File | House | Emblem / colour |
|---|---|---|
| `Altyn Orda.png` | Altyn Orda | Eagle, gold/orange |
| `Aq Orda.png` | Aq Orda | Snow leopard, red |
| `Kok Orda.png` | Kök Orda | Wolf, blue |
| `Uly Orda.png` | Ūly Orda | Owl, green |

- They are a sub-brand asset for the house system. **The app doesn't use them yet.** Don't delete them.
- Their style (detailed mascot illustrations, glows, saturated colour, their own lettering) is very different from the flat Qadam logo. Don't place a house badge next to the Qadam logo, and don't take UI colours from them.
- **Open decision:** whether houses appear in the product (student profile, leaderboards), whether the badges get flat or icon versions to match the logo, and which house colours become tokens. Until that is decided, treat the badges as display artwork only.

## 7. Checklist for new screens

- [ ] Every string goes through `t()`, with keys in ru, kz and en. Product and school names come from `app.name` / `app.school`.
- [ ] Dates and numbers are formatted with `currentIntlLocale()`, never `'kz'`.
- [ ] Buttons behind white text use `bg-brand-600 hover:bg-brand-700`. Orange text is `brand-600`+ in light mode and `brand-400`/`300` in dark mode.
- [ ] `brand-500` appears only on borders, focus rings, icons and indicators.
- [ ] Status colours use success/warning/error/blue-light, not brand orange.
- [ ] Charts import colours from `chartTheme.ts`. No `#465FFF`, no logo gradient.
- [ ] Both light and dark mode are checked. All text passes 4.5:1 (3:1 for large text and icons).
- [ ] Any logo uses the correct light or dark file, with `alt="Qadam School"`, unstretched, with clear space around it.
- [ ] Only the Manrope and theme type tokens are used, with no new font imports.
- [ ] Copy is calm and formal (Вы/Сіз), with no emoji. The Kazakh wording has been read in context.
