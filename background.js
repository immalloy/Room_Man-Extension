const api = globalThis.browser ?? chrome;
const room = api.runtime.getURL("room_man.html");

api.webNavigation.onCommitted.addListener(({ tabId, frameId, url, transitionQualifiers }) => {
  if (frameId || url.startsWith(api.runtime.getURL("")) || !transitionQualifiers.includes("forward_back")) return;
  if (Math.floor(Math.random() * 50) === 0) api.tabs.update(tabId, { url: room });
});
