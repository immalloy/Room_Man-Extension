# Room_Man Extension

Load this folder as an unpacked extension in Chrome or Firefox. A Back or Forward navigation has a 1-in-50 chance to open the room in that tab.

- Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** → select this folder.
- Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `manifest.json`.

The address bar uses the browser's extension URL (`chrome-extension://…/room_man.html` or `moz-extension://…/room_man.html`); browsers do not permit an extension to replace it with arbitrary text.

Before a public store release, host `PRIVACY.md` at a public URL and use that URL for the store privacy-policy field.
