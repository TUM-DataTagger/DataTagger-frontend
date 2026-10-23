# Branding

Logo, institution and links of DataTagger are configured here instead of in the code. Changes show up after reloading
the page; no rebuild or restart is needed.

## Files

| File | Purpose |
|---|---|
| `branding.json` | Names, links and options (see below) |
| `logo.svg` | Logo for the light theme |
| `logo-dark.svg` | Logo for the dark theme (optional; without it the light logo is used in both themes) |
| `favicon.ico`, `favicon-32x32.png` | Icon in the browser tab |
| `apple-touch-icon.png` | Icon when saved to an iPhone/iPad home screen (180 × 180 px) |
| `android-chrome-*.png` | Icons when installed as an app / saved to an Android home screen |

Logos can be SVG, PNG, JPG, WebP or ICO files placed directly in this folder. They are shown 16 px high in the
navigation bar and 30 px high in the footer, so a wide, short logo (or just the mark) works best.

## `branding.json`

```json
{
	"appName": "DataTagger",
	"institution": {
		"name": "Johannes Kepler University Linz",
		"shortName": "JKU",
		"unit": "University Library",
		"url": "https://www.jku.at"
	},
	"logo": {
		"light": "logo.svg",
		"dark": "logo-dark.svg",
		"alt": "JKU"
	},
	"icons": {
		"favicon": "favicon.ico",
		"icon": "favicon-32x32.png",
		"appleTouchIcon": "apple-touch-icon.png",
		"app": ["android-chrome-192x192.png", "android-chrome-256x256.png"]
	},
	"links": {
		"contact": "https://www.jku.at/kontakt/",
		"imprint": "https://www.jku.at/impressum/"
	},
	"showTestEnvironmentBanner": true
}
```

| Setting | Where it appears |
|---|---|
| `appName` | Browser tab title, footer version line |
| `institution.unit` + `institution.name` | Footer, two lines next to the logo |
| `institution.shortName` + `institution.unit` | Footer of the command menu (Ctrl+K), e.g. "JKU University Library" |
| `institution.url` | Where the footer logo links to |
| `logo.light`, `logo.dark`, `logo.alt` | Navigation bar and footer logo, text for screen readers |
| `icons.favicon`, `icons.icon` | Browser tab icon (`.ico` and a 32 × 32 PNG) |
| `icons.appleTouchIcon`, `icons.app` | Home screen and installed-app icons; put the size (e.g. `192x192`) in the file name |
| `links.contact`, `links.imprint` | "Contact" and "Imprint" in the footer and the command menu; leave out to hide them |
| `showTestEnvironmentBanner` | The orange "You are currently on the test environment." bar; set to `false` on the production server |

Links must start with `http://` or `https://`. Missing or invalid values fall back to defaults (no logo, no links), and if
the file can't be read at all, the app still runs with the defaults.

## On a server

By default the app reads this `branding` folder. To keep the branding outside the code, for example on the Ubuntu
server, point the `BRANDING_DIR` environment variable to another folder, e.g. when running the frontend container:

```bash
docker run -v /srv/datatagger/branding:/branding -e BRANDING_DIR=/branding ...
```
