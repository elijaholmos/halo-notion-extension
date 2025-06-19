var background = function() {
  "use strict";
  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const AUTHORIZATION_KEY = "TE1TX0FVVEg";
  const CONTEXT_KEY = "TE1TX0NPTlRFWFQ";
  const url = {
    gateway: "https://gateway.halo.gcu.edu",
    validate: "https://halo.gcu.edu/api/auth/session"
  };
  const getInformation = async function() {
    try {
      const data = await fetch(url.validate, {
        method: "GET",
        headers: {
          accept: "*/*",
          "content-type": "application/json"
        }
      });
      const res = await data.json();
      const output = {
        [AUTHORIZATION_KEY]: res["authToken"],
        [CONTEXT_KEY]: res["contextToken"],
        userId: res["userId"]
      };
      console.log("information", output);
      return output;
    } catch (e) {
      return { code: 500, error: e };
    }
  };
  background;
  const definition = defineBackground(() => {
    (async () => {
      console.log("initializing ApplicationStoreManager");
      console.log("getting information");
      const info = await getInformation();
      if ("userId" in info) {
        const { userId, ...cookies } = info;
      } else {
        console.error(info);
      }
      console.log("ApplicationStoreManager initialized");
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        (async () => {
          try {
            if (sender.id !== chrome.runtime.id) return console.log("ids are not equal");
            sendResponse(null);
          } catch (error) {
            sendResponse(JSON.stringify(error));
          }
        })();
        return true;
      });
      chrome.runtime.onInstalled.addListener(
        ({ reason }) => reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
      );
    })();
  });
  background;
  function initPlugins() {
  }
  const browser$1 = ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url2) {
      if (this.isAllUrls)
        return true;
      const u = typeof url2 === "string" ? new URL(url2) : url2 instanceof Location ? new URL(url2.href) : url2;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url2) {
      return url2.protocol === "http:" && this.isHostPathMatch(url2);
    }
    isHttpsMatch(url2) {
      return url2.protocol === "https:" && this.isHostPathMatch(url2);
    }
    isHostPathMatch(url2) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url2.hostname)) && pathnameMatchRegex.test(url2.pathname);
    }
    isFileMatch(url2) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url2) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url2) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "http://localhost:3000";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url2 = tab.url;
      if (!url2) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url2));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
}();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjdfQHR5cGVzK25vZGVAMjQuMC4zX2ppdGlAMi40LjJfcm9sbHVwQDQuNDMuMF90ZXJzZXJANS40My4wX3lhbWxAMi44LjAvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL3NyYy9zaGFyZWQvdXRpbC9oYWxvLnRzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHd4dC1kZXYrYnJvd3NlckAwLjAuMzI2L25vZGVfbW9kdWxlcy9Ad3h0LWRldi9icm93c2VyL3NyYy9pbmRleC5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuN19AdHlwZXMrbm9kZUAyNC4wLjNfaml0aUAyLjQuMl9yb2xsdXBANC40My4wX3RlcnNlckA1LjQzLjBfeWFtbEAyLjguMC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQHdlYmV4dC1jb3JlK21hdGNoLXBhdHRlcm5zQDEuMC4zL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuICBpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcbiAgcmV0dXJuIGFyZztcbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKEMpIDIwMjQgRWxpamFoIE9sbW9zXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzXG4gKiBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgdmVyc2lvbiAzLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gU2VlIHRoZVxuICogR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbmV4cG9ydCBjb25zdCBBVVRIT1JJWkFUSU9OX0tFWSA9ICdURTFUWDBGVlZFZyc7XG5leHBvcnQgY29uc3QgQ09OVEVYVF9LRVkgPSAnVEUxVFgwTlBUbFJGV0ZRJztcbmNvbnN0IHVybCA9IHtcblx0Z2F0ZXdheTogJ2h0dHBzOi8vZ2F0ZXdheS5oYWxvLmdjdS5lZHUnLFxuXHR2YWxpZGF0ZTogJ2h0dHBzOi8vaGFsby5nY3UuZWR1L2FwaS9hdXRoL3Nlc3Npb24nLFxufTtcblxuZXhwb3J0IGNvbnN0IGdldFVzZXJPdmVydmlldyA9IGFzeW5jIGZ1bmN0aW9uICh7IGNvb2tpZSwgdWlkIH06IHsgY29va2llOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+OyB1aWQ6IHN0cmluZyB9KSB7XG5cdGNvbnNvbGUubG9nKCdnZXRVc2VyT3ZlcnZpZXcnLCBjb29raWUsIHVpZCk7XG5cblx0Y29uc3QgZGF0YSA9IGF3YWl0IGZldGNoKHVybC5nYXRld2F5LCB7XG5cdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0YWNjZXB0OiAnKi8qJyxcblx0XHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29va2llW0FVVEhPUklaQVRJT05fS0VZXX1gLFxuXHRcdFx0Y29udGV4dHRva2VuOiBgQmVhcmVyICR7Y29va2llW0NPTlRFWFRfS0VZXX1gLFxuXHRcdH0sXG5cdFx0Ym9keTogSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0Ly9TcGVjaWZpYyBHcmFwaFFMIHF1ZXJ5IHN5bnRheCwgcmV2ZXJzZS1lbmdpbmVlcmVkXG5cdFx0XHRvcGVyYXRpb25OYW1lOiAnSGVhZGVyRmllbGRzJyxcblx0XHRcdHZhcmlhYmxlczoge1xuXHRcdFx0XHR1c2VySWQ6IHVpZCxcblx0XHRcdFx0c2tpcENsYXNzZXM6IGZhbHNlLFxuXHRcdFx0fSxcblx0XHRcdHF1ZXJ5OiAncXVlcnkgSGVhZGVyRmllbGRzKCR1c2VySWQ6IFN0cmluZyEsICRza2lwQ2xhc3NlczogQm9vbGVhbiEpIHtcXG4gIHVzZXJJbmZvOiBnZXRVc2VyQnlJZChpZDogJHVzZXJJZCkge1xcbiAgICBpZFxcbiAgICBmaXJzdE5hbWVcXG4gICAgbGFzdE5hbWVcXG4gICAgdXNlckltZ1VybFxcbiAgICBzb3VyY2VJZFxcbiAgICBfX3R5cGVuYW1lXFxuICB9XFxuICBjbGFzc2VzOiBnZXRDb3Vyc2VDbGFzc2VzRm9yVXNlciBAc2tpcChpZjogJHNraXBDbGFzc2VzKSB7XFxuICAgIGNvdXJzZUNsYXNzZXMge1xcbiAgICAgIGlkXFxuICAgICAgY2xhc3NDb2RlXFxuICAgICAgc2x1Z0lkXFxuICAgICAgc3RhcnREYXRlXFxuICAgICAgZW5kRGF0ZVxcbiAgICAgIG5hbWVcXG4gICAgICBkZXNjcmlwdGlvblxcbiAgICAgIHN0YWdlXFxuICAgICAgbW9kYWxpdHlcXG4gICAgICB2ZXJzaW9uXFxuICAgICAgY291cnNlQ29kZVxcbiAgICAgIHVuaXRzIHtcXG4gICAgICAgIGlkXFxuICAgICAgICBjdXJyZW50XFxuICAgICAgICB0aXRsZVxcbiAgICAgICAgc2VxdWVuY2VcXG4gICAgICAgIF9fdHlwZW5hbWVcXG4gICAgICB9XFxuICAgICAgaW5zdHJ1Y3RvcnMge1xcbiAgICAgICAgLi4uaGVhZGVyVXNlckZpZWxkc1xcbiAgICAgICAgX190eXBlbmFtZVxcbiAgICAgIH1cXG4gICAgICBzdHVkZW50cyB7XFxuICAgICAgICBpc0FjY29tbW9kYXRlZFxcbiAgICAgICAgaXNIb25vcnNcXG4gICAgICAgIC4uLmhlYWRlclVzZXJGaWVsZHNcXG4gICAgICAgIF9fdHlwZW5hbWVcXG4gICAgICB9XFxuICAgICAgX190eXBlbmFtZVxcbiAgICB9XFxuICAgIF9fdHlwZW5hbWVcXG4gIH1cXG59XFxuXFxuZnJhZ21lbnQgaGVhZGVyVXNlckZpZWxkcyBvbiBDb3Vyc2VDbGFzc1VzZXIge1xcbiAgaWRcXG4gIGNvdXJzZUNsYXNzSWRcXG4gIHJvbGVOYW1lXFxuICBiYXNlUm9sZU5hbWVcXG4gIHN0YXR1c1xcbiAgdXNlcklkXFxuICB1c2VyIHtcXG4gICAgLi4uaGVhZGVyVXNlclxcbiAgICBfX3R5cGVuYW1lXFxuICB9XFxuICBfX3R5cGVuYW1lXFxufVxcblxcbmZyYWdtZW50IGhlYWRlclVzZXIgb24gVXNlciB7XFxuICBpZFxcbiAgdXNlclN0YXR1c1xcbiAgZmlyc3ROYW1lXFxuICBsYXN0TmFtZVxcbiAgdXNlckltZ1VybFxcbiAgc291cmNlSWRcXG4gIGxhc3RMb2dpblxcbiAgX190eXBlbmFtZVxcbn1cXG4nLFxuXHRcdH0pLFxuXHR9KTtcblxuXHR0cnkge1xuXHRcdGNvbnNvbGUubG9nKGRhdGEpO1xuXG5cdFx0Y29uc3QgcmVzID0gYXdhaXQgZGF0YS5qc29uKCk7XG5cblx0XHRpZiAocmVzLmJvZHk/LmVycm9ycz8uWzBdPy5tZXNzYWdlPy5pbmNsdWRlcygnNDAxJykpIHRocm93IHsgY29kZTogNDAxLCBjb29raWUgfTtcblx0XHQvL0Vycm9yIGhhbmRsaW5nIGFuZCBkYXRhIHZhbGlkYXRpb24gY291bGQgYmUgaW1wcm92ZWRcblx0XHRpZiAocmVzLmVycm9yKSByZXR1cm4gY29uc29sZS5lcnJvcihyZXMuZXJyb3IpO1xuXHRcdHJldHVybiByZXMuZGF0YTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGNvbnNvbGUubG9nKCdnZXRVc2VyT3ZlcnZpZXcgZXJyb3InLCBlKTtcblx0XHRyZXR1cm4ge307XG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRVc2VySWQgPSBhc3luYyBmdW5jdGlvbiAoeyBjb29raWUgfTogeyBjb29raWU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfSkge1xuXHRjb25zb2xlLmxvZygnZ2V0VXNlcklkJywgY29va2llKTtcblxuXHRjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2godXJsLnZhbGlkYXRlLCB7XG5cdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHRhY2NlcHQ6ICcqLyonLFxuXHRcdFx0J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHR9LFxuXHR9KTtcblxuXHR0cnkge1xuXHRcdGNvbnNvbGUubG9nKCdnZXRVc2VySWQtZGF0YScsIGRhdGEpO1xuXHRcdGNvbnN0IHJlcyA9IGF3YWl0IGRhdGEuanNvbigpO1xuXG5cdFx0aWYgKHJlcy5ib2R5Py5lcnJvcnM/LlswXT8ubWVzc2FnZT8uaW5jbHVkZXMoJzQwMScpKSB0aHJvdyB7IGNvZGU6IDQwMSwgY29va2llIH07XG5cdFx0Ly9FcnJvciBoYW5kbGluZyBhbmQgZGF0YSB2YWxpZGF0aW9uIGNvdWxkIGJlIGltcHJvdmVkXG5cdFx0aWYgKHJlcy5lcnJvcikgcmV0dXJuIGNvbnNvbGUuZXJyb3IocmVzLmVycm9yKTtcblx0XHRyZXR1cm4gcmVzWyd1c2VySWQnXTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHRocm93IHsgY29kZTogNTAwLCBlcnJvcjogZSB9O1xuXHR9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0SGFsb1VzZXJJbmZvID0gYXN5bmMgZnVuY3Rpb24gKHsgY29va2llIH06IHsgY29va2llOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0pIHtcblx0Y29uc3QgZGF0YSA9IGF3YWl0IGZldGNoKHVybC52YWxpZGF0ZSwge1xuXHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0YWNjZXB0OiAnKi8qJyxcblx0XHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0fSxcblx0fSk7XG5cblx0dHJ5IHtcblx0XHRjb25zdCByZXMgPSBhd2FpdCBkYXRhLmpzb24oKTtcblx0XHRjb25zb2xlLmxvZygnZ2V0SGFsb1VzZXJJbmZvJywgcmVzKTtcblxuXHRcdGlmIChyZXM/LmVycm9ycz8uWzBdPy5tZXNzYWdlPy5pbmNsdWRlcygnNDAxJykpIHRocm93IHsgY29kZTogNDAxLCBjb29raWUgfTtcblx0XHQvL0Vycm9yIGhhbmRsaW5nIGFuZCBkYXRhIHZhbGlkYXRpb24gY291bGQgYmUgaW1wcm92ZWRcblx0XHRpZiAocmVzLmVycm9yKSByZXR1cm4gY29uc29sZS5lcnJvcihyZXMuZXJyb3IpO1xuXHRcdHJldHVybiByZXM7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR0aHJvdyB7IGNvZGU6IDUwMCwgY29va2llIH07XG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRDbGFzc0luZm9ybWF0aW9uID0gYXN5bmMgZnVuY3Rpb24gKHtcblx0Y29va2llLFxuXHRzbHVnSWQsXG59OiB7XG5cdGNvb2tpZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0c2x1Z0lkOiBzdHJpbmc7XG59KSB7XG5cdGNvbnN0IHJlcyA9IGF3YWl0IChcblx0XHRhd2FpdCBmZXRjaCh1cmwuZ2F0ZXdheSwge1xuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdGFjY2VwdDogJyovKicsXG5cdFx0XHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRcdGF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb29raWVbQVVUSE9SSVpBVElPTl9LRVldfWAsXG5cdFx0XHRcdGNvbnRleHR0b2tlbjogYEJlYXJlciAke2Nvb2tpZVtDT05URVhUX0tFWV19YCxcblx0XHRcdH0sXG5cdFx0XHRib2R5OiBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdG9wZXJhdGlvbk5hbWU6ICdDdXJyZW50Q2xhc3MnLFxuXHRcdFx0XHR2YXJpYWJsZXM6IHsgc2x1Z0lkLCBpc1N0dWRlbnQ6IHRydWUgfSxcblx0XHRcdFx0cXVlcnk6ICdxdWVyeSBDdXJyZW50Q2xhc3MoJHNsdWdJZDogU3RyaW5nISwgJGlzU3R1ZGVudDogQm9vbGVhbiEpIHtcXG4gIGN1cnJlbnRDbGFzczogZ2V0Q291cnNlQ2xhc3NCeVNsdWdJZChzbHVnSWQ6ICRzbHVnSWQpIHtcXG4gICAgaWRcXG4gICAgY2xhc3NDb2RlXFxuICAgIHNsdWdJZFxcbiAgICBkZWdyZWVMZXZlbFxcbiAgICBzdGFydERhdGVcXG4gICAgZW5kRGF0ZVxcbiAgICBkZXNjcmlwdGlvblxcbiAgICBuYW1lXFxuICAgIHN0YWdlXFxuICAgIG1vZGFsaXR5XFxuICAgIGNyZWRpdHNcXG4gICAgY291cnNlQ29kZVxcbiAgICB2ZXJzaW9uXFxuICAgIGxhc3RQdWJsaXNoZWREYXRlXFxuICAgIHNlY3Rpb25JZFxcbiAgICBob2xpZGF5cyB7XFxuICAgICAgLi4uaG9saWRheURldGFpbEZpZWxkc1xcbiAgICAgIF9fdHlwZW5hbWVcXG4gICAgfVxcbiAgICBzdHVkZW50cyB7XFxuICAgICAgLi4uc3R1ZGVudERldGFpbEZpZWxkc1xcbiAgICAgIF9fdHlwZW5hbWVcXG4gICAgfVxcbiAgICBwYXJ0aWNpcGF0aW9uUG9saWN5IHtcXG4gICAgICBkZXNjcmlwdGlvblxcbiAgICAgIGlkXFxuICAgICAgbnVtRGF5c1xcbiAgICAgIG51bVBvc3RzXFxuICAgICAgX190eXBlbmFtZVxcbiAgICB9XFxuICAgIGdyYWRlU2NhbGUge1xcbiAgICAgIGlkXFxuICAgICAgZW50cmllcyB7XFxuICAgICAgICBpZFxcbiAgICAgICAgbGFiZWxcXG4gICAgICAgIG1pblBlcmNlbnRcXG4gICAgICAgIG1heFBlcmNlbnRcXG4gICAgICAgIG1pblBvaW50c1xcbiAgICAgICAgbWF4UG9pbnRzXFxuICAgICAgICB0eXBlXFxuICAgICAgICBfX3R5cGVuYW1lXFxuICAgICAgfVxcbiAgICAgIF9fdHlwZW5hbWVcXG4gICAgfVxcbiAgICBpbnN0cnVjdG9ycyB7XFxuICAgICAgLi4uaW5zdHJ1Y3RvckRldGFpbEZpZWxkc1xcbiAgICAgIF9fdHlwZW5hbWVcXG4gICAgfVxcbiAgICB1bml0cyB7XFxuICAgICAgaWRcXG4gICAgICB0aXRsZVxcbiAgICAgIHNlcXVlbmNlXFxuICAgICAgc3RhcnREYXRlXFxuICAgICAgZW5kRGF0ZVxcbiAgICAgIGN1cnJlbnRcXG4gICAgICBwb2ludHNcXG4gICAgICBkZXNjcmlwdGlvblxcbiAgICAgIGFzc2Vzc21lbnRzIHtcXG4gICAgICAgIGlkXFxuICAgICAgICBzZXF1ZW5jZVxcbiAgICAgICAgdGl0bGVcXG4gICAgICAgIGRlc2NyaXB0aW9uXFxuICAgICAgICBzdGFydERhdGVcXG4gICAgICAgIGR1ZURhdGVcXG4gICAgICAgIGFjY29tbW9kYXRlZER1ZURhdGUgQHNraXAoaWY6ICRpc1N0dWRlbnQpXFxuICAgICAgICBleGVtcHRBY2NvbW1vZGF0aW9uc1xcbiAgICAgICAgcG9pbnRzXFxuICAgICAgICB0eXBlXFxuICAgICAgICB0YWdzXFxuICAgICAgICByZXF1aXJlc0xvcGVzV3JpdGVcXG4gICAgICAgIGlzR3JvdXBFbmFibGVkXFxuICAgICAgICBpblBlcnNvblxcbiAgICAgICAgcnVicmljIHtcXG4gICAgICAgICAgaWRcXG4gICAgICAgICAgbmFtZVxcbiAgICAgICAgICBpZFxcbiAgICAgICAgICBfX3R5cGVuYW1lXFxuICAgICAgICB9XFxuICAgICAgICBhdHRhY2htZW50cyB7XFxuICAgICAgICAgIGlkXFxuICAgICAgICAgIHJlc291cmNlSWRcXG4gICAgICAgICAgdGl0bGVcXG4gICAgICAgICAgX190eXBlbmFtZVxcbiAgICAgICAgfVxcbiAgICAgICAgX190eXBlbmFtZVxcbiAgICAgIH1cXG4gICAgICBfX3R5cGVuYW1lXFxuICAgIH1cXG4gICAgX190eXBlbmFtZVxcbiAgfVxcbn1cXG5cXG5mcmFnbWVudCBzdHVkZW50RGV0YWlsRmllbGRzIG9uIENvdXJzZUNsYXNzVXNlciB7XFxuICBpZFxcbiAgaXNBY2NvbW1vZGF0ZWRcXG4gIGNvdXJzZUNsYXNzSWRcXG4gIGlzSG9ub3JzXFxuICB1c2VyIHtcXG4gICAgaWRcXG4gICAgZmlyc3ROYW1lXFxuICAgIGxhc3ROYW1lXFxuICAgIHNvdXJjZUlkXFxuICAgIHVzZXJJbWdVcmxcXG4gICAgbGFzdExvZ2luXFxuICAgIGlzQWNjb21tb2RhdGVkIEBza2lwKGlmOiAkaXNTdHVkZW50KVxcbiAgICBfX3R5cGVuYW1lXFxuICB9XFxuICBiYXNlUm9sZU5hbWVcXG4gIHJvbGVOYW1lXFxuICBzdGF0dXNcXG4gIHVzZXJJZFxcbiAgX190eXBlbmFtZVxcbn1cXG5cXG5mcmFnbWVudCBpbnN0cnVjdG9yRGV0YWlsRmllbGRzIG9uIENvdXJzZUNsYXNzVXNlciB7XFxuICBpZFxcbiAgdXNlciB7XFxuICAgIGlkXFxuICAgIGZpcnN0TmFtZVxcbiAgICBsYXN0TmFtZVxcbiAgICBzb3VyY2VJZFxcbiAgICB1c2VySW1nVXJsXFxuICAgIHNvY2lhbENvbnRhY3RzIHtcXG4gICAgICBpZFxcbiAgICAgIHZhbHVlXFxuICAgICAgc29jaWFsQ29udGFjdFR5cGVcXG4gICAgICBfX3R5cGVuYW1lXFxuICAgIH1cXG4gICAgX190eXBlbmFtZVxcbiAgfVxcbiAgYmFzZVJvbGVOYW1lXFxuICByb2xlTmFtZVxcbiAgc3RhdHVzXFxuICB1c2VySWRcXG4gIF9fdHlwZW5hbWVcXG59XFxuXFxuZnJhZ21lbnQgaG9saWRheURldGFpbEZpZWxkcyBvbiBIb2xpZGF5Q2FsZW5kYXIge1xcbiAgaWRcXG4gIGFjdGl2ZVxcbiAgZGVzY3JpcHRpb25cXG4gIGR1cmF0aW9uXFxuICBzdGFydERhdGVcXG4gIHRpdGxlXFxuICBfX3R5cGVuYW1lXFxufVxcbicsXG5cdFx0XHR9KSxcblx0XHR9KVxuXHQpLmpzb24oKTtcblxuXHRpZiAocmVzPy5lcnJvcnM/LlswXT8ubWVzc2FnZT8uaW5jbHVkZXMoJzQwMScpKSB0aHJvdyByZXMuZXJyb3JzO1xuXHQvL0Vycm9yIGhhbmRsaW5nIGFuZCBkYXRhIHZhbGlkYXRpb24gY291bGQgYmUgaW1wcm92ZWRcblx0aWYgKHJlcy5lcnJvcikgcmV0dXJuIGNvbnNvbGUuZXJyb3IocmVzLmVycm9yKTtcblx0cmV0dXJuIHJlcy5kYXRhLmN1cnJlbnRDbGFzcztcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRJbmZvcm1hdGlvbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcblx0dHJ5IHtcblx0XHRjb25zdCBkYXRhID0gYXdhaXQgZmV0Y2godXJsLnZhbGlkYXRlLCB7XG5cdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRhY2NlcHQ6ICcqLyonLFxuXHRcdFx0XHQnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0fSxcblx0XHR9KTtcblxuXHRcdGNvbnN0IHJlcyA9IGF3YWl0IGRhdGEuanNvbigpO1xuXG5cdFx0Y29uc3Qgb3V0cHV0ID0ge1xuXHRcdFx0W0FVVEhPUklaQVRJT05fS0VZXTogcmVzWydhdXRoVG9rZW4nXSxcblx0XHRcdFtDT05URVhUX0tFWV06IHJlc1snY29udGV4dFRva2VuJ10sXG5cdFx0XHR1c2VySWQ6IHJlc1sndXNlcklkJ10sXG5cdFx0fTtcblx0XHRjb25zb2xlLmxvZygnaW5mb3JtYXRpb24nLCBvdXRwdXQpO1xuXG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiB7IGNvZGU6IDUwMCwgZXJyb3I6IGUgfTtcblx0fVxufTtcbiIsIi8vIGltcG9ydCB7IGluaXQsIHN0b3JlcyB9IGZyb20gJy4vc3JjL3NoYXJlZC9zdG9yZXMnO1xuLy8gaW1wb3J0IHsgdHJpZ2dlck5vdGlvbkF1dGhGbG93IH0gZnJvbSAnLi91dGlsL2F1dGgnO1xuLy8gaW1wb3J0IGNocm9tZVN0b3JhZ2VTeW5jU3RvcmUgZnJvbSAnLi91dGlsL2Nocm9tZVN0b3JhZ2VTeW5jU3RvcmUnO1xuaW1wb3J0IHsgZ2V0SGFsb1VzZXJJbmZvLCBnZXRJbmZvcm1hdGlvbiwgZ2V0VXNlck92ZXJ2aWV3IH0gZnJvbSAnLi4vc2hhcmVkL3V0aWwvaGFsbyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuXHQvLyBjb25zb2xlLmxvZyhgJHtjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLm5hbWV9IHYke1ZFUlNJT059YCk7XG5cblx0KGFzeW5jICgpID0+IHtcblx0XHRjb25zb2xlLmxvZygnaW5pdGlhbGl6aW5nIEFwcGxpY2F0aW9uU3RvcmVNYW5hZ2VyJyk7XG5cdFx0Y29uc29sZS5sb2coJ2dldHRpbmcgaW5mb3JtYXRpb24nKTtcblx0XHRjb25zdCBpbmZvID0gYXdhaXQgZ2V0SW5mb3JtYXRpb24oKTtcblx0XHRpZiAoJ3VzZXJJZCcgaW4gaW5mbykge1xuXHRcdFx0Y29uc3QgeyB1c2VySWQsIC4uLmNvb2tpZXMgfSA9IGluZm87XG5cdFx0XHQvLyB1c2UgaGVyZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGluZm8pO1xuXHRcdH1cblx0XHQvLyBjb25zb2xlLmxvZygnZmV0Y2hlZCB1c2VyIGlkJywgdXNlcklkKTtcblx0XHQvLyBjb25zb2xlLmxvZygnZmV0Y2hlZCBoYWxvIGNvb2tpZXMnLCBjb29raWVzKTtcblx0XHQvLyBhd2FpdCBpbml0KFtcblx0XHQvLyBcdGNocm9tZVN0b3JhZ2VTeW5jU3RvcmUoeyBrZXk6ICdub3Rpb25faW5mbycgfSksXG5cdFx0Ly8gXHRjaHJvbWVTdG9yYWdlU3luY1N0b3JlKHsga2V5OiAnaGFsb19jb29raWVzJywgaW5pdGlhbF92YWx1ZTogY29va2llcyB9KSxcblx0XHQvLyBcdGNocm9tZVN0b3JhZ2VTeW5jU3RvcmUoe1xuXHRcdC8vIFx0XHRrZXk6ICdoYWxvX2luZm8nLFxuXHRcdC8vIFx0XHRpbml0aWFsX3ZhbHVlOiBhc3luYyAoKSA9PiBhd2FpdCBnZXRIYWxvVXNlckluZm8oeyBjb29raWU6IGNvb2tpZXMgfSksXG5cdFx0Ly8gXHR9KSxcblx0XHQvLyBcdGNocm9tZVN0b3JhZ2VTeW5jU3RvcmUoe1xuXHRcdC8vIFx0XHRrZXk6ICdzZWxlY3RlZF9jbGFzc2VzJyxcblx0XHQvLyBcdFx0aW5pdGlhbF92YWx1ZTogYXN5bmMgKCkgPT5cblx0XHQvLyBcdFx0XHQoXG5cdFx0Ly8gXHRcdFx0XHRhd2FpdCBnZXRVc2VyT3ZlcnZpZXcoe1xuXHRcdC8vIFx0XHRcdFx0XHR1aWQ6IHVzZXJJZCxcblx0XHQvLyBcdFx0XHRcdFx0Y29va2llOiBjb29raWVzLFxuXHRcdC8vIFx0XHRcdFx0fSlcblx0XHQvLyBcdFx0XHQpPy5jbGFzc2VzPy5jb3Vyc2VDbGFzc2VzXG5cdFx0Ly8gXHRcdFx0XHQ/LmZpbHRlcigoeyBzdGFnZSB9KSA9PiBzdGFnZSAhPT0gJ1BPU1QnKVxuXHRcdC8vIFx0XHRcdFx0Py5yZWR1Y2UoKGFjYywgeyBjb3Vyc2VDb2RlIH0pID0+ICh7IC4uLmFjYywgW2NvdXJzZUNvZGVdOiB0cnVlIH0pLCB7fSksXG5cdFx0Ly8gXHR9KSxcblx0XHQvLyBdKTtcblx0XHRjb25zb2xlLmxvZygnQXBwbGljYXRpb25TdG9yZU1hbmFnZXIgaW5pdGlhbGl6ZWQnKTtcblx0XHQvLyBjb25zb2xlLmxvZyhzdG9yZXMpO1xuXG5cdFx0Ly8gRklSRUZPWCBSRVNUUklDVElPTjogcG9wdXAgaXMgY2xvc2VkIGR1cmluZyBhdXRoLCBzbyBpdCBuZWVkcyB0byBiZSB0cmlnZ2VyZWQgZnJvbSBiYWNrZ3JvdW5kIHNjcmlwdFxuXHRcdGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobXNnLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuXHRcdFx0KGFzeW5jICgpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRpZiAoc2VuZGVyLmlkICE9PSBjaHJvbWUucnVudGltZS5pZCkgcmV0dXJuIGNvbnNvbGUubG9nKCdpZHMgYXJlIG5vdCBlcXVhbCcpO1xuXHRcdFx0XHRcdC8vIG1zZyA9PT0gJ2xhdW5jaF9hdXRoJyAmJiAoYXdhaXQgdHJpZ2dlck5vdGlvbkF1dGhGbG93KCkpO1xuXHRcdFx0XHRcdHNlbmRSZXNwb25zZShudWxsKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRzZW5kUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSkoKTtcblx0XHRcdHJldHVybiB0cnVlOyAvL3JlcXVpcmVkIGlmIHVzaW5nIGFzeW5jL2F3YWl0IGluIGEgbWVzc2FnZSBsaXN0ZW5lclxuXHRcdH0pO1xuXG5cdFx0Ly8gY3VycmVudGx5IGJyb2tlbiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9Hb29nbGVDaHJvbWUvZGV2ZWxvcGVyLmNocm9tZS5jb20vaXNzdWVzLzI2MDJcblx0XHRjaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihcblx0XHRcdCh7IHJlYXNvbiB9KSA9PiByZWFzb24gPT09IGNocm9tZS5ydW50aW1lLk9uSW5zdGFsbGVkUmVhc29uLklOU1RBTEwgJiYgY2hyb21lLmFjdGlvbi5vcGVuUG9wdXAoKVxuXHRcdCk7XG5cdH0pKCk7XG59KTtcbiIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgX2Jyb3dzZXIgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBfYnJvd3NlcjtcbmV4cG9ydCB7fTtcbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iXSwibmFtZXMiOlsiYnJvd3NlciIsIl9icm93c2VyIiwidXJsIl0sIm1hcHBpbmdzIjoiOzs7QUFBTyxXQUFTLGlCQUFpQixLQUFLO0FBQ3BDLFFBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxXQUFZLFFBQU8sRUFBRSxNQUFNLElBQUs7QUFDbEUsV0FBTztBQUFBLEVBQ1Q7QUNhTyxRQUFNLG9CQUFvQjtBQUMxQixRQUFNLGNBQWM7QUFDM0IsUUFBTSxNQUFNO0FBQUEsSUFDWCxTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsRUFDWDtBQW1ITyxRQUFNLGlCQUFpQixpQkFBa0I7QUFDM0MsUUFBQTtBQUNILFlBQU0sT0FBTyxNQUFNLE1BQU0sSUFBSSxVQUFVO0FBQUEsUUFDdEMsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsZ0JBQWdCO0FBQUEsUUFBQTtBQUFBLE1BQ2pCLENBQ0E7QUFFSyxZQUFBLE1BQU0sTUFBTSxLQUFLLEtBQUs7QUFFNUIsWUFBTSxT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
