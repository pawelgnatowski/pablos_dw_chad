(function () {
  'use strict';

  // src/background/service_worker.ts
  chrome.runtime.onInstalled.addListener(() => {
      console.log("Pablo's DW Chad extension installed.");
      // Initialize default settings or perform one-time setup if needed
      // chrome.storage.local.set({ defaultSettings: {} });
  });
  // Listen for messages from content scripts or other parts of the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Message received in service worker:", message, "from sender:", sender);
      if (message.action === "getExtensionInfo") {
          sendResponse({ version: chrome.runtime.getManifest().version });
          return true; // Indicates you wish to send a response asynchronously
      }
      // Example: Handle a request to open a new tab
      if (message.action === "openNewTab" && message.url) {
          chrome.tabs.create({ url: message.url });
          sendResponse({ status: "Tab creation initiated" });
          return true;
      }
      // Add other message handlers as needed
      // Make sure to return true if sendResponse will be called asynchronously
  });
  // Example: Browser action click listener (if not using a popup)
  // chrome.action.onClicked.addListener((tab) => {
  //   console.log("Browser action icon clicked on tab:", tab.id);
  //   // You could inject a script or send a message to the content script here
  //   if (tab.id) {
  //     chrome.scripting.executeScript({
  //       target: { tabId: tab.id },
  //       func: () => {
  //         // This function is executed in the context of the page
  //         // For security reasons, prefer sending messages to content script
  //         // which can then interact with the page or its injected scripts.
  //         console.log("Action icon was clicked, script executed in page via service worker.");
  //         // Example: window.alert("Action icon clicked!"); 
  //         // This alert would show on the active page.
  //       }
  //     }).catch(err => console.error("Failed to execute script from action: ", err));
  //   }
  // });
  console.log("Pablo's DW Chad Service Worker Started/Refreshed");
  // Listener for intercepting specific network requests
  chrome.webRequest.onBeforeRequest.addListener((details) => {
      // Log every request that matches the URL filter to see if it's even getting here
      console.log("PABLO'S DW CHAD: Request listener triggered for URL:", details.url, "Method:", details.method, "Request ID:", details.requestId);
      if (details.method === "PUT" && details.requestBody && details.requestBody.raw) {
          try {
              // Assuming the first part of raw data is the one we need and it's ArrayBuffer
              const rawBody = details.requestBody.raw[0]?.bytes;
              if (rawBody) {
                  const decodedBody = new TextDecoder("utf-8").decode(rawBody);
                  const parsedBody = JSON.parse(decodedBody);
                  if (parsedBody && parsedBody.context) {
                      const contextValue = parsedBody.context;
                      console.log("PABLO'S DW CHAD: Extracted context:", contextValue);
                      // Store the extracted context value
                      chrome.storage.local.set({ pdwc_last_retrieved_context: contextValue }, () => {
                          if (chrome.runtime.lastError) {
                              console.error("PABLO'S DW CHAD: Error saving context to storage:", chrome.runtime.lastError);
                          }
                          else {
                              console.log("PABLO'S DW CHAD: Context saved to storage.");
                          }
                      });
                  }
                  else {
                      console.log("PABLO'S DW CHAD: 'context' key not found in request payload:", parsedBody);
                  }
              }
              else {
                  console.log("PABLO'S DW CHAD: Request body 'raw[0].bytes' is empty or not ArrayBuffer.");
              }
          }
          catch (error) {
              console.error("PABLO'S DW CHAD: Error processing request body:", error, "Details:", details);
          }
      }
      // Return an empty object or nothing for non-blocking behavior
      return {};
  }, {
      urls: ["*://*/api/v1/context/session/prepare*"], // Intercept requests to this specific path on any host, including query params
      types: ["xmlhttprequest"] // Covering common ways APIs are called, xmlhttprequest typically includes fetch
  }, ["requestBody"] // We need this to access the request payload
  );

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZV93b3JrZXIuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9iYWNrZ3JvdW5kL3NlcnZpY2Vfd29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9iYWNrZ3JvdW5kL3NlcnZpY2Vfd29ya2VyLnRzXG5cbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgY29uc29sZS5sb2coXCJQYWJsbydzIERXIENoYWQgZXh0ZW5zaW9uIGluc3RhbGxlZC5cIik7XG4gIC8vIEluaXRpYWxpemUgZGVmYXVsdCBzZXR0aW5ncyBvciBwZXJmb3JtIG9uZS10aW1lIHNldHVwIGlmIG5lZWRlZFxuICAvLyBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBkZWZhdWx0U2V0dGluZ3M6IHt9IH0pO1xufSk7XG5cbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSBjb250ZW50IHNjcmlwdHMgb3Igb3RoZXIgcGFydHMgb2YgdGhlIGV4dGVuc2lvblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICBjb25zb2xlLmxvZyhcIk1lc3NhZ2UgcmVjZWl2ZWQgaW4gc2VydmljZSB3b3JrZXI6XCIsIG1lc3NhZ2UsIFwiZnJvbSBzZW5kZXI6XCIsIHNlbmRlcik7XG5cbiAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSBcImdldEV4dGVuc2lvbkluZm9cIikge1xuICAgIHNlbmRSZXNwb25zZSh7IHZlcnNpb246IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCkudmVyc2lvbiB9KTtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gSW5kaWNhdGVzIHlvdSB3aXNoIHRvIHNlbmQgYSByZXNwb25zZSBhc3luY2hyb25vdXNseVxuICB9XG5cbiAgLy8gRXhhbXBsZTogSGFuZGxlIGEgcmVxdWVzdCB0byBvcGVuIGEgbmV3IHRhYlxuICBpZiAobWVzc2FnZS5hY3Rpb24gPT09IFwib3Blbk5ld1RhYlwiICYmIG1lc3NhZ2UudXJsKSB7XG4gICAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBtZXNzYWdlLnVybCB9KTtcbiAgICBzZW5kUmVzcG9uc2UoeyBzdGF0dXM6IFwiVGFiIGNyZWF0aW9uIGluaXRpYXRlZFwifSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBBZGQgb3RoZXIgbWVzc2FnZSBoYW5kbGVycyBhcyBuZWVkZWRcbiAgLy8gTWFrZSBzdXJlIHRvIHJldHVybiB0cnVlIGlmIHNlbmRSZXNwb25zZSB3aWxsIGJlIGNhbGxlZCBhc3luY2hyb25vdXNseVxufSk7XG5cbi8vIEV4YW1wbGU6IEJyb3dzZXIgYWN0aW9uIGNsaWNrIGxpc3RlbmVyIChpZiBub3QgdXNpbmcgYSBwb3B1cClcbi8vIGNocm9tZS5hY3Rpb24ub25DbGlja2VkLmFkZExpc3RlbmVyKCh0YWIpID0+IHtcbi8vICAgY29uc29sZS5sb2coXCJCcm93c2VyIGFjdGlvbiBpY29uIGNsaWNrZWQgb24gdGFiOlwiLCB0YWIuaWQpO1xuLy8gICAvLyBZb3UgY291bGQgaW5qZWN0IGEgc2NyaXB0IG9yIHNlbmQgYSBtZXNzYWdlIHRvIHRoZSBjb250ZW50IHNjcmlwdCBoZXJlXG4vLyAgIGlmICh0YWIuaWQpIHtcbi8vICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuLy8gICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbi8vICAgICAgIGZ1bmM6ICgpID0+IHtcbi8vICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBpbiB0aGUgY29udGV4dCBvZiB0aGUgcGFnZVxuLy8gICAgICAgICAvLyBGb3Igc2VjdXJpdHkgcmVhc29ucywgcHJlZmVyIHNlbmRpbmcgbWVzc2FnZXMgdG8gY29udGVudCBzY3JpcHRcbi8vICAgICAgICAgLy8gd2hpY2ggY2FuIHRoZW4gaW50ZXJhY3Qgd2l0aCB0aGUgcGFnZSBvciBpdHMgaW5qZWN0ZWQgc2NyaXB0cy5cbi8vICAgICAgICAgY29uc29sZS5sb2coXCJBY3Rpb24gaWNvbiB3YXMgY2xpY2tlZCwgc2NyaXB0IGV4ZWN1dGVkIGluIHBhZ2UgdmlhIHNlcnZpY2Ugd29ya2VyLlwiKTtcbi8vICAgICAgICAgLy8gRXhhbXBsZTogd2luZG93LmFsZXJ0KFwiQWN0aW9uIGljb24gY2xpY2tlZCFcIik7IFxuLy8gICAgICAgICAvLyBUaGlzIGFsZXJ0IHdvdWxkIHNob3cgb24gdGhlIGFjdGl2ZSBwYWdlLlxuLy8gICAgICAgfVxuLy8gICAgIH0pLmNhdGNoKGVyciA9PiBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgc2NyaXB0IGZyb20gYWN0aW9uOiBcIiwgZXJyKSk7XG4vLyAgIH1cbi8vIH0pO1xuXG5jb25zb2xlLmxvZyhcIlBhYmxvJ3MgRFcgQ2hhZCBTZXJ2aWNlIFdvcmtlciBTdGFydGVkL1JlZnJlc2hlZFwiKTtcblxuLy8gTGlzdGVuZXIgZm9yIGludGVyY2VwdGluZyBzcGVjaWZpYyBuZXR3b3JrIHJlcXVlc3RzXG5jaHJvbWUud2ViUmVxdWVzdC5vbkJlZm9yZVJlcXVlc3QuYWRkTGlzdGVuZXIoXG4gIChkZXRhaWxzKSA9PiB7XG4gICAgLy8gTG9nIGV2ZXJ5IHJlcXVlc3QgdGhhdCBtYXRjaGVzIHRoZSBVUkwgZmlsdGVyIHRvIHNlZSBpZiBpdCdzIGV2ZW4gZ2V0dGluZyBoZXJlXG4gICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IFJlcXVlc3QgbGlzdGVuZXIgdHJpZ2dlcmVkIGZvciBVUkw6XCIsIGRldGFpbHMudXJsLCBcIk1ldGhvZDpcIiwgZGV0YWlscy5tZXRob2QsIFwiUmVxdWVzdCBJRDpcIiwgZGV0YWlscy5yZXF1ZXN0SWQpO1xuXG4gICAgaWYgKGRldGFpbHMubWV0aG9kID09PSBcIlBVVFwiICYmIGRldGFpbHMucmVxdWVzdEJvZHkgJiYgZGV0YWlscy5yZXF1ZXN0Qm9keS5yYXcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEFzc3VtaW5nIHRoZSBmaXJzdCBwYXJ0IG9mIHJhdyBkYXRhIGlzIHRoZSBvbmUgd2UgbmVlZCBhbmQgaXQncyBBcnJheUJ1ZmZlclxuICAgICAgICBjb25zdCByYXdCb2R5ID0gZGV0YWlscy5yZXF1ZXN0Qm9keS5yYXdbMF0/LmJ5dGVzO1xuICAgICAgICBpZiAocmF3Qm9keSkge1xuICAgICAgICAgIGNvbnN0IGRlY29kZWRCb2R5ID0gbmV3IFRleHREZWNvZGVyKFwidXRmLThcIikuZGVjb2RlKHJhd0JvZHkpO1xuICAgICAgICAgIGNvbnN0IHBhcnNlZEJvZHkgPSBKU09OLnBhcnNlKGRlY29kZWRCb2R5KTtcblxuICAgICAgICAgIGlmIChwYXJzZWRCb2R5ICYmIHBhcnNlZEJvZHkuY29udGV4dCkge1xuICAgICAgICAgICAgY29uc3QgY29udGV4dFZhbHVlID0gcGFyc2VkQm9keS5jb250ZXh0O1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IEV4dHJhY3RlZCBjb250ZXh0OlwiLCBjb250ZXh0VmFsdWUpO1xuICAgICAgICAgICAgLy8gU3RvcmUgdGhlIGV4dHJhY3RlZCBjb250ZXh0IHZhbHVlXG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBwZHdjX2xhc3RfcmV0cmlldmVkX2NvbnRleHQ6IGNvbnRleHRWYWx1ZSB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUEFCTE8nUyBEVyBDSEFEOiBFcnJvciBzYXZpbmcgY29udGV4dCB0byBzdG9yYWdlOlwiLCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBDb250ZXh0IHNhdmVkIHRvIHN0b3JhZ2UuXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6ICdjb250ZXh0JyBrZXkgbm90IGZvdW5kIGluIHJlcXVlc3QgcGF5bG9hZDpcIiwgcGFyc2VkQm9keSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBSZXF1ZXN0IGJvZHkgJ3Jhd1swXS5ieXRlcycgaXMgZW1wdHkgb3Igbm90IEFycmF5QnVmZmVyLlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgcHJvY2Vzc2luZyByZXF1ZXN0IGJvZHk6XCIsIGVycm9yLCBcIkRldGFpbHM6XCIsIGRldGFpbHMpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZXR1cm4gYW4gZW1wdHkgb2JqZWN0IG9yIG5vdGhpbmcgZm9yIG5vbi1ibG9ja2luZyBiZWhhdmlvclxuICAgIHJldHVybiB7fTsgXG4gIH0sXG4gIHtcbiAgICB1cmxzOiBbXCIqOi8vKi9hcGkvdjEvY29udGV4dC9zZXNzaW9uL3ByZXBhcmUqXCJdLCAvLyBJbnRlcmNlcHQgcmVxdWVzdHMgdG8gdGhpcyBzcGVjaWZpYyBwYXRoIG9uIGFueSBob3N0LCBpbmNsdWRpbmcgcXVlcnkgcGFyYW1zXG4gICAgdHlwZXM6IFtcInhtbGh0dHByZXF1ZXN0XCJdIC8vIENvdmVyaW5nIGNvbW1vbiB3YXlzIEFQSXMgYXJlIGNhbGxlZCwgeG1saHR0cHJlcXVlc3QgdHlwaWNhbGx5IGluY2x1ZGVzIGZldGNoXG4gIH0sXG4gIFtcInJlcXVlc3RCb2R5XCJdIC8vIFdlIG5lZWQgdGhpcyB0byBhY2Nlc3MgdGhlIHJlcXVlc3QgcGF5bG9hZFxuKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7RUFBQTtFQUVBLE1B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
