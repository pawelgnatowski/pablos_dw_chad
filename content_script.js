(function () {
  'use strict';

  const COMMON_HEADERS = {
      'accept': 'application/json',
      'accept-language': 'en-US,en;q=0.9,pl;q=0.8', // Matching your mockup
      // Other sec- headers are usually browser-added and not needed in fetch, but can be added if required by server
  };
  /**
   * Fetches the list of all attributes from the DataWalk API.
   * @param baseUrl The base URL of the DataWalk instance.
   * @returns A promise that resolves to an array of Attributes.
   */
  async function fetchAttributes(baseUrl) {
      const endpoint = `${baseUrl}/api/v1/metadata/attribute/list`;
      try {
          const response = await fetch(endpoint, {
              method: 'GET',
              headers: COMMON_HEADERS,
              credentials: 'include',
              mode: 'cors',
          });
          if (!response.ok) {
              console.error(`PABLO'S DW CHAD: API Error fetching attributes. Status: ${response.status}`, await response.text());
              throw new Error(`Failed to fetch attributes: ${response.status}`);
          }
          const data = await response.json();
          return data; // Assuming the response directly matches Attribute[]
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error in fetchAttributes:", error);
          throw error; // Re-throw to allow caller to handle
      }
  }
  /**
   * Fetches the list of all sets (classes) from the DataWalk API.
   * @param baseUrl The base URL of the DataWalk instance.
   * @returns A promise that resolves to an array of Sets.
   */
  async function fetchSets(baseUrl) {
      const endpoint = `${baseUrl}/api/v1/metadata/class/list`;
      try {
          const response = await fetch(endpoint, {
              method: 'GET',
              headers: COMMON_HEADERS,
              credentials: 'include',
              mode: 'cors',
          });
          if (!response.ok) {
              console.error(`PABLO'S DW CHAD: API Error fetching sets. Status: ${response.status}`, await response.text());
              throw new Error(`Failed to fetch sets: ${response.status}`);
          }
          const data = await response.json();
          return data; // Assuming the response directly matches Set[]
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error in fetchSets:", error);
          throw error; // Re-throw to allow caller to handle
      }
  }
  /**
   * Fetches link types based on a list of class (set) IDs.
   * @param baseUrl The base URL of the DataWalk instance.
   * @param classIds An array of numbers representing the class (set) IDs.
   * @returns A promise that resolves to an array of DataWalkLinkType.
   */
  async function fetchLinkTypesByClassIds(baseUrl, classIds) {
      if (!classIds || classIds.length === 0) {
          console.warn("PABLO'S DW CHAD: fetchLinkTypesByClassIds called with no classIds. Returning empty array.");
          return [];
      }
      const batchEndpoint = `${baseUrl}/api/v1/metadata/linktype/batch/class/${classIds.join(',')}`;
      const commonFetchOptions = {
          method: 'GET',
          headers: COMMON_HEADERS,
          credentials: 'include',
          mode: 'cors',
      };
      try {
          const batchResponse = await fetch(batchEndpoint, commonFetchOptions);
          if (batchResponse.ok) {
              const data = await batchResponse.json();
              return data;
          }
          else if (batchResponse.status === 404) {
              console.warn(`PABLO'S DW CHAD: Batch endpoint for link types (${batchEndpoint}) not found (404). Falling back to individual requests for ${classIds.length} class IDs.`);
              const allLinkTypes = [];
              for (const classId of classIds) {
                  const singleClassEndpoint = `${baseUrl}/api/v1/metadata/linktype/class/${classId}`;
                  try {
                      const singleResponse = await fetch(singleClassEndpoint, commonFetchOptions);
                      if (singleResponse.ok) {
                          // Assuming the single endpoint returns DataWalkLinkType[] for consistency, even if it's for one class
                          // If it returns a single DataWalkLinkType object, this would need adjustment (e.g., allLinkTypes.push(await singleResponse.json()))
                          const classLinkTypes = await singleResponse.json();
                          allLinkTypes.push(...classLinkTypes);
                      }
                      else {
                          console.error(`PABLO'S DW CHAD: API Error fetching link types for classId ${classId} (fallback). Endpoint: ${singleClassEndpoint}. Status: ${singleResponse.status}`, await singleResponse.text());
                      }
                  }
                  catch (individualError) {
                      console.error(`PABLO'S DW CHAD: Network or other error fetching link types for classId ${classId} (fallback). Endpoint: ${singleClassEndpoint}:`, individualError);
                  }
              }
              console.log(`PABLO'S DW CHAD: Fallback for fetchLinkTypesByClassIds completed. Fetched ${allLinkTypes.length} link types individually.`);
              return allLinkTypes;
          }
          else {
              // Handle other non-OK statuses for the batch request
              console.error(`PABLO'S DW CHAD: API Error fetching link types (batch). Endpoint: ${batchEndpoint}. Status: ${batchResponse.status}`, await batchResponse.text());
              throw new Error(`Failed to fetch link types: ${batchResponse.status}`);
          }
      }
      catch (error) {
          // Catch errors from the initial batch fetch attempt or unhandled errors from fallback
          console.error("PABLO'S DW CHAD: General error in fetchLinkTypesByClassIds. Batch Endpoint: ${batchEndpoint}:", error);
          throw error; // Re-throw to allow caller to handle
      }
  }
  /**
   * Unregisters a dynamic endpoint from the DataWalk API.
   * @param baseUrl The base URL of the DataWalk instance.
   * @param appExecutionUuid The UUID of the app execution to unregister.
   * @returns A promise that resolves when the operation is complete.
   */
  async function unregisterDynamicEndpoint(baseUrl, appExecutionUuid) {
      const endpoint = `${baseUrl}/api/v1/ext/dynamic-endpoint/unregister`;
      try {
          const response = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                  ...COMMON_HEADERS,
                  'Content-Type': 'application/json',
              },
              credentials: 'include',
              mode: 'cors',
              body: JSON.stringify({ appExecutionUuid }),
          });
          if (!response.ok) {
              console.error(`PABLO'S DW CHAD: API Error unregistering dynamic endpoint. Status: ${response.status}`, await response.text());
              throw new Error(`Failed to unregister dynamic endpoint: ${response.status}`);
          }
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error unregistering dynamic endpoint:", error);
          throw error;
      }
  }
  async function getDynamicEndpoints(baseUrl) {
      const endpoint = `${baseUrl}/api/v1/ext/dynamic-endpoint`;
      try {
          const response = await fetch(endpoint, {
              method: 'GET',
              headers: COMMON_HEADERS,
              credentials: 'include',
              mode: 'cors',
          });
          if (!response.ok) {
              console.error(`PABLO'S DW CHAD: API Error fetching dynamic endpoints. Status: ${response.status}`, await response.text());
              throw new Error(`Failed to fetch dynamic endpoints: ${response.status}`);
          }
          const data = await response.json();
          return data;
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error in getDynamicEndpoints:", error);
          throw error; // Re-throw to allow caller to handle
      }
  }
  /**
   * Fetches public dynamic endpoints from the DataWalk API.
   * @param baseUrl The base URL of the DataWalk instance.
   * @returns A promise that resolves to a DynamicEndpointsResponse.
   */
  async function getPublicDynamicEndpoints(baseUrl) {
      const endpoint = `${baseUrl}/api/v1/ext/dynamic-endpoint/public`;
      try {
          const response = await fetch(endpoint, {
              method: 'GET',
              headers: COMMON_HEADERS,
              credentials: 'include',
              mode: 'cors',
          });
          if (!response.ok) {
              console.error(`PABLO'S DW CHAD: API Error fetching public dynamic endpoints. Status: ${response.status}`, await response.text());
              throw new Error(`Failed to fetch public dynamic endpoints: ${response.status}`);
          }
          const data = await response.json();
          return data;
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error in getPublicDynamicEndpoints:", error);
          throw error; // Re-throw to allow caller to handle
      }
  }
  /**
   * Fetches and combines information about deployed applications from both internal and public dynamic endpoints.
   * @param baseUrl The base URL of the DataWalk instance.
   * @returns A promise that resolves to an array of CombinedAppInfo objects.
   */
  /**
   * Truncates all data in a specific set/class.
   * @param baseUrl The base URL of the DataWalk instance.
   * @param setId The ID of the set/class to truncate.
   * @returns A promise that resolves to the API response.
   */
  async function truncateSet(baseUrl, setId) {
      const endpoint = `${baseUrl}/api/v1/metadata/class/truncate/${setId}`;
      try {
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                  ...COMMON_HEADERS,
                  'Content-Type': 'application/json',
              },
              credentials: 'include',
              mode: 'cors',
              body: JSON.stringify({}) // Empty body as required by the endpoint
          });
          if (!response.ok) {
              const errorText = await response.text();
              console.error(`PABLO'S DW CHAD: API Error truncating set ${setId}. Status: ${response.status}`, errorText);
              throw new Error(`Failed to truncate set: ${response.status} - ${errorText}`);
          }
          // Check if response has content before trying to parse as JSON
          const responseText = await response.text();
          if (!responseText) {
              // Return a success response if the response is empty
              return { data: { success: true, message: 'Set truncated successfully' } };
          }
          return JSON.parse(responseText);
      }
      catch (error) {
          console.error(`PABLO'S DW CHAD: Error in truncateSet:`, error);
          throw error;
      }
  }
  async function getCombinedAppInfoList(baseUrl) {
      try {
          const [internalAppsResponse, publicAppsResponse] = await Promise.all([
              getDynamicEndpoints(baseUrl),
              getPublicDynamicEndpoints(baseUrl)
          ]);
          const combinedAppsMap = new Map();
          // Process internal apps
          internalAppsResponse.mappings.forEach(app => {
              combinedAppsMap.set(app.appExecutionUuid, {
                  appExecutionUuid: app.appExecutionUuid,
                  appName: app.appName,
                  appConfigurationName: app.appConfigurationName,
                  internalDestinationHost: app.destinationHost,
                  internalPortMappings: app.portMappings,
              });
          });
          // Process public apps and merge with existing entries
          publicAppsResponse.mappings.forEach(publicApp => {
              const existingApp = combinedAppsMap.get(publicApp.appExecutionUuid);
              if (existingApp) {
                  existingApp.publicPortMappings = publicApp.portMappings;
                  // Optionally update appName or appConfigurationName if they can differ and public is preferred
                  // For now, we assume they are consistent or internal is primary for these common fields.
                  // existingApp.publicDestinationHost = publicApp.destinationHost; // Can be added if needed
              }
              else {
                  // App exists only in public list
                  combinedAppsMap.set(publicApp.appExecutionUuid, {
                      appExecutionUuid: publicApp.appExecutionUuid,
                      appName: publicApp.appName,
                      appConfigurationName: publicApp.appConfigurationName,
                      publicPortMappings: publicApp.portMappings,
                      // publicDestinationHost: publicApp.destinationHost, // Can be added if needed
                  });
              }
          });
          return Array.from(combinedAppsMap.values());
      }
      catch (error) {
          console.error("PABLO'S DW CHAD: Error in getCombinedAppInfoList:", error);
          // Depending on desired error handling, you might want to return an empty array or re-throw
          // For now, re-throwing to let the caller decide.
          throw error;
      }
  }

  // src/utils/urlUtils.ts
  /**
   * Gets the base URL of the current DataWalk instance.
   * Assumes the script is running in the context of a DataWalk page.
   * @returns A promise that resolves to the base URL (e.g., 'https://example.datawalk.com') or null if not determinable.
   */
  async function getCurrentDatawalkBaseUrl() {
      // In the context of a content script or injected UI, window.location.origin is the most direct way.
      if (window && window.location && window.location.origin) {
          // Ensure it's a valid http/https URL, not 'chrome-extension://' or other schemes if tool runs in other contexts.
          if (window.location.origin.startsWith('http')) {
              return Promise.resolve(window.location.origin);
          }
      }
      // Fallback or error case
      console.warn('PABLO\'S DW CHAD: Could not determine DataWalk base URL from window.location.origin.');
      return Promise.resolve(null);
  }

  function openGitHubIssue(toolName) {
      const title = `[${toolName}] `;
      const body = `## Description

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior

## Actual Behavior

## Environment
- Browser: ${navigator.userAgent}
- Tool: ${toolName}
- URL: ${window.location.href}

## Additional Context`;
      const url = new URL('https://github.com/pawelgnatowski/pablos_dw_chad/issues/new');
      url.searchParams.set('title', title.trim());
      url.searchParams.set('body', body);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  // src/ui/DeployedAppsTool.ts
  const REFRESH_INTERVAL_MS = 30000; // Refresh every 30 seconds, for example
  class DeployedAppsTool {
      constructor() {
          this.toolElement = null;
          this.tableBodyElement = null;
          this.lastUpdatedElement = null;
          this.refreshIntervalId = null;
          this.currentIsVisible = false;
          this.createUI();
      }
      createUI() {
          // Main container for the tool
          this.toolElement = document.createElement('div');
          this.toolElement.id = 'pdwc-deployed-apps-tool';
          this.toolElement.classList.add('pdwc-tool-panel'); // General styling for a tool panel
          this.toolElement.style.display = 'none'; // Hidden by default
          // Header
          const header = document.createElement('div');
          header.classList.add('pdwc-tool-header');
          header.textContent = 'Deployed Long-Running Apps';
          const closeButton = document.createElement('button');
          closeButton.classList.add('pdwc-tool-close-button');
          closeButton.textContent = '×';
          closeButton.onclick = () => this.hide();
          header.appendChild(closeButton);
          this.toolElement.appendChild(header);
          // Last Updated Timestamp
          this.lastUpdatedElement = document.createElement('div');
          this.lastUpdatedElement.classList.add('pdwc-last-updated');
          this.lastUpdatedElement.style.padding = '5px 10px';
          this.lastUpdatedElement.style.fontSize = '0.8em';
          this.toolElement.appendChild(this.lastUpdatedElement);
          // Add feedback button
          const feedbackButton = document.createElement('button');
          feedbackButton.className = 'pdwc-feedback-button';
          feedbackButton.title = 'Report an issue';
          feedbackButton.innerHTML = '🐞';
          feedbackButton.style.background = 'none';
          feedbackButton.style.border = 'none';
          feedbackButton.style.color = '#f2f2f7';
          feedbackButton.style.fontSize = '16px';
          feedbackButton.style.cursor = 'pointer';
          feedbackButton.style.padding = '0 10px';
          feedbackButton.style.lineHeight = '1';
          feedbackButton.style.opacity = '0.8';
          feedbackButton.style.transition = 'opacity 0.2s';
          feedbackButton.style.position = 'absolute';
          feedbackButton.style.right = '35px';
          feedbackButton.style.top = '5px';
          feedbackButton.onmouseover = () => {
              feedbackButton.style.opacity = '1';
              feedbackButton.style.color = '#ff9f0a';
          };
          feedbackButton.onmouseout = () => {
              feedbackButton.style.opacity = '0.8';
              feedbackButton.style.color = '#f2f2f7';
          };
          feedbackButton.onclick = () => openGitHubIssue('Deployed Apps Tool');
          this.toolElement.appendChild(feedbackButton);
          // Scrollable container for the table
          const tableContainer = document.createElement('div');
          tableContainer.classList.add('pdwc-apps-table-container');
          this.toolElement.appendChild(tableContainer);
          // Table for displaying apps
          const table = document.createElement('table');
          table.classList.add('pdwc-apps-table');
          const tableHeader = table.createTHead().insertRow();
          // Add empty header for the actions column
          const actionHeader = document.createElement('th');
          actionHeader.textContent = 'Actions';
          tableHeader.appendChild(actionHeader);
          ['App Name', 'Config Name', 'Internal Ports', 'Public Endpoint', 'UUID (Hover)'].forEach(text => {
              const th = document.createElement('th');
              th.textContent = text;
              tableHeader.appendChild(th);
          });
          this.tableBodyElement = table.createTBody();
          tableContainer.appendChild(table); // Append table to its container
          document.body.appendChild(this.toolElement);
      }
      async refreshData() {
          if (!this.isVisible() || !this.tableBodyElement || !this.lastUpdatedElement)
              return;
          try {
              const baseUrl = await getCurrentDatawalkBaseUrl();
              if (!baseUrl) {
                  console.warn('PABLO\'S DW CHAD: Base URL not found, cannot refresh deployed apps.');
                  this.lastUpdatedElement.textContent = 'Error: DataWalk URL not found.';
                  return;
              }
              const apps = await getCombinedAppInfoList(baseUrl);
              this.renderTable(apps);
              this.lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
          }
          catch (error) {
              console.error('PABLO\'S DW CHAD: Error refreshing deployed apps list:', error);
              if (this.lastUpdatedElement) {
                  this.lastUpdatedElement.textContent = 'Error loading data.';
              }
          }
      }
      renderTable(apps) {
          if (!this.tableBodyElement)
              return;
          this.tableBodyElement.innerHTML = ''; // Clear existing rows
          if (apps.length === 0) {
              const row = this.tableBodyElement.insertRow();
              const cell = row.insertCell();
              cell.colSpan = 6; // Number of columns (including the new actions column)
              cell.textContent = 'No deployed applications found or an error occurred.';
              cell.style.textAlign = 'center';
              return;
          }
          apps.forEach(app => {
              const row = this.tableBodyElement.insertRow();
              // Add trash bin icon for unregister action
              const actionCell = row.insertCell();
              const trashIcon = document.createElement('span');
              trashIcon.innerHTML = '🗑️';
              trashIcon.title = 'Unregister this endpoint';
              trashIcon.style.cursor = 'pointer';
              trashIcon.style.fontSize = '1.2em';
              trashIcon.style.opacity = '0.7';
              trashIcon.onmouseover = () => trashIcon.style.opacity = '1';
              trashIcon.onmouseout = () => trashIcon.style.opacity = '0.7';
              trashIcon.onclick = async (e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to unregister the endpoint for ${app.appName}?`)) {
                      try {
                          const baseUrl = await getCurrentDatawalkBaseUrl();
                          if (baseUrl) {
                              await unregisterDynamicEndpoint(baseUrl, app.appExecutionUuid);
                              this.refreshData(); // Refresh the table after successful unregistration
                          }
                      }
                      catch (error) {
                          console.error('Failed to unregister endpoint:', error);
                          alert('Failed to unregister endpoint. Check console for details.');
                      }
                  }
              };
              actionCell.appendChild(trashIcon);
              row.insertCell().textContent = app.appName;
              row.insertCell().textContent = app.appConfigurationName;
              // Internal Ports
              const internalPortsCell = row.insertCell();
              if (app.internalPortMappings && app.internalPortMappings.length > 0) {
                  internalPortsCell.innerHTML = app.internalPortMappings
                      .map(p => `${p.id}: ${app.internalDestinationHost}:${p.destinationPort}`)
                      .join('<br>');
              }
              else {
                  internalPortsCell.textContent = 'N/A';
              }
              // Public Endpoint
              const publicEndpointCell = row.insertCell();
              if (app.publicPortMappings && app.publicPortMappings.length > 0) {
                  publicEndpointCell.innerHTML = app.publicPortMappings
                      .map(p => {
                      const portInfo = `${p.id}: ${p.destinationPort}`;
                      return p.loadBalancerEndpoint
                          ? `<a href="${p.loadBalancerEndpoint}" target="_blank">${p.loadBalancerEndpoint}</a> (${portInfo})`
                          : portInfo;
                  })
                      .join('<br>');
              }
              else {
                  publicEndpointCell.textContent = 'N/A';
              }
              // UUID (shown on hover)
              const uuidCell = row.insertCell();
              uuidCell.textContent = '...'; // Placeholder
              uuidCell.title = app.appExecutionUuid; // Show full UUID on hover
          });
      }
      show() {
          if (this.toolElement) {
              this.toolElement.style.display = 'flex'; // Changed from 'block' to 'flex'
              this.currentIsVisible = true;
              console.log(`PABLO'S DW CHAD: DeployedAppsTool.show() - Style set to '${this.toolElement.style.display}', currentIsVisible: ${this.currentIsVisible}`);
              // Re-enable data fetching and auto-refresh
              this.refreshData(); // Load data when shown
              this.startAutoRefresh();
          }
          else {
              console.error('PABLO\'S DW CHAD: DeployedAppsTool.show() called, but toolElement is null.');
          }
      }
      hide() {
          if (this.toolElement) {
              this.toolElement.style.display = 'none';
              this.currentIsVisible = false;
              this.stopAutoRefresh();
          }
      }
      toggle() {
          if (this.isVisible()) {
              this.hide();
          }
          else {
              this.show();
          }
      }
      startAutoRefresh() {
          if (this.refreshIntervalId === null) {
              this.refreshIntervalId = window.setInterval(() => this.refreshData(), REFRESH_INTERVAL_MS);
          }
      }
      stopAutoRefresh() {
          if (this.refreshIntervalId !== null) {
              clearInterval(this.refreshIntervalId);
              this.refreshIntervalId = null;
          }
      }
      isVisible() {
          return this.currentIsVisible;
      }
      // Ensure to call this when the tool is no longer needed to prevent memory leaks
      destroy() {
          this.stopAutoRefresh();
          if (this.toolElement && this.toolElement.parentNode) {
              this.toolElement.parentNode.removeChild(this.toolElement);
          }
          this.toolElement = null;
          this.tableBodyElement = null;
          this.lastUpdatedElement = null;
      }
  }

  // src/ui/SetTruncationTool.ts
  class SetTruncationTool {
      constructor() {
          this.toolElement = null;
          this.currentIsVisible = false;
          this.isDragging = false;
          this.dragStartX = 0;
          this.dragStartY = 0;
          this.currentX = 0;
          this.currentY = 0;
          this.sets = [];
          this.filteredSets = [];
          this.setGroups = [];
          this.isLoading = false;
          this.statusElement = null;
          this.searchInput = null;
          this.setsContainer = null;
          this.groupSelect = null;
          this.groupNameInput = null;
          this.saveGroupButton = null;
          this.deleteGroupButton = null;
          this.actionSelect = null;
          this.baseUrl = null;
          this.lastKnownBaseUrl = null;
          this.isInitialized = false;
          this.storageChangeListener = null;
          this.initialize();
          // Set up a periodic check for base URL changes
          setInterval(this.checkForEnvironmentChange.bind(this), 1000);
          // Listen for storage changes from other tabs
          this.setupStorageListener();
      }
      setupStorageListener() {
          if (!chrome.storage?.onChanged?.addListener)
              return;
          this.storageChangeListener = async (changes, areaName) => {
              if (areaName !== 'local')
                  return;
              const storageKey = await this.getStorageKey();
              if (changes[storageKey] || changes.lastUpdate) {
                  // Refresh groups when our storage key changes or when we get a general update
                  await this.loadGroups();
              }
          };
          chrome.storage.onChanged.addListener(this.storageChangeListener);
      }
      cleanup() {
          if (this.storageChangeListener && chrome.storage?.onChanged?.removeListener) {
              chrome.storage.onChanged.removeListener(this.storageChangeListener);
          }
      }
      async checkForEnvironmentChange() {
          if (!this.isInitialized)
              return;
          const currentBaseUrl = await getCurrentDatawalkBaseUrl();
          // If base URL has changed and we have a previous URL
          if (currentBaseUrl && currentBaseUrl !== this.lastKnownBaseUrl) {
              this.lastKnownBaseUrl = currentBaseUrl;
              this.baseUrl = currentBaseUrl;
              // Refresh the UI with new environment's data
              await this.loadSets();
              await this.loadGroups();
              // Clear any existing status messages
              if (this.statusElement) {
                  this.statusElement.textContent = '';
                  this.statusElement.style.display = 'none';
              }
          }
      }
      async initialize() {
          this.baseUrl = await getCurrentDatawalkBaseUrl();
          this.lastKnownBaseUrl = this.baseUrl;
          this.createUI();
          this.loadSets();
      }
      createUI() {
          if (this.toolElement)
              return;
          this.toolElement = document.createElement('div');
          this.toolElement.id = 'pdwc-set-truncation-tool';
          this.toolElement.style.position = 'fixed';
          this.toolElement.style.top = '50%';
          this.toolElement.style.left = '50%';
          this.toolElement.style.transform = 'translate(-50%, -50%)';
          this.toolElement.style.width = '90%';
          this.toolElement.style.maxWidth = '1200px';
          this.toolElement.style.minWidth = '320px';
          this.toolElement.style.height = 'auto';
          this.toolElement.style.maxHeight = '90vh';
          this.toolElement.style.backgroundColor = 'white';
          this.toolElement.style.border = '1px solid #e0e0e0';
          this.toolElement.style.borderRadius = '8px';
          this.toolElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
          this.toolElement.style.display = 'none';
          this.toolElement.style.overflow = 'hidden';
          this.toolElement.style.zIndex = '10000';
          this.toolElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";
          this.toolElement.style.resize = 'both';
          this.toolElement.style.minHeight = '400px';
          // Header container
          const header = document.createElement('div');
          header.style.position = 'relative';
          header.style.backgroundColor = '#f8f9fa';
          header.style.borderBottom = '1px solid #e9ecef';
          header.style.padding = '0';
          header.style.margin = '0';
          header.style.userSelect = 'none';
          // Header content (for dragging)
          const headerContent = document.createElement('div');
          headerContent.style.cursor = 'move';
          headerContent.style.padding = '12px 40px 12px 16px';
          headerContent.style.fontSize = '14px';
          headerContent.style.fontWeight = '500';
          // Title
          const title = document.createElement('div');
          title.textContent = 'Set Management Tool';
          title.style.overflow = 'hidden';
          title.style.textOverflow = 'ellipsis';
          title.style.whiteSpace = 'nowrap';
          headerContent.appendChild(title);
          header.appendChild(headerContent);
          // Close button
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '&times;';
          closeButton.className = 'pdwc-tool-close-button';
          closeButton.style.position = 'absolute';
          closeButton.style.top = '2px';
          closeButton.style.right = '2px';
          closeButton.style.width = '28px';
          closeButton.style.height = '28px';
          closeButton.style.display = 'flex';
          closeButton.style.alignItems = 'center';
          closeButton.style.justifyContent = 'center';
          closeButton.style.background = 'none';
          closeButton.style.border = 'none';
          closeButton.style.fontSize = '20px';
          closeButton.style.fontWeight = 'bold';
          closeButton.style.cursor = 'pointer';
          closeButton.style.padding = '0';
          closeButton.style.margin = '0';
          closeButton.style.lineHeight = '1';
          closeButton.style.borderRadius = '4px';
          closeButton.addEventListener('mouseover', () => {
              closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          });
          closeButton.addEventListener('mouseout', () => {
              closeButton.style.backgroundColor = 'transparent';
          });
          closeButton.addEventListener('click', (e) => {
              e.stopPropagation();
              this.hide();
          });
          header.appendChild(closeButton);
          // Add feedback button
          const feedbackButton = document.createElement('button');
          feedbackButton.className = 'pdwc-feedback-button';
          feedbackButton.title = 'Report an issue';
          feedbackButton.innerHTML = '🐞';
          feedbackButton.style.background = 'none';
          feedbackButton.style.border = 'none';
          feedbackButton.style.color = '#f2f2f7';
          feedbackButton.style.fontSize = '16px';
          feedbackButton.style.cursor = 'pointer';
          feedbackButton.style.padding = '0 10px';
          feedbackButton.style.lineHeight = '1';
          feedbackButton.style.opacity = '0.8';
          feedbackButton.style.transition = 'opacity 0.2s';
          feedbackButton.style.position = 'absolute';
          feedbackButton.style.right = '35px';
          feedbackButton.style.top = '5px';
          feedbackButton.onmouseover = () => {
              feedbackButton.style.opacity = '1';
              feedbackButton.style.color = '#ff9f0a';
          };
          feedbackButton.onmouseout = () => {
              feedbackButton.style.opacity = '0.8';
              feedbackButton.style.color = '#f2f2f7';
          };
          feedbackButton.onclick = () => openGitHubIssue('Set Truncation Tool');
          header.appendChild(feedbackButton);
          // Add drag event listeners
          headerContent.addEventListener('mousedown', this.startDragging.bind(this));
          document.addEventListener('mousemove', this.onDrag.bind(this));
          document.addEventListener('mouseup', this.stopDragging.bind(this));
          const content = document.createElement('div');
          content.style.padding = '16px';
          content.style.display = 'flex';
          content.style.flexDirection = 'row';
          content.style.gap = '20px';
          content.style.overflow = 'hidden';
          content.style.height = 'calc(100% - 60px)';
          content.style.minHeight = '340px';
          // Left column - Search and sets list
          const leftColumn = document.createElement('div');
          leftColumn.style.display = 'flex';
          leftColumn.style.flexDirection = 'column';
          leftColumn.style.flex = '1';
          leftColumn.style.minWidth = '300px';
          leftColumn.style.overflow = 'hidden';
          leftColumn.style.gap = '12px';
          // Search and filter section
          const searchSection = document.createElement('div');
          this.searchInput = document.createElement('input');
          this.searchInput.type = 'text';
          this.searchInput.placeholder = 'Search sets...';
          this.searchInput.style.width = '100%';
          this.searchInput.style.padding = '8px 12px';
          this.searchInput.style.border = '1px solid #dee2e6';
          this.searchInput.style.borderRadius = '4px';
          this.searchInput.style.fontSize = '13px';
          this.searchInput.style.boxSizing = 'border-box';
          this.searchInput.addEventListener('input', () => this.filterSets());
          searchSection.appendChild(this.searchInput);
          leftColumn.appendChild(searchSection);
          // Main container for the left column content
          const leftContent = document.createElement('div');
          leftContent.style.display = 'flex';
          leftContent.style.flexDirection = 'column';
          leftContent.style.flex = '1';
          leftContent.style.minHeight = '300px';
          leftContent.style.overflow = 'hidden';
          // Sets container with border and background
          const setsContainer = document.createElement('div');
          setsContainer.style.flex = '1';
          setsContainer.style.display = 'flex';
          setsContainer.style.flexDirection = 'column';
          setsContainer.style.overflow = 'hidden';
          setsContainer.style.border = '1px solid #dee2e6';
          setsContainer.style.borderRadius = '4px';
          setsContainer.style.backgroundColor = '#fff';
          setsContainer.style.marginTop = '8px';
          // Scrollable content wrapper - takes remaining space
          const scrollableContent = document.createElement('div');
          scrollableContent.style.overflowY = 'auto';
          scrollableContent.style.overflowX = 'hidden';
          scrollableContent.style.padding = '8px';
          scrollableContent.style.display = 'flex';
          scrollableContent.style.flexDirection = 'column';
          scrollableContent.style.gap = '4px';
          scrollableContent.style.height = 'calc(100vh - 400px)';
          scrollableContent.style.minHeight = '200px';
          scrollableContent.style.maxHeight = '600px';
          // Build the hierarchy
          setsContainer.appendChild(scrollableContent);
          // Add sets container to left content
          leftContent.appendChild(setsContainer);
          // Assign the scrollable content to the class property
          this.setsContainer = scrollableContent;
          leftColumn.appendChild(leftContent);
          content.appendChild(leftColumn);
          // Right column - Groups
          const rightColumn = document.createElement('div');
          rightColumn.style.display = 'flex';
          rightColumn.style.flexDirection = 'column';
          rightColumn.style.gap = '12px';
          rightColumn.style.width = '280px';
          rightColumn.style.minWidth = '280px';
          rightColumn.style.maxWidth = '320px';
          rightColumn.style.overflow = 'hidden';
          rightColumn.style.minWidth = '280px';
          // Groups section
          const groupsSection = document.createElement('div');
          groupsSection.style.display = 'flex';
          groupsSection.style.flexDirection = 'column';
          groupsSection.style.gap = '12px';
          const groupsHeader = document.createElement('h3');
          groupsHeader.textContent = 'Set Groups';
          groupsHeader.style.margin = '0';
          groupsHeader.style.fontSize = '14px';
          groupsHeader.style.fontWeight = '600';
          // Group name input
          this.groupNameInput = document.createElement('input');
          this.groupNameInput.type = 'text';
          this.groupNameInput.placeholder = 'Group name';
          this.groupNameInput.style.width = '100%';
          this.groupNameInput.style.padding = '8px 12px';
          this.groupNameInput.style.border = '1px solid #dee2e6';
          this.groupNameInput.style.borderRadius = '4px';
          this.groupNameInput.style.fontSize = '13px';
          this.groupNameInput.style.boxSizing = 'border-box';
          // Group controls (Save/Delete buttons)
          const groupControls = document.createElement('div');
          groupControls.style.display = 'flex';
          groupControls.style.gap = '8px';
          // Save button
          this.saveGroupButton = document.createElement('button');
          this.saveGroupButton.textContent = 'Save';
          this.saveGroupButton.style.flex = '1';
          this.saveGroupButton.style.padding = '8px 12px';
          this.saveGroupButton.style.backgroundColor = '#007bff';
          this.saveGroupButton.style.color = 'white';
          this.saveGroupButton.style.border = 'none';
          this.saveGroupButton.style.borderRadius = '4px';
          this.saveGroupButton.style.cursor = 'pointer';
          this.saveGroupButton.style.fontSize = '13px';
          this.saveGroupButton.style.transition = 'background-color 0.2s';
          this.saveGroupButton.addEventListener('mouseover', () => this.saveGroupButton && (this.saveGroupButton.style.backgroundColor = '#0069d9'));
          this.saveGroupButton.addEventListener('mouseout', () => this.saveGroupButton && (this.saveGroupButton.style.backgroundColor = '#007bff'));
          this.saveGroupButton.addEventListener('click', () => this.saveGroup());
          // Delete button
          this.deleteGroupButton = document.createElement('button');
          this.deleteGroupButton.textContent = 'Delete';
          this.deleteGroupButton.style.flex = '1';
          this.deleteGroupButton.style.padding = '8px 12px';
          this.deleteGroupButton.style.backgroundColor = '#dc3545';
          this.deleteGroupButton.style.color = 'white';
          this.deleteGroupButton.style.border = 'none';
          this.deleteGroupButton.style.borderRadius = '4px';
          this.deleteGroupButton.style.cursor = 'pointer';
          this.deleteGroupButton.style.fontSize = '13px';
          this.deleteGroupButton.style.transition = 'background-color 0.2s';
          this.deleteGroupButton.addEventListener('mouseover', () => this.deleteGroupButton && (this.deleteGroupButton.style.backgroundColor = '#c82333'));
          this.deleteGroupButton.addEventListener('mouseout', () => this.deleteGroupButton && (this.deleteGroupButton.style.backgroundColor = '#dc3545'));
          this.deleteGroupButton.addEventListener('click', () => this.deleteGroup());
          // Group select dropdown
          this.groupSelect = document.createElement('select');
          this.groupSelect.style.width = '100%';
          this.groupSelect.style.padding = '8px 12px';
          this.groupSelect.style.border = '1px solid #dee2e6';
          this.groupSelect.style.borderRadius = '4px';
          this.groupSelect.style.fontSize = '13px';
          this.groupSelect.style.boxSizing = 'border-box';
          this.groupSelect.style.marginTop = '4px';
          this.groupSelect.addEventListener('change', () => this.loadSelectedGroup());
          // Assemble groups section
          groupControls.appendChild(this.saveGroupButton);
          groupControls.appendChild(this.deleteGroupButton);
          groupsSection.appendChild(groupsHeader);
          groupsSection.appendChild(this.groupNameInput);
          groupsSection.appendChild(groupControls);
          groupsSection.appendChild(this.groupSelect);
          // Add to right column
          rightColumn.appendChild(groupsSection);
          content.appendChild(rightColumn);
          // Actions section - positioned at the bottom of the left column
          const actionsSection = document.createElement('div');
          actionsSection.style.marginTop = '12px';
          actionsSection.style.paddingTop = '12px';
          actionsSection.style.borderTop = '1px solid #eee';
          const actionsHeader = document.createElement('h3');
          actionsHeader.textContent = 'Actions';
          actionsHeader.style.margin = '0 0 10px 0';
          actionsHeader.style.fontSize = '14px';
          actionsHeader.style.fontWeight = '600';
          const actionControls = document.createElement('div');
          actionControls.style.display = 'flex';
          actionControls.style.gap = '10px';
          actionControls.style.marginTop = '8px';
          this.actionSelect = document.createElement('select');
          this.actionSelect.style.flex = '1';
          this.actionSelect.style.padding = '8px';
          const actions = [
              { value: 'truncate', label: 'Truncate (Delete all data)' },
              { value: 'count', label: 'Count items' },
              { value: 'export', label: 'Export data' }
          ];
          actions.forEach(action => {
              const option = document.createElement('option');
              option.value = action.value;
              option.textContent = action.label;
              this.actionSelect?.appendChild(option);
          });
          const executeButton = document.createElement('button');
          executeButton.textContent = 'Execute';
          executeButton.className = 'pdwc-tool-button';
          executeButton.style.flex = '0 0 auto';
          executeButton.addEventListener('click', () => this.executeAction());
          actionControls.appendChild(this.actionSelect);
          actionControls.appendChild(executeButton);
          actionsSection.appendChild(actionsHeader);
          actionsSection.appendChild(actionControls);
          // Status element
          this.statusElement = document.createElement('div');
          this.statusElement.style.marginTop = '10px';
          this.statusElement.style.padding = '8px';
          this.statusElement.style.borderRadius = '4px';
          this.statusElement.style.display = 'none';
          // Assemble the UI
          // Add elements to left column in the correct order
          leftColumn.appendChild(leftContent);
          leftColumn.appendChild(actionsSection);
          // Add elements to the main content area
          content.appendChild(leftColumn);
          content.appendChild(rightColumn);
          // Add header and content to the tool
          this.toolElement.appendChild(header);
          this.toolElement.appendChild(content);
          document.body.appendChild(this.toolElement);
          // Load saved groups
          this.loadGroups();
          // Initial render of sets
          this.filterSets();
      }
      filterSets() {
          if (!this.searchInput || !this.setsContainer)
              return;
          const searchTerm = this.searchInput.value.toLowerCase();
          this.filteredSets = this.sets.filter(set => set.name.toLowerCase().includes(searchTerm) ||
              set.id.toString().includes(searchTerm));
          this.renderSets();
      }
      renderSets() {
          if (!this.setsContainer)
              return;
          this.setsContainer.innerHTML = '';
          if (this.filteredSets.length === 0) {
              const noResults = document.createElement('div');
              noResults.textContent = 'No sets found';
              noResults.style.padding = '10px';
              noResults.style.textAlign = 'center';
              noResults.style.color = '#666';
              this.setsContainer.appendChild(noResults);
              return;
          }
          this.filteredSets.forEach(set => {
              const setItem = document.createElement('div');
              setItem.style.display = 'flex';
              setItem.style.alignItems = 'center';
              setItem.style.padding = '8px';
              setItem.style.borderBottom = '1px solid #eee';
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.checked = set.selected || false;
              checkbox.style.marginRight = '10px';
              checkbox.addEventListener('change', () => {
                  set.selected = checkbox.checked;
              });
              const label = document.createElement('span');
              label.textContent = `${set.name} (ID: ${set.id})`;
              label.style.flex = '1';
              label.style.overflow = 'hidden';
              label.style.textOverflow = 'ellipsis';
              label.style.whiteSpace = 'nowrap';
              setItem.appendChild(checkbox);
              setItem.appendChild(label);
              this.setsContainer?.appendChild(setItem);
          });
      }
      getSelectedSets() {
          return this.sets.filter(set => set.selected);
      }
      async loadSets() {
          if (!this.statusElement)
              return;
          this.isLoading = true;
          this.setStatus('Loading sets...', 'info');
          try {
              const baseUrl = this.baseUrl || await getCurrentDatawalkBaseUrl();
              if (!baseUrl) {
                  throw new Error('Could not determine DataWalk base URL');
              }
              const sets = await fetchSets(baseUrl);
              this.sets = sets.map(set => ({
                  id: set.id,
                  name: set.name,
                  selected: false
              }));
              this.filteredSets = [...this.sets];
              this.renderSets();
              this.setStatus('', 'info');
              // Always load groups after loading sets
              await this.loadGroups();
              // Mark as initialized after first load
              this.isInitialized = true;
          }
          catch (error) {
              console.error('Error loading sets:', error);
              this.setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          }
          finally {
              this.isLoading = false;
          }
      }
      async loadGroups() {
          try {
              const savedGroups = await this.getSavedGroups();
              this.setGroups = savedGroups;
              this.updateGroupSelect();
              // Clear group name input when groups are loaded for a new environment
              if (this.groupNameInput) {
                  this.groupNameInput.value = '';
              }
          }
          catch (error) {
              console.error('Error loading groups:', error);
              this.setStatus('Failed to load saved groups', 'error');
          }
      }
      async getStorageKey() {
          const baseUrl = this.baseUrl || await getCurrentDatawalkBaseUrl();
          return `dwSetGroups_${btoa(baseUrl || '')}`;
      }
      async getSavedGroups() {
          try {
              const storageKey = await this.getStorageKey();
              // Try chrome.storage.local first
              if (chrome.storage?.local) {
                  const result = await chrome.storage.local.get(storageKey);
                  return result[storageKey] || [];
              }
              // Fall back to localStorage if chrome.storage is not available
              console.warn('chrome.storage.local not available, falling back to localStorage');
              const saved = localStorage.getItem(storageKey);
              return saved ? JSON.parse(saved) : [];
          }
          catch (error) {
              console.error('Error loading groups:', error);
              return [];
          }
      }
      async saveGroups() {
          try {
              const storageKey = await this.getStorageKey();
              const data = { [storageKey]: this.setGroups };
              // Try chrome.storage.local first
              if (chrome.storage?.local) {
                  await chrome.storage.local.set(data);
              }
              else {
                  // Fall back to localStorage
                  console.warn('chrome.storage.local not available, falling back to localStorage');
                  localStorage.setItem(storageKey, JSON.stringify(this.setGroups));
              }
              // Notify other tabs about the update
              await this.notifyEnvironmentChange();
          }
          catch (error) {
              console.error('Error saving groups:', error);
              throw new Error('Failed to save groups');
          }
      }
      async notifyEnvironmentChange() {
          // This will help other tabs detect changes
          if (chrome.storage?.local) {
              try {
                  const storageKey = await this.getStorageKey();
                  await chrome.storage.local.set({
                      [storageKey]: this.setGroups,
                      lastUpdate: Date.now()
                  });
              }
              catch (error) {
                  console.error('Error notifying environment change:', error);
              }
          }
      }
      updateGroupSelect() {
          if (!this.groupSelect)
              return;
          const currentValue = this.groupSelect.value;
          this.groupSelect.innerHTML = '';
          const defaultOption = document.createElement('option');
          defaultOption.value = '';
          defaultOption.textContent = '-- Select a group --';
          this.groupSelect.appendChild(defaultOption);
          this.setGroups.forEach(group => {
              const option = document.createElement('option');
              option.value = group.id;
              option.textContent = `${group.name} (${group.setIds.length} sets)`;
              this.groupSelect?.appendChild(option);
          });
          if (currentValue) {
              this.groupSelect.value = currentValue;
          }
      }
      async saveGroup() {
          if (!this.groupNameInput)
              return;
          const name = this.groupNameInput.value.trim();
          if (!name) {
              this.setStatus('Please enter a group name', 'error');
              return;
          }
          const selectedSets = this.getSelectedSets();
          if (selectedSets.length === 0) {
              this.setStatus('Please select at least one set', 'error');
              return;
          }
          try {
              // Check if a group with this name already exists (case-insensitive)
              const existingGroupIndex = this.setGroups.findIndex(g => g.name.toLowerCase() === name.toLowerCase());
              if (existingGroupIndex >= 0) {
                  // Update existing group
                  const updatedGroups = [...this.setGroups];
                  updatedGroups[existingGroupIndex] = {
                      ...updatedGroups[existingGroupIndex],
                      setIds: selectedSets.map(set => set.id),
                      updatedAt: Date.now()
                  };
                  this.setGroups = updatedGroups;
                  this.setStatus(`Group "${name}" updated successfully`, 'success');
              }
              else {
                  // Create new group
                  const newGroup = {
                      id: `group_${Date.now()}`,
                      name,
                      setIds: selectedSets.map(set => set.id),
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                  };
                  this.setGroups = [...this.setGroups, newGroup];
                  this.setStatus(`Group "${name}" created successfully`, 'success');
              }
              await this.saveGroups();
              this.updateGroupSelect();
              // Clear the group name input
              if (this.groupNameInput) {
                  this.groupNameInput.value = '';
              }
          }
          catch (error) {
              console.error('Error saving group:', error);
              this.setStatus('Failed to save group', 'error');
          }
      }
      async deleteGroup() {
          if (!this.groupSelect || !confirm('Are you sure you want to delete this group?')) {
              return;
          }
          const groupId = this.groupSelect.value;
          if (!groupId)
              return;
          try {
              this.setGroups = this.setGroups.filter(g => g.id !== groupId);
              await this.saveGroups();
              this.updateGroupSelect();
              this.setStatus('Group deleted', 'success');
          }
          catch (error) {
              console.error('Error deleting group:', error);
              this.setStatus('Failed to delete group', 'error');
          }
      }
      loadSelectedGroup() {
          if (!this.groupSelect || !this.groupNameInput)
              return;
          const groupId = this.groupSelect.value;
          if (!groupId)
              return;
          const group = this.setGroups.find(g => g.id === groupId);
          if (!group)
              return;
          // Update the group name input
          this.groupNameInput.value = group.name;
          // Update selected state of sets
          this.sets.forEach(set => {
              set.selected = group.setIds.includes(set.id);
          });
          // Re-render sets to show updated selection
          this.renderSets();
      }
      async executeAction() {
          const selectedSets = this.getSelectedSets();
          if (selectedSets.length === 0) {
              this.setStatus('Please select at least one set', 'error');
              return;
          }
          const action = this.actionSelect?.value || 'truncate';
          switch (action) {
              case 'truncate':
                  if (confirm(`WARNING: This will permanently delete all data in ${selectedSets.length} selected set(s). This action cannot be undone.\n\nAre you sure you want to continue?`)) {
                      for (const set of selectedSets) {
                          await this.truncateSet(set.id, set.name);
                      }
                  }
                  break;
              case 'count':
                  this.setStatus(`Selected ${selectedSets.length} set(s)`, 'info');
                  break;
              case 'export':
                  // TODO: Implement export functionality
                  this.setStatus('Export functionality coming soon', 'info');
                  break;
              default:
                  this.setStatus('Unknown action', 'error');
          }
      }
      async truncateSet(setId, setName) {
          if (!this.statusElement)
              return;
          this.setStatus(`Truncating "${setName}"...`, 'info');
          try {
              const baseUrl = await getCurrentDatawalkBaseUrl();
              if (!baseUrl) {
                  throw new Error('Could not determine DataWalk base URL');
              }
              const response = await truncateSet(baseUrl, setId);
              if (response.data?.success) {
                  this.setStatus(`Successfully truncated "${setName}"`, 'success');
              }
              else {
                  throw new Error(response.error?.message || 'Unknown error occurred');
              }
          }
          catch (error) {
              console.error(`Error truncating set ${setId}:`, error);
              this.setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to truncate set'}`, 'error');
          }
      }
      setStatus(message, type = 'info') {
          if (!this.statusElement)
              return;
          this.statusElement.textContent = message;
          this.statusElement.style.backgroundColor =
              type === 'error' ? '#f8d7da' :
                  type === 'success' ? '#d4edda' :
                      type === 'warning' ? '#fff3cd' : '#d1ecf1';
          this.statusElement.style.color =
              type === 'error' ? '#dc3545' :
                  type === 'success' ? '#28a745' :
                      type === 'warning' ? '#856404' : '#0c5460';
          this.statusElement.style.borderLeft = `4px solid ${type === 'error' ? '#dc3545' :
            type === 'success' ? '#28a745' :
                type === 'warning' ? '#ffc107' : '#17a2b8'}`;
          this.statusElement.style.display = message ? 'block' : 'none';
          this.statusElement.style.padding = '10px';
          this.statusElement.style.borderRadius = '4px';
          this.statusElement.style.marginTop = '10px';
      }
      startDragging(e) {
          if (e.button !== 0 || !this.toolElement)
              return; // Only left mouse button
          // Get the current position and dimensions of the tool
          const rect = this.toolElement.getBoundingClientRect();
          // Calculate the offset from the mouse to the top-left corner of the tool
          this.dragStartX = e.clientX - rect.left;
          this.dragStartY = e.clientY - rect.top;
          this.isDragging = true;
          this.currentX = rect.left;
          this.currentY = rect.top;
          // Apply styles for dragging
          this.toolElement.style.transition = 'none';
          document.body.style.userSelect = 'none';
      }
      onDrag(e) {
          if (!this.isDragging || !this.toolElement)
              return;
          // Calculate new position
          let newX = e.clientX - this.dragStartX;
          let newY = e.clientY - this.dragStartY;
          // Constrain to viewport
          const rect = this.toolElement.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          // Keep tool within viewport bounds with some margin (10px)
          const margin = 10;
          newX = Math.max(margin - rect.width + 20, Math.min(newX, viewportWidth - 20));
          newY = Math.max(margin, Math.min(newY, viewportHeight - 20));
          // Update position
          this.toolElement.style.left = `${newX}px`;
          this.toolElement.style.top = `${newY}px`;
          this.toolElement.style.transform = 'none';
      }
      stopDragging() {
          this.isDragging = false;
          document.body.style.userSelect = '';
      }
      show() {
          if (!this.toolElement)
              return;
          this.toolElement.style.display = 'block';
          this.currentIsVisible = true;
          // Center the tool when showing
          this.toolElement.style.left = '50%';
          this.toolElement.style.top = '50%';
          this.toolElement.style.transform = 'translate(-50%, -50%)';
          // Refresh sets when showing the tool
          this.loadSets();
      }
      hide() {
          if (!this.toolElement)
              return;
          this.toolElement.style.display = 'none';
          this.currentIsVisible = false;
          // Clean up event listeners when hiding
          document.removeEventListener('mousemove', this.onDrag.bind(this));
          document.removeEventListener('mouseup', this.stopDragging.bind(this));
      }
      toggle() {
          if (this.currentIsVisible) {
              this.hide();
          }
          else {
              this.show();
          }
      }
      isVisible() {
          return this.currentIsVisible;
      }
  }

  // src/ui/DraggableIcon.ts
  class DraggableIcon {
      constructor(onSearchClickCallback, onCodeClickCallback, onContextClickCallback, mainIconClickHandler) {
          this.isDragging = false;
          this.offsetX = 0;
          this.offsetY = 0;
          this.isStickyHoverActive = false;
          this.hoverHideTimeout = null;
          this.contextTool = null;
          this.deployedAppsTool = null;
          this.setTruncationTool = null;
          this.onMouseMove = (e) => {
              if (!this.isDragging)
                  return;
              e.preventDefault();
              let newX = e.clientX - this.offsetX;
              let newY = e.clientY - this.offsetY;
              const iconRect = this.element.getBoundingClientRect();
              newX = Math.max(0, Math.min(newX, window.innerWidth - iconRect.width));
              newY = Math.max(0, Math.min(newY, window.innerHeight - iconRect.height));
              this.element.style.left = `${newX}px`;
              this.element.style.top = `${newY}px`;
              if (this.element.style.bottom || this.element.style.right) {
                  this.element.style.bottom = '';
                  this.element.style.right = '';
              }
          };
          this.onMouseUp = (e) => {
              if (!this.isDragging)
                  return;
              this.isDragging = false;
              this.element.style.cursor = 'grab';
              document.body.style.userSelect = '';
              document.removeEventListener('mousemove', this.onMouseMove);
              document.removeEventListener('mouseup', this.onMouseUp);
              this.savePosition();
          };
          this.handleDeployedAppsIconClick = (e) => {
              e.stopPropagation();
              console.log('PABLO\'S DW CHAD: Deployed Apps Icon clicked.');
              if (!this.deployedAppsTool) {
                  console.log('PABLO\'S DW CHAD: Creating new DeployedAppsTool instance.');
                  this.deployedAppsTool = new DeployedAppsTool();
              }
              if (this.deployedAppsTool.isVisible()) {
                  console.log('PABLO\'S DW CHAD: DeployedAppsTool is visible, calling hide().');
                  this.deployedAppsTool.hide();
              }
              else {
                  console.log('PABLO\'S DW CHAD: DeployedAppsTool is hidden, calling show().');
                  this.deployedAppsTool.show();
              }
              this.isStickyHoverActive = false;
              this.hideToolIconsInstant();
          };
          this.element = document.createElement('div');
          this.element.className = 'pdwc-draggable-icon';
          const mainIconVisual = document.createElement('i');
          mainIconVisual.className = 'fas fa-tools';
          this.element.appendChild(mainIconVisual);
          this.element.title = "Pablo's DW Chad Tools";
          this.onSearchIconClick = onSearchClickCallback;
          this.onCodeIconClick = onCodeClickCallback;
          this.onContextIconClick = onContextClickCallback;
          this.clickHandler = mainIconClickHandler;
          this.toolIconsWrapper = document.createElement('div');
          this.toolIconsWrapper.className = 'pdwc-tool-icons-wrapper';
          this.toolIconsWrapper.style.display = 'none';
          // Search Icon
          this.searchToolIcon = document.createElement('div');
          this.searchToolIcon.className = 'pdwc-tool-icon pdwc-search-button';
          this.searchToolIcon.innerHTML = '<i class="fas fa-search"></i>';
          this.searchToolIcon.title = 'Open Search Tool';
          this.searchToolIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log("PABLO'S DW CHAD: Search icon clicked via DraggableIcon handler.");
              if (this.onSearchIconClick) {
                  this.onSearchIconClick();
              }
              this.isStickyHoverActive = false;
              this.hideToolIconsInstant();
          });
          // Code Icon
          this.codeToolIcon = document.createElement('div');
          this.codeToolIcon.className = 'pdwc-tool-icon pdwc-code-button';
          this.codeToolIcon.innerHTML = '<i class="fas fa-code"></i>';
          this.codeToolIcon.title = 'Open Code Tool';
          this.codeToolIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log("PABLO'S DW CHAD: Code icon clicked via DraggableIcon handler.");
              if (this.onCodeIconClick) {
                  this.onCodeIconClick();
              }
              this.isStickyHoverActive = false;
              this.hideToolIconsInstant();
          });
          // Context Retrieval Icon
          this.contextToolIcon = document.createElement('div');
          this.contextToolIcon.className = 'pdwc-tool-icon pdwc-context-button';
          this.contextToolIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor" style="vertical-align: middle;">
        <path d="M0 0h24v24H0V0z" fill="none"/>
        <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
      </svg>`;
          this.contextToolIcon.title = 'Open Context Retrieval Tool';
          this.contextToolIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log("PABLO'S DW CHAD: Context icon clicked via DraggableIcon handler.");
              if (this.onContextIconClick) {
                  this.onContextIconClick();
              }
              this.isStickyHoverActive = false;
              this.hideToolIconsInstant();
          });
          // Set Truncation Icon
          this.setTruncationIcon = document.createElement('div');
          this.setTruncationIcon.className = 'pdwc-tool-icon pdwc-truncate-button';
          this.setTruncationIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor" style="vertical-align: middle;">
        <path d="M0 0h24v24H0V0z" fill="none"/>
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>`;
          this.setTruncationIcon.title = 'Truncate Set';
          this.setTruncationIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              console.log("PABLO'S DW CHAD: Set Truncation icon clicked");
              if (!this.setTruncationTool) {
                  this.setTruncationTool = new SetTruncationTool();
              }
              this.setTruncationTool.toggle();
              this.isStickyHoverActive = false;
              this.hideToolIconsInstant();
          });
          // Deployed Apps Tool Icon
          this.deployedAppsToolIcon = document.createElement('div');
          this.deployedAppsToolIcon.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="table" class="svg-inline--fa fa-table fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64v-96h160v96zm0-160H64v-96h160v96zm224 160H288v-96h160v96zm0-160H288v-96h160v96z"></path></svg>`;
          this.deployedAppsToolIcon.classList.add('pdwc-tool-icon', 'pdwc-deployed-apps-button');
          this.deployedAppsToolIcon.title = 'Open Deployed Apps Tool';
          this.deployedAppsToolIcon.addEventListener('click', (e) => this.handleDeployedAppsIconClick(e));
          this.toolIconsWrapper.appendChild(this.searchToolIcon);
          this.toolIconsWrapper.appendChild(this.codeToolIcon);
          this.toolIconsWrapper.appendChild(this.contextToolIcon);
          this.toolIconsWrapper.appendChild(this.setTruncationIcon);
          this.toolIconsWrapper.appendChild(this.deployedAppsToolIcon);
          this.element.appendChild(this.toolIconsWrapper);
          this.loadPosition();
          this.initDrag();
          this.initClick();
          this.initHover();
      }
      initDrag() {
          this.element.addEventListener('mousedown', (e) => {
              if (e.button !== 0)
                  return;
              if (e.target.closest('.pdwc-tool-icon')) {
                  return;
              }
              if (this.toolIconsWrapper.style.display !== 'none') {
                  this.hideToolIconsInstant();
              }
              this.isDragging = true;
              this.offsetX = e.clientX - this.element.getBoundingClientRect().left;
              this.offsetY = e.clientY - this.element.getBoundingClientRect().top;
              this.element.style.cursor = 'grabbing';
              document.body.style.userSelect = 'none';
              document.addEventListener('mousemove', this.onMouseMove);
              document.addEventListener('mouseup', this.onMouseUp);
          });
      }
      initClick() {
          let dragThreshold = 5;
          let startX, startY;
          this.element.addEventListener('mousedown', (e) => {
              if (e.button !== 0)
                  return;
              if (e.target.closest('.pdwc-tool-icon')) {
                  return;
              }
              startX = e.clientX;
              startY = e.clientY;
          });
          this.element.addEventListener('mouseup', (e) => {
              if (e.button !== 0)
                  return;
              if (e.target.closest('.pdwc-tool-icon')) {
                  return;
              }
              const deltaX = Math.abs(e.clientX - startX);
              const deltaY = Math.abs(e.clientY - startY);
              if (deltaX < dragThreshold && deltaY < dragThreshold) {
                  this.isStickyHoverActive = !this.isStickyHoverActive;
                  if (this.isStickyHoverActive) {
                      this.showToolIcons();
                      if (this.hoverHideTimeout) {
                          clearTimeout(this.hoverHideTimeout);
                          this.hoverHideTimeout = null;
                      }
                  }
                  else {
                      this.hideToolIconsInstant();
                  }
              }
          });
      }
      onClick(handler) {
          this.clickHandler = handler;
      }
      savePosition() {
          this.element.getBoundingClientRect();
          const position = {
              left: this.element.style.left,
              top: this.element.style.top,
          };
          if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ 'pdwc-icon-position': position }, () => {
                  console.log(`PABLO'S DW CHAD: Icon position saved.`);
              });
          }
          else {
              localStorage.setItem('pdwc-icon-position', JSON.stringify(position));
          }
      }
      loadPosition() {
          const loadFromStorage = (storedPositionData) => {
              console.log(`PABLO'S DW CHAD: loadFromStorage called with:`, storedPositionData);
              let positionApplied = false;
              const iconWidth = 50;
              const iconHeight = 50;
              if (storedPositionData && typeof storedPositionData.left === 'string' && typeof storedPositionData.top === 'string') {
                  const parsedLeft = parseInt(storedPositionData.left, 10);
                  const parsedTop = parseInt(storedPositionData.top, 10);
                  console.log(`PABLO'S DW CHAD: Parsed - Left: ${parsedLeft}, Top: ${parsedTop}`);
                  if (!isNaN(parsedLeft) && !isNaN(parsedTop)) {
                      const constrainedLeft = Math.max(0, Math.min(parsedLeft, window.innerWidth - iconWidth));
                      const constrainedTop = Math.max(0, Math.min(parsedTop, window.innerHeight - iconHeight));
                      console.log(`PABLO'S DW CHAD: Constrained - Left: ${constrainedLeft}, Top: ${constrainedTop}`);
                      this.element.style.left = `${constrainedLeft}px`;
                      this.element.style.top = `${constrainedTop}px`;
                      this.element.style.bottom = '';
                      this.element.style.right = '';
                      positionApplied = true;
                      console.log(`PABLO'S DW CHAD: Applied stored constrained position.`);
                  }
              }
              if (!positionApplied) {
                  console.log(`PABLO'S DW CHAD: Applying default position (bottom-right).`);
                  this.element.style.bottom = '20px';
                  this.element.style.right = '20px';
                  this.element.style.left = '';
                  this.element.style.top = '';
              }
          };
          if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get('pdwc-icon-position', (result) => {
                  console.log(`PABLO'S DW CHAD: chrome.storage.local.get result for 'pdwc-icon-position':`, result);
                  const positionFromStorage = result['pdwc-icon-position'];
                  loadFromStorage(positionFromStorage);
                  console.log(`PABLO'S DW CHAD: Icon position loading initiated from chrome.storage.`);
              });
          }
          else {
              console.warn("PABLO'S DW CHAD: chrome.storage.local not available. Trying localStorage.");
              const storedPositionString = localStorage.getItem('pdwc-icon-position');
              if (storedPositionString) {
                  try {
                      console.log(`PABLO'S DW CHAD: localStorage item 'pdwc-icon-position':`, storedPositionString);
                      loadFromStorage(JSON.parse(storedPositionString));
                      console.log(`PABLO'S DW CHAD: Icon position loading initiated from localStorage.`);
                  }
                  catch (e) {
                      console.error(`PABLO'S DW CHAD: Error parsing icon position from localStorage.`, e);
                      loadFromStorage(null);
                  }
              }
              else {
                  console.log(`PABLO'S DW CHAD: No position found in localStorage. Applying default.`);
                  loadFromStorage(null);
              }
          }
      }
      initHover() {
          const showIcons = () => {
              if (this.hoverHideTimeout) {
                  clearTimeout(this.hoverHideTimeout);
                  this.hoverHideTimeout = null;
              }
              if (!this.isStickyHoverActive) {
                  this.showToolIcons();
              }
          };
          const startHideTimer = () => {
              if (!this.isStickyHoverActive) {
                  this.hoverHideTimeout = window.setTimeout(() => {
                      this.hideToolIcons();
                  }, 300);
              }
          };
          this.element.addEventListener('mouseenter', showIcons);
          this.element.addEventListener('mouseleave', startHideTimer);
          this.toolIconsWrapper.addEventListener('mouseenter', () => {
              if (this.hoverHideTimeout) {
                  clearTimeout(this.hoverHideTimeout);
                  this.hoverHideTimeout = null;
              }
          });
          this.toolIconsWrapper.addEventListener('mouseleave', startHideTimer);
      }
      showToolIcons() {
          this.toolIconsWrapper.style.display = 'flex';
      }
      hideToolIcons() {
          if (this.isStickyHoverActive)
              return;
          this.toolIconsWrapper.style.display = 'none';
      }
      hideToolIconsInstant() {
          this.toolIconsWrapper.style.display = 'none';
      }
      appendToBody() {
          document.body.appendChild(this.element);
      }
      getElement() {
          return this.element;
      }
      show() {
          this.element.style.display = 'flex';
      }
      hide() {
          this.element.style.display = 'none';
      }
  }

  // src/ui/ToolMenu.ts
  class ToolMenu {
      constructor(onToolSelectedCallback) {
          this.isVisible = false;
          this.onToolSelected = onToolSelectedCallback;
          this.element = document.createElement('div');
          this.element.className = 'pdwc-tool-menu';
          this.element.style.display = 'none'; // Initially hidden
          this.menuItems = [
              {
                  id: 'super-search',
                  label: 'Super Search',
                  iconClass: 'fas fa-search-location',
                  action: this.handleItemClick.bind(this),
              },
              // Add more tools here as needed
              // Example:
              // {
              //   id: 'settings',
              //   label: 'Settings',
              //   iconClass: 'fas fa-cog',
              //   action: this.handleItemClick.bind(this),
              // },
          ];
          this.renderMenu();
          this.addEventListeners();
      }
      renderMenu() {
          const ul = document.createElement('ul');
          this.menuItems.forEach((item) => {
              const li = document.createElement('li');
              const button = document.createElement('button');
              button.setAttribute('data-tool-id', item.id);
              button.innerHTML = `<i class="${item.iconClass}"></i> <span>${item.label}</span>`;
              button.addEventListener('click', () => item.action(item.id));
              li.appendChild(button);
              ul.appendChild(li);
          });
          this.element.innerHTML = ''; // Clear previous content
          this.element.appendChild(ul);
      }
      handleItemClick(toolId) {
          console.log(`ToolMenu: ${toolId} selected`);
          this.onToolSelected(toolId);
          this.hide(); // Hide menu after selection
      }
      addEventListeners() {
          // Close menu if clicked outside
          document.addEventListener('click', (event) => {
              if (!this.isVisible)
                  return;
              const target = event.target;
              // Check if the click is outside the menu and not on the draggable icon (let icon handle its own click)
              if (!this.element.contains(target) && !target.closest('.pdwc-draggable-icon')) {
                  this.hide();
              }
          });
      }
      toggle(x, y) {
          if (this.isVisible) {
              this.hide();
          }
          else {
              this.show(x, y);
          }
      }
      show(x, y) {
          this.element.style.display = 'block';
          this.isVisible = true;
          // Position the menu above and slightly to the left of the icon/coordinates
          const menuRect = this.element.getBoundingClientRect();
          let menuX = x;
          let menuY = y - menuRect.height - 10; // 10px buffer above icon
          // Adjust if menu goes off-screen
          if (menuY < 0) {
              menuY = y + 50 + 10; // Position below icon if no space above (icon height ~50px)
          }
          if (menuX + menuRect.width > window.innerWidth) {
              menuX = window.innerWidth - menuRect.width - 5; // Adjust if goes off right screen edge
          }
          if (menuX < 0) {
              menuX = 5; // Adjust if goes off left screen edge
          }
          this.element.style.left = `${menuX}px`;
          this.element.style.top = `${menuY}px`;
          console.log('ToolMenu shown at:', { x: menuX, y: menuY });
      }
      hide() {
          this.element.style.display = 'none';
          this.isVisible = false;
          console.log('ToolMenu hidden');
      }
      getElement() {
          return this.element;
      }
  }

  const DB_NAME = 'PablosDwChadCache';
  const DB_VERSION = 1;
  const STORE_NAME = 'dwMetadata';
  let dbPromise = null;
  function openDB() {
      if (dbPromise) {
          return dbPromise;
      }
      dbPromise = new Promise((resolve, reject) => {
          if (!window.indexedDB) {
              console.error("PABLO'S DW CHAD: IndexedDB not supported by this browser.");
              reject(new Error('IndexedDB not supported'));
              return;
          }
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(STORE_NAME)) {
                  db.createObjectStore(STORE_NAME, { keyPath: 'baseUrl' });
              }
          };
          request.onsuccess = (event) => {
              resolve(event.target.result);
          };
          request.onerror = (event) => {
              console.error("PABLO'S DW CHAD: IndexedDB error:", event.target.error);
              reject(event.target.error);
              dbPromise = null; // Reset promise on error
          };
          request.onblocked = () => {
              console.warn("PABLO'S DW CHAD: IndexedDB open request blocked. Please close other tabs using the database.");
              // We are not rejecting here, to allow the browser to resolve it if other tabs are closed.
          };
      });
      return dbPromise;
  }
  async function saveDataToCache(baseUrl, attributes, sets, linkTypes) {
      try {
          const db = await openDB();
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const dataToCache = {
              baseUrl,
              attributes,
              sets,
              linkTypes: linkTypes,
              timestamp: Date.now(),
          };
          const request = store.put(dataToCache);
          return new Promise((resolve, reject) => {
              request.onsuccess = () => {
                  resolve();
              };
              request.onerror = (event) => {
                  console.error(`PABLO'S DW CHAD: Error in store.put for ${baseUrl}:`, event.target.error);
                  reject(event.target.error);
              };
              transaction.oncomplete = () => {
                  console.log(`PABLO'S DW CHAD: Data successfully cached for ${baseUrl} at ${new Date(dataToCache.timestamp).toLocaleString()}`);
              };
              transaction.onerror = (event) => {
                  console.error(`PABLO'S DW CHAD: Error in cache save transaction for ${baseUrl}:`, event.target.error);
                  // Ensure rejection if not already handled by request.onerror
                  // Note: if request.onerror fired, this might be redundant or too late.
                  if (!event.target.error?.message.includes('Transaction aborted')) { // Avoid double rejection for same root cause if possible
                      reject(event.target.error);
                  }
              };
          });
      }
      catch (error) {
          console.error(`PABLO'S DW CHAD: Failed to initiate save data to cache for ${baseUrl}:`, error);
          throw error;
      }
  }
  async function loadDataFromCache(baseUrl) {
      try {
          const db = await openDB();
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(baseUrl);
          return new Promise((resolve, reject) => {
              request.onsuccess = (event) => {
                  const result = event.target.result;
                  if (result) {
                      console.log(`PABLO'S DW CHAD: Data loaded from cache for ${baseUrl} (timestamp: ${new Date(result.timestamp).toLocaleString()})`);
                      resolve(result);
                  }
                  else {
                      console.log(`PABLO'S DW CHAD: No data in cache for ${baseUrl}`);
                      resolve(null);
                  }
              };
              request.onerror = (event) => {
                  console.error(`PABLO'S DW CHAD: Error loading data from cache for ${baseUrl}:`, event.target.error);
                  reject(event.target.error);
              };
          });
      }
      catch (error) {
          console.error(`PABLO'S DW CHAD: Failed to initiate load data from cache for ${baseUrl}:`, error);
          return null;
      }
  }

  // src/ui/SuperSearch.ts
  const MAX_RESULTS_DISPLAY = 100;
  const RESULTS_PER_PAGE = 20;
  const MAX_HISTORY_ITEMS = 10;
  class SuperSearch {
      // Attempting to break build cache with this comment
      constructor(dwBaseUrl) {
          this.currentQuery = { term: '', limit: RESULTS_PER_PAGE, offset: 0 };
          this.currentResults = [];
          this.totalResults = 0;
          this.currentPage = 1;
          this.isLoading = false;
          this.searchHistory = [];
          // New members for holding fetched data
          this.allAttributes = [];
          this.allSets = [];
          this.allLinkTypes = []; // New property for link types
          this.dataLoaded = false;
          // New member for search type filter
          this.searchFilterType = 'all'; // Added 'links'
          // Added for cache
          this.cacheTimestamp = null;
          this.isDataFromCache = false;
          this.dwApiToken = null; // dwApiToken is loaded from storage in initializeData
          this.baseUrl = dwBaseUrl;
          // this.dwApiToken = dwApiToken; // Removed: dwApiToken is not set from constructor
          this.element = document.createElement('div');
          this.element.className = 'pdwc-modal pdwc-super-search-modal';
          this.element.style.display = 'none'; // Hidden by default
          // Attach instance to the element for easier retrieval if needed (e.g., by content_script)
          this.element.__SUPER_SEARCH_INSTANCE__ = this;
          this.loadSearchHistory();
          this.render();
          this.attachEventListeners();
          this.initializeData(); // Initialize data on construction
      }
      render() {
          this.element.innerHTML = `
      <style>
        /* Component-specific styles */
        .pdwc-super-search-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 20px;
          gap: 10px;
        }
        
        .pdwc-search-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .pdwc-search-container {
          flex: 1;
          position: relative;
        }
        
        .pdwc-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          height: 36px;
          box-sizing: border-box;
        }
        
        .pdwc-controls-right {
          display: flex;
          gap: 8px;
        }
        
        .pdwc-filter-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          height: 36px;
          white-space: nowrap;
        }
        
        .pdwc-filter-button:hover {
          background: #e9ecef;
        }
        
        .pdwc-filter-button svg {
          width: 16px;
          height: 16px;
        }
        .pdwc-super-search-results-area {
          margin-top: 15px;
          border: 1px solid #ddd;
          min-height: 50px; /* Ensure it's visible even when empty */
          max-height: 350px; /* Or your preferred height */
          overflow-y: auto; /* Enable vertical scroll if content overflows */
          padding: 5px;
          background-color: #fff;
          flex-grow: 1;
        }
        .pdwc-primary-btn,
        .pdwc-secondary-btn {
          /* ... existing styles ... */
        }
        .pdwc-search-filter-group label {
          margin-right: 10px;
        }
        .pdwc-super-search-detail-view {
          display: none; /* Hidden by default */
          position: fixed; /* Or absolute, depending on desired behavior */
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 700px;
          max-height: 80vh;
          background-color: white;
          border: 1px solid #ccc;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          padding: 20px;
          z-index: 1001; /* Ensure it's above other content */
          overflow-y: auto;
        }
        .pdwc-detail-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .pdwc-detail-view-header h3 {
          margin: 0;
        }
        .pdwc-detail-view-close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        #relatedAttributesSection h4 {
          font-size: 1.1em; /* Slightly larger font */
          font-weight: bold; /* Bold heading */
          margin-top: 20px; /* Add some space above the heading */
          margin-bottom: 10px;
        }
        #relatedAttributesList li {
          padding: 3px 0; /* Add a little padding to list items */
        }
        .pdwc-copy-btn {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          margin-left: 8px;
          font-size: 0.9em;
        }
        .pdwc-copy-btn:hover {
          color: #0056b3;
        }
        .pdwc-copy-btn .fas.fa-check {
          color: green;
        }
      </style>
      <div class="pdwc-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0;"><i class="fas fa-search-location"></i> Super Search</h2>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="pdwc-feedback-button" title="Report an issue" style="background: none; border: none; color: #f2f2f7; font-size: 16px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;" id="pdwc-super-search-feedback-btn">🐞</button>
          <button class="pdwc-modal-close-btn" title="Close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; ">&times;</button>
        </div>
      </div>
      <div class="pdwc-super-search-container">
        <div class="pdwc-search-controls">
          <div class="pdwc-search-container">
            <input type="search" id="pdwc-super-search-input" list="pdwc-search-history" class="pdwc-search-input" placeholder="Search...">
            <datalist id="pdwc-search-history"></datalist>
          </div>
          <div class="pdwc-controls-right">
            <button class="pdwc-filter-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
              </svg>
              Filters
            </button>
          </div>
        </div>
        <div class="pdwc-form-group pdwc-search-filter-group">
          <label>Filter by type:</label>
          <label><input type="radio" name="pdwc-search-filter" value="all" checked> All</label>
          <label><input type="radio" name="pdwc-search-filter" value="attributes"> Attributes</label>
          <label><input type="radio" name="pdwc-search-filter" value="sets"> Sets</label>
          <label><input type="radio" name="pdwc-search-filter" value="links"> Links</label>
        </div>
        <div class="pdwc-super-search-results-area">
          <!-- Results will be shown here -->
        </div>
        <div class="pdwc-super-search-detail-view">
          <!-- Detail view will be dynamically populated here -->
        </div>
        <div class="cache-status-display" style="font-size: 0.8em; margin-top: 5px; color: #555;"></div>
      </div>
    `;
          this.searchInput = this.element.querySelector('#pdwc-super-search-input');
          this.datalistElement = this.element.querySelector('#pdwc-search-history');
          this.resultsContainer = this.element.querySelector('.pdwc-super-search-results-area');
          this.detailViewContainer = this.element.querySelector('.pdwc-super-search-detail-view');
          this.updateSearchHistoryDatalist();
          // Get references to filter radio buttons
          this.filterAllRadio = this.element.querySelector('input[name="pdwc-search-filter"][value="all"]');
          this.filterAttributesRadio = this.element.querySelector('input[name="pdwc-search-filter"][value="attributes"]');
          this.filterSetsRadio = this.element.querySelector('input[name="pdwc-search-filter"][value="sets"]');
          this.filterLinksRadio = this.element.querySelector('input[name="pdwc-search-filter"][value="links"]'); // Initialize Links radio button
          this.attachDetailViewCopyListeners(); // Attach listener after container is defined
      }
      renderSearchControls() {
          const controls = document.createElement('div');
          controls.className = 'pdwc-search-controls';
          const searchContainer = document.createElement('div');
          searchContainer.className = 'pdwc-search-container';
          const searchInput = document.createElement('input');
          searchInput.type = 'text';
          searchInput.placeholder = 'Search...';
          searchInput.className = 'pdwc-search-input';
          searchInput.value = this.currentQuery.term || '';
          searchInput.addEventListener('input', (e) => {
              this.currentQuery.term = e.target.value;
              this.performSearch();
          });
          const filterButton = document.createElement('button');
          filterButton.className = 'pdwc-filter-button';
          filterButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
      </svg>
      Filters
    `;
          filterButton.addEventListener('click', () => this.showFilterDialog());
          const controlsRight = document.createElement('div');
          controlsRight.className = 'pdwc-controls-right';
          controlsRight.appendChild(filterButton);
          searchContainer.appendChild(searchInput);
          controls.appendChild(searchContainer);
          controls.appendChild(controlsRight);
          // Add some styles
          const style = document.createElement('style');
          style.textContent = `
      .pdwc-search-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
      }
      .pdwc-search-container {
        flex: 1;
        position: relative;
      }
      .pdwc-search-input {
        width: 100%;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }
      .pdwc-controls-right {
        display: flex;
        gap: 0.5rem;
      }
      .pdwc-filter-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        color: #495057;
      }
      .pdwc-filter-button:hover {
        background: #e9ecef;
      }
      .pdwc-filter-button svg {
        width: 16px;
        height: 16px;
      }
    `;
          controls.appendChild(style);
          return controls;
      }
      attachEventListeners() {
          const closeButton = this.element.querySelector('.pdwc-modal-close-btn');
          closeButton?.addEventListener('click', () => this.close());
          // Add event listener for the feedback button
          const feedbackButton = this.element.querySelector('#pdwc-super-search-feedback-btn');
          if (feedbackButton) {
              feedbackButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                      openGitHubIssue('Super Search');
                      // Add visual feedback
                      const originalHTML = feedbackButton.innerHTML;
                      const originalTitle = feedbackButton.getAttribute('title') || '';
                      feedbackButton.innerHTML = '✓';
                      feedbackButton.setAttribute('title', 'Thanks for your feedback!');
                      setTimeout(() => {
                          feedbackButton.innerHTML = originalHTML;
                          feedbackButton.setAttribute('title', originalTitle);
                      }, 2000);
                  }
                  catch (error) {
                      console.error('Error opening feedback:', error);
                      const originalHTML = feedbackButton.innerHTML;
                      feedbackButton.innerHTML = '!';
                      feedbackButton.setAttribute('title', 'Failed to open feedback');
                      setTimeout(() => {
                          feedbackButton.innerHTML = originalHTML;
                          feedbackButton.setAttribute('title', 'Report an issue');
                      }, 2000);
                  }
              });
          }
          // Add event listener for the filter button
          const filterButton = this.element.querySelector('.pdwc-filter-button');
          if (filterButton) {
              filterButton.addEventListener('click', () => this.showFilterDialog());
          }
          // Handle search input changes
          this.searchInput.addEventListener('input', (e) => {
              this.currentQuery.term = e.target.value;
              this.currentQuery.offset = 0;
              this.currentPage = 1;
              this.performSearch();
          });
          this.searchInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                  this.currentQuery.term = this.searchInput.value.trim();
                  this.currentQuery.offset = 0;
                  this.currentPage = 1;
                  this.performSearch();
              }
          });
          // Add event listeners for filter radio buttons
          this.filterAllRadio.addEventListener('change', () => {
              if (this.filterAllRadio.checked) {
                  this.searchFilterType = 'all';
                  this.performSearch(); // Re-run search with new filter
              }
          });
          this.filterAttributesRadio.addEventListener('change', () => {
              if (this.filterAttributesRadio.checked) {
                  this.searchFilterType = 'attributes';
                  this.performSearch(); // Re-run search with new filter
              }
          });
          this.filterSetsRadio.addEventListener('change', () => {
              if (this.filterSetsRadio.checked) {
                  this.searchFilterType = 'sets';
                  this.performSearch(); // Re-run search with new filter
              }
          });
          this.filterLinksRadio.addEventListener('change', () => {
              if (this.filterLinksRadio.checked) {
                  this.searchFilterType = 'links';
                  this.performSearch(); // Re-run search with new filter
              }
          });
          // Initial call to update cache display (if needed, though initializeData also calls it)
          this.updateCacheStatusDisplay();
      }
      updateSearchHistoryDatalist() {
          this.datalistElement.innerHTML = '';
          this.searchHistory.forEach(term => {
              const option = document.createElement('option');
              option.value = term;
              this.datalistElement.appendChild(option);
          });
      }
      addToSearchHistory(term) {
          if (!term)
              return;
          this.searchHistory = [term, ...this.searchHistory.filter(t => t !== term)].slice(0, MAX_HISTORY_ITEMS);
          this.updateSearchHistoryDatalist();
          this.saveSearchHistory();
      }
      saveSearchHistory() {
          if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ 'pdwc-search-history': this.searchHistory });
          }
      }
      loadSearchHistory() {
          if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get('pdwc-search-history', (result) => {
                  if (result['pdwc-search-history'] && Array.isArray(result['pdwc-search-history'])) {
                      this.searchHistory = result['pdwc-search-history'];
                      this.updateSearchHistoryDatalist();
                  }
              });
          }
      }
      // New method to load initial data from API
      async initializeData() {
          console.log("PABLO'S DW CHAD: SuperSearch initializing data...");
          this.isLoading = true;
          this.renderLoading(true);
          this.renderResultsMessage('<div class="pdwc-loading-spinner-container"><div class="pdwc-loading-spinner"></div>Loading metadata...</div>', true);
          try {
              // Try to load from cache first
              if (this.baseUrl) {
                  const cached = await loadDataFromCache(this.baseUrl);
                  if (cached) {
                      this.allAttributes = cached.attributes;
                      this.allSets = cached.sets;
                      this.allLinkTypes = cached.linkTypes || []; // Load linkTypes from cache
                      this.cacheTimestamp = cached.timestamp;
                      this.isDataFromCache = true;
                      this.dataLoaded = true; // <--- SET DATA LOADED TO TRUE
                      console.log(`PABLO'S DW CHAD: SuperSearch initialized with data from cache (timestamp: ${new Date(cached.timestamp).toLocaleString()}).`);
                      this.updateCacheStatusDisplay();
                      this.renderLoading(false);
                      this.renderResultsMessage('data loaded from cache', false);
                      this.performSearch(true);
                      return; // Data loaded from cache, no need to fetch from API
                  }
              }
              // If no cache or baseUrl not set for cache, fetch from API
              this.isDataFromCache = false;
              console.log("PABLO'S DW CHAD: No cache found or applicable, fetching fresh data for SuperSearch.");
              const [attributes, sets] = await Promise.all([
                  fetchAttributes(this.baseUrl), // Reverted: dwApiToken removed
                  fetchSets(this.baseUrl) // Reverted: dwApiToken removed
              ]);
              this.allAttributes = attributes;
              this.allSets = sets;
              this.allLinkTypes = []; // Reset before fetching
              // Fetch LinkTypes in batches
              if (this.allSets.length > 0) {
                  console.log(`PABLO'S DW CHAD: Found ${this.allSets.length} sets. Fetching link types in batches.`);
                  const setIds = this.allSets.map(set => set.id); // Assuming 'id' is the property for set ID
                  const batchSize = 50;
                  for (let i = 0; i < setIds.length; i += batchSize) {
                      const batchOfSetIds = setIds.slice(i, i + batchSize);
                      try {
                          console.log(`PABLO'S DW CHAD: Fetching link types for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(setIds.length / batchSize)} (Set IDs: ${batchOfSetIds.join(', ')})`);
                          const fetchedLinkTypes = await fetchLinkTypesByClassIds(this.baseUrl, batchOfSetIds);
                          this.allLinkTypes.push(...fetchedLinkTypes);
                          console.log(`PABLO'S DW CHAD: Fetched ${fetchedLinkTypes.length} link types in this batch. Total link types: ${this.allLinkTypes.length}`);
                      }
                      catch (linkFetchError) {
                          console.error(`PABLO'S DW CHAD: Error fetching batch of link types for set IDs ${batchOfSetIds.join(', ')}:`, linkFetchError);
                          // Optionally, decide if one batch failure should stop all or just skip
                      }
                  }
                  console.log(`PABLO'S DW CHAD: Finished fetching all link types. Total: ${this.allLinkTypes.length}`);
              }
              if (this.baseUrl) {
                  try {
                      await saveDataToCache(this.baseUrl, this.allAttributes, this.allSets, this.allLinkTypes); // Pass linkTypes to cache
                      this.cacheTimestamp = Date.now(); // Set current time as cache time
                      this.dataLoaded = true; // <--- SET DATA LOADED TO TRUE
                      console.log("PABLO'S DW CHAD: Fresh data fetched and saved to cache for SuperSearch.");
                  }
                  catch (cacheError) {
                      console.error("PABLO'S DW CHAD: Failed to save fetched data to cache:", cacheError);
                      // Continue without cache, data is still loaded in memory for the session
                      this.dataLoaded = true; // <--- SET DATA LOADED TO TRUE (even if cache save fails, data is in memory)
                  }
              }
              this.updateCacheStatusDisplay();
          }
          catch (error) {
              console.error("PABLO'S DW CHAD: SuperSearch failed to initialize data:", error);
              this.renderResultsMessage('Error loading metadata. Please try again later or check console.', false);
          }
          finally {
              this.isLoading = false;
              // this.dataLoaded should be true if successful, or false if error occurred before data assignment
              this.renderLoading(false);
          }
      }
      /**
       * Checks if an object matches all nested property filters
       * Handles boolean values, optional properties, and various match types
       */
      matchesNestedFilters(obj, filters = []) {
          if (!filters.length)
              return true;
          return filters.every(filter => {
              try {
                  // Handle special case for checking property existence
                  if (filter.path.endsWith('?') || filter.matchType === 'exists') {
                      const path = filter.path.endsWith('?') ? filter.path.slice(0, -1) : filter.path;
                      const exists = this.checkPropertyExists(obj, path);
                      // If checking for existence, treat any non-empty string as true
                      const shouldExist = filter.value.toLowerCase() === 'true' || filter.value === '1' || filter.value.toLowerCase() === 'yes';
                      return exists === shouldExist;
                  }
                  // Get value using dot notation path
                  const value = this.getNestedValue(obj, filter.path);
                  // Handle undefined/null values
                  if (value === undefined || value === null) {
                      // If the filter value is 'null' or 'undefined', check for explicit null/undefined
                      const normalizedFilterValue = filter.value.toLowerCase().trim();
                      if (normalizedFilterValue === 'null' || normalizedFilterValue === 'undefined') {
                          return value === null || value === undefined;
                      }
                      return false; // Property doesn't exist or is null/undefined
                  }
                  // Handle boolean values
                  if (typeof value === 'boolean') {
                      const boolValue = this.parseBoolean(filter.value);
                      return boolValue !== null ? value === boolValue : false;
                  }
                  // Handle string/number comparisons
                  const searchValue = filter.caseSensitive ? filter.value : filter.value.toLowerCase();
                  const targetValue = typeof value === 'string'
                      ? (filter.caseSensitive ? value : value.toLowerCase())
                      : String(value);
                  // Special handling for match types
                  switch (filter.matchType) {
                      case 'exact':
                          return targetValue === searchValue;
                      case 'startsWith':
                          return targetValue.startsWith(searchValue);
                      case 'endsWith':
                          return targetValue.endsWith(searchValue);
                      case 'regex':
                          const regex = new RegExp(searchValue, filter.caseSensitive ? '' : 'i');
                          return regex.test(String(value));
                      case 'gt':
                          return !isNaN(Number(value)) && !isNaN(Number(searchValue)) && Number(value) > Number(searchValue);
                      case 'lt':
                          return !isNaN(Number(value)) && !isNaN(Number(searchValue)) && Number(value) < Number(searchValue);
                      case 'gte':
                          return !isNaN(Number(value)) && !isNaN(Number(searchValue)) && Number(value) >= Number(searchValue);
                      case 'lte':
                          return !isNaN(Number(value)) && !isNaN(Number(searchValue)) && Number(value) <= Number(searchValue);
                      case 'contains':
                      default:
                          return targetValue.includes(searchValue);
                  }
              }
              catch (e) {
                  console.warn('Error evaluating nested filter:', e, { filter, obj });
                  return false;
              }
          });
      }
      /**
       * Helper to safely get nested property value using dot notation
       */
      getNestedValue(obj, path) {
          return path.split('.').reduce((o, key) => o !== null && typeof o === 'object' && key in o
              ? o[key]
              : undefined, obj);
      }
      /**
       * Check if a property exists in the object (supports dot notation)
       */
      checkPropertyExists(obj, path) {
          try {
              const value = this.getNestedValue(obj, path);
              return value !== undefined && value !== null;
          }
          catch (e) {
              return false;
          }
      }
      /**
       * Parse string representations of boolean values
       */
      parseBoolean(value) {
          if (!value)
              return null;
          const lower = value.toLowerCase().trim();
          if (['true', 'yes', '1', 'on'].includes(lower))
              return true;
          if (['false', 'no', '0', 'off'].includes(lower))
              return false;
          return null; // Not a recognized boolean value
      }
      /**
       * Extract filterable properties from the data
       */
      getFilterableProperties() {
          const attributeProperties = [
              { path: 'name', label: 'Name', type: 'string' },
              { path: 'id', label: 'ID', type: 'string' },
              { path: 'dataType', label: 'Data Type', type: 'string', options: ['string', 'number', 'boolean', 'date'] },
              { path: 'isIndexed', label: 'Is Indexed', type: 'boolean' },
              { path: 'isSystem', label: 'Is System', type: 'boolean' },
          ];
          const setProperties = [
              { path: 'name', label: 'Name', type: 'string' },
              { path: 'id', label: 'ID', type: 'string' },
              { path: 'description', label: 'Description', type: 'string' },
              { path: 'core', label: 'Is Core', type: 'boolean' },
              { path: 'isHidden', label: 'Is Hidden', type: 'boolean' },
          ];
          const linkProperties = [
              { path: 'name', label: 'Name', type: 'string' },
              { path: 'id', label: 'ID', type: 'string' },
              { path: 'sourceCollectionId', label: 'Source Collection ID', type: 'string' },
              { path: 'targetCollectionId', label: 'Target Collection ID', type: 'string' },
              { path: 'directed', label: 'Is Directed', type: 'boolean' },
              { path: 'core', label: 'Is Core', type: 'boolean' },
              { path: 'config.type', label: 'Link Type', type: 'string' },
          ];
          return [
              {
                  id: 'attributes',
                  label: 'Attributes',
                  type: 'attributes',
                  properties: attributeProperties,
              },
              {
                  id: 'sets',
                  label: 'Sets',
                  type: 'sets',
                  properties: setProperties,
              },
              {
                  id: 'links',
                  label: 'Links',
                  type: 'links',
                  properties: linkProperties,
              },
          ];
      }
      /**
       * Show the filter dialog
       */
      showFilterDialog() {
          const filterGroups = this.getFilterableProperties();
          const currentFilters = this.currentQuery.nestedFilters || [];
          const dialog = document.createElement('div');
          dialog.className = 'pdwc-filter-dialog';
          dialog.innerHTML = `
      <style>
        .pdwc-filter-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 80%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          z-index: 10001;
          overflow: hidden;
        }
        .pdwc-filter-dialog-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pdwc-filter-dialog-title {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 500;
        }
        .pdwc-filter-dialog-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
        }
        .pdwc-filter-dialog-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        .pdwc-filter-group {
          margin-bottom: 24px;
        }
        .pdwc-filter-group-title {
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .pdwc-filter-property {
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
        }
        .pdwc-filter-property-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .pdwc-filter-property-name {
          font-weight: 500;
        }
        .pdwc-filter-property-controls {
          display: flex;
          gap: 8px;
        }
        .pdwc-filter-property-body {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e9ecef;
        }
        .pdwc-filter-dialog-footer {
          padding: 16px 20px;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .pdwc-tabs {
          display: flex;
          border-bottom: 1px solid #e9ecef;
          padding: 0 20px;
        }
        .pdwc-tab {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .pdwc-tab.active {
          border-bottom-color: #4a6cf7;
          color: #4a6cf7;
          font-weight: 500;
        }
        .pdwc-tab-content {
          display: none;
        }
        .pdwc-tab-content.active {
          display: block;
        }
      </style>
      <div class="pdwc-filter-dialog-header">
        <h3 class="pdwc-filter-dialog-title">Advanced Filters</h3>
        <button class="pdwc-filter-dialog-close">&times;</button>
      </div>
      <div class="pdwc-tabs">
        ${filterGroups.map(group => `
          <div class="pdwc-tab ${group.type === 'attributes' ? 'active' : ''}" data-tab="${group.id}">
            ${group.label}
          </div>
        `).join('')}
      </div>
      <div class="pdwc-filter-dialog-body">
        ${filterGroups.map(group => `
          <div class="pdwc-tab-content ${group.type === 'attributes' ? 'active' : ''}" data-tab-content="${group.id}">
            <h4 class="pdwc-filter-group-title">${group.label} Properties</h4>
            <div class="pdwc-filter-group">
              ${group.properties.map(prop => {
            const filterExists = currentFilters.some(f => f.path === prop.path && f.type === group.type);
            const currentFilter = currentFilters.find(f => f.path === prop.path && f.type === group.type);
            return `
                  <div class="pdwc-filter-property">
                    <div class="pdwc-filter-property-header">
                      <div class="pdwc-filter-property-name">${prop.label}</div>
                      <div class="pdwc-filter-property-controls">
                        <select class="pdwc-filter-operator" data-path="${prop.path}" data-type="${group.type}">
                          <option value="" ${!filterExists ? 'selected' : ''}>No filter</option>
                          <option value="equals" ${currentFilter?.matchType === 'exact' ? 'selected' : ''}>Equals</option>
                          <option value="contains" ${!currentFilter?.matchType || currentFilter?.matchType === 'contains' ? 'selected' : ''}>Contains</option>
                          ${prop.type === 'number' ? `
                            <option value="gt" ${currentFilter?.matchType === 'gt' ? 'selected' : ''}>Greater than</option>
                            <option value="lt" ${currentFilter?.matchType === 'lt' ? 'selected' : ''}>Less than</option>
                          ` : ''}
                          <option value="exists" ${currentFilter?.matchType === 'exists' ? 'selected' : ''}>Exists</option>
                        </select>
                        ${filterExists ? `
                          <input type="text" 
                                 class="pdwc-filter-value" 
                                 data-path="${prop.path}" 
                                 data-type="${group.type}" 
                                 value="${currentFilter?.value || ''}"
                                 placeholder="Value..." />
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="pdwc-filter-dialog-footer">
        <button class="pdwc-secondary-btn" id="pdwc-filter-clear">Clear All</button>
        <button class="pdwc-primary-btn" id="pdwc-filter-apply">Apply Filters</button>
      </div>
    `;
          // Add tab switching
          const tabs = dialog.querySelectorAll('.pdwc-tab');
          if (tabs) {
              tabs.forEach(tab => {
                  tab.addEventListener('click', () => {
                      // Remove active class from all tabs and contents
                      dialog.querySelectorAll('.pdwc-tab').forEach((t) => t.classList.remove('active'));
                      dialog.querySelectorAll('.pdwc-tab-content').forEach((c) => c.classList.remove('active'));
                      // Add active class to clicked tab and corresponding content
                      const tabId = tab.getAttribute('data-tab');
                      if (tabId) {
                          tab.classList.add('active');
                          const content = dialog.querySelector(`.pdwc-tab-content[data-tab-content="${tabId}"]`);
                          if (content) {
                              content.classList.add('active');
                          }
                      }
                  });
              });
          }
          // Handle operator changes
          const operatorSelects = dialog.querySelectorAll('.pdwc-filter-operator');
          operatorSelects.forEach(select => {
              select.addEventListener('change', (e) => {
                  const target = e.target;
                  const propertyEl = target.closest('.pdwc-filter-property');
                  if (!propertyEl)
                      return;
                  const valueInput = propertyEl.querySelector('.pdwc-filter-value');
                  if (target.value) {
                      if (!valueInput) {
                          const input = document.createElement('input');
                          input.type = 'text';
                          input.className = 'pdwc-filter-value';
                          const path = target.getAttribute('data-path');
                          const type = target.getAttribute('data-type');
                          if (path)
                              input.setAttribute('data-path', path);
                          if (type)
                              input.setAttribute('data-type', type);
                          input.placeholder = 'Value...';
                          const parent = target.parentNode;
                          if (parent) {
                              parent.appendChild(input);
                          }
                      }
                  }
                  else if (valueInput) {
                      valueInput.remove();
                  }
              });
          });
          // Handle apply button
          const applyButton = dialog.querySelector('#pdwc-filter-apply');
          if (applyButton) {
              applyButton.addEventListener('click', () => {
                  const filters = [];
                  const operatorSelects = dialog.querySelectorAll('.pdwc-filter-operator');
                  operatorSelects.forEach(select => {
                      if (select.value) {
                          const path = select.getAttribute('data-path');
                          const type = select.getAttribute('data-type');
                          const valueInput = select.parentElement?.querySelector('.pdwc-filter-value');
                          if (!path || !type)
                              return;
                          if (select.value === 'exists') {
                              filters.push({
                                  path: path + '?',
                                  value: 'true',
                                  matchType: 'exists',
                                  type: type
                              });
                          }
                          else if (valueInput) {
                              filters.push({
                                  path,
                                  value: valueInput.value,
                                  matchType: select.value,
                                  type: type
                              });
                          }
                      }
                  });
                  this.currentQuery.nestedFilters = filters;
                  this.performSearch();
                  dialog.remove();
              });
          }
          // Handle clear button
          const clearButton = dialog.querySelector('#pdwc-filter-clear');
          if (clearButton) {
              clearButton.addEventListener('click', () => {
                  this.currentQuery.nestedFilters = [];
                  this.performSearch();
                  dialog.remove();
              });
          }
          // Handle close button
          const closeButton = dialog.querySelector('.pdwc-filter-dialog-close');
          if (closeButton) {
              closeButton.addEventListener('click', () => {
                  dialog.remove();
              });
          }
          // Add to DOM
          document.body.appendChild(dialog);
      }
      async performSearch(isPaginating = false) {
          if (this.isLoading)
              return; // Don't search if initial data is still loading
          if (!this.dataLoaded) {
              this.renderResultsMessage('Metadata not yet loaded. Please wait.', false);
              return;
          }
          if (!this.currentQuery.term && !isPaginating && !this.currentQuery.nestedFilters?.length) {
              this.renderResultsMessage('Please enter a search term or apply filters.');
              return;
          }
          this.isLoading = true;
          this.renderLoading(true);
          if (this.currentQuery.term) {
              this.addToSearchHistory(this.currentQuery.term);
          }
          // Simulate async operation for consistency, actual filtering is sync
          await new Promise(resolve => setTimeout(resolve, 50));
          try {
              const queryTermLower = this.currentQuery.term?.toLowerCase() || '';
              let combinedResults = [];
              // Helper function to check if an item matches the search term
              const matchesSearchTerm = (item, searchTerm) => {
                  if (!searchTerm)
                      return true;
                  return (item.name?.toLowerCase().includes(searchTerm) ||
                      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                      item.id.toString().toLowerCase().includes(searchTerm));
              };
              if (this.searchFilterType === 'all' || this.searchFilterType === 'attributes') {
                  const matchedAttributes = this.allAttributes.filter(attr => matchesSearchTerm(attr, queryTermLower) &&
                      this.matchesNestedFilters(attr, this.currentQuery.nestedFilters));
                  combinedResults.push(...matchedAttributes.map((attr) => ({
                      id: attr.id.toString(),
                      type: 'Attribute',
                      label: attr.name,
                      properties: {
                          description: attr.description || '',
                          dataType: attr.dataType,
                          originalData: attr
                      }
                  })));
              }
              if (this.searchFilterType === 'all' || this.searchFilterType === 'sets') {
                  const matchedSets = this.allSets.filter(set => matchesSearchTerm(set, queryTermLower) &&
                      this.matchesNestedFilters(set, this.currentQuery.nestedFilters));
                  combinedResults.push(...matchedSets.map((set) => ({
                      id: set.id.toString(),
                      type: 'Set',
                      label: set.name,
                      properties: {
                          description: set.description || '',
                          isCore: set.core,
                          isHidden: set.isHidden,
                          originalData: set
                      }
                  })));
              }
              if (this.searchFilterType === 'all' || this.searchFilterType === 'links') {
                  const matchedLinkTypes = this.allLinkTypes.filter(link => (queryTermLower ? (link.name.toLowerCase().includes(queryTermLower) ||
                      link.id.toString().toLowerCase().includes(queryTermLower)) : true) &&
                      this.matchesNestedFilters(link, this.currentQuery.nestedFilters));
                  combinedResults.push(...matchedLinkTypes.map((link) => {
                      const description = `Source: ${link.sourceCollectionId}, Target: ${link.targetCollectionId}`;
                      return {
                          id: link.id.toString(),
                          type: 'LinkType',
                          label: link.name,
                          properties: {
                              description: description,
                              originalData: link
                          }
                      };
                  }));
              }
              // Sort results (e.g., by label)
              combinedResults.sort((a, b) => a.label.localeCompare(b.label));
              this.totalResults = combinedResults.length;
              const offset = this.currentQuery.offset || 0;
              const limit = this.currentQuery.limit || RESULTS_PER_PAGE;
              this.currentResults = combinedResults.slice(offset, offset + limit);
              this.renderResults();
          }
          catch (error) {
              console.error("PABLO'S DW CHAD: Error during SuperSearch performSearch:", error);
              this.renderResultsMessage('An error occurred during search.', false);
          }
          finally {
              this.isLoading = false;
              this.renderLoading(false);
          }
      }
      renderLoading(show) {
          let loadingElement = this.resultsContainer.querySelector('.pdwc-loading-indicator');
          if (show) {
              if (!loadingElement) {
                  loadingElement = document.createElement('div');
                  loadingElement.className = 'pdwc-loading-indicator';
                  loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading results...';
                  // Prepend to keep existing results visible during pagination loading
                  if (this.resultsContainer.firstChild) {
                      this.resultsContainer.insertBefore(loadingElement, this.resultsContainer.firstChild);
                  }
                  else {
                      this.resultsContainer.appendChild(loadingElement);
                  }
              }
              loadingElement.style.display = 'block';
          }
          else {
              if (loadingElement) {
                  loadingElement.style.display = 'none';
              }
          }
      }
      renderResultsMessage(message, isHtml = false) {
          if (isHtml) {
              this.resultsContainer.innerHTML = message;
          }
          else {
              this.resultsContainer.innerHTML = `<p class="pdwc-center-message">${message}</p>`;
          }
      }
      renderResults() {
          this.resultsContainer.innerHTML = ''; // Clear previous results or messages
          if (this.currentResults.length === 0 && this.currentQuery.term) {
              this.resultsContainer.innerHTML = '<p class="pdwc-center-message">No results found.</p>';
              return;
          }
          if (this.currentResults.length === 0 && !this.currentQuery.term) {
              // Message when search is cleared or no term entered and data is loaded.
              this.resultsContainer.innerHTML = '<p class="pdwc-center-message">Enter a term to search attributes and sets.</p>';
              return;
          }
          const ul = document.createElement('ul');
          ul.className = 'pdwc-results-list';
          this.currentResults.slice(0, MAX_RESULTS_DISPLAY).forEach(item => {
              const li = document.createElement('li');
              li.className = 'pdwc-search-result-item';
              // Construct the new label format
              let labelHtml = `<strong>${item.type}:</strong> ${item.label}, <strong>ID:</strong> ${item.id}`;
              let displayDesc = item.properties.description || ''; // Default to pre-calculated description
              if (!displayDesc) { // If pre-calculated is empty, try to get from originalData if not a LinkType
                  if (item.type === 'Attribute') {
                      displayDesc = item.properties.originalData.description || '';
                  }
                  else if (item.type === 'Set') {
                      displayDesc = item.properties.originalData.description || '';
                  }
                  // No need for LinkType here, as its item.properties.description was specifically set during mapping.
              }
              li.innerHTML = `
        <div class="pdwc-result-label">${labelHtml}</div>
        <div class="pdwc-result-description">${displayDesc}</div>
      `;
              li.addEventListener('click', () => this.handleResultClick(item));
              ul.appendChild(li);
          });
          this.resultsContainer.appendChild(ul);
          this.renderPagination();
      }
      renderPagination() {
          const totalPages = Math.ceil(this.totalResults / RESULTS_PER_PAGE);
          if (totalPages <= 1)
              return;
          const paginationContainer = document.createElement('div');
          paginationContainer.className = 'pdwc-pagination-controls';
          // Previous Button
          if (this.currentPage > 1) {
              const prevButton = document.createElement('button');
              prevButton.innerHTML = '<i class="fas fa-arrow-left"></i> Previous';
              prevButton.addEventListener('click', () => {
                  this.currentPage--;
                  this.currentQuery.offset = (this.currentPage - 1) * RESULTS_PER_PAGE;
                  this.currentResults = []; // Clear results for true pagination (not infinite scroll)
                  this.performSearch(true);
              });
              paginationContainer.appendChild(prevButton);
          }
          const pageInfo = document.createElement('span');
          pageInfo.textContent = ` Page ${this.currentPage} of ${totalPages} `;
          paginationContainer.appendChild(pageInfo);
          // Next Button
          if (this.currentPage < totalPages) {
              const nextButton = document.createElement('button');
              nextButton.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
              nextButton.addEventListener('click', () => {
                  this.currentPage++;
                  this.currentQuery.offset = (this.currentPage - 1) * RESULTS_PER_PAGE;
                  // If you want infinite scroll like behavior, don't clear currentResults
                  // this.currentResults = []; // For paginated, clear previous page's results
                  this.performSearch(true);
              });
              paginationContainer.appendChild(nextButton);
          }
          this.resultsContainer.appendChild(paginationContainer);
      }
      async handleResultClick(item) {
          console.log('Result clicked:', item);
          this.showDetailView();
          const originalData = item.properties.originalData;
          let detailHtml = `<div class="pdwc-detail-view-header">
                        <h3><i class="fas fa-info-circle"></i> ${item.label} (${item.type} Details)</h3>
                        <button class="pdwc-detail-view-close-btn" title="Close Details">&times;</button>
                      </div>`;
          const copyIcon = '<i class="fas fa-copy"></i>';
          const escapeAttr = (val) => val.replace(/'/g, '&apos;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
          detailHtml += `<p><strong>Name:</strong> ${item.label} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(item.label)}' title='Copy Name'>${copyIcon}</button></p>`;
          detailHtml += `<p><strong>ID:</strong> ${item.id} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(item.id)}' title='Copy ID'>${copyIcon}</button></p>`;
          let detailViewDescription = item.properties.description || '';
          if (!detailViewDescription) {
              if (item.type === 'Attribute') {
                  detailViewDescription = item.properties.originalData.description || '';
              }
              else if (item.type === 'Set') {
                  detailViewDescription = item.properties.originalData.description || '';
              }
          }
          detailHtml += `<p><strong>Description:</strong> ${detailViewDescription} ${detailViewDescription ? `<button class='pdwc-copy-btn' data-copy-value='${escapeAttr(detailViewDescription)}' title='Copy Description'>${copyIcon}</button>` : ''}</p>`;
          let setIdForAttributes;
          if (item.type === 'Attribute') {
              const attribute = originalData;
              detailHtml += `<p><strong>Data Type:</strong> ${attribute.dataType} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(attribute.dataType)}' title='Copy Data Type'>${copyIcon}</button></p>`;
              detailHtml += `<p><strong>Indexed:</strong> ${attribute.properties.index ? 'Yes' : 'No'} </p>`;
              detailHtml += `<p><strong>Searchable:</strong> ${attribute.properties.searcher ? 'Yes' : 'No'} </p>`;
              // detailHtml += `<p><strong>Multivalue:</strong> ${attribute.isMultivalue} </p>`; // isMultivalue not directly available
              if (attribute.classId) { // Changed from entityClassId to classId
                  setIdForAttributes = attribute.classId.toString();
                  detailHtml += `<p><strong>Part of Set ID:</strong> ${attribute.classId} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(attribute.classId.toString())}' title='Copy Set ID'>${copyIcon}</button></p>`;
              }
          }
          else if (item.type === 'Set') {
              const set = originalData;
              setIdForAttributes = set.id.toString(); // Ensure setIdForAttributes is set for Sets
              detailHtml += `<p><strong>Core:</strong> ${set.core}</p>`;
              detailHtml += `<p><strong>Hidden:</strong> ${set.isHidden}</p>`;
              // Add back configuration copy UI
              detailHtml += `<p style="margin-top:15px;"><strong>Copy Configuration:</strong></p>
                       <div style="display: flex; align-items: center; margin-bottom: 5px;">
                         <select id="pdwc-config-type-select" style="margin-right: 10px; padding: 5px; border-radius: 4px;">
                           <option value="structure">Structure Config</option>
                           <option value="full">Full Configuration</option>
                           <option value="column_names_map">Column Names Map</option>
                         </select>
                         <button id="pdwc-copy-selected-config-btn" class="pdwc-primary-btn pdwc-copy-btn-dynamic" title="Copy selected configuration" style="padding: 5px 10px;">${copyIcon} Copy Selected</button>
                       </div>`;
              if (set.configuration) {
                  const configJsonForDisplay = JSON.stringify(set.configuration, null, 2);
                  detailHtml += `<div style="margin-top:10px;"><strong>Full Set Configuration (for reference):</strong><pre style="background-color: #f0f0f0; padding:10px; border-radius:4px; max-height: 200px; overflow-y:auto;">${escapeAttr(configJsonForDisplay)}</pre></div>`;
              }
          }
          else if (item.type === 'LinkType') { // Added detail view for LinkType
              const link = originalData;
              detailHtml += `<p><strong>Source Collection ID:</strong> ${link.sourceCollectionId} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.sourceCollectionId.toString())}' title='Copy Source ID'>${copyIcon}</button></p>`;
              detailHtml += `<p><strong>Target Collection ID:</strong> ${link.targetCollectionId} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.targetCollectionId.toString())}' title='Copy Target ID'>${copyIcon}</button></p>`;
              detailHtml += `<p><strong>Directed:</strong> ${link.directed}</p>`;
              detailHtml += `<p><strong>Core:</strong> ${link.core}</p>`;
              detailHtml += `<p><strong>Dynamic Links Only:</strong> ${link.dynamicLinksOnly}</p>`;
              detailHtml += `<p><strong>All Manual Links:</strong> ${link.allManualLinks}</p>`;
              detailHtml += `<p><strong>Creation Date:</strong> ${new Date(link.creationDate).toLocaleString()} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(new Date(link.creationDate).toLocaleString())}' title='Copy Creation Date'>${copyIcon}</button></p>`;
              detailHtml += `<p><strong>User ID:</strong> ${link.userId}</p>`;
              if (link.connectingEntityClassId) {
                  detailHtml += `<p><strong>Connecting Entity Class ID:</strong> ${link.connectingEntityClassId} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.connectingEntityClassId.toString())}' title='Copy Connecting Entity Class ID'>${copyIcon}</button></p>`;
              }
              detailHtml += `<h4>Configuration:</h4>`;
              detailHtml += `<p><strong>Config Type:</strong> ${link.config.type} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.config.type)}' title='Copy Config Type'>${copyIcon}</button></p>`;
              detailHtml += `<p><strong>Link Storage Mode:</strong> ${link.config.linkStorage.mode} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.config.linkStorage.mode)}' title='Copy Storage Mode'>${copyIcon}</button></p>`;
              if (link.config.linkStorage.configuration.connectingEntityClassId) {
                  detailHtml += `<p><strong>Storage Connecting Entity Class ID:</strong> ${link.config.linkStorage.configuration.connectingEntityClassId} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(link.config.linkStorage.configuration.connectingEntityClassId.toString())}' title='Copy Storage Connecting ID'>${copyIcon}</button></p>`;
              }
              if (link.config.conditions && link.config.conditions.length > 0) {
                  detailHtml += `<p><strong>Conditions:</strong> ${link.config.conditions.length} condition(s) present.</p>`;
              }
          }
          if (item.type === 'Attribute' || item.type === 'Set') {
              detailHtml += `<div id="relatedAttributesSection"><h4>Related Attributes:</h4><ul id="relatedAttributesList"><li><i>Loading attributes...</i></li></ul></div>`;
          }
          this.detailViewContainer.innerHTML = detailHtml;
          this.attachDetailViewCopyListeners(); // Attaches listeners for existing .pdwc-copy-btn
          // Add back event listener for the new dynamic config copy button
          const copySelectedConfigBtn = this.detailViewContainer.querySelector('#pdwc-copy-selected-config-btn');
          if (copySelectedConfigBtn && item.type === 'Set') { // Check item.type to ensure currentItemData is a Set
              copySelectedConfigBtn.addEventListener('click', () => {
                  const selectElement = this.detailViewContainer.querySelector('#pdwc-config-type-select');
                  const configType = selectElement.value;
                  let textToCopy = '';
                  const currentSet = item.properties.originalData;
                  if (configType === 'structure') {
                      const setName = currentSet.name;
                      const setId = currentSet.id;
                      const relatedAttributeIds = this.allAttributes
                          .filter(attr => attr.classId.toString() === setId.toString())
                          .map(attr => attr.id);
                      const structureConfig = {
                          [setName]: {
                              setId: setId,
                              import: {
                                  strategy: "UPSERT",
                                  identification: {
                                      type: "COLUMN_VALUES",
                                      data: {
                                          columnIds: relatedAttributeIds
                                      }
                                  }
                              }
                          }
                      };
                      textToCopy = JSON.stringify(structureConfig, null, 2);
                  }
                  else if (configType === 'full') {
                      if (currentSet.configuration) {
                          textToCopy = JSON.stringify(currentSet.configuration, null, 2);
                      }
                  }
                  else if (configType === 'column_names_map') {
                      const setName = currentSet.name;
                      const setId = currentSet.id;
                      const relatedAttributes = this.allAttributes.filter(attr => attr.classId.toString() === setId.toString());
                      const renameColumnMap = {};
                      relatedAttributes.forEach(attr => {
                          const sqlFriendlyName = attr.name.replace(/,|;|\s/g, '_'); // Escaped \s for regex within string
                          renameColumnMap[attr.name] = sqlFriendlyName;
                      });
                      const columnNamesMapConfig = {
                          [setName]: {
                              "rename_column": renameColumnMap
                          }
                      };
                      textToCopy = JSON.stringify(columnNamesMapConfig, null, 2);
                  }
                  if (textToCopy) {
                      navigator.clipboard.writeText(textToCopy).then(() => {
                          const originalButtonText = copySelectedConfigBtn.innerHTML;
                          copySelectedConfigBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                          setTimeout(() => {
                              copySelectedConfigBtn.innerHTML = originalButtonText;
                          }, 1500);
                      }).catch(err => {
                          console.error('PABLO\'S DW CHAD: Failed to copy text: ', err); // Escaped apostrophe
                          alert('Failed to copy configuration.');
                      });
                  }
                  else {
                      alert('No configuration data available to copy for the selected type.');
                  }
              });
          }
          // Restore the detail view close button listener
          this.detailViewContainer.querySelector('.pdwc-detail-view-close-btn')?.addEventListener('click', () => this.hideDetailView());
          // Fetch and display related attributes
          if (setIdForAttributes) {
              const relatedAttributes = this.allAttributes.filter(attr => attr.classId.toString() === setIdForAttributes); // Changed from entityClassId to classId
              const relatedAttributesListEl = this.detailViewContainer.querySelector('#relatedAttributesList');
              if (relatedAttributesListEl) {
                  if (relatedAttributes.length > 0) {
                      relatedAttributesListEl.innerHTML = relatedAttributes.map(attr => `<li>${attr.name} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(attr.name)}' title='Copy Name'>${copyIcon}</button> 
             <strong>ID:</strong> ${attr.id} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(attr.id.toString())}' title='Copy ID'>${copyIcon}</button> 
             <strong>Type:</strong> ${attr.dataType} <button class='pdwc-copy-btn' data-copy-value='${escapeAttr(attr.dataType)}' title='Copy Type'>${copyIcon}</button></li>`).join('');
                  }
                  else {
                      relatedAttributesListEl.innerHTML = '<li>No attributes found for this set.</li>';
                  }
                  this.attachDetailViewCopyListeners(); // Ensure new buttons in the list get listeners
              }
          }
          else {
              const relatedAttributesListEl = this.detailViewContainer.querySelector('#relatedAttributesList');
              if (relatedAttributesListEl) {
                  relatedAttributesListEl.innerHTML = '<li>Could not determine set to load attributes from.</li>';
              }
          }
      }
      showDetailView() {
          if (this.detailViewContainer) {
              this.detailViewContainer.innerHTML = ''; // Clear previous content
              this.detailViewContainer.style.display = 'block';
              // Optional: hide main search results when detail modal is open
              // this.resultsContainer.style.display = 'none'; 
          }
      }
      hideDetailView() {
          if (this.detailViewContainer) {
              this.detailViewContainer.style.display = 'none';
              this.detailViewContainer.innerHTML = '';
              // Optional: show main search results again
              // this.resultsContainer.style.display = 'block'; 
          }
      }
      attachDetailViewCopyListeners() {
          console.log("PABLO'S DW CHAD: Attaching detail view copy listeners...");
          if (!this.detailViewContainer) {
              console.error("PABLO'S DW CHAD: detailViewContainer is null in attachDetailViewCopyListeners");
              return;
          }
          const copyButtons = this.detailViewContainer.querySelectorAll('.pdwc-copy-btn');
          console.log(`PABLO'S DW CHAD: Found ${copyButtons.length} .pdwc-copy-btn elements.`);
          copyButtons.forEach((button, index) => {
              // console.log(`PABLO'S DW CHAD: Attaching to button ${index}`, button); // Can be verbose
              button.addEventListener('click', (e) => {
                  const targetButton = e.currentTarget;
                  const valueToCopy = targetButton.dataset.copyValue;
                  console.log(`PABLO'S DW CHAD: Clicked copy button. Attempting to copy: '${valueToCopy}'`, targetButton);
                  if (valueToCopy !== undefined && valueToCopy !== null) { // Check explicitly for undefined/null
                      navigator.clipboard.writeText(valueToCopy).then(() => {
                          console.log("PABLO'S DW CHAD: Text copied successfully to clipboard: ", valueToCopy);
                          const originalButtonText = targetButton.innerHTML;
                          targetButton.innerHTML = 'Copied!'; // Provide feedback
                          setTimeout(() => {
                              targetButton.innerHTML = originalButtonText;
                          }, 1500); // Revert after 1.5 seconds
                      }).catch(err => {
                          console.error("PABLO'S DW CHAD: Failed to copy text: ", err);
                          alert('PABLO\'S DW CHAD: Failed to copy text. See console for details.');
                      });
                  }
                  else {
                      console.warn("PABLO'S DW CHAD: No value to copy (data-copy-value is missing, null, or undefined).");
                      alert('PABLO\'S DW CHAD: No value found to copy.');
                  }
              });
          });
      }
      updateCacheStatusDisplay() {
          const statusElement = this.element.querySelector('.cache-status-display');
          if (statusElement) {
              if (this.isDataFromCache && this.cacheTimestamp) {
                  statusElement.innerHTML = `Using cached data from: ${new Date(this.cacheTimestamp).toLocaleString()}`;
                  statusElement.innerHTML += ` <button id="super-search-refresh-cache" class="refresh-cache-button" title="Refresh data from server">Refresh</button>`;
              }
              else if (this.cacheTimestamp) {
                  statusElement.innerHTML = `Data refreshed from server: ${new Date(this.cacheTimestamp).toLocaleString()}`;
                  statusElement.innerHTML += ` <button id="super-search-refresh-cache" class="refresh-cache-button" title="Refresh data from server">Refresh</button>`;
              }
              else {
                  statusElement.textContent = 'No data cache available for this server.';
                  statusElement.innerHTML += ` <button id="super-search-refresh-cache" class="refresh-cache-button" title="Fetch data from server">Fetch Data</button>`;
              }
              const refreshButton = statusElement.querySelector('#super-search-refresh-cache');
              if (refreshButton) {
                  refreshButton.addEventListener('click', () => this.handleRefreshData());
              }
          }
          console.log(`Cache status: ${this.isDataFromCache ? 'Using cache' : 'Using fresh data'}, Timestamp: ${this.cacheTimestamp ? new Date(this.cacheTimestamp).toLocaleString() : 'N/A'}`);
      }
      async handleRefreshData() {
          this.renderLoading(true);
          this.isDataFromCache = false; // Mark as fetching fresh data
          if (!this.baseUrl) {
              this.renderResultsMessage('DataWalk base URL not configured.', false);
              this.renderLoading(false);
              return;
          }
          try {
              const [attributes, sets] = await Promise.all([
                  fetchAttributes(this.baseUrl), // Reverted: dwApiToken removed
                  fetchSets(this.baseUrl) // Reverted: dwApiToken removed
              ]);
              this.allAttributes = attributes;
              this.allSets = sets;
              this.allLinkTypes = []; // Reset before fetching
              // Fetch LinkTypes in batches
              if (this.allSets.length > 0) {
                  console.log(`PABLO'S DW CHAD: Found ${this.allSets.length} sets. Fetching link types in batches.`);
                  const setIds = this.allSets.map(set => set.id); // Assuming 'id' is the property for set ID
                  const batchSize = 50;
                  for (let i = 0; i < setIds.length; i += batchSize) {
                      const batchOfSetIds = setIds.slice(i, i + batchSize);
                      try {
                          console.log(`PABLO'S DW CHAD: Fetching link types for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(setIds.length / batchSize)} (Set IDs: ${batchOfSetIds.join(', ')})`);
                          const fetchedLinkTypes = await fetchLinkTypesByClassIds(this.baseUrl, batchOfSetIds);
                          this.allLinkTypes.push(...fetchedLinkTypes);
                          console.log(`PABLO'S DW CHAD: Fetched ${fetchedLinkTypes.length} link types in this batch. Total link types: ${this.allLinkTypes.length}`);
                      }
                      catch (linkFetchError) {
                          console.error(`PABLO'S DW CHAD: Error fetching batch of link types for set IDs ${batchOfSetIds.join(', ')}:`, linkFetchError);
                          // Optionally, decide if one batch failure should stop all or just skip
                      }
                  }
                  console.log(`PABLO'S DW CHAD: Finished fetching all link types. Total: ${this.allLinkTypes.length}`);
              }
              await saveDataToCache(this.baseUrl, this.allAttributes, this.allSets, this.allLinkTypes); // Pass linkTypes to cache
              this.cacheTimestamp = Date.now();
              this.isDataFromCache = false; // Data is now fresh from server, not 'from cache' in the sense of old cache
              console.log("PABLO'S DW CHAD: Data refreshed from server and saved to cache.");
              this.updateCacheStatusDisplay();
              this.performSearch(true);
          }
          catch (error) {
              console.error('Error refreshing SuperSearch data:', error);
              this.renderResultsMessage(`Failed to refresh data: ${error.message}`, false);
              // Potentially revert isDataFromCache or handle state appropriately
          }
          finally {
              this.renderLoading(false);
          }
      }
      open() {
          this.element.style.display = 'flex'; // Use flex if modal is flex container
          this.searchInput.focus();
          // If there's a previous query term, you might want to keep it or clear it
          // this.searchInput.value = this.currentQuery.term;
          // if (this.currentResults.length === 0 && this.currentQuery.term) {
          //    this.performSearch(); // Optionally auto-search if term exists and no results shown
          // }
          console.log('SuperSearch modal opened.');
      }
      close() {
          this.element.style.display = 'none';
          console.log('SuperSearch modal closed.');
      }
      getElement() {
          return this.element;
      }
  }

  class SqlConfigConverterTool {
      constructor() {
          this.closeButton = null;
          this.titleEl = null;
          this.connectorNameInputEl = null;
          this.minifyJsonCheckboxEl = null;
          this.removeCommentsCheckboxEl = null;
          this.rawSqlInputEl = null;
          this.rawInputLabelEl = null;
          this.switchDirectionButtonEl = null;
          this.outputCodeEl = null;
          this.outputLabelEl = null;
          this.copyOutputButtonEl = null;
          this.convertButtonEl = null;
          this.validationFeedbackEl = null;
          this.isReverseMode = false;
          this.element = document.createElement('div');
          this.element.className = 'sql-config-converter-tool pdwc-modal'; // Use our main tool class + base modal
          this.element.style.display = 'none'; // Hidden by default
          this.setupUI();
          this.loadRequiredAssets(); // RENAMED and will load all assets
      }
      static getInstance() {
          if (!SqlConfigConverterTool.instance) {
              SqlConfigConverterTool.instance = new SqlConfigConverterTool();
              document.body.appendChild(SqlConfigConverterTool.instance.element);
          }
          return SqlConfigConverterTool.instance;
      }
      async loadRequiredAssets() {
          // Check if main tool CSS is loaded
          if (!document.getElementById('pdwc-scc-tool-css')) {
              const toolCssLink = document.createElement('link');
              toolCssLink.id = 'pdwc-scc-tool-css';
              toolCssLink.rel = 'stylesheet';
              toolCssLink.href = chrome.runtime.getURL('assets/css/sql-config-converter.css');
              document.head.appendChild(toolCssLink);
          }
      }
      setupUI() {
          // Use scc- specific classes for header, title, close button, and body content.
          this.element.innerHTML = `
      <div class="scc-header">
        <h2 class="scc-title">SQL to Configuration Converter</h2>
        <button class="scc-feedback-button" title="Report an issue">🐞</button>
        <button class="scc-close-button">&times;</button>
      </div>
      <div class="scc-body">
        ${this.getToolHtmlStructure()}
      </div>
    `;
          this.closeButton = this.element.querySelector('.scc-close-button');
          this.closeButton?.addEventListener('click', () => this.close());
          // Add feedback button with enhanced click handler
          const feedbackButton = this.element.querySelector('.scc-feedback-button');
          if (feedbackButton) {
              feedbackButton.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                      openGitHubIssue('SQL Config Converter');
                      // Add visual feedback
                      feedbackButton.textContent = '✓';
                      feedbackButton.setAttribute('title', 'Thanks for your feedback!');
                      setTimeout(() => {
                          if (feedbackButton) {
                              feedbackButton.textContent = '🐞';
                              feedbackButton.setAttribute('title', 'Report an issue');
                          }
                      }, 2000);
                  }
                  catch (error) {
                      console.error('Error opening feedback:', error);
                      feedbackButton.textContent = '!';
                      feedbackButton.setAttribute('title', 'Failed to open feedback');
                      setTimeout(() => {
                          if (feedbackButton) {
                              feedbackButton.textContent = '🐞';
                              feedbackButton.setAttribute('title', 'Report an issue');
                          }
                      }, 2000);
                  }
              });
          }
          // Get references to tool-specific elements
          this.titleEl = this.element.querySelector('.scc-title');
          this.connectorNameInputEl = this.element.querySelector('#scc-connector-name');
          this.minifyJsonCheckboxEl = this.element.querySelector('#scc-minify-json');
          this.removeCommentsCheckboxEl = this.element.querySelector('#scc-remove-comments');
          this.rawSqlInputEl = this.element.querySelector('#scc-raw-input');
          this.rawInputLabelEl = this.element.querySelector('#scc-raw-input-label');
          this.switchDirectionButtonEl = this.element.querySelector('#scc-switch-direction');
          this.outputCodeEl = this.element.querySelector('#scc-output-code');
          this.outputLabelEl = this.element.querySelector('#scc-output-label');
          this.copyOutputButtonEl = this.element.querySelector('#scc-copy-output');
          this.convertButtonEl = this.element.querySelector('#scc-convert-button');
          this.validationFeedbackEl = this.element.querySelector('#scc-validation-feedback');
          this.attachEventListeners();
          this.updateLabelsAndPlaceholders(this.isReverseMode ? 'jsonToSql' : 'sqlToJson');
      }
      getToolHtmlStructure() {
          // Removed outer <div class="container sql-converter-container">
          return `
      <div class="scc-main-layout">
        <!-- Left Column -->
        <div class="scc-left-column">
          <div class="scc-form-group">
            <label for="scc-connector-name">Connector Name:</label>
            <input type="text" id="scc-connector-name" class="scc-input" placeholder="e.g., project_morganstanleyll_sandbox_og">
          </div>
          <div class="scc-form-group scc-checkbox-group">
            <input type="checkbox" id="scc-minify-json">
            <label for="scc-minify-json" id="scc-minify-json-label">Minify JSON output</label>
          </div>
          <div class="scc-form-group scc-checkbox-group" id="scc-remove-comments-group">
            <input type="checkbox" id="scc-remove-comments">
            <label for="scc-remove-comments" id="scc-remove-comments-label">Remove SQL comments</label>
          </div>
          <div class="scc-form-group scc-input-area">
            <label for="scc-raw-input" id="scc-raw-input-label">Raw SQL Input:</label>
            <textarea id="scc-raw-input" class="scc-textarea" rows="12" placeholder="Paste your SQL queries here..."></textarea>
          </div>
        </div>

        <!-- Middle Column (Switch Button) -->
        <div class="scc-middle-column">
          <button id="scc-switch-direction" class="scc-button scc-switch-button" title="Switch conversion direction">
            &rlarr; <!-- Unicode for right-left arrows -->
          </button>
        </div>

        <!-- Right Column -->
        <div class="scc-right-column">
          <div class="scc-form-group scc-output-area">
            <label for="scc-output-code" id="scc-output-label">Generated Configuration (JSON):</label>
            <pre class="scc-output-pre"><code id="scc-output-code" class="scc-output language-json"></code></pre>
          </div>
           <div class="scc-output-actions">
              <button id="scc-copy-output" class="scc-button">Copy Output</button>
          </div>
        </div>
      </div>

      <div class="scc-global-actions">
        <button id="scc-convert-button" class="scc-button">Convert to Config</button> <!-- Removed scc-button-primary class -->
        <div id="scc-validation-feedback" class="scc-validation"></div>
      </div>
    `;
      }
      attachEventListeners() {
          this.convertButtonEl?.addEventListener('click', () => {
              if (this.isReverseMode) {
                  this.convertJsonToSql();
              }
              else {
                  this.convertSql();
              }
          });
          this.copyOutputButtonEl?.addEventListener('click', () => this.copyOutput());
          this.switchDirectionButtonEl?.addEventListener('click', () => this.toggleDirection());
          this.rawSqlInputEl?.addEventListener('input', () => this.clearValidationFeedback());
          this.connectorNameInputEl?.addEventListener('input', () => this.clearValidationFeedback());
          // Save preferences when checkboxes change
          this.minifyJsonCheckboxEl?.addEventListener('change', () => {
              if (this.minifyJsonCheckboxEl) {
                  chrome.storage.local.set({ scc_minifyJsonPreference: this.minifyJsonCheckboxEl.checked });
              }
          });
          this.removeCommentsCheckboxEl?.addEventListener('change', () => {
              if (this.removeCommentsCheckboxEl) {
                  chrome.storage.local.set({ scc_removeSqlCommentsPreference: this.removeCommentsCheckboxEl.checked });
              }
          });
      }
      toggleDirection() {
          this.isReverseMode = !this.isReverseMode;
          this.clearValidationFeedback();
          if (this.rawSqlInputEl)
              this.rawSqlInputEl.value = '';
          if (this.outputCodeEl)
              this.outputCodeEl.textContent = '';
          // Call updateLabelsAndPlaceholders to refresh all text based on the new direction
          this.updateLabelsAndPlaceholders(this.isReverseMode ? 'jsonToSql' : 'sqlToJson');
          this.highlightOutput(); // This still just sets textContent as Prism is removed
      }
      highlightOutput() {
          if (this.outputCodeEl && this.outputCodeEl.textContent) {
              this.outputCodeEl.textContent = this.outputCodeEl.textContent;
          }
      }
      showValidationFeedback(message, isError = true) {
          if (this.validationFeedbackEl) {
              this.validationFeedbackEl.textContent = message;
              this.validationFeedbackEl.className = isError ? 'scc-validation scc-validation-error' : 'scc-validation scc-validation-success';
          }
      }
      clearValidationFeedback() {
          if (this.validationFeedbackEl) {
              this.validationFeedbackEl.textContent = '';
              this.validationFeedbackEl.className = 'scc-validation';
          }
      }
      convertSql() {
          const sqlText = this.rawSqlInputEl?.value;
          const connectorName = this.connectorNameInputEl?.value || 'unknown_connector';
          const minify = this.minifyJsonCheckboxEl?.checked || false;
          const shouldRemoveComments = this.removeCommentsCheckboxEl?.checked || false;
          if (!sqlText) {
              this.showValidationFeedback('SQL input cannot be empty.');
              if (this.outputCodeEl)
                  this.outputCodeEl.textContent = '';
              return;
          }
          try {
              let processedSql = sqlText;
              if (shouldRemoveComments) {
                  processedSql = this.stripSqlComments(processedSql);
              }
              const statements = this.parseAndCleanSql(processedSql);
              if (statements.length === 0 && sqlText.trim() !== '') {
                  // If comments were removed, and still no statements, the original might have been only comments
                  const feedbackMsg = shouldRemoveComments
                      ? 'No valid SQL statements found after removing comments.'
                      : 'No valid SQL statements found.';
                  this.showValidationFeedback(feedbackMsg);
                  if (this.outputCodeEl)
                      this.outputCodeEl.textContent = '';
                  return;
              }
              // Removed redundant condition: statements.length === 0 && sqlText.trim() === ''
              // This case is covered by the !sqlText check or the subsequent logic if sqlText has content.
              const config = {
                  node_type: 'SandboxSQLQuery',
                  connector: connectorName,
                  sql_script: statements,
              };
              const outputJson = minify
                  ? JSON.stringify(config)
                  : JSON.stringify(config, null, 2);
              if (this.outputCodeEl) {
                  this.outputCodeEl.textContent = outputJson;
                  this.highlightOutput();
                  this.showValidationFeedback('Conversion successful!', false);
                  // Save the successfully used connector name
                  chrome.storage.local.set({ scc_lastConnectorName: connectorName }, () => {
                      console.log("PABLO'S DW CHAD: Last connector name saved:", connectorName);
                  });
              }
          }
          catch (error) {
              this.showValidationFeedback(`Error during SQL conversion: ${error.message}`);
          }
      }
      convertJsonToSql() {
          const jsonText = this.rawSqlInputEl?.value;
          if (!jsonText) {
              this.showValidationFeedback('JSON input cannot be empty.');
              if (this.outputCodeEl)
                  this.outputCodeEl.textContent = '';
              return;
          }
          if (!this.outputCodeEl)
              return;
          try {
              const parsedJson = JSON.parse(jsonText);
              let extractedSqls = [];
              if (parsedJson &&
                  parsedJson.node_type === "SandboxSQLQuery" &&
                  typeof parsedJson.connector === 'string' &&
                  Array.isArray(parsedJson.sql_script)) {
                  if (this.connectorNameInputEl) {
                      this.connectorNameInputEl.value = parsedJson.connector;
                  }
                  extractedSqls = parsedJson.sql_script.filter((item) => typeof item === 'string');
              }
              else {
                  this.showValidationFeedback('Invalid JSON. Expected: { node_type: "SandboxSQLQuery", connector: "...", sql_script: ["..."] }');
                  this.outputCodeEl.textContent = '';
                  return;
              }
              this.outputCodeEl.className = 'scc-output language-sql'; // Set before highlight
              if (extractedSqls.length > 0) {
                  this.outputCodeEl.textContent = extractedSqls.join('\n\n');
              }
              else {
                  this.outputCodeEl.textContent = "// No SQL statements found in 'sql_script' array or array is empty.";
              }
              this.highlightOutput();
              this.clearValidationFeedback();
          }
          catch (error) {
              this.showValidationFeedback('Invalid JSON input for SQL conversion: ' + error.message);
              this.outputCodeEl.textContent = '';
          }
      }
      // This method now ONLY parses statements from SQL that may or may not have comments.
      // Comment removal is handled by stripSqlComments() if the user opts in.
      parseAndCleanSql(sql) {
          // 1. Normalize newlines to \n and trim whitespace from the whole block
          let normalizedSql = sql.replace(/\r\n?/g, '\n').trim();
          const statements = [];
          let remainingSql = normalizedSql;
          while (remainingSql.length > 0) {
              remainingSql = remainingSql.trimStart();
              if (remainingSql.length === 0)
                  break;
              const doBlockMatch = remainingSql.match(/^DO\s*\$\$([\s\S]*?)\$\$;?/i);
              if (doBlockMatch) {
                  const doBlock = doBlockMatch[0];
                  statements.push(doBlock.trim());
                  remainingSql = remainingSql.substring(doBlock.length);
              }
              else {
                  const nextSemicolon = remainingSql.indexOf(';');
                  if (nextSemicolon === -1) {
                      const rest = remainingSql.trim();
                      if (rest.length > 0) {
                          statements.push(rest);
                      }
                      break;
                  }
                  else {
                      const statement = remainingSql.substring(0, nextSemicolon + 1);
                      statements.push(statement.trim());
                      remainingSql = remainingSql.substring(nextSemicolon + 1);
                  }
              }
          }
          return statements.filter(stmt => stmt.length > 0);
      }
      stripSqlComments(sql) {
          // 1. Remove multi-line comments /* ... */ (non-greedy)
          let noCommentsSql = sql.replace(/\/\*[\s\S]*?\*\//gs, '');
          // 2. Remove single-line comments -- ...
          noCommentsSql = noCommentsSql.split('\n').map(line => line.replace(/--.*$/, '')).join('\n');
          return noCommentsSql.trim(); // Trim overall after removing comments
      }
      copyOutput() {
          if (!this.outputCodeEl || !this.copyOutputButtonEl)
              return;
          if (this.outputCodeEl.textContent) {
              navigator.clipboard.writeText(this.outputCodeEl.textContent)
                  .then(() => {
                  this.showValidationFeedback('Copied to clipboard!', false);
                  this.copyOutputButtonEl.textContent = 'Copied!';
                  setTimeout(() => {
                      if (this.copyOutputButtonEl)
                          this.copyOutputButtonEl.textContent = 'Copy Output';
                  }, 2000);
              })
                  .catch(err => {
                  this.showValidationFeedback('Failed to copy: ' + err, true);
              });
          }
          else {
              this.showValidationFeedback('Nothing to copy.', true);
          }
      }
      updateLabelsAndPlaceholders(direction) {
          if (!this.titleEl || !this.rawInputLabelEl || !this.outputLabelEl || !this.convertButtonEl ||
              !this.minifyJsonCheckboxEl || !document.getElementById('scc-minify-json-label') ||
              !this.removeCommentsCheckboxEl || !document.getElementById('scc-remove-comments-label') ||
              !this.connectorNameInputEl || !this.rawSqlInputEl) {
              console.warn("PABLO'S DW CHAD: One or more UI elements for label update not found.");
              return;
          }
          const minifyLabel = document.getElementById('scc-minify-json-label');
          const removeCommentsGroup = document.getElementById('scc-remove-comments-group');
          if (direction === 'sqlToJson') {
              this.titleEl.textContent = 'Generate Sandbox Node Configuration';
              this.rawInputLabelEl.textContent = 'Raw SQL Input:';
              this.outputLabelEl.textContent = 'Generated Sandbox Configuration (JSON):';
              this.convertButtonEl.textContent = 'Generate Configuration';
              this.minifyJsonCheckboxEl.style.display = '';
              minifyLabel.style.display = '';
              removeCommentsGroup.style.display = ''; // Show remove comments option
              this.connectorNameInputEl.placeholder = 'e.g., project_morganstanleyll_sandbox_og';
              this.rawSqlInputEl.placeholder = 'Paste your SQL queries here...';
          }
          else { // jsonToSql
              this.titleEl.textContent = 'Extract SQL from Sandbox Node';
              this.rawInputLabelEl.textContent = 'Sandbox Node Configuration (JSON):';
              this.outputLabelEl.textContent = 'Extracted SQL Script:';
              this.convertButtonEl.textContent = 'Extract SQL';
              this.minifyJsonCheckboxEl.style.display = 'none';
              minifyLabel.style.display = 'none';
              removeCommentsGroup.style.display = 'none'; // Hide remove comments option
              this.connectorNameInputEl.placeholder = 'Connector name will be extracted from JSON';
              this.rawSqlInputEl.placeholder = 'Paste your Sandbox JSON configuration here...';
          }
      }
      open() {
          this.element.style.display = 'flex';
          this.highlightOutput();
          // Load and set preferences
          chrome.storage.local.get(['scc_lastConnectorName', 'scc_minifyJsonPreference', 'scc_removeSqlCommentsPreference'], (data) => {
              if (data.scc_lastConnectorName && this.connectorNameInputEl) {
                  this.connectorNameInputEl.value = data.scc_lastConnectorName;
              }
              if (this.minifyJsonCheckboxEl && typeof data.scc_minifyJsonPreference === 'boolean') {
                  this.minifyJsonCheckboxEl.checked = data.scc_minifyJsonPreference;
              }
              if (this.removeCommentsCheckboxEl && typeof data.scc_removeSqlCommentsPreference === 'boolean') {
                  this.removeCommentsCheckboxEl.checked = data.scc_removeSqlCommentsPreference;
              }
              else if (this.removeCommentsCheckboxEl) {
                  // Default to false if not set
                  this.removeCommentsCheckboxEl.checked = false;
              }
          });
      }
      close() {
          this.element.style.display = 'none';
      }
      getElement() {
          return this.element;
      }
  }
  SqlConfigConverterTool.instance = null;

  // src/utils/domUtils.ts
  /**
   * Displays a toast message.
   * Assumes CSS for .pdwc-toast, .pdwc-toast-visible, and .pdwc-toast-[type] are defined.
   */
  function showToast(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `pdwc-toast pdwc-toast-${type}`; // CSS classes for styling
      toast.textContent = message;
      document.body.appendChild(toast);
      // Force a reflow before adding the class to trigger the animation
      void toast.offsetWidth;
      toast.classList.add('pdwc-toast-visible');
      setTimeout(() => {
          toast.classList.remove('pdwc-toast-visible');
          // Listen for transitionend event to remove the element after fade-out
          toast.addEventListener('transitionend', () => {
              if (toast.parentElement) {
                  toast.remove();
              }
          }, { once: true });
          // Fallback removal if transitionend doesn't fire (e.g., no transition defined)
          setTimeout(() => {
              if (toast.parentElement) {
                  toast.remove();
              }
          }, duration + 500); // A bit longer than duration
      }, duration);
  }

  class ContextRetrievalTool {
      constructor(baseUrl) {
          this.toolElement = null;
          this.contentArea = null;
          this.customContextTextArea = null;
          this.copyFormattedButton = null;
          this.copyEscapedButton = null;
          this.closeButton = null;
          this.jinjaCheckbox = null;
          this.refreshMetadataButton = null;
          this.isVisible = false;
          this.rawContextData = null;
          this.modeRadioGroup = null;
          this.storedContextRadio = null;
          this.customContextRadio = null;
          this.contextSourceMode = 'stored';
          this.allAttributes = [];
          this.allSets = [];
          this.allLinkTypes = []; // Added member for link types
          this.baseUrl = baseUrl;
          // Bind methods to ensure 'this' context is correct
          this.show = this.show.bind(this);
          this.hide = this.hide.bind(this);
          this.copyFormattedContextToClipboard = this.copyFormattedContextToClipboard.bind(this);
          this.copyEscapedContextToClipboard = this.copyEscapedContextToClipboard.bind(this);
          this.handleRefreshMetadata = this.handleRefreshMetadata.bind(this);
          this.handleModeChange = this.handleModeChange.bind(this);
          this.boundStorageChangeListener = this.storageChangeListener.bind(this); // Bind listener
      }
      createUI() {
          if (this.toolElement)
              return;
          this.toolElement = document.createElement('div');
          this.toolElement.className = 'pdwc-context-tool';
          this.toolElement.style.display = 'none';
          // Header
          const header = document.createElement('div');
          header.className = 'pdwc-tool-header';
          const title = document.createElement('span');
          title.textContent = 'Retrieved API Context';
          header.appendChild(title);
          this.closeButton = document.createElement('button');
          this.closeButton.innerHTML = '&times;';
          this.closeButton.className = 'pdwc-tool-close-button';
          this.closeButton.onclick = () => this.hide();
          header.appendChild(this.closeButton);
          this.toolElement.appendChild(header);
          // Mode Selection UI
          this.modeRadioGroup = document.createElement('div');
          this.modeRadioGroup.className = 'pdwc-context-mode-selector';
          const storedLabel = document.createElement('label');
          this.storedContextRadio = document.createElement('input');
          this.storedContextRadio.type = 'radio';
          this.storedContextRadio.name = 'contextSourceMode';
          this.storedContextRadio.value = 'stored';
          this.storedContextRadio.checked = true;
          this.storedContextRadio.onchange = this.handleModeChange;
          storedLabel.appendChild(this.storedContextRadio);
          storedLabel.appendChild(document.createTextNode(' Use Stored Context'));
          this.modeRadioGroup.appendChild(storedLabel);
          const customLabel = document.createElement('label');
          this.customContextRadio = document.createElement('input');
          this.customContextRadio.type = 'radio';
          this.customContextRadio.name = 'contextSourceMode';
          this.customContextRadio.value = 'custom';
          this.customContextRadio.onchange = this.handleModeChange;
          customLabel.appendChild(this.customContextRadio);
          customLabel.appendChild(document.createTextNode(' Use Custom Context'));
          this.modeRadioGroup.appendChild(customLabel);
          this.toolElement.appendChild(this.modeRadioGroup);
          // Jinja Checkbox Container
          const jinjaCheckboxContainer = document.createElement('div');
          jinjaCheckboxContainer.style.padding = '10px 15px';
          jinjaCheckboxContainer.style.borderBottom = '1px solid #eee';
          this.jinjaCheckbox = document.createElement('input');
          this.jinjaCheckbox.type = 'checkbox';
          this.jinjaCheckbox.id = 'pdwc-jinja-checkbox';
          this.jinjaCheckbox.style.marginRight = '5px';
          const jinjaLabel = document.createElement('label');
          jinjaLabel.htmlFor = 'pdwc-jinja-checkbox';
          jinjaLabel.textContent = 'Enable Jinja Placeholders';
          jinjaLabel.style.cursor = 'pointer';
          jinjaCheckboxContainer.appendChild(this.jinjaCheckbox);
          jinjaCheckboxContainer.appendChild(jinjaLabel);
          this.toolElement.appendChild(jinjaCheckboxContainer);
          // Content Display Areas
          this.contentArea = document.createElement('pre');
          this.contentArea.className = 'pdwc-context-content-area';
          this.toolElement.appendChild(this.contentArea);
          this.customContextTextArea = document.createElement('textarea');
          this.customContextTextArea.className = 'pdwc-custom-context-textarea';
          this.customContextTextArea.placeholder = 'Paste your JSON context here...';
          this.toolElement.appendChild(this.customContextTextArea);
          // Button Container
          const footer = document.createElement('div');
          footer.className = 'pdwc-tool-footer';
          this.copyFormattedButton = document.createElement('button');
          this.copyFormattedButton.textContent = 'Copy Formatted JSON';
          this.copyFormattedButton.className = 'pdwc-tool-button';
          this.copyFormattedButton.onclick = () => this.copyFormattedContextToClipboard();
          this.copyEscapedButton = document.createElement('button');
          this.copyEscapedButton.textContent = 'Copy as Escaped String';
          this.copyEscapedButton.className = 'pdwc-tool-button';
          this.copyEscapedButton.onclick = () => this.copyEscapedContextToClipboard();
          // Add feedback button
          const feedbackButton = document.createElement('button');
          feedbackButton.className = 'pdwc-feedback-button';
          feedbackButton.title = 'Report an issue';
          feedbackButton.innerHTML = '&#x1F41E;';
          feedbackButton.style.background = 'none';
          feedbackButton.style.border = 'none';
          feedbackButton.style.color = '#f2f2f7';
          feedbackButton.style.fontSize = '16px';
          feedbackButton.style.cursor = 'pointer';
          feedbackButton.style.padding = '0 10px';
          feedbackButton.style.lineHeight = '1';
          feedbackButton.style.opacity = '0.8';
          feedbackButton.style.transition = 'opacity 0.2s';
          feedbackButton.style.position = 'absolute';
          feedbackButton.style.right = '35px';
          feedbackButton.style.top = '5px';
          feedbackButton.onmouseover = () => {
              feedbackButton.style.opacity = '1';
              feedbackButton.style.color = '#ff9f0a';
          };
          feedbackButton.onmouseout = () => {
              feedbackButton.style.opacity = '0.8';
              feedbackButton.style.color = '#f2f2f7';
          };
          feedbackButton.onclick = () => openGitHubIssue('Context Retrieval Tool');
          header.appendChild(feedbackButton);
          this.refreshMetadataButton = document.createElement('button');
          this.refreshMetadataButton.textContent = 'Refresh Metadata';
          this.refreshMetadataButton.className = 'pdwc-tool-button';
          this.refreshMetadataButton.onclick = this.handleRefreshMetadata;
          this.closeButton = document.createElement('button');
          this.closeButton.textContent = 'Close';
          this.closeButton.className = 'pdwc-tool-button';
          this.closeButton.onclick = () => this.hide();
          footer.appendChild(this.copyFormattedButton);
          footer.appendChild(this.copyEscapedButton);
          footer.appendChild(this.refreshMetadataButton);
          footer.appendChild(feedbackButton);
          footer.appendChild(this.closeButton);
          this.toolElement.appendChild(footer);
          document.body.appendChild(this.toolElement);
          this.updateContextDisplayViews();
          this.initializeStoredContextListener(); // For the actual context JSON
      }
      async loadInitialMetadata() {
          try {
              const cachedData = await loadDataFromCache(this.baseUrl);
              if (cachedData) {
                  this.allAttributes = cachedData.attributes || [];
                  this.allSets = cachedData.sets || [];
                  this.allLinkTypes = cachedData.linkTypes || []; // Load linkTypes
                  console.log('PABLO DW CHAD: ContextTool - Loaded attributes, sets, and linkTypes from cache.', this.allAttributes.length, this.allSets.length, this.allLinkTypes.length);
              }
              else {
                  this.allAttributes = [];
                  this.allSets = [];
                  this.allLinkTypes = [];
                  console.warn('PABLO DW CHAD: ContextTool - Could not load attributes/sets/linkTypes from cache or cache was empty for baseUrl:', this.baseUrl);
                  // Optionally trigger a fetch if cache is empty on first load
                  // await this.handleRefreshMetadata(false); 
              }
          }
          catch (error) {
              this.allAttributes = [];
              this.allSets = [];
              this.allLinkTypes = [];
              console.error('PABLO DW CHAD: ContextTool - Error loading initial attributes/sets/linkTypes from cache:', error);
          }
      }
      async show() {
          if (!this.toolElement) {
              this.createUI();
          }
          if (this.toolElement) {
              // Load metadata if not already loaded or if a refresh is desired implicitly on show
              if (this.allAttributes.length === 0 && this.allSets.length === 0 && this.allLinkTypes.length === 0) {
                  await this.loadInitialMetadata();
              }
              this.updateContextDisplayViews();
              this.toolElement.style.display = 'flex';
              this.isVisible = true;
          }
      }
      hide() {
          if (this.toolElement && this.isVisible) {
              this.toolElement.style.display = 'none';
              this.isVisible = false;
          }
      }
      async jinifyContext(context) {
          if (!this.allAttributes.length && !this.allSets.length && !this.allLinkTypes.length) {
              console.warn('PABLO DW CHAD: JinifyContext - Attributes, sets, or linkTypes not loaded or empty. Returning original context.');
              return JSON.parse(JSON.stringify(context)); // Return a deep copy
          }
          const attributeMap = new Map();
          const setMap = new Map();
          const linkTypeMap = new Map();
          for (const set of this.allSets) {
              if (set && typeof set.id === 'number' && typeof set.name === 'string') {
                  setMap.set(set.id, set.name);
              }
          }
          for (const attr of this.allAttributes) {
              if (attr && typeof attr.id === 'number' && typeof attr.name === 'string' && typeof attr.classId === 'number') {
                  const parentSetName = setMap.get(attr.classId);
                  if (parentSetName) {
                      attributeMap.set(attr.id, { name: attr.name, className: parentSetName });
                  }
              }
          }
          for (const linkType of this.allLinkTypes) {
              if (linkType && typeof linkType.id === 'number' && typeof linkType.sourceCollectionId === 'number' && typeof linkType.targetCollectionId === 'number' && typeof linkType.name === 'string') {
                  linkTypeMap.set(linkType.id, { sourceCollectionId: linkType.sourceCollectionId, targetCollectionId: linkType.targetCollectionId, name: linkType.name });
              }
          }
          // New function to transform keys ONLY if they are Set IDs
          const transformKeyIfNeeded = (key) => {
              const parsedNum = parseInt(key, 10);
              // Check if the key is a string representation of a number AND that number is in setMap
              if (!isNaN(parsedNum) && String(parsedNum) === key.trim() && setMap.has(parsedNum)) {
                  const setName = setMap.get(parsedNum);
                  return `{{ DW_METADATA_CACHE.get_entity_class_by_name('${setName}').id }}`;
              }
              return key; // Return original key if not a numeric Set ID
          };
          const transformValue = (value, semanticHint) => {
              let idToTest = null;
              if (typeof value === 'number') {
                  idToTest = value;
              }
              else if (typeof value === 'string') {
                  const parsedNum = parseInt(value, 10);
                  if (!isNaN(parsedNum) && String(parsedNum) === value.trim()) {
                      idToTest = parsedNum;
                  }
              }
              if (idToTest !== null) {
                  if (semanticHint === 'set') {
                      if (setMap.has(idToTest)) {
                          const setName = setMap.get(idToTest);
                          return `{{ DW_METADATA_CACHE.get_entity_class_by_name('${setName}').id }}`;
                      }
                      return `{{ error processing id ${idToTest} as set - not found or permissions? }}`;
                  }
                  else if (semanticHint === 'attribute') {
                      if (attributeMap.has(idToTest)) {
                          const attrInfo = attributeMap.get(idToTest);
                          return `{{ DW_METADATA_CACHE.get_attribute_by_name('${attrInfo.name}', DW_METADATA_CACHE.get_entity_class_by_name('${attrInfo.className}').id).id }}`;
                      }
                      return `{{ error processing id ${idToTest} as attribute - not found or permissions? }}`;
                  }
                  else if (semanticHint === 'link') {
                      if (linkTypeMap.has(idToTest)) {
                          const linkTypeInfo = linkTypeMap.get(idToTest);
                          const sourceClass = setMap.get(linkTypeInfo.sourceCollectionId);
                          const targetClass = setMap.get(linkTypeInfo.targetCollectionId);
                          if (sourceClass && targetClass) {
                              return `{{ DW_METADATA_CACHE.get_link_type_by_name('${linkTypeInfo.name}', DW_METADATA_CACHE.get_entity_class_by_name('${sourceClass}').id, DW_METADATA_CACHE.get_entity_class_by_name('${targetClass}').id).id }}`;
                          }
                          return `{{ error processing id ${idToTest} as link (missing source/target class) - not found or permissions? }}`;
                      }
                      return `{{ error processing id ${idToTest} as link - not found or permissions? }}`;
                  }
                  else { // semanticHint === 'unknown'
                      if (setMap.has(idToTest)) {
                          const setName = setMap.get(idToTest);
                          return `{{ DW_METADATA_CACHE.get_entity_class_by_name('${setName}').id }}`;
                      }
                      else if (attributeMap.has(idToTest)) {
                          const attrInfo = attributeMap.get(idToTest);
                          return `{{ DW_METADATA_CACHE.get_attribute_by_name('${attrInfo.name}', DW_METADATA_CACHE.get_entity_class_by_name('${attrInfo.className}').id).id }}`;
                      }
                      else if (linkTypeMap.has(idToTest)) {
                          const linkTypeInfo = linkTypeMap.get(idToTest);
                          const sourceClass = setMap.get(linkTypeInfo.sourceCollectionId);
                          const targetClass = setMap.get(linkTypeInfo.targetCollectionId);
                          if (sourceClass && targetClass) {
                              return `{{ DW_METADATA_CACHE.get_link_type_by_name('${linkTypeInfo.name}', DW_METADATA_CACHE.get_entity_class_by_name('${sourceClass}').id, DW_METADATA_CACHE.get_entity_class_by_name('${targetClass}').id).id }}`;
                          }
                          return `{{ error processing id ${idToTest} (unknown type, link with missing source/target) - not found or permissions? }}`;
                      }
                      return `{{ error processing id ${idToTest} (unknown type) - not found or permissions? }}`;
                  }
              }
              return value; // Return original value if it's not a potential ID or if no transformation applied based on hint
          };
          const transform = (currentContextPart, semanticHint = 'unknown') => {
              if (Array.isArray(currentContextPart)) {
                  return currentContextPart.map(item => transform(item, semanticHint));
              }
              else if (typeof currentContextPart === 'object' && currentContextPart !== null) {
                  const newObj = {};
                  for (const key in currentContextPart) {
                      if (Object.prototype.hasOwnProperty.call(currentContextPart, key)) {
                          const transformedNewKey = transformKeyIfNeeded(key); // Keys are only hinted as sets (or not at all)
                          let nextSemanticHint = 'unknown';
                          if (key === 'entityClassId' || key === 'entityClassIds' || key === 'classId') {
                              nextSemanticHint = 'set';
                          }
                          else if (key === 'attributeId' || key === 'attributeIds') {
                              nextSemanticHint = 'attribute';
                          }
                          else if (key === 'linkTypeId' || key === 'linkTypeIds') {
                              nextSemanticHint = 'link';
                          }
                          // If the key is 'value', preserve its original value directly.
                          // Otherwise, proceed with the standard transformation.
                          if (key === "value") {
                              newObj[transformedNewKey] = currentContextPart[key];
                          }
                          else {
                              newObj[transformedNewKey] = transform(currentContextPart[key], nextSemanticHint);
                          }
                      }
                  }
                  return newObj;
              }
              else {
                  return transformValue(currentContextPart, semanticHint);
              }
          };
          return transform(JSON.parse(JSON.stringify(context))); // Initial call, no specific hint (defaults to 'unknown')
      }
      handleModeChange() {
          if (this.storedContextRadio?.checked) {
              this.contextSourceMode = 'stored';
          }
          else if (this.customContextRadio?.checked) {
              this.contextSourceMode = 'custom';
          }
          this.updateContextDisplayViews();
      }
      updateContextDisplayViews() {
          if (this.contextSourceMode === 'stored') {
              if (this.contentArea)
                  this.contentArea.style.display = 'block';
              if (this.customContextTextArea)
                  this.customContextTextArea.style.display = 'none';
              chrome.storage.local.get('pdwc_last_retrieved_context', (result) => {
                  if (chrome.runtime.lastError) {
                      console.error('Error retrieving stored context:', chrome.runtime.lastError);
                      if (this.contentArea)
                          this.contentArea.textContent = 'Error loading stored context.';
                      this.rawContextData = null;
                      return;
                  }
                  if (result.pdwc_last_retrieved_context) {
                      this.rawContextData = result.pdwc_last_retrieved_context;
                      if (this.contentArea) {
                          try {
                              this.contentArea.textContent = JSON.stringify(this.rawContextData, null, 2);
                          }
                          catch (e) {
                              console.error('Error stringifying stored context:', e);
                              this.contentArea.textContent = 'Error displaying stored context: Invalid JSON.';
                              this.rawContextData = null;
                          }
                      }
                  }
                  else {
                      if (this.contentArea)
                          this.contentArea.textContent = 'No stored context available.';
                      this.rawContextData = null;
                  }
              });
          }
          else {
              if (this.contentArea)
                  this.contentArea.style.display = 'none';
              if (this.customContextTextArea) {
                  this.customContextTextArea.style.display = 'block';
              }
          }
      }
      async getActiveContext() {
          if (this.contextSourceMode === 'custom') {
              if (!this.customContextTextArea || this.customContextTextArea.value.trim() === '') {
                  alert('Custom context is empty. Please paste your JSON.');
                  return null;
              }
              try {
                  const customData = JSON.parse(this.customContextTextArea.value);
                  this.rawContextData = customData;
                  return customData;
              }
              catch (error) {
                  let errorMessage = 'An unknown error occurred.';
                  if (error instanceof Error) {
                      errorMessage = error.message;
                  }
                  alert('Invalid JSON in custom context area. Please correct it.\n\nError: ' + errorMessage);
                  console.error('PABLO DW CHAD: Error parsing custom JSON context:', error);
                  return null;
              }
          }
          else {
              return this.rawContextData;
          }
      }
      async copyFormattedContextToClipboard() {
          const activeContext = await this.getActiveContext();
          if (!activeContext || !this.copyFormattedButton)
              return;
          this.copyFormattedButton.disabled = true;
          let dataToCopy = activeContext;
          if (this.jinjaCheckbox?.checked) {
              dataToCopy = await this.jinifyContext(activeContext);
          }
          const jsonString = JSON.stringify(dataToCopy, null, 2);
          navigator.clipboard.writeText(jsonString).then(() => {
              const originalText = this.copyFormattedButton.textContent;
              this.copyFormattedButton.textContent = 'Copied!';
              setTimeout(() => {
                  this.copyFormattedButton.textContent = originalText;
                  this.copyFormattedButton.disabled = false;
              }, 1500);
          }).catch(err => {
              console.error('Failed to copy formatted JSON: ', err);
              this.copyFormattedButton.textContent = 'Error!';
              setTimeout(() => {
                  this.copyFormattedButton.textContent = 'Copy Formatted JSON';
                  this.copyFormattedButton.disabled = false;
              }, 1500);
          });
      }
      async copyEscapedContextToClipboard() {
          const activeContext = await this.getActiveContext();
          if (!activeContext || !this.copyEscapedButton)
              return;
          this.copyEscapedButton.disabled = true;
          let dataToCopy = activeContext;
          if (this.jinjaCheckbox?.checked) {
              dataToCopy = await this.jinifyContext(activeContext);
          }
          const compactJsonString = JSON.stringify(dataToCopy);
          navigator.clipboard.writeText(JSON.stringify(compactJsonString)).then(() => {
              const originalText = this.copyEscapedButton.textContent;
              this.copyEscapedButton.textContent = 'Copied!';
              setTimeout(() => {
                  this.copyEscapedButton.textContent = originalText;
                  this.copyEscapedButton.disabled = false;
              }, 1500);
          }).catch(err => {
              console.error('Failed to copy escaped JSON: ', err);
              this.copyEscapedButton.textContent = 'Error!';
              setTimeout(() => {
                  this.copyEscapedButton.textContent = 'Copy as Escaped String';
                  this.copyEscapedButton.disabled = false;
              }, 1500);
          });
      }
      async handleRefreshMetadata() {
          if (!this.refreshMetadataButton)
              return;
          const originalButtonText = this.refreshMetadataButton.innerHTML;
          this.refreshMetadataButton.innerHTML = '&#x21BB; Refreshing...';
          this.refreshMetadataButton.disabled = true;
          try {
              console.log('PABLO DW CHAD: ContextTool - Refreshing metadata...');
              const [newAttributes, newSets] = await Promise.all([
                  fetchAttributes(this.baseUrl), // No token needed
                  fetchSets(this.baseUrl) // No token needed
              ]);
              this.allAttributes = newAttributes;
              this.allSets = newSets;
              this.allLinkTypes = []; // Reset before fetching
              if (this.allSets.length > 0) {
                  console.log(`PABLO DW CHAD: Found ${this.allSets.length} sets. Fetching link types in batches for ContextRetrievalTool.`);
                  const setIds = this.allSets.map(set => set.id);
                  const batchSize = 50; // Same batch size as SuperSearch for consistency
                  for (let i = 0; i < setIds.length; i += batchSize) {
                      const batchOfSetIds = setIds.slice(i, i + batchSize);
                      try {
                          const fetchedLinkTypes = await fetchLinkTypesByClassIds(this.baseUrl, batchOfSetIds);
                          this.allLinkTypes.push(...fetchedLinkTypes);
                      }
                      catch (linkFetchError) {
                          console.error(`PABLO DW CHAD: Error fetching batch of link types for ContextRetrievalTool (Set IDs ${batchOfSetIds.join(', ')}):`, linkFetchError);
                      }
                  }
                  console.log(`PABLO DW CHAD: Finished fetching all link types for ContextRetrievalTool. Total: ${this.allLinkTypes.length}`);
              }
              await saveDataToCache(this.baseUrl, this.allAttributes, this.allSets, this.allLinkTypes);
              console.log('PABLO DW CHAD: ContextTool - Metadata refreshed and cached.', this.allAttributes.length, this.allSets.length, this.allLinkTypes.length);
              this.refreshMetadataButton.innerHTML = '&#x21BB; Refreshed!';
          }
          catch (error) {
              console.error('PABLO DW CHAD: ContextTool - Failed to refresh metadata:', error);
              this.refreshMetadataButton.innerHTML = '&#x21BB; Error!';
          }
          finally {
              setTimeout(() => {
                  if (this.refreshMetadataButton) {
                      this.refreshMetadataButton.innerHTML = originalButtonText;
                      this.refreshMetadataButton.disabled = false;
                  }
              }, 2000);
          }
      }
      getElement() {
          return this.toolElement;
      }
      getIsVisible() {
          return this.isVisible;
      }
      storageChangeListener(changes, namespace) {
          if (namespace === 'local' && changes.pdwc_last_retrieved_context) {
              console.log("PABLO'S DW CHAD: CRT - Detected change in pdwc_last_retrieved_context via storage listener.");
              if (this.contextSourceMode === 'stored') {
                  this.rawContextData = changes.pdwc_last_retrieved_context.newValue || null;
                  this.updateContextDisplayViews();
                  showToast('Stored context updated automatically.', 'info', 2000);
              }
              else {
                  this.rawContextData = changes.pdwc_last_retrieved_context.newValue || null;
                  console.log("PABLO'S DW CHAD: CRT - In custom mode; pdwc_last_retrieved_context updated in background.");
              }
          }
      }
      initializeStoredContextListener() {
          chrome.storage.local.get('pdwc_last_retrieved_context', (result) => {
              if (chrome.runtime.lastError) {
                  console.error("PABLO'S DW CHAD: CRT - Error getting initial stored context:", chrome.runtime.lastError.message);
                  this.rawContextData = null;
              }
              else {
                  this.rawContextData = result.pdwc_last_retrieved_context || null;
                  console.log("PABLO'S DW CHAD: CRT - Initial stored context loaded:", this.rawContextData ? 'Data found' : 'No data');
              }
              if (this.contextSourceMode === 'stored') {
                  this.updateContextDisplayViews();
              }
          });
          chrome.storage.onChanged.addListener(this.boundStorageChangeListener);
      }
  }

  // src/content_scripts/content_script.ts
  console.log(`PABLO'S DW CHAD: Content script loaded.`);
  let baseUrl = null;
  let datawalkAppVersion = null;
  let pdwcInitialized = false; // Flag to ensure UI is initialized only once
  /**
   * Injects a script into the page to access window variables.
   */
  function injectPageScript() {
      try {
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('injected_script.js');
          (document.head || document.documentElement).appendChild(script);
          script.onload = () => {
              console.log(`PABLO'S DW CHAD: Injected script loaded.`);
              script.remove(); // Clean up the script tag
          };
          script.onerror = (e) => {
              console.error(`PABLO'S DW CHAD: Error loading injected_script.js`, e);
          };
      }
      catch (e) {
          console.error(`PABLO'S DW CHAD: Error injecting page script:`, e);
      }
  }
  /**
   * Handles messages from the injected script.
   */
  window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data.type || !event.data.source?.startsWith('pablos-dw-chad-injected')) {
          return;
      }
      console.log(`PABLO'S DW CHAD: Message received in content script from injected script:`, event.data);
      if (event.data.type === 'DATAWALK_APP_INFO') {
          baseUrl = event.data.baseUrl;
          datawalkAppVersion = event.data.version;
          console.log(`PABLO'S DW CHAD: Received DataWalk info:`, { baseUrl, datawalkAppVersion });
          if (baseUrl && datawalkAppVersion) {
              initializeExtensionUI();
          }
          else {
              console.warn(`PABLO'S DW CHAD: Could not retrieve necessary DataWalk info from page.`);
          }
      }
      else if (event.data.type === 'DATAWALK_APP_INFO_NOT_FOUND') {
          console.warn(`PABLO'S DW CHAD: DATAWALK_APP_VERSION or baseUrl not found by injected script.`);
      }
  });
  function initializeExtensionUI() {
      if (pdwcInitialized) {
          console.log(`PABLO'S DW CHAD: UI already initialized.`);
          return;
      }
      pdwcInitialized = true;
      console.log(`PABLO'S DW CHAD: Initializing UI...`);
      // Inject FontAwesome if not already available
      if (!document.querySelector('link[href*="fontawesome"]') && !document.querySelector('style[id*="fontawesome"]')) {
          const faLink = document.createElement('link');
          faLink.rel = 'stylesheet';
          faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'; // Using a specific, recent version
          faLink.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
          faLink.crossOrigin = 'anonymous';
          faLink.referrerPolicy = 'no-referrer';
          document.head.appendChild(faLink);
          console.log(`PABLO'S DW CHAD: FontAwesome CSS injected.`);
      }
      // Define the SuperSearch instance globally or in a way it can be accessed/reused
      let superSearchInstance = null;
      // Instantiate the new ContextRetrievalTool
      let contextRetrievalTool = null;
      if (baseUrl) {
          contextRetrievalTool = new ContextRetrievalTool(baseUrl);
      }
      else {
          console.warn("PABLO'S DW CHAD: BaseURL not available, ContextRetrievalTool not initialized.");
      }
      const openSuperSearch = () => {
          if (!baseUrl) {
              console.error(`PABLO'S DW CHAD: Base URL not available for Super Search.`);
              alert('Error: DataWalk Base URL not found. Cannot open Super Search.');
              return;
          }
          if (!superSearchInstance || !document.body.contains(superSearchInstance.getElement())) {
              superSearchInstance = new SuperSearch(baseUrl);
              document.body.appendChild(superSearchInstance.getElement());
          }
          superSearchInstance.open();
          console.log("PABLO'S DW CHAD: SuperSearch opened via icon click.");
      };
      const openCodeTool = () => {
          console.log("PABLO'S DW CHAD: Code tool icon clicked, opening SQL Config Converter.");
          const converterTool = SqlConfigConverterTool.getInstance();
          converterTool.open();
      };
      const openContextRetrievalTool = () => {
          console.log("PABLO'S DW CHAD: Context retrieval icon clicked, toggling tool.");
          if (contextRetrievalTool) {
              if (contextRetrievalTool.getIsVisible()) {
                  contextRetrievalTool.hide();
              }
              else {
                  contextRetrievalTool.show();
              }
          }
          else {
              console.warn("PABLO'S DW CHAD: ContextRetrievalTool not initialized because baseUrl was not available.");
          }
      };
      const toolMenu = new ToolMenu((toolId) => {
          console.log(`PABLO'S DW CHAD: Tool selected from menu:`, toolId);
          if (toolId === 'super-search') {
              openSuperSearch(); // Use the refactored function
          }
          // Add other tool menu item handlers here if any
      });
      // Append menu to body, it will be hidden by default
      document.body.appendChild(toolMenu.getElement());
      // Instantiate DraggableIcon with callbacks for the new tool icons
      // and the original main icon click handler for the ToolMenu
      const draggableIcon = new DraggableIcon(openSuperSearch, // Callback for search icon
      openCodeTool, // Callback for code icon
      openContextRetrievalTool, // Callback for the new context icon
      () => {
          console.log("PABLO'S DW CHAD: Main DraggableIcon onClick triggered, opening ToolMenu.");
          const iconRect = draggableIcon.getElement().getBoundingClientRect();
          toolMenu.toggle(iconRect.left, iconRect.top);
      });
      document.body.appendChild(draggableIcon.getElement());
      console.log(`PABLO'S DW CHAD: Draggable icon, tool menu, and new icon handlers initialized.`);
  }
  /**
   * Check for DATAWALK_APP_VERSION and baseUrl.
   */
  function checkForDatawalk() {
      console.log(`PABLO'S DW CHAD: Checking for DataWalk environment by injecting script...`);
      injectPageScript(); // The injected script will post a message back
  }
  // Start the activation check
  // Run after the DOM is loaded to ensure document.head is available
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkForDatawalk);
  }
  else {
      checkForDatawalk();
  }
  // Ensure that if the page uses dynamic loading (SPA), we might need to re-check or use a more robust detection.
  // For now, standard DOM loading is assumed.

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudF9zY3JpcHQuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvZGF0YXdhbGtTZXJ2aWNlLnRzIiwiLi4vc3JjL3V0aWxzL3VybFV0aWxzLnRzIiwiLi4vc3JjL3V0aWxzL2ZlZWRiYWNrVXRpbHMudHMiLCIuLi9zcmMvdWkvRGVwbG95ZWRBcHBzVG9vbC50cyIsIi4uL3NyYy91aS9TZXRUcnVuY2F0aW9uVG9vbC50cyIsIi4uL3NyYy91aS9EcmFnZ2FibGVJY29uLnRzIiwiLi4vc3JjL3VpL1Rvb2xNZW51LnRzIiwiLi4vc3JjL2NhY2hlU2VydmljZS50cyIsIi4uL3NyYy91aS9TdXBlclNlYXJjaC50cyIsIi4uL3NyYy91aS9TcWxDb25maWdDb252ZXJ0ZXJUb29sLnRzIiwiLi4vc3JjL3V0aWxzL2RvbVV0aWxzLnRzIiwiLi4vc3JjL3VpL0NvbnRleHRSZXRyaWV2YWxUb29sLnRzIiwiLi4vc3JjL2NvbnRlbnRfc2NyaXB0cy9jb250ZW50X3NjcmlwdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvYXBpL2RhdGF3YWxrU2VydmljZS50c1xuaW1wb3J0IHR5cGUgeyBBdHRyaWJ1dGUgfSBmcm9tICcuL21vZGVsL2dldF9saXN0QXR0cmlidXRlcyc7XG5pbXBvcnQgdHlwZSB7IFNldCB9IGZyb20gJy4vbW9kZWwvZ2V0X2xpc3RTZXRzJztcbmltcG9ydCB0eXBlIHsgRGF0YVdhbGtMaW5rVHlwZSB9IGZyb20gJy4uL3R5cGVzL2RhdGFNb2RlbHMnO1xuaW1wb3J0IHR5cGUgeyBEeW5hbWljRW5kcG9pbnRzUmVzcG9uc2UsIER5bmFtaWNFbmRwb2ludE1hcHBpbmcgfSBmcm9tICcuL21vZGVsL2R5bmFtaWNFbmRwb2ludHMnO1xuaW1wb3J0IHR5cGUgeyBDb21iaW5lZEFwcEluZm8gfSBmcm9tICcuL21vZGVsL2NvbWJpbmVkQXBwSW5mbyc7IC8vIENvcnJlY3RlZCBpbXBvcnQgcGF0aFxuaW1wb3J0IHR5cGUgeyBEYXRhV2Fsa0FwaVJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMvZGF0YU1vZGVscyc7XG5cbmNvbnN0IENPTU1PTl9IRUFERVJTID0ge1xuICAnYWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAnYWNjZXB0LWxhbmd1YWdlJzogJ2VuLVVTLGVuO3E9MC45LHBsO3E9MC44JywgLy8gTWF0Y2hpbmcgeW91ciBtb2NrdXBcbiAgLy8gT3RoZXIgc2VjLSBoZWFkZXJzIGFyZSB1c3VhbGx5IGJyb3dzZXItYWRkZWQgYW5kIG5vdCBuZWVkZWQgaW4gZmV0Y2gsIGJ1dCBjYW4gYmUgYWRkZWQgaWYgcmVxdWlyZWQgYnkgc2VydmVyXG59O1xuXG4vKipcbiAqIEZldGNoZXMgdGhlIGxpc3Qgb2YgYWxsIGF0dHJpYnV0ZXMgZnJvbSB0aGUgRGF0YVdhbGsgQVBJLlxuICogQHBhcmFtIGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IG9mIEF0dHJpYnV0ZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEF0dHJpYnV0ZXMoYmFzZVVybDogc3RyaW5nKTogUHJvbWlzZTxBdHRyaWJ1dGVbXT4ge1xuICBjb25zdCBlbmRwb2ludCA9IGAke2Jhc2VVcmx9L2FwaS92MS9tZXRhZGF0YS9hdHRyaWJ1dGUvbGlzdGA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGVuZHBvaW50LCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgaGVhZGVyczogQ09NTU9OX0hFQURFUlMsXG4gICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgbW9kZTogJ2NvcnMnLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBBUEkgRXJyb3IgZmV0Y2hpbmcgYXR0cmlidXRlcy4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gLCBhd2FpdCByZXNwb25zZS50ZXh0KCkpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggYXR0cmlidXRlczogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGRhdGEgYXMgQXR0cmlidXRlW107IC8vIEFzc3VtaW5nIHRoZSByZXNwb25zZSBkaXJlY3RseSBtYXRjaGVzIEF0dHJpYnV0ZVtdXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gZmV0Y2hBdHRyaWJ1dGVzOlwiLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7IC8vIFJlLXRocm93IHRvIGFsbG93IGNhbGxlciB0byBoYW5kbGVcbiAgfVxufVxuXG4vKipcbiAqIEZldGNoZXMgdGhlIGxpc3Qgb2YgYWxsIHNldHMgKGNsYXNzZXMpIGZyb20gdGhlIERhdGFXYWxrIEFQSS5cbiAqIEBwYXJhbSBiYXNlVXJsIFRoZSBiYXNlIFVSTCBvZiB0aGUgRGF0YVdhbGsgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBhcnJheSBvZiBTZXRzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hTZXRzKGJhc2VVcmw6IHN0cmluZyk6IFByb21pc2U8U2V0W10+IHtcbiAgY29uc3QgZW5kcG9pbnQgPSBgJHtiYXNlVXJsfS9hcGkvdjEvbWV0YWRhdGEvY2xhc3MvbGlzdGA7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGVuZHBvaW50LCB7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgaGVhZGVyczogQ09NTU9OX0hFQURFUlMsXG4gICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgbW9kZTogJ2NvcnMnLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBBUEkgRXJyb3IgZmV0Y2hpbmcgc2V0cy4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gLCBhd2FpdCByZXNwb25zZS50ZXh0KCkpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggc2V0czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGRhdGEgYXMgU2V0W107IC8vIEFzc3VtaW5nIHRoZSByZXNwb25zZSBkaXJlY3RseSBtYXRjaGVzIFNldFtdXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gZmV0Y2hTZXRzOlwiLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7IC8vIFJlLXRocm93IHRvIGFsbG93IGNhbGxlciB0byBoYW5kbGVcbiAgfVxufVxuXG4vKipcbiAqIEZldGNoZXMgbGluayB0eXBlcyBiYXNlZCBvbiBhIGxpc3Qgb2YgY2xhc3MgKHNldCkgSURzLlxuICogQHBhcmFtIGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEBwYXJhbSBjbGFzc0lkcyBBbiBhcnJheSBvZiBudW1iZXJzIHJlcHJlc2VudGluZyB0aGUgY2xhc3MgKHNldCkgSURzLlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2YgRGF0YVdhbGtMaW5rVHlwZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoTGlua1R5cGVzQnlDbGFzc0lkcyhiYXNlVXJsOiBzdHJpbmcsIGNsYXNzSWRzOiBudW1iZXJbXSk6IFByb21pc2U8RGF0YVdhbGtMaW5rVHlwZVtdPiB7XG4gIGlmICghY2xhc3NJZHMgfHwgY2xhc3NJZHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS53YXJuKFwiUEFCTE8nUyBEVyBDSEFEOiBmZXRjaExpbmtUeXBlc0J5Q2xhc3NJZHMgY2FsbGVkIHdpdGggbm8gY2xhc3NJZHMuIFJldHVybmluZyBlbXB0eSBhcnJheS5cIik7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgYmF0Y2hFbmRwb2ludCA9IGAke2Jhc2VVcmx9L2FwaS92MS9tZXRhZGF0YS9saW5rdHlwZS9iYXRjaC9jbGFzcy8ke2NsYXNzSWRzLmpvaW4oJywnKX1gO1xuICBjb25zdCBjb21tb25GZXRjaE9wdGlvbnMgPSB7XG4gICAgbWV0aG9kOiAnR0VUJyxcbiAgICBoZWFkZXJzOiBDT01NT05fSEVBREVSUyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnIGFzIFJlcXVlc3RDcmVkZW50aWFscyxcbiAgICBtb2RlOiAnY29ycycgYXMgUmVxdWVzdE1vZGUsXG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBiYXRjaFJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYmF0Y2hFbmRwb2ludCwgY29tbW9uRmV0Y2hPcHRpb25zKTtcblxuICAgIGlmIChiYXRjaFJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgYmF0Y2hSZXNwb25zZS5qc29uKCk7XG4gICAgICByZXR1cm4gZGF0YSBhcyBEYXRhV2Fsa0xpbmtUeXBlW107XG4gICAgfSBlbHNlIGlmIChiYXRjaFJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBQQUJMTydTIERXIENIQUQ6IEJhdGNoIGVuZHBvaW50IGZvciBsaW5rIHR5cGVzICgke2JhdGNoRW5kcG9pbnR9KSBub3QgZm91bmQgKDQwNCkuIEZhbGxpbmcgYmFjayB0byBpbmRpdmlkdWFsIHJlcXVlc3RzIGZvciAke2NsYXNzSWRzLmxlbmd0aH0gY2xhc3MgSURzLmBcbiAgICAgICk7XG4gICAgICBjb25zdCBhbGxMaW5rVHlwZXM6IERhdGFXYWxrTGlua1R5cGVbXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBjbGFzc0lkIG9mIGNsYXNzSWRzKSB7XG4gICAgICAgIGNvbnN0IHNpbmdsZUNsYXNzRW5kcG9pbnQgPSBgJHtiYXNlVXJsfS9hcGkvdjEvbWV0YWRhdGEvbGlua3R5cGUvY2xhc3MvJHtjbGFzc0lkfWA7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3Qgc2luZ2xlUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChzaW5nbGVDbGFzc0VuZHBvaW50LCBjb21tb25GZXRjaE9wdGlvbnMpO1xuICAgICAgICAgIGlmIChzaW5nbGVSZXNwb25zZS5vaykge1xuICAgICAgICAgICAgLy8gQXNzdW1pbmcgdGhlIHNpbmdsZSBlbmRwb2ludCByZXR1cm5zIERhdGFXYWxrTGlua1R5cGVbXSBmb3IgY29uc2lzdGVuY3ksIGV2ZW4gaWYgaXQncyBmb3Igb25lIGNsYXNzXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgc2luZ2xlIERhdGFXYWxrTGlua1R5cGUgb2JqZWN0LCB0aGlzIHdvdWxkIG5lZWQgYWRqdXN0bWVudCAoZS5nLiwgYWxsTGlua1R5cGVzLnB1c2goYXdhaXQgc2luZ2xlUmVzcG9uc2UuanNvbigpKSlcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlua1R5cGVzID0gYXdhaXQgc2luZ2xlUmVzcG9uc2UuanNvbigpIGFzIERhdGFXYWxrTGlua1R5cGVbXTsgXG4gICAgICAgICAgICBhbGxMaW5rVHlwZXMucHVzaCguLi5jbGFzc0xpbmtUeXBlcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgIGBQQUJMTydTIERXIENIQUQ6IEFQSSBFcnJvciBmZXRjaGluZyBsaW5rIHR5cGVzIGZvciBjbGFzc0lkICR7Y2xhc3NJZH0gKGZhbGxiYWNrKS4gRW5kcG9pbnQ6ICR7c2luZ2xlQ2xhc3NFbmRwb2ludH0uIFN0YXR1czogJHtzaW5nbGVSZXNwb25zZS5zdGF0dXN9YCxcbiAgICAgICAgICAgICAgYXdhaXQgc2luZ2xlUmVzcG9uc2UudGV4dCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoaW5kaXZpZHVhbEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBQQUJMTydTIERXIENIQUQ6IE5ldHdvcmsgb3Igb3RoZXIgZXJyb3IgZmV0Y2hpbmcgbGluayB0eXBlcyBmb3IgY2xhc3NJZCAke2NsYXNzSWR9IChmYWxsYmFjaykuIEVuZHBvaW50OiAke3NpbmdsZUNsYXNzRW5kcG9pbnR9OmAsXG4gICAgICAgICAgICBpbmRpdmlkdWFsRXJyb3JcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFBBQkxPJ1MgRFcgQ0hBRDogRmFsbGJhY2sgZm9yIGZldGNoTGlua1R5cGVzQnlDbGFzc0lkcyBjb21wbGV0ZWQuIEZldGNoZWQgJHthbGxMaW5rVHlwZXMubGVuZ3RofSBsaW5rIHR5cGVzIGluZGl2aWR1YWxseS5gXG4gICAgICApO1xuICAgICAgcmV0dXJuIGFsbExpbmtUeXBlcztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSGFuZGxlIG90aGVyIG5vbi1PSyBzdGF0dXNlcyBmb3IgdGhlIGJhdGNoIHJlcXVlc3RcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBQQUJMTydTIERXIENIQUQ6IEFQSSBFcnJvciBmZXRjaGluZyBsaW5rIHR5cGVzIChiYXRjaCkuIEVuZHBvaW50OiAke2JhdGNoRW5kcG9pbnR9LiBTdGF0dXM6ICR7YmF0Y2hSZXNwb25zZS5zdGF0dXN9YCxcbiAgICAgICAgYXdhaXQgYmF0Y2hSZXNwb25zZS50ZXh0KClcbiAgICAgICk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBsaW5rIHR5cGVzOiAke2JhdGNoUmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBDYXRjaCBlcnJvcnMgZnJvbSB0aGUgaW5pdGlhbCBiYXRjaCBmZXRjaCBhdHRlbXB0IG9yIHVuaGFuZGxlZCBlcnJvcnMgZnJvbSBmYWxsYmFja1xuICAgIGNvbnNvbGUuZXJyb3IoXCJQQUJMTydTIERXIENIQUQ6IEdlbmVyYWwgZXJyb3IgaW4gZmV0Y2hMaW5rVHlwZXNCeUNsYXNzSWRzLiBCYXRjaCBFbmRwb2ludDogJHtiYXRjaEVuZHBvaW50fTpcIiwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yOyAvLyBSZS10aHJvdyB0byBhbGxvdyBjYWxsZXIgdG8gaGFuZGxlXG4gIH1cbn1cblxuLyoqXG4gKiBGZXRjaGVzIGR5bmFtaWMgZW5kcG9pbnRzIGZyb20gdGhlIERhdGFXYWxrIEFQSS5cbiAqIEBwYXJhbSBiYXNlVXJsIFRoZSBiYXNlIFVSTCBvZiB0aGUgRGF0YVdhbGsgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIER5bmFtaWNFbmRwb2ludHNSZXNwb25zZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBVbnJlZ2lzdGVyRHluYW1pY0VuZHBvaW50UmVxdWVzdCB7XG4gIGFwcEV4ZWN1dGlvblV1aWQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBVbnJlZ2lzdGVycyBhIGR5bmFtaWMgZW5kcG9pbnQgZnJvbSB0aGUgRGF0YVdhbGsgQVBJLlxuICogQHBhcmFtIGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEBwYXJhbSBhcHBFeGVjdXRpb25VdWlkIFRoZSBVVUlEIG9mIHRoZSBhcHAgZXhlY3V0aW9uIHRvIHVucmVnaXN0ZXIuXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBvcGVyYXRpb24gaXMgY29tcGxldGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bnJlZ2lzdGVyRHluYW1pY0VuZHBvaW50KFxuICBiYXNlVXJsOiBzdHJpbmcsXG4gIGFwcEV4ZWN1dGlvblV1aWQ6IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVuZHBvaW50ID0gYCR7YmFzZVVybH0vYXBpL3YxL2V4dC9keW5hbWljLWVuZHBvaW50L3VucmVnaXN0ZXJgO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgLi4uQ09NTU9OX0hFQURFUlMsXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYXBwRXhlY3V0aW9uVXVpZCB9KSxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogQVBJIEVycm9yIHVucmVnaXN0ZXJpbmcgZHluYW1pYyBlbmRwb2ludC4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gLCBhd2FpdCByZXNwb25zZS50ZXh0KCkpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gdW5yZWdpc3RlciBkeW5hbWljIGVuZHBvaW50OiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgdW5yZWdpc3RlcmluZyBkeW5hbWljIGVuZHBvaW50OlwiLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldER5bmFtaWNFbmRwb2ludHMoYmFzZVVybDogc3RyaW5nKTogUHJvbWlzZTxEeW5hbWljRW5kcG9pbnRzUmVzcG9uc2U+IHtcbiAgY29uc3QgZW5kcG9pbnQgPSBgJHtiYXNlVXJsfS9hcGkvdjEvZXh0L2R5bmFtaWMtZW5kcG9pbnRgO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGhlYWRlcnM6IENPTU1PTl9IRUFERVJTLFxuICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogQVBJIEVycm9yIGZldGNoaW5nIGR5bmFtaWMgZW5kcG9pbnRzLiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWAsIGF3YWl0IHJlc3BvbnNlLnRleHQoKSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBkeW5hbWljIGVuZHBvaW50czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGRhdGEgYXMgRHluYW1pY0VuZHBvaW50c1Jlc3BvbnNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJQQUJMTydTIERXIENIQUQ6IEVycm9yIGluIGdldER5bmFtaWNFbmRwb2ludHM6XCIsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjsgLy8gUmUtdGhyb3cgdG8gYWxsb3cgY2FsbGVyIHRvIGhhbmRsZVxuICB9XG59XG5cbi8qKlxuICogRmV0Y2hlcyBwdWJsaWMgZHluYW1pYyBlbmRwb2ludHMgZnJvbSB0aGUgRGF0YVdhbGsgQVBJLlxuICogQHBhcmFtIGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgRHluYW1pY0VuZHBvaW50c1Jlc3BvbnNlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHVibGljRHluYW1pY0VuZHBvaW50cyhiYXNlVXJsOiBzdHJpbmcpOiBQcm9taXNlPER5bmFtaWNFbmRwb2ludHNSZXNwb25zZT4ge1xuICBjb25zdCBlbmRwb2ludCA9IGAke2Jhc2VVcmx9L2FwaS92MS9leHQvZHluYW1pYy1lbmRwb2ludC9wdWJsaWNgO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGhlYWRlcnM6IENPTU1PTl9IRUFERVJTLFxuICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogQVBJIEVycm9yIGZldGNoaW5nIHB1YmxpYyBkeW5hbWljIGVuZHBvaW50cy4gU3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gLCBhd2FpdCByZXNwb25zZS50ZXh0KCkpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggcHVibGljIGR5bmFtaWMgZW5kcG9pbnRzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcbiAgICB9XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4gZGF0YSBhcyBEeW5hbWljRW5kcG9pbnRzUmVzcG9uc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gZ2V0UHVibGljRHluYW1pY0VuZHBvaW50czpcIiwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yOyAvLyBSZS10aHJvdyB0byBhbGxvdyBjYWxsZXIgdG8gaGFuZGxlXG4gIH1cbn1cblxuLyoqXG4gKiBGZXRjaGVzIGFuZCBjb21iaW5lcyBpbmZvcm1hdGlvbiBhYm91dCBkZXBsb3llZCBhcHBsaWNhdGlvbnMgZnJvbSBib3RoIGludGVybmFsIGFuZCBwdWJsaWMgZHluYW1pYyBlbmRwb2ludHMuXG4gKiBAcGFyYW0gYmFzZVVybCBUaGUgYmFzZSBVUkwgb2YgdGhlIERhdGFXYWxrIGluc3RhbmNlLlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2YgQ29tYmluZWRBcHBJbmZvIG9iamVjdHMuXG4gKi9cbi8qKlxuICogVHJ1bmNhdGVzIGFsbCBkYXRhIGluIGEgc3BlY2lmaWMgc2V0L2NsYXNzLlxuICogQHBhcmFtIGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEBwYXJhbSBzZXRJZCBUaGUgSUQgb2YgdGhlIHNldC9jbGFzcyB0byB0cnVuY2F0ZS5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBBUEkgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cnVuY2F0ZVNldChiYXNlVXJsOiBzdHJpbmcsIHNldElkOiBudW1iZXIpOiBQcm9taXNlPERhdGFXYWxrQXBpUmVzcG9uc2U8eyBzdWNjZXNzOiBib29sZWFuOyBtZXNzYWdlOiBzdHJpbmcgfT4+IHtcbiAgY29uc3QgZW5kcG9pbnQgPSBgJHtiYXNlVXJsfS9hcGkvdjEvbWV0YWRhdGEvY2xhc3MvdHJ1bmNhdGUvJHtzZXRJZH1gO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbmRwb2ludCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIC4uLkNPTU1PTl9IRUFERVJTLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgfSxcbiAgICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZScsXG4gICAgICBtb2RlOiAnY29ycycsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7fSkgLy8gRW1wdHkgYm9keSBhcyByZXF1aXJlZCBieSB0aGUgZW5kcG9pbnRcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogQVBJIEVycm9yIHRydW5jYXRpbmcgc2V0ICR7c2V0SWR9LiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWAsIGVycm9yVGV4dCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB0cnVuY2F0ZSBzZXQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3JUZXh0fWApO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBpZiByZXNwb25zZSBoYXMgY29udGVudCBiZWZvcmUgdHJ5aW5nIHRvIHBhcnNlIGFzIEpTT05cbiAgICBjb25zdCByZXNwb25zZVRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgaWYgKCFyZXNwb25zZVRleHQpIHtcbiAgICAgIC8vIFJldHVybiBhIHN1Y2Nlc3MgcmVzcG9uc2UgaWYgdGhlIHJlc3BvbnNlIGlzIGVtcHR5XG4gICAgICByZXR1cm4geyBkYXRhOiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdTZXQgdHJ1bmNhdGVkIHN1Y2Nlc3NmdWxseScgfSB9O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gdHJ1bmNhdGVTZXQ6YCwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb21iaW5lZEFwcEluZm9MaXN0KGJhc2VVcmw6IHN0cmluZyk6IFByb21pc2U8Q29tYmluZWRBcHBJbmZvW10+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBbaW50ZXJuYWxBcHBzUmVzcG9uc2UsIHB1YmxpY0FwcHNSZXNwb25zZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBnZXREeW5hbWljRW5kcG9pbnRzKGJhc2VVcmwpLFxuICAgICAgZ2V0UHVibGljRHluYW1pY0VuZHBvaW50cyhiYXNlVXJsKVxuICAgIF0pO1xuXG4gICAgY29uc3QgY29tYmluZWRBcHBzTWFwID0gbmV3IE1hcDxzdHJpbmcsIENvbWJpbmVkQXBwSW5mbz4oKTtcblxuICAgIC8vIFByb2Nlc3MgaW50ZXJuYWwgYXBwc1xuICAgIGludGVybmFsQXBwc1Jlc3BvbnNlLm1hcHBpbmdzLmZvckVhY2goYXBwID0+IHtcbiAgICAgIGNvbWJpbmVkQXBwc01hcC5zZXQoYXBwLmFwcEV4ZWN1dGlvblV1aWQsIHtcbiAgICAgICAgYXBwRXhlY3V0aW9uVXVpZDogYXBwLmFwcEV4ZWN1dGlvblV1aWQsXG4gICAgICAgIGFwcE5hbWU6IGFwcC5hcHBOYW1lLFxuICAgICAgICBhcHBDb25maWd1cmF0aW9uTmFtZTogYXBwLmFwcENvbmZpZ3VyYXRpb25OYW1lLFxuICAgICAgICBpbnRlcm5hbERlc3RpbmF0aW9uSG9zdDogYXBwLmRlc3RpbmF0aW9uSG9zdCxcbiAgICAgICAgaW50ZXJuYWxQb3J0TWFwcGluZ3M6IGFwcC5wb3J0TWFwcGluZ3MsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIFByb2Nlc3MgcHVibGljIGFwcHMgYW5kIG1lcmdlIHdpdGggZXhpc3RpbmcgZW50cmllc1xuICAgIHB1YmxpY0FwcHNSZXNwb25zZS5tYXBwaW5ncy5mb3JFYWNoKHB1YmxpY0FwcCA9PiB7XG4gICAgICBjb25zdCBleGlzdGluZ0FwcCA9IGNvbWJpbmVkQXBwc01hcC5nZXQocHVibGljQXBwLmFwcEV4ZWN1dGlvblV1aWQpO1xuICAgICAgaWYgKGV4aXN0aW5nQXBwKSB7XG4gICAgICAgIGV4aXN0aW5nQXBwLnB1YmxpY1BvcnRNYXBwaW5ncyA9IHB1YmxpY0FwcC5wb3J0TWFwcGluZ3M7XG4gICAgICAgIC8vIE9wdGlvbmFsbHkgdXBkYXRlIGFwcE5hbWUgb3IgYXBwQ29uZmlndXJhdGlvbk5hbWUgaWYgdGhleSBjYW4gZGlmZmVyIGFuZCBwdWJsaWMgaXMgcHJlZmVycmVkXG4gICAgICAgIC8vIEZvciBub3csIHdlIGFzc3VtZSB0aGV5IGFyZSBjb25zaXN0ZW50IG9yIGludGVybmFsIGlzIHByaW1hcnkgZm9yIHRoZXNlIGNvbW1vbiBmaWVsZHMuXG4gICAgICAgIC8vIGV4aXN0aW5nQXBwLnB1YmxpY0Rlc3RpbmF0aW9uSG9zdCA9IHB1YmxpY0FwcC5kZXN0aW5hdGlvbkhvc3Q7IC8vIENhbiBiZSBhZGRlZCBpZiBuZWVkZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEFwcCBleGlzdHMgb25seSBpbiBwdWJsaWMgbGlzdFxuICAgICAgICBjb21iaW5lZEFwcHNNYXAuc2V0KHB1YmxpY0FwcC5hcHBFeGVjdXRpb25VdWlkLCB7XG4gICAgICAgICAgYXBwRXhlY3V0aW9uVXVpZDogcHVibGljQXBwLmFwcEV4ZWN1dGlvblV1aWQsXG4gICAgICAgICAgYXBwTmFtZTogcHVibGljQXBwLmFwcE5hbWUsXG4gICAgICAgICAgYXBwQ29uZmlndXJhdGlvbk5hbWU6IHB1YmxpY0FwcC5hcHBDb25maWd1cmF0aW9uTmFtZSxcbiAgICAgICAgICBwdWJsaWNQb3J0TWFwcGluZ3M6IHB1YmxpY0FwcC5wb3J0TWFwcGluZ3MsXG4gICAgICAgICAgLy8gcHVibGljRGVzdGluYXRpb25Ib3N0OiBwdWJsaWNBcHAuZGVzdGluYXRpb25Ib3N0LCAvLyBDYW4gYmUgYWRkZWQgaWYgbmVlZGVkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oY29tYmluZWRBcHBzTWFwLnZhbHVlcygpKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJQQUJMTydTIERXIENIQUQ6IEVycm9yIGluIGdldENvbWJpbmVkQXBwSW5mb0xpc3Q6XCIsIGVycm9yKTtcbiAgICAvLyBEZXBlbmRpbmcgb24gZGVzaXJlZCBlcnJvciBoYW5kbGluZywgeW91IG1pZ2h0IHdhbnQgdG8gcmV0dXJuIGFuIGVtcHR5IGFycmF5IG9yIHJlLXRocm93XG4gICAgLy8gRm9yIG5vdywgcmUtdGhyb3dpbmcgdG8gbGV0IHRoZSBjYWxsZXIgZGVjaWRlLlxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG4iLCIvLyBzcmMvdXRpbHMvdXJsVXRpbHMudHNcblxuLyoqXG4gKiBHZXRzIHRoZSBiYXNlIFVSTCBvZiB0aGUgY3VycmVudCBEYXRhV2FsayBpbnN0YW5jZS5cbiAqIEFzc3VtZXMgdGhlIHNjcmlwdCBpcyBydW5uaW5nIGluIHRoZSBjb250ZXh0IG9mIGEgRGF0YVdhbGsgcGFnZS5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBiYXNlIFVSTCAoZS5nLiwgJ2h0dHBzOi8vZXhhbXBsZS5kYXRhd2Fsay5jb20nKSBvciBudWxsIGlmIG5vdCBkZXRlcm1pbmFibGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAvLyBJbiB0aGUgY29udGV4dCBvZiBhIGNvbnRlbnQgc2NyaXB0IG9yIGluamVjdGVkIFVJLCB3aW5kb3cubG9jYXRpb24ub3JpZ2luIGlzIHRoZSBtb3N0IGRpcmVjdCB3YXkuXG4gIGlmICh3aW5kb3cgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pIHtcbiAgICAvLyBFbnN1cmUgaXQncyBhIHZhbGlkIGh0dHAvaHR0cHMgVVJMLCBub3QgJ2Nocm9tZS1leHRlbnNpb246Ly8nIG9yIG90aGVyIHNjaGVtZXMgaWYgdG9vbCBydW5zIGluIG90aGVyIGNvbnRleHRzLlxuICAgIGlmICh3aW5kb3cubG9jYXRpb24ub3JpZ2luLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9XG4gIH1cbiAgLy8gRmFsbGJhY2sgb3IgZXJyb3IgY2FzZVxuICBjb25zb2xlLndhcm4oJ1BBQkxPXFwnUyBEVyBDSEFEOiBDb3VsZCBub3QgZGV0ZXJtaW5lIERhdGFXYWxrIGJhc2UgVVJMIGZyb20gd2luZG93LmxvY2F0aW9uLm9yaWdpbi4nKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBvcGVuR2l0SHViSXNzdWUodG9vbE5hbWU6IHN0cmluZykge1xuICBjb25zdCB0aXRsZSA9IGBbJHt0b29sTmFtZX1dIGA7XG4gIGNvbnN0IGJvZHkgPSBgIyMgRGVzY3JpcHRpb25cblxuIyMgU3RlcHMgdG8gUmVwcm9kdWNlXG4xLiBcbjIuIFxuMy4gXG5cbiMjIEV4cGVjdGVkIEJlaGF2aW9yXG5cbiMjIEFjdHVhbCBCZWhhdmlvclxuXG4jIyBFbnZpcm9ubWVudFxuLSBCcm93c2VyOiAke25hdmlnYXRvci51c2VyQWdlbnR9XG4tIFRvb2w6ICR7dG9vbE5hbWV9XG4tIFVSTDogJHt3aW5kb3cubG9jYXRpb24uaHJlZn1cblxuIyMgQWRkaXRpb25hbCBDb250ZXh0YDtcblxuICBjb25zdCB1cmwgPSBuZXcgVVJMKCdodHRwczovL2dpdGh1Yi5jb20vcGF3ZWxnbmF0b3dza2kvcGFibG9zX2R3X2NoYWQvaXNzdWVzL25ldycpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgndGl0bGUnLCB0aXRsZS50cmltKCkpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnYm9keScsIGJvZHkpO1xuICBcbiAgd2luZG93Lm9wZW4odXJsLnRvU3RyaW5nKCksICdfYmxhbmsnLCAnbm9vcGVuZXIsbm9yZWZlcnJlcicpO1xufVxuIiwiLy8gc3JjL3VpL0RlcGxveWVkQXBwc1Rvb2wudHNcbmltcG9ydCB7IGdldENvbWJpbmVkQXBwSW5mb0xpc3QsIHVucmVnaXN0ZXJEeW5hbWljRW5kcG9pbnQgfSBmcm9tICcuLi9hcGkvZGF0YXdhbGtTZXJ2aWNlJztcbmltcG9ydCB0eXBlIHsgQ29tYmluZWRBcHBJbmZvIH0gZnJvbSAnLi4vYXBpL21vZGVsL2NvbWJpbmVkQXBwSW5mbyc7XG5pbXBvcnQgeyBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsIH0gZnJvbSAnLi4vdXRpbHMvdXJsVXRpbHMnOyAvLyBBc3N1bWluZyB3ZSBoYXZlIHRoaXMgdXRpbGl0eVxuaW1wb3J0IHsgb3BlbkdpdEh1Yklzc3VlIH0gZnJvbSAnLi4vdXRpbHMvZmVlZGJhY2tVdGlscyc7XG5cbmNvbnN0IFJFRlJFU0hfSU5URVJWQUxfTVMgPSAzMDAwMDsgLy8gUmVmcmVzaCBldmVyeSAzMCBzZWNvbmRzLCBmb3IgZXhhbXBsZVxuXG5leHBvcnQgY2xhc3MgRGVwbG95ZWRBcHBzVG9vbCB7XG4gIHByaXZhdGUgdG9vbEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGFibGVCb2R5RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsYXN0VXBkYXRlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVmcmVzaEludGVydmFsSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1cnJlbnRJc1Zpc2libGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmNyZWF0ZVVJKCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVVJKCk6IHZvaWQge1xuICAgIC8vIE1haW4gY29udGFpbmVyIGZvciB0aGUgdG9vbFxuICAgIHRoaXMudG9vbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnRvb2xFbGVtZW50LmlkID0gJ3Bkd2MtZGVwbG95ZWQtYXBwcy10b29sJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3Bkd2MtdG9vbC1wYW5lbCcpOyAvLyBHZW5lcmFsIHN0eWxpbmcgZm9yIGEgdG9vbCBwYW5lbFxuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgLy8gSGlkZGVuIGJ5IGRlZmF1bHRcblxuICAgIC8vIEhlYWRlclxuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKCdwZHdjLXRvb2wtaGVhZGVyJyk7XG4gICAgaGVhZGVyLnRleHRDb250ZW50ID0gJ0RlcGxveWVkIExvbmctUnVubmluZyBBcHBzJztcblxuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgY2xvc2VCdXR0b24uY2xhc3NMaXN0LmFkZCgncGR3Yy10b29sLWNsb3NlLWJ1dHRvbicpO1xuICAgIGNsb3NlQnV0dG9uLnRleHRDb250ZW50ID0gJ8OXJztcbiAgICBjbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5oaWRlKCk7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKGNsb3NlQnV0dG9uKTtcbiAgICB0aGlzLnRvb2xFbGVtZW50LmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgICAvLyBMYXN0IFVwZGF0ZWQgVGltZXN0YW1wXG4gICAgdGhpcy5sYXN0VXBkYXRlZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmxhc3RVcGRhdGVkRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwZHdjLWxhc3QtdXBkYXRlZCcpO1xuICAgIHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSAnNXB4IDEwcHgnO1xuICAgIHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50LnN0eWxlLmZvbnRTaXplID0gJzAuOGVtJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50KTtcblxuICAgIC8vIEFkZCBmZWVkYmFjayBidXR0b25cbiAgICBjb25zdCBmZWVkYmFja0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGZlZWRiYWNrQnV0dG9uLmNsYXNzTmFtZSA9ICdwZHdjLWZlZWRiYWNrLWJ1dHRvbic7XG4gICAgZmVlZGJhY2tCdXR0b24udGl0bGUgPSAnUmVwb3J0IGFuIGlzc3VlJztcbiAgICBmZWVkYmFja0J1dHRvbi5pbm5lckhUTUwgPSAn8J+Qnic7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY29sb3IgPSAnI2YyZjJmNyc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnBhZGRpbmcgPSAnMCAxMHB4JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5saW5lSGVpZ2h0ID0gJzEnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC44JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS50cmFuc2l0aW9uID0gJ29wYWNpdHkgMC4ycyc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnJpZ2h0ID0gJzM1cHgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnRvcCA9ICc1cHgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLm9ubW91c2VvdmVyID0gKCkgPT4ge1xuICAgICAgZmVlZGJhY2tCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmNvbG9yID0gJyNmZjlmMGEnO1xuICAgIH07XG4gICAgZmVlZGJhY2tCdXR0b24ub25tb3VzZW91dCA9ICgpID0+IHtcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC44JztcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmNvbG9yID0gJyNmMmYyZjcnO1xuICAgIH07XG4gICAgZmVlZGJhY2tCdXR0b24ub25jbGljayA9ICgpID0+IG9wZW5HaXRIdWJJc3N1ZSgnRGVwbG95ZWQgQXBwcyBUb29sJyk7XG4gICAgdGhpcy50b29sRWxlbWVudC5hcHBlbmRDaGlsZChmZWVkYmFja0J1dHRvbik7XG5cbiAgICAvLyBTY3JvbGxhYmxlIGNvbnRhaW5lciBmb3IgdGhlIHRhYmxlXG4gICAgY29uc3QgdGFibGVDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0YWJsZUNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdwZHdjLWFwcHMtdGFibGUtY29udGFpbmVyJyk7XG4gICAgdGhpcy50b29sRWxlbWVudC5hcHBlbmRDaGlsZCh0YWJsZUNvbnRhaW5lcik7XG5cbiAgICAvLyBUYWJsZSBmb3IgZGlzcGxheWluZyBhcHBzXG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpO1xuICAgIHRhYmxlLmNsYXNzTGlzdC5hZGQoJ3Bkd2MtYXBwcy10YWJsZScpO1xuICAgIGNvbnN0IHRhYmxlSGVhZGVyID0gdGFibGUuY3JlYXRlVEhlYWQoKS5pbnNlcnRSb3coKTtcbiAgICAvLyBBZGQgZW1wdHkgaGVhZGVyIGZvciB0aGUgYWN0aW9ucyBjb2x1bW5cbiAgICBjb25zdCBhY3Rpb25IZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aCcpO1xuICAgIGFjdGlvbkhlYWRlci50ZXh0Q29udGVudCA9ICdBY3Rpb25zJztcbiAgICB0YWJsZUhlYWRlci5hcHBlbmRDaGlsZChhY3Rpb25IZWFkZXIpO1xuICAgIFxuICAgIFsnQXBwIE5hbWUnLCAnQ29uZmlnIE5hbWUnLCAnSW50ZXJuYWwgUG9ydHMnLCAnUHVibGljIEVuZHBvaW50JywgJ1VVSUQgKEhvdmVyKSddLmZvckVhY2godGV4dCA9PiB7XG4gICAgICBjb25zdCB0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoJyk7XG4gICAgICB0aC50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICB0YWJsZUhlYWRlci5hcHBlbmRDaGlsZCh0aCk7XG4gICAgfSk7XG4gICAgdGhpcy50YWJsZUJvZHlFbGVtZW50ID0gdGFibGUuY3JlYXRlVEJvZHkoKTtcbiAgICB0YWJsZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0YWJsZSk7IC8vIEFwcGVuZCB0YWJsZSB0byBpdHMgY29udGFpbmVyXG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMudG9vbEVsZW1lbnQpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlZnJlc2hEYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5pc1Zpc2libGUoKSB8fCAhdGhpcy50YWJsZUJvZHlFbGVtZW50IHx8ICF0aGlzLmxhc3RVcGRhdGVkRWxlbWVudCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJhc2VVcmwgPSBhd2FpdCBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsKCk7XG4gICAgICBpZiAoIWJhc2VVcmwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQQUJMT1xcJ1MgRFcgQ0hBRDogQmFzZSBVUkwgbm90IGZvdW5kLCBjYW5ub3QgcmVmcmVzaCBkZXBsb3llZCBhcHBzLicpO1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGVkRWxlbWVudC50ZXh0Q29udGVudCA9ICdFcnJvcjogRGF0YVdhbGsgVVJMIG5vdCBmb3VuZC4nO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBhcHBzID0gYXdhaXQgZ2V0Q29tYmluZWRBcHBJbmZvTGlzdChiYXNlVXJsKTtcbiAgICAgIHRoaXMucmVuZGVyVGFibGUoYXBwcyk7XG4gICAgICB0aGlzLmxhc3RVcGRhdGVkRWxlbWVudC50ZXh0Q29udGVudCA9IGBMYXN0IHVwZGF0ZWQ6ICR7bmV3IERhdGUoKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1gO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdQQUJMT1xcJ1MgRFcgQ0hBRDogRXJyb3IgcmVmcmVzaGluZyBkZXBsb3llZCBhcHBzIGxpc3Q6JywgZXJyb3IpO1xuICAgICAgaWYgKHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50KSB7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50LnRleHRDb250ZW50ID0gJ0Vycm9yIGxvYWRpbmcgZGF0YS4nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVGFibGUoYXBwczogQ29tYmluZWRBcHBJbmZvW10pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMudGFibGVCb2R5RWxlbWVudCkgcmV0dXJuO1xuXG4gICAgKHRoaXMudGFibGVCb2R5RWxlbWVudCBhcyBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCkuaW5uZXJIVE1MID0gJyc7IC8vIENsZWFyIGV4aXN0aW5nIHJvd3NcblxuICAgIGlmIChhcHBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3Qgcm93ID0gKHRoaXMudGFibGVCb2R5RWxlbWVudCBhcyBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCkuaW5zZXJ0Um93KCk7XG4gICAgICBjb25zdCBjZWxsID0gcm93Lmluc2VydENlbGwoKTtcbiAgICAgIGNlbGwuY29sU3BhbiA9IDY7IC8vIE51bWJlciBvZiBjb2x1bW5zIChpbmNsdWRpbmcgdGhlIG5ldyBhY3Rpb25zIGNvbHVtbilcbiAgICAgIGNlbGwudGV4dENvbnRlbnQgPSAnTm8gZGVwbG95ZWQgYXBwbGljYXRpb25zIGZvdW5kIG9yIGFuIGVycm9yIG9jY3VycmVkLic7XG4gICAgICBjZWxsLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGFwcHMuZm9yRWFjaChhcHAgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gKHRoaXMudGFibGVCb2R5RWxlbWVudCBhcyBIVE1MVGFibGVTZWN0aW9uRWxlbWVudCkuaW5zZXJ0Um93KCk7XG4gICAgICBcbiAgICAgIC8vIEFkZCB0cmFzaCBiaW4gaWNvbiBmb3IgdW5yZWdpc3RlciBhY3Rpb25cbiAgICAgIGNvbnN0IGFjdGlvbkNlbGwgPSByb3cuaW5zZXJ0Q2VsbCgpO1xuICAgICAgY29uc3QgdHJhc2hJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgdHJhc2hJY29uLmlubmVySFRNTCA9ICfwn5eR77iPJztcbiAgICAgIHRyYXNoSWNvbi50aXRsZSA9ICdVbnJlZ2lzdGVyIHRoaXMgZW5kcG9pbnQnO1xuICAgICAgdHJhc2hJY29uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICAgIHRyYXNoSWNvbi5zdHlsZS5mb250U2l6ZSA9ICcxLjJlbSc7XG4gICAgICB0cmFzaEljb24uc3R5bGUub3BhY2l0eSA9ICcwLjcnO1xuICAgICAgdHJhc2hJY29uLm9ubW91c2VvdmVyID0gKCkgPT4gdHJhc2hJY29uLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICB0cmFzaEljb24ub25tb3VzZW91dCA9ICgpID0+IHRyYXNoSWNvbi5zdHlsZS5vcGFjaXR5ID0gJzAuNyc7XG4gICAgICB0cmFzaEljb24ub25jbGljayA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChjb25maXJtKGBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gdW5yZWdpc3RlciB0aGUgZW5kcG9pbnQgZm9yICR7YXBwLmFwcE5hbWV9P2ApKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGJhc2VVcmwgPSBhd2FpdCBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsKCk7XG4gICAgICAgICAgICBpZiAoYmFzZVVybCkge1xuICAgICAgICAgICAgICBhd2FpdCB1bnJlZ2lzdGVyRHluYW1pY0VuZHBvaW50KGJhc2VVcmwsIGFwcC5hcHBFeGVjdXRpb25VdWlkKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoRGF0YSgpOyAvLyBSZWZyZXNoIHRoZSB0YWJsZSBhZnRlciBzdWNjZXNzZnVsIHVucmVnaXN0cmF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB1bnJlZ2lzdGVyIGVuZHBvaW50OicsIGVycm9yKTtcbiAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gdW5yZWdpc3RlciBlbmRwb2ludC4gQ2hlY2sgY29uc29sZSBmb3IgZGV0YWlscy4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBhY3Rpb25DZWxsLmFwcGVuZENoaWxkKHRyYXNoSWNvbik7XG4gICAgICBcbiAgICAgIHJvdy5pbnNlcnRDZWxsKCkudGV4dENvbnRlbnQgPSBhcHAuYXBwTmFtZTtcbiAgICAgIHJvdy5pbnNlcnRDZWxsKCkudGV4dENvbnRlbnQgPSBhcHAuYXBwQ29uZmlndXJhdGlvbk5hbWU7XG4gICAgICBcbiAgICAgIC8vIEludGVybmFsIFBvcnRzXG4gICAgICBjb25zdCBpbnRlcm5hbFBvcnRzQ2VsbCA9IHJvdy5pbnNlcnRDZWxsKCk7XG4gICAgICBpZiAoYXBwLmludGVybmFsUG9ydE1hcHBpbmdzICYmIGFwcC5pbnRlcm5hbFBvcnRNYXBwaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGludGVybmFsUG9ydHNDZWxsLmlubmVySFRNTCA9IGFwcC5pbnRlcm5hbFBvcnRNYXBwaW5nc1xuICAgICAgICAgIC5tYXAocCA9PiBgJHtwLmlkfTogJHthcHAuaW50ZXJuYWxEZXN0aW5hdGlvbkhvc3R9OiR7cC5kZXN0aW5hdGlvblBvcnR9YClcbiAgICAgICAgICAuam9pbignPGJyPicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW50ZXJuYWxQb3J0c0NlbGwudGV4dENvbnRlbnQgPSAnTi9BJztcbiAgICAgIH1cblxuICAgICAgLy8gUHVibGljIEVuZHBvaW50XG4gICAgICBjb25zdCBwdWJsaWNFbmRwb2ludENlbGwgPSByb3cuaW5zZXJ0Q2VsbCgpO1xuICAgICAgaWYgKGFwcC5wdWJsaWNQb3J0TWFwcGluZ3MgJiYgYXBwLnB1YmxpY1BvcnRNYXBwaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHB1YmxpY0VuZHBvaW50Q2VsbC5pbm5lckhUTUwgPSBhcHAucHVibGljUG9ydE1hcHBpbmdzXG4gICAgICAgICAgLm1hcChwID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvcnRJbmZvID0gYCR7cC5pZH06ICR7cC5kZXN0aW5hdGlvblBvcnR9YDtcbiAgICAgICAgICAgIHJldHVybiBwLmxvYWRCYWxhbmNlckVuZHBvaW50IFxuICAgICAgICAgICAgICA/IGA8YSBocmVmPVwiJHtwLmxvYWRCYWxhbmNlckVuZHBvaW50fVwiIHRhcmdldD1cIl9ibGFua1wiPiR7cC5sb2FkQmFsYW5jZXJFbmRwb2ludH08L2E+ICgke3BvcnRJbmZvfSlgIFxuICAgICAgICAgICAgICA6IHBvcnRJbmZvO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmpvaW4oJzxicj4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHB1YmxpY0VuZHBvaW50Q2VsbC50ZXh0Q29udGVudCA9ICdOL0EnO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBVVUlEIChzaG93biBvbiBob3ZlcilcbiAgICAgIGNvbnN0IHV1aWRDZWxsID0gcm93Lmluc2VydENlbGwoKTtcbiAgICAgIHV1aWRDZWxsLnRleHRDb250ZW50ID0gJy4uLic7IC8vIFBsYWNlaG9sZGVyXG4gICAgICB1dWlkQ2VsbC50aXRsZSA9IGFwcC5hcHBFeGVjdXRpb25VdWlkOyAvLyBTaG93IGZ1bGwgVVVJRCBvbiBob3ZlclxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNob3coKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudG9vbEVsZW1lbnQpIHtcbiAgICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JzsgLy8gQ2hhbmdlZCBmcm9tICdibG9jaycgdG8gJ2ZsZXgnXG4gICAgICB0aGlzLmN1cnJlbnRJc1Zpc2libGUgPSB0cnVlO1xuICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRGVwbG95ZWRBcHBzVG9vbC5zaG93KCkgLSBTdHlsZSBzZXQgdG8gJyR7dGhpcy50b29sRWxlbWVudC5zdHlsZS5kaXNwbGF5fScsIGN1cnJlbnRJc1Zpc2libGU6ICR7dGhpcy5jdXJyZW50SXNWaXNpYmxlfWApO1xuXG4gICAgICAvLyBSZS1lbmFibGUgZGF0YSBmZXRjaGluZyBhbmQgYXV0by1yZWZyZXNoXG4gICAgICB0aGlzLnJlZnJlc2hEYXRhKCk7IC8vIExvYWQgZGF0YSB3aGVuIHNob3duXG4gICAgICB0aGlzLnN0YXJ0QXV0b1JlZnJlc2goKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdQQUJMT1xcJ1MgRFcgQ0hBRDogRGVwbG95ZWRBcHBzVG9vbC5zaG93KCkgY2FsbGVkLCBidXQgdG9vbEVsZW1lbnQgaXMgbnVsbC4nKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50b29sRWxlbWVudCkge1xuICAgICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy5jdXJyZW50SXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICB0aGlzLnN0b3BBdXRvUmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyB0b2dnbGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNWaXNpYmxlKCkpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc3RhcnRBdXRvUmVmcmVzaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5yZWZyZXNoSW50ZXJ2YWxJZCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5yZWZyZXNoSW50ZXJ2YWxJZCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnJlZnJlc2hEYXRhKCksIFJFRlJFU0hfSU5URVJWQUxfTVMpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzdG9wQXV0b1JlZnJlc2goKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVmcmVzaEludGVydmFsSWQgIT09IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5yZWZyZXNoSW50ZXJ2YWxJZCk7XG4gICAgICB0aGlzLnJlZnJlc2hJbnRlcnZhbElkID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRJc1Zpc2libGU7XG4gIH1cblxuICAvLyBFbnN1cmUgdG8gY2FsbCB0aGlzIHdoZW4gdGhlIHRvb2wgaXMgbm8gbG9uZ2VyIG5lZWRlZCB0byBwcmV2ZW50IG1lbW9yeSBsZWFrc1xuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BBdXRvUmVmcmVzaCgpO1xuICAgIGlmICh0aGlzLnRvb2xFbGVtZW50ICYmIHRoaXMudG9vbEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy50b29sRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMudG9vbEVsZW1lbnQpO1xuICAgIH1cbiAgICB0aGlzLnRvb2xFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLnRhYmxlQm9keUVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMubGFzdFVwZGF0ZWRFbGVtZW50ID0gbnVsbDtcbiAgfVxufVxuIiwiLy8gc3JjL3VpL1NldFRydW5jYXRpb25Ub29sLnRzXG5pbXBvcnQgeyBmZXRjaFNldHMsIHRydW5jYXRlU2V0IH0gZnJvbSAnLi4vYXBpL2RhdGF3YWxrU2VydmljZSc7XG5pbXBvcnQgeyBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsIH0gZnJvbSAnLi4vdXRpbHMvdXJsVXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBEYXRhV2Fsa0FwaVJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMvZGF0YU1vZGVscyc7XG5pbXBvcnQgeyBvcGVuR2l0SHViSXNzdWUgfSBmcm9tICcuLi91dGlscy9mZWVkYmFja1V0aWxzJztcblxudHlwZSBTdGF0dXNUeXBlID0gJ2luZm8nIHwgJ3N1Y2Nlc3MnIHwgJ2Vycm9yJyB8ICd3YXJuaW5nJztcblxuaW50ZXJmYWNlIFNldEdyb3VwIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBzZXRJZHM6IG51bWJlcltdO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgdXBkYXRlZEF0OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBTZXRJdGVtIHtcbiAgaWQ6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBzZWxlY3RlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFNldFRydW5jYXRpb25Ub29sIHtcbiAgcHJpdmF0ZSB0b29sRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjdXJyZW50SXNWaXNpYmxlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgaXNEcmFnZ2luZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGRyYWdTdGFydFg6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgZHJhZ1N0YXJ0WTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBjdXJyZW50WDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBjdXJyZW50WTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzZXRzOiBTZXRJdGVtW10gPSBbXTtcbiAgcHJpdmF0ZSBmaWx0ZXJlZFNldHM6IFNldEl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIHNldEdyb3VwczogU2V0R3JvdXBbXSA9IFtdO1xuICBwcml2YXRlIGlzTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHN0YXR1c0VsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2VhcmNoSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzZXRzQ29udGFpbmVyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGdyb3VwU2VsZWN0OiBIVE1MU2VsZWN0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGdyb3VwTmFtZUlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2F2ZUdyb3VwQnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRlbGV0ZUdyb3VwQnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGlvblNlbGVjdDogSFRNTFNlbGVjdEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIGJhc2VVcmw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxhc3RLbm93bkJhc2VVcmw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGlzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzdG9yYWdlQ2hhbmdlTGlzdGVuZXI6ICgoY2hhbmdlczogeyBba2V5OiBzdHJpbmddOiBjaHJvbWUuc3RvcmFnZS5TdG9yYWdlQ2hhbmdlIH0sIGFyZWFOYW1lOiBzdHJpbmcpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgLy8gU2V0IHVwIGEgcGVyaW9kaWMgY2hlY2sgZm9yIGJhc2UgVVJMIGNoYW5nZXNcbiAgICBzZXRJbnRlcnZhbCh0aGlzLmNoZWNrRm9yRW52aXJvbm1lbnRDaGFuZ2UuYmluZCh0aGlzKSwgMTAwMCk7XG4gICAgXG4gICAgLy8gTGlzdGVuIGZvciBzdG9yYWdlIGNoYW5nZXMgZnJvbSBvdGhlciB0YWJzXG4gICAgdGhpcy5zZXR1cFN0b3JhZ2VMaXN0ZW5lcigpO1xuICB9XG4gIFxuICBwcml2YXRlIHNldHVwU3RvcmFnZUxpc3RlbmVyKCkge1xuICAgIGlmICghY2hyb21lLnN0b3JhZ2U/Lm9uQ2hhbmdlZD8uYWRkTGlzdGVuZXIpIHJldHVybjtcbiAgICBcbiAgICB0aGlzLnN0b3JhZ2VDaGFuZ2VMaXN0ZW5lciA9IGFzeW5jIChjaGFuZ2VzLCBhcmVhTmFtZSkgPT4ge1xuICAgICAgaWYgKGFyZWFOYW1lICE9PSAnbG9jYWwnKSByZXR1cm47XG4gICAgICBcbiAgICAgIGNvbnN0IHN0b3JhZ2VLZXkgPSBhd2FpdCB0aGlzLmdldFN0b3JhZ2VLZXkoKTtcbiAgICAgIGlmIChjaGFuZ2VzW3N0b3JhZ2VLZXldIHx8IGNoYW5nZXMubGFzdFVwZGF0ZSkge1xuICAgICAgICAvLyBSZWZyZXNoIGdyb3VwcyB3aGVuIG91ciBzdG9yYWdlIGtleSBjaGFuZ2VzIG9yIHdoZW4gd2UgZ2V0IGEgZ2VuZXJhbCB1cGRhdGVcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkR3JvdXBzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBjaHJvbWUuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIodGhpcy5zdG9yYWdlQ2hhbmdlTGlzdGVuZXIpO1xuICB9XG4gIFxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgaWYgKHRoaXMuc3RvcmFnZUNoYW5nZUxpc3RlbmVyICYmIGNocm9tZS5zdG9yYWdlPy5vbkNoYW5nZWQ/LnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICBjaHJvbWUuc3RvcmFnZS5vbkNoYW5nZWQucmVtb3ZlTGlzdGVuZXIodGhpcy5zdG9yYWdlQ2hhbmdlTGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2hlY2tGb3JFbnZpcm9ubWVudENoYW5nZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IGN1cnJlbnRCYXNlVXJsID0gYXdhaXQgZ2V0Q3VycmVudERhdGF3YWxrQmFzZVVybCgpO1xuICAgIFxuICAgIC8vIElmIGJhc2UgVVJMIGhhcyBjaGFuZ2VkIGFuZCB3ZSBoYXZlIGEgcHJldmlvdXMgVVJMXG4gICAgaWYgKGN1cnJlbnRCYXNlVXJsICYmIGN1cnJlbnRCYXNlVXJsICE9PSB0aGlzLmxhc3RLbm93bkJhc2VVcmwpIHtcbiAgICAgIHRoaXMubGFzdEtub3duQmFzZVVybCA9IGN1cnJlbnRCYXNlVXJsO1xuICAgICAgdGhpcy5iYXNlVXJsID0gY3VycmVudEJhc2VVcmw7XG4gICAgICBcbiAgICAgIC8vIFJlZnJlc2ggdGhlIFVJIHdpdGggbmV3IGVudmlyb25tZW50J3MgZGF0YVxuICAgICAgYXdhaXQgdGhpcy5sb2FkU2V0cygpO1xuICAgICAgYXdhaXQgdGhpcy5sb2FkR3JvdXBzKCk7XG4gICAgICBcbiAgICAgIC8vIENsZWFyIGFueSBleGlzdGluZyBzdGF0dXMgbWVzc2FnZXNcbiAgICAgIGlmICh0aGlzLnN0YXR1c0VsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNFbGVtZW50LnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIHRoaXMuc3RhdHVzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5pdGlhbGl6ZSgpIHtcbiAgICB0aGlzLmJhc2VVcmwgPSBhd2FpdCBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsKCk7XG4gICAgdGhpcy5sYXN0S25vd25CYXNlVXJsID0gdGhpcy5iYXNlVXJsO1xuICAgIHRoaXMuY3JlYXRlVUkoKTtcbiAgICB0aGlzLmxvYWRTZXRzKCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVVJKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRvb2xFbGVtZW50KSByZXR1cm47XG5cbiAgICB0aGlzLnRvb2xFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy50b29sRWxlbWVudC5pZCA9ICdwZHdjLXNldC10cnVuY2F0aW9uLXRvb2wnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUudG9wID0gJzUwJSc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzUwJSc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKC01MCUsIC01MCUpJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLndpZHRoID0gJzkwJSc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5tYXhXaWR0aCA9ICcxMjAwcHgnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUubWluV2lkdGggPSAnMzIwcHgnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gJzkwdmgnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3doaXRlJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgI2UwZTBlMCc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnOHB4JztcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLmJveFNoYWRvdyA9ICcwIDRweCAyMHB4IHJnYmEoMCwgMCwgMCwgMC4xNSknO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS56SW5kZXggPSAnMTAwMDAnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IFwiLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBSb2JvdG8sIE94eWdlbiwgVWJ1bnR1LCBDYW50YXJlbGwsICdPcGVuIFNhbnMnLCAnSGVsdmV0aWNhIE5ldWUnLCBzYW5zLXNlcmlmXCI7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5yZXNpemUgPSAnYm90aCc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSAnNDAwcHgnO1xuXG4gICAgLy8gSGVhZGVyIGNvbnRhaW5lclxuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGhlYWRlci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgaGVhZGVyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjZjhmOWZhJztcbiAgICBoZWFkZXIuc3R5bGUuYm9yZGVyQm90dG9tID0gJzFweCBzb2xpZCAjZTllY2VmJztcbiAgICBoZWFkZXIuc3R5bGUucGFkZGluZyA9ICcwJztcbiAgICBoZWFkZXIuc3R5bGUubWFyZ2luID0gJzAnO1xuICAgIGhlYWRlci5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnO1xuICAgIFxuICAgIC8vIEhlYWRlciBjb250ZW50IChmb3IgZHJhZ2dpbmcpXG4gICAgY29uc3QgaGVhZGVyQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGhlYWRlckNvbnRlbnQuc3R5bGUuY3Vyc29yID0gJ21vdmUnO1xuICAgIGhlYWRlckNvbnRlbnQuc3R5bGUucGFkZGluZyA9ICcxMnB4IDQwcHggMTJweCAxNnB4JztcbiAgICBoZWFkZXJDb250ZW50LnN0eWxlLmZvbnRTaXplID0gJzE0cHgnO1xuICAgIGhlYWRlckNvbnRlbnQuc3R5bGUuZm9udFdlaWdodCA9ICc1MDAnO1xuICAgIFxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aXRsZS50ZXh0Q29udGVudCA9ICdTZXQgTWFuYWdlbWVudCBUb29sJztcbiAgICB0aXRsZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgIHRpdGxlLnN0eWxlLnRleHRPdmVyZmxvdyA9ICdlbGxpcHNpcyc7XG4gICAgdGl0bGUuc3R5bGUud2hpdGVTcGFjZSA9ICdub3dyYXAnO1xuICAgIGhlYWRlckNvbnRlbnQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICAgIGhlYWRlci5hcHBlbmRDaGlsZChoZWFkZXJDb250ZW50KTtcbiAgICBcbiAgICAvLyBDbG9zZSBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGNsb3NlQnV0dG9uLmlubmVySFRNTCA9ICcmdGltZXM7JztcbiAgICBjbG9zZUJ1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWNsb3NlLWJ1dHRvbic7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnRvcCA9ICcycHgnO1xuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnJpZ2h0ID0gJzJweCc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSAnMjhweCc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUuaGVpZ2h0ID0gJzI4cHgnO1xuICAgIGNsb3NlQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgIGNsb3NlQnV0dG9uLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUuZm9udFNpemUgPSAnMjBweCc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJztcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUucGFkZGluZyA9ICcwJztcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5tYXJnaW4gPSAnMCc7XG4gICAgY2xvc2VCdXR0b24uc3R5bGUubGluZUhlaWdodCA9ICcxJztcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICBjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCAoKSA9PiB7XG4gICAgICBjbG9zZUJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgwLCAwLCAwLCAwLjA1KSc7XG4gICAgfSk7XG4gICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PiB7XG4gICAgICBjbG9zZUJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIH0pO1xuICAgIGNsb3NlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICB9KTtcbiAgICBoZWFkZXIuYXBwZW5kQ2hpbGQoY2xvc2VCdXR0b24pO1xuXG4gICAgLy8gQWRkIGZlZWRiYWNrIGJ1dHRvblxuICAgIGNvbnN0IGZlZWRiYWNrQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgZmVlZGJhY2tCdXR0b24uY2xhc3NOYW1lID0gJ3Bkd2MtZmVlZGJhY2stYnV0dG9uJztcbiAgICBmZWVkYmFja0J1dHRvbi50aXRsZSA9ICdSZXBvcnQgYW4gaXNzdWUnO1xuICAgIGZlZWRiYWNrQnV0dG9uLmlubmVySFRNTCA9ICfwn5CeJztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmJvcmRlciA9ICdub25lJztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5jb2xvciA9ICcjZjJmMmY3JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5mb250U2l6ZSA9ICcxNnB4JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUucGFkZGluZyA9ICcwIDEwcHgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmxpbmVIZWlnaHQgPSAnMSc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnRyYW5zaXRpb24gPSAnb3BhY2l0eSAwLjJzJztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUucmlnaHQgPSAnMzVweCc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUudG9wID0gJzVweCc7XG4gICAgZmVlZGJhY2tCdXR0b24ub25tb3VzZW92ZXIgPSAoKSA9PiB7XG4gICAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY29sb3IgPSAnI2ZmOWYwYSc7XG4gICAgfTtcbiAgICBmZWVkYmFja0J1dHRvbi5vbm1vdXNlb3V0ID0gKCkgPT4ge1xuICAgICAgZmVlZGJhY2tCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcwLjgnO1xuICAgICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY29sb3IgPSAnI2YyZjJmNyc7XG4gICAgfTtcbiAgICBmZWVkYmFja0J1dHRvbi5vbmNsaWNrID0gKCkgPT4gb3BlbkdpdEh1Yklzc3VlKCdTZXQgVHJ1bmNhdGlvbiBUb29sJyk7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKGZlZWRiYWNrQnV0dG9uKTtcblxuICAgIC8vIEFkZCBkcmFnIGV2ZW50IGxpc3RlbmVyc1xuICAgIGhlYWRlckNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5zdGFydERyYWdnaW5nLmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25EcmFnLmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLnN0b3BEcmFnZ2luZy5iaW5kKHRoaXMpKTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250ZW50LnN0eWxlLnBhZGRpbmcgPSAnMTZweCc7XG4gICAgY29udGVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgIGNvbnRlbnQuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdyb3cnO1xuICAgIGNvbnRlbnQuc3R5bGUuZ2FwID0gJzIwcHgnO1xuICAgIGNvbnRlbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICBjb250ZW50LnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSA2MHB4KSc7XG4gICAgY29udGVudC5zdHlsZS5taW5IZWlnaHQgPSAnMzQwcHgnO1xuXG4gICAgLy8gTGVmdCBjb2x1bW4gLSBTZWFyY2ggYW5kIHNldHMgbGlzdFxuICAgIGNvbnN0IGxlZnRDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBsZWZ0Q29sdW1uLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgbGVmdENvbHVtbi5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgbGVmdENvbHVtbi5zdHlsZS5mbGV4ID0gJzEnO1xuICAgIGxlZnRDb2x1bW4uc3R5bGUubWluV2lkdGggPSAnMzAwcHgnO1xuICAgIGxlZnRDb2x1bW4uc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICBsZWZ0Q29sdW1uLnN0eWxlLmdhcCA9ICcxMnB4JztcbiAgICBcbiAgICAvLyBTZWFyY2ggYW5kIGZpbHRlciBzZWN0aW9uXG4gICAgY29uc3Qgc2VhcmNoU2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIFxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIHRoaXMuc2VhcmNoSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLnNlYXJjaElucHV0LnBsYWNlaG9sZGVyID0gJ1NlYXJjaCBzZXRzLi4uJztcbiAgICB0aGlzLnNlYXJjaElucHV0LnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIHRoaXMuc2VhcmNoSW5wdXQuc3R5bGUucGFkZGluZyA9ICc4cHggMTJweCc7XG4gICAgdGhpcy5zZWFyY2hJbnB1dC5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkICNkZWUyZTYnO1xuICAgIHRoaXMuc2VhcmNoSW5wdXQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzRweCc7XG4gICAgdGhpcy5zZWFyY2hJbnB1dC5zdHlsZS5mb250U2l6ZSA9ICcxM3B4JztcbiAgICB0aGlzLnNlYXJjaElucHV0LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4gdGhpcy5maWx0ZXJTZXRzKCkpO1xuICAgIFxuICAgIHNlYXJjaFNlY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5zZWFyY2hJbnB1dCk7XG4gICAgbGVmdENvbHVtbi5hcHBlbmRDaGlsZChzZWFyY2hTZWN0aW9uKTtcblxuICAgIC8vIE1haW4gY29udGFpbmVyIGZvciB0aGUgbGVmdCBjb2x1bW4gY29udGVudFxuICAgIGNvbnN0IGxlZnRDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbGVmdENvbnRlbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBsZWZ0Q29udGVudC5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgbGVmdENvbnRlbnQuc3R5bGUuZmxleCA9ICcxJztcbiAgICBsZWZ0Q29udGVudC5zdHlsZS5taW5IZWlnaHQgPSAnMzAwcHgnO1xuICAgIGxlZnRDb250ZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgXG4gICAgLy8gU2V0cyBjb250YWluZXIgd2l0aCBib3JkZXIgYW5kIGJhY2tncm91bmRcbiAgICBjb25zdCBzZXRzQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgc2V0c0NvbnRhaW5lci5zdHlsZS5mbGV4ID0gJzEnO1xuICAgIHNldHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBzZXRzQ29udGFpbmVyLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICBzZXRzQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgc2V0c0NvbnRhaW5lci5zdHlsZS5ib3JkZXIgPSAnMXB4IHNvbGlkICNkZWUyZTYnO1xuICAgIHNldHNDb250YWluZXIuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzRweCc7XG4gICAgc2V0c0NvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2ZmZic7XG4gICAgc2V0c0NvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSAnOHB4JztcbiAgICBcbiAgICAvLyBTY3JvbGxhYmxlIGNvbnRlbnQgd3JhcHBlciAtIHRha2VzIHJlbWFpbmluZyBzcGFjZVxuICAgIGNvbnN0IHNjcm9sbGFibGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgc2Nyb2xsYWJsZUNvbnRlbnQuc3R5bGUub3ZlcmZsb3dZID0gJ2F1dG8nO1xuICAgIHNjcm9sbGFibGVDb250ZW50LnN0eWxlLm92ZXJmbG93WCA9ICdoaWRkZW4nO1xuICAgIHNjcm9sbGFibGVDb250ZW50LnN0eWxlLnBhZGRpbmcgPSAnOHB4JztcbiAgICBzY3JvbGxhYmxlQ29udGVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICAgIHNjcm9sbGFibGVDb250ZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICBzY3JvbGxhYmxlQ29udGVudC5zdHlsZS5nYXAgPSAnNHB4JztcbiAgICBzY3JvbGxhYmxlQ29udGVudC5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDB2aCAtIDQwMHB4KSc7XG4gICAgc2Nyb2xsYWJsZUNvbnRlbnQuc3R5bGUubWluSGVpZ2h0ID0gJzIwMHB4JztcbiAgICBzY3JvbGxhYmxlQ29udGVudC5zdHlsZS5tYXhIZWlnaHQgPSAnNjAwcHgnO1xuICAgIFxuICAgIC8vIEJ1aWxkIHRoZSBoaWVyYXJjaHlcbiAgICBzZXRzQ29udGFpbmVyLmFwcGVuZENoaWxkKHNjcm9sbGFibGVDb250ZW50KTtcbiAgICBcbiAgICAvLyBBZGQgc2V0cyBjb250YWluZXIgdG8gbGVmdCBjb250ZW50XG4gICAgbGVmdENvbnRlbnQuYXBwZW5kQ2hpbGQoc2V0c0NvbnRhaW5lcik7XG4gICAgXG4gICAgLy8gQXNzaWduIHRoZSBzY3JvbGxhYmxlIGNvbnRlbnQgdG8gdGhlIGNsYXNzIHByb3BlcnR5XG4gICAgdGhpcy5zZXRzQ29udGFpbmVyID0gc2Nyb2xsYWJsZUNvbnRlbnQ7XG4gICAgXG4gICAgbGVmdENvbHVtbi5hcHBlbmRDaGlsZChsZWZ0Q29udGVudCk7XG4gICAgY29udGVudC5hcHBlbmRDaGlsZChsZWZ0Q29sdW1uKTtcblxuICAgIC8vIFJpZ2h0IGNvbHVtbiAtIEdyb3Vwc1xuICAgIGNvbnN0IHJpZ2h0Q29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcmlnaHRDb2x1bW4uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICByaWdodENvbHVtbi5zdHlsZS5mbGV4RGlyZWN0aW9uID0gJ2NvbHVtbic7XG4gICAgcmlnaHRDb2x1bW4uc3R5bGUuZ2FwID0gJzEycHgnO1xuICAgIHJpZ2h0Q29sdW1uLnN0eWxlLndpZHRoID0gJzI4MHB4JztcbiAgICByaWdodENvbHVtbi5zdHlsZS5taW5XaWR0aCA9ICcyODBweCc7XG4gICAgcmlnaHRDb2x1bW4uc3R5bGUubWF4V2lkdGggPSAnMzIwcHgnO1xuICAgIHJpZ2h0Q29sdW1uLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgcmlnaHRDb2x1bW4uc3R5bGUubWluV2lkdGggPSAnMjgwcHgnO1xuICAgIFxuICAgIC8vIEdyb3VwcyBzZWN0aW9uXG4gICAgY29uc3QgZ3JvdXBzU2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdyb3Vwc1NlY3Rpb24uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBncm91cHNTZWN0aW9uLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgICBncm91cHNTZWN0aW9uLnN0eWxlLmdhcCA9ICcxMnB4JztcbiAgICBcbiAgICBjb25zdCBncm91cHNIZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGdyb3Vwc0hlYWRlci50ZXh0Q29udGVudCA9ICdTZXQgR3JvdXBzJztcbiAgICBncm91cHNIZWFkZXIuc3R5bGUubWFyZ2luID0gJzAnO1xuICAgIGdyb3Vwc0hlYWRlci5zdHlsZS5mb250U2l6ZSA9ICcxNHB4JztcbiAgICBncm91cHNIZWFkZXIuc3R5bGUuZm9udFdlaWdodCA9ICc2MDAnO1xuXG4gICAgLy8gR3JvdXAgbmFtZSBpbnB1dFxuICAgIHRoaXMuZ3JvdXBOYW1lSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIHRoaXMuZ3JvdXBOYW1lSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICB0aGlzLmdyb3VwTmFtZUlucHV0LnBsYWNlaG9sZGVyID0gJ0dyb3VwIG5hbWUnO1xuICAgIHRoaXMuZ3JvdXBOYW1lSW5wdXQuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gICAgdGhpcy5ncm91cE5hbWVJbnB1dC5zdHlsZS5wYWRkaW5nID0gJzhweCAxMnB4JztcbiAgICB0aGlzLmdyb3VwTmFtZUlucHV0LnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgI2RlZTJlNic7XG4gICAgdGhpcy5ncm91cE5hbWVJbnB1dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICB0aGlzLmdyb3VwTmFtZUlucHV0LnN0eWxlLmZvbnRTaXplID0gJzEzcHgnO1xuICAgIHRoaXMuZ3JvdXBOYW1lSW5wdXQuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICAgIFxuICAgIC8vIEdyb3VwIGNvbnRyb2xzIChTYXZlL0RlbGV0ZSBidXR0b25zKVxuICAgIGNvbnN0IGdyb3VwQ29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBncm91cENvbnRyb2xzLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgZ3JvdXBDb250cm9scy5zdHlsZS5nYXAgPSAnOHB4JztcbiAgICBcbiAgICAvLyBTYXZlIGJ1dHRvblxuICAgIHRoaXMuc2F2ZUdyb3VwQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgdGhpcy5zYXZlR3JvdXBCdXR0b24udGV4dENvbnRlbnQgPSAnU2F2ZSc7XG4gICAgdGhpcy5zYXZlR3JvdXBCdXR0b24uc3R5bGUuZmxleCA9ICcxJztcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5wYWRkaW5nID0gJzhweCAxMnB4JztcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwN2JmZic7XG4gICAgdGhpcy5zYXZlR3JvdXBCdXR0b24uc3R5bGUuY29sb3IgPSAnd2hpdGUnO1xuICAgIHRoaXMuc2F2ZUdyb3VwQnV0dG9uLnN0eWxlLmJvcmRlciA9ICdub25lJztcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgdGhpcy5zYXZlR3JvdXBCdXR0b24uc3R5bGUuZm9udFNpemUgPSAnMTNweCc7XG4gICAgdGhpcy5zYXZlR3JvdXBCdXR0b24uc3R5bGUudHJhbnNpdGlvbiA9ICdiYWNrZ3JvdW5kLWNvbG9yIDAuMnMnO1xuICAgIHRoaXMuc2F2ZUdyb3VwQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsICgpID0+IHRoaXMuc2F2ZUdyb3VwQnV0dG9uICYmICh0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwNjlkOScpKTtcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsICgpID0+IHRoaXMuc2F2ZUdyb3VwQnV0dG9uICYmICh0aGlzLnNhdmVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwN2JmZicpKTtcbiAgICB0aGlzLnNhdmVHcm91cEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuc2F2ZUdyb3VwKCkpO1xuXG4gICAgLy8gRGVsZXRlIGJ1dHRvblxuICAgIHRoaXMuZGVsZXRlR3JvdXBCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwQnV0dG9uLnRleHRDb250ZW50ID0gJ0RlbGV0ZSc7XG4gICAgdGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5mbGV4ID0gJzEnO1xuICAgIHRoaXMuZGVsZXRlR3JvdXBCdXR0b24uc3R5bGUucGFkZGluZyA9ICc4cHggMTJweCc7XG4gICAgdGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2RjMzU0NSc7XG4gICAgdGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5jb2xvciA9ICd3aGl0ZSc7XG4gICAgdGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgdGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNHB4JztcbiAgICB0aGlzLmRlbGV0ZUdyb3VwQnV0dG9uLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcbiAgICB0aGlzLmRlbGV0ZUdyb3VwQnV0dG9uLnN0eWxlLmZvbnRTaXplID0gJzEzcHgnO1xuICAgIHRoaXMuZGVsZXRlR3JvdXBCdXR0b24uc3R5bGUudHJhbnNpdGlvbiA9ICdiYWNrZ3JvdW5kLWNvbG9yIDAuMnMnO1xuICAgIHRoaXMuZGVsZXRlR3JvdXBCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgKCkgPT4gdGhpcy5kZWxldGVHcm91cEJ1dHRvbiAmJiAodGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2M4MjMzMycpKTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT4gdGhpcy5kZWxldGVHcm91cEJ1dHRvbiAmJiAodGhpcy5kZWxldGVHcm91cEJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2RjMzU0NScpKTtcbiAgICB0aGlzLmRlbGV0ZUdyb3VwQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5kZWxldGVHcm91cCgpKTtcbiAgICBcbiAgICAvLyBHcm91cCBzZWxlY3QgZHJvcGRvd25cbiAgICB0aGlzLmdyb3VwU2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgdGhpcy5ncm91cFNlbGVjdC5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICB0aGlzLmdyb3VwU2VsZWN0LnN0eWxlLnBhZGRpbmcgPSAnOHB4IDEycHgnO1xuICAgIHRoaXMuZ3JvdXBTZWxlY3Quc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCAjZGVlMmU2JztcbiAgICB0aGlzLmdyb3VwU2VsZWN0LnN0eWxlLmJvcmRlclJhZGl1cyA9ICc0cHgnO1xuICAgIHRoaXMuZ3JvdXBTZWxlY3Quc3R5bGUuZm9udFNpemUgPSAnMTNweCc7XG4gICAgdGhpcy5ncm91cFNlbGVjdC5zdHlsZS5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gICAgdGhpcy5ncm91cFNlbGVjdC5zdHlsZS5tYXJnaW5Ub3AgPSAnNHB4JztcbiAgICB0aGlzLmdyb3VwU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHRoaXMubG9hZFNlbGVjdGVkR3JvdXAoKSk7XG5cbiAgICAvLyBBc3NlbWJsZSBncm91cHMgc2VjdGlvblxuICAgIGdyb3VwQ29udHJvbHMuYXBwZW5kQ2hpbGQodGhpcy5zYXZlR3JvdXBCdXR0b24pO1xuICAgIGdyb3VwQ29udHJvbHMuYXBwZW5kQ2hpbGQodGhpcy5kZWxldGVHcm91cEJ1dHRvbik7XG4gICAgXG4gICAgZ3JvdXBzU2VjdGlvbi5hcHBlbmRDaGlsZChncm91cHNIZWFkZXIpO1xuICAgIGdyb3Vwc1NlY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5ncm91cE5hbWVJbnB1dCk7XG4gICAgZ3JvdXBzU2VjdGlvbi5hcHBlbmRDaGlsZChncm91cENvbnRyb2xzKTtcbiAgICBncm91cHNTZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuZ3JvdXBTZWxlY3QpO1xuICAgIFxuICAgIC8vIEFkZCB0byByaWdodCBjb2x1bW5cbiAgICByaWdodENvbHVtbi5hcHBlbmRDaGlsZChncm91cHNTZWN0aW9uKTtcbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHJpZ2h0Q29sdW1uKTtcblxuICAgIC8vIEFjdGlvbnMgc2VjdGlvbiAtIHBvc2l0aW9uZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgbGVmdCBjb2x1bW5cbiAgICBjb25zdCBhY3Rpb25zU2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGFjdGlvbnNTZWN0aW9uLnN0eWxlLm1hcmdpblRvcCA9ICcxMnB4JztcbiAgICBhY3Rpb25zU2VjdGlvbi5zdHlsZS5wYWRkaW5nVG9wID0gJzEycHgnO1xuICAgIGFjdGlvbnNTZWN0aW9uLnN0eWxlLmJvcmRlclRvcCA9ICcxcHggc29saWQgI2VlZSc7XG5cbiAgICBjb25zdCBhY3Rpb25zSGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcbiAgICBhY3Rpb25zSGVhZGVyLnRleHRDb250ZW50ID0gJ0FjdGlvbnMnO1xuICAgIGFjdGlvbnNIZWFkZXIuc3R5bGUubWFyZ2luID0gJzAgMCAxMHB4IDAnO1xuICAgIGFjdGlvbnNIZWFkZXIuc3R5bGUuZm9udFNpemUgPSAnMTRweCc7XG4gICAgYWN0aW9uc0hlYWRlci5zdHlsZS5mb250V2VpZ2h0ID0gJzYwMCc7XG5cbiAgICBjb25zdCBhY3Rpb25Db250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGFjdGlvbkNvbnRyb2xzLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgYWN0aW9uQ29udHJvbHMuc3R5bGUuZ2FwID0gJzEwcHgnO1xuICAgIGFjdGlvbkNvbnRyb2xzLnN0eWxlLm1hcmdpblRvcCA9ICc4cHgnO1xuXG4gICAgdGhpcy5hY3Rpb25TZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICB0aGlzLmFjdGlvblNlbGVjdC5zdHlsZS5mbGV4ID0gJzEnO1xuICAgIHRoaXMuYWN0aW9uU2VsZWN0LnN0eWxlLnBhZGRpbmcgPSAnOHB4JztcbiAgICBcbiAgICBjb25zdCBhY3Rpb25zID0gW1xuICAgICAgeyB2YWx1ZTogJ3RydW5jYXRlJywgbGFiZWw6ICdUcnVuY2F0ZSAoRGVsZXRlIGFsbCBkYXRhKScgfSxcbiAgICAgIHsgdmFsdWU6ICdjb3VudCcsIGxhYmVsOiAnQ291bnQgaXRlbXMnIH0sXG4gICAgICB7IHZhbHVlOiAnZXhwb3J0JywgbGFiZWw6ICdFeHBvcnQgZGF0YScgfVxuICAgIF07XG4gICAgXG4gICAgYWN0aW9ucy5mb3JFYWNoKGFjdGlvbiA9PiB7XG4gICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgIG9wdGlvbi52YWx1ZSA9IGFjdGlvbi52YWx1ZTtcbiAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGFjdGlvbi5sYWJlbDtcbiAgICAgIHRoaXMuYWN0aW9uU2VsZWN0Py5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZXhlY3V0ZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGV4ZWN1dGVCdXR0b24udGV4dENvbnRlbnQgPSAnRXhlY3V0ZSc7XG4gICAgZXhlY3V0ZUJ1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWJ1dHRvbic7XG4gICAgZXhlY3V0ZUJ1dHRvbi5zdHlsZS5mbGV4ID0gJzAgMCBhdXRvJztcbiAgICBleGVjdXRlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5leGVjdXRlQWN0aW9uKCkpO1xuXG4gICAgYWN0aW9uQ29udHJvbHMuYXBwZW5kQ2hpbGQodGhpcy5hY3Rpb25TZWxlY3QpO1xuICAgIGFjdGlvbkNvbnRyb2xzLmFwcGVuZENoaWxkKGV4ZWN1dGVCdXR0b24pO1xuXG4gICAgYWN0aW9uc1NlY3Rpb24uYXBwZW5kQ2hpbGQoYWN0aW9uc0hlYWRlcik7XG4gICAgYWN0aW9uc1NlY3Rpb24uYXBwZW5kQ2hpbGQoYWN0aW9uQ29udHJvbHMpO1xuXG4gICAgLy8gU3RhdHVzIGVsZW1lbnRcbiAgICB0aGlzLnN0YXR1c0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnN0YXR1c0VsZW1lbnQuc3R5bGUubWFyZ2luVG9wID0gJzEwcHgnO1xuICAgIHRoaXMuc3RhdHVzRWxlbWVudC5zdHlsZS5wYWRkaW5nID0gJzhweCc7XG4gICAgdGhpcy5zdGF0dXNFbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9ICc0cHgnO1xuICAgIHRoaXMuc3RhdHVzRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgLy8gQXNzZW1ibGUgdGhlIFVJXG4gICAgLy8gQWRkIGVsZW1lbnRzIHRvIGxlZnQgY29sdW1uIGluIHRoZSBjb3JyZWN0IG9yZGVyXG4gICAgbGVmdENvbHVtbi5hcHBlbmRDaGlsZChsZWZ0Q29udGVudCk7XG4gICAgbGVmdENvbHVtbi5hcHBlbmRDaGlsZChhY3Rpb25zU2VjdGlvbik7XG4gICAgXG4gICAgLy8gQWRkIGVsZW1lbnRzIHRvIHRoZSBtYWluIGNvbnRlbnQgYXJlYVxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQobGVmdENvbHVtbik7XG4gICAgY29udGVudC5hcHBlbmRDaGlsZChyaWdodENvbHVtbik7XG4gICAgXG4gICAgLy8gQWRkIGhlYWRlciBhbmQgY29udGVudCB0byB0aGUgdG9vbFxuICAgIHRoaXMudG9vbEVsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICB0aGlzLnRvb2xFbGVtZW50LmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy50b29sRWxlbWVudCk7XG5cbiAgICAvLyBMb2FkIHNhdmVkIGdyb3Vwc1xuICAgIHRoaXMubG9hZEdyb3VwcygpO1xuICAgIFxuICAgIC8vIEluaXRpYWwgcmVuZGVyIG9mIHNldHNcbiAgICB0aGlzLmZpbHRlclNldHMoKTtcbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyU2V0cygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoSW5wdXQgfHwgIXRoaXMuc2V0c0NvbnRhaW5lcikgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IHNlYXJjaFRlcm0gPSB0aGlzLnNlYXJjaElucHV0LnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5maWx0ZXJlZFNldHMgPSB0aGlzLnNldHMuZmlsdGVyKHNldCA9PiBcbiAgICAgIHNldC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSkgfHxcbiAgICAgIHNldC5pZC50b1N0cmluZygpLmluY2x1ZGVzKHNlYXJjaFRlcm0pXG4gICAgKTtcbiAgICBcbiAgICB0aGlzLnJlbmRlclNldHMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU2V0cygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2V0c0NvbnRhaW5lcikgcmV0dXJuO1xuICAgIFxuICAgIHRoaXMuc2V0c0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICBcbiAgICBpZiAodGhpcy5maWx0ZXJlZFNldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBub1Jlc3VsdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG5vUmVzdWx0cy50ZXh0Q29udGVudCA9ICdObyBzZXRzIGZvdW5kJztcbiAgICAgIG5vUmVzdWx0cy5zdHlsZS5wYWRkaW5nID0gJzEwcHgnO1xuICAgICAgbm9SZXN1bHRzLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgbm9SZXN1bHRzLnN0eWxlLmNvbG9yID0gJyM2NjYnO1xuICAgICAgdGhpcy5zZXRzQ29udGFpbmVyLmFwcGVuZENoaWxkKG5vUmVzdWx0cyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHRoaXMuZmlsdGVyZWRTZXRzLmZvckVhY2goc2V0ID0+IHtcbiAgICAgIGNvbnN0IHNldEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHNldEl0ZW0uc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIHNldEl0ZW0uc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgc2V0SXRlbS5zdHlsZS5wYWRkaW5nID0gJzhweCc7XG4gICAgICBzZXRJdGVtLnN0eWxlLmJvcmRlckJvdHRvbSA9ICcxcHggc29saWQgI2VlZSc7XG4gICAgICBcbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgIGNoZWNrYm94LnR5cGUgPSAnY2hlY2tib3gnO1xuICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHNldC5zZWxlY3RlZCB8fCBmYWxzZTtcbiAgICAgIGNoZWNrYm94LnN0eWxlLm1hcmdpblJpZ2h0ID0gJzEwcHgnO1xuICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICBzZXQuc2VsZWN0ZWQgPSBjaGVja2JveC5jaGVja2VkO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBgJHtzZXQubmFtZX0gKElEOiAke3NldC5pZH0pYDtcbiAgICAgIGxhYmVsLnN0eWxlLmZsZXggPSAnMSc7XG4gICAgICBsYWJlbC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgbGFiZWwuc3R5bGUudGV4dE92ZXJmbG93ID0gJ2VsbGlwc2lzJztcbiAgICAgIGxhYmVsLnN0eWxlLndoaXRlU3BhY2UgPSAnbm93cmFwJztcbiAgICAgIFxuICAgICAgc2V0SXRlbS5hcHBlbmRDaGlsZChjaGVja2JveCk7XG4gICAgICBzZXRJdGVtLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgIHRoaXMuc2V0c0NvbnRhaW5lcj8uYXBwZW5kQ2hpbGQoc2V0SXRlbSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldFNlbGVjdGVkU2V0cygpOiBTZXRJdGVtW10ge1xuICAgIHJldHVybiB0aGlzLnNldHMuZmlsdGVyKHNldCA9PiBzZXQuc2VsZWN0ZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkU2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzRWxlbWVudCkgcmV0dXJuO1xuICAgIFxuICAgIHRoaXMuaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnNldFN0YXR1cygnTG9hZGluZyBzZXRzLi4uJywgJ2luZm8nKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3QgYmFzZVVybCA9IHRoaXMuYmFzZVVybCB8fCBhd2FpdCBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsKCk7XG4gICAgICBpZiAoIWJhc2VVcmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgZGV0ZXJtaW5lIERhdGFXYWxrIGJhc2UgVVJMJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNldHMgPSBhd2FpdCBmZXRjaFNldHMoYmFzZVVybCk7XG4gICAgICB0aGlzLnNldHMgPSBzZXRzLm1hcChzZXQgPT4gKHtcbiAgICAgICAgaWQ6IHNldC5pZCxcbiAgICAgICAgbmFtZTogc2V0Lm5hbWUsXG4gICAgICAgIHNlbGVjdGVkOiBmYWxzZVxuICAgICAgfSkpO1xuICAgICAgdGhpcy5maWx0ZXJlZFNldHMgPSBbLi4udGhpcy5zZXRzXTtcbiAgICAgIHRoaXMucmVuZGVyU2V0cygpO1xuICAgICAgdGhpcy5zZXRTdGF0dXMoJycsICdpbmZvJyk7XG4gICAgICBcbiAgICAgIC8vIEFsd2F5cyBsb2FkIGdyb3VwcyBhZnRlciBsb2FkaW5nIHNldHNcbiAgICAgIGF3YWl0IHRoaXMubG9hZEdyb3VwcygpO1xuICAgICAgXG4gICAgICAvLyBNYXJrIGFzIGluaXRpYWxpemVkIGFmdGVyIGZpcnN0IGxvYWRcbiAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgc2V0czonLCBlcnJvcik7XG4gICAgICB0aGlzLnNldFN0YXR1cyhgRXJyb3I6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCwgJ2Vycm9yJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBwcml2YXRlIGFzeW5jIGxvYWRHcm91cHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkR3JvdXBzID0gYXdhaXQgdGhpcy5nZXRTYXZlZEdyb3VwcygpO1xuICAgICAgdGhpcy5zZXRHcm91cHMgPSBzYXZlZEdyb3VwcztcbiAgICAgIHRoaXMudXBkYXRlR3JvdXBTZWxlY3QoKTtcbiAgICAgIFxuICAgICAgLy8gQ2xlYXIgZ3JvdXAgbmFtZSBpbnB1dCB3aGVuIGdyb3VwcyBhcmUgbG9hZGVkIGZvciBhIG5ldyBlbnZpcm9ubWVudFxuICAgICAgaWYgKHRoaXMuZ3JvdXBOYW1lSW5wdXQpIHtcbiAgICAgICAgdGhpcy5ncm91cE5hbWVJbnB1dC52YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGdyb3VwczonLCBlcnJvcik7XG4gICAgICB0aGlzLnNldFN0YXR1cygnRmFpbGVkIHRvIGxvYWQgc2F2ZWQgZ3JvdXBzJywgJ2Vycm9yJyk7XG4gICAgfVxuICB9XG4gIFxuICBwcml2YXRlIGFzeW5jIGdldFN0b3JhZ2VLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5iYXNlVXJsIHx8IGF3YWl0IGdldEN1cnJlbnREYXRhd2Fsa0Jhc2VVcmwoKTtcbiAgICByZXR1cm4gYGR3U2V0R3JvdXBzXyR7YnRvYShiYXNlVXJsIHx8ICcnKX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRTYXZlZEdyb3VwcygpOiBQcm9taXNlPFNldEdyb3VwW10+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RvcmFnZUtleSA9IGF3YWl0IHRoaXMuZ2V0U3RvcmFnZUtleSgpO1xuICAgICAgXG4gICAgICAvLyBUcnkgY2hyb21lLnN0b3JhZ2UubG9jYWwgZmlyc3RcbiAgICAgIGlmIChjaHJvbWUuc3RvcmFnZT8ubG9jYWwpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KHN0b3JhZ2VLZXkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0W3N0b3JhZ2VLZXldIHx8IFtdO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBGYWxsIGJhY2sgdG8gbG9jYWxTdG9yYWdlIGlmIGNocm9tZS5zdG9yYWdlIGlzIG5vdCBhdmFpbGFibGVcbiAgICAgIGNvbnNvbGUud2FybignY2hyb21lLnN0b3JhZ2UubG9jYWwgbm90IGF2YWlsYWJsZSwgZmFsbGluZyBiYWNrIHRvIGxvY2FsU3RvcmFnZScpO1xuICAgICAgY29uc3Qgc2F2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcbiAgICAgIHJldHVybiBzYXZlZCA/IEpTT04ucGFyc2Uoc2F2ZWQpIDogW107XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZ3JvdXBzOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cbiAgXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUdyb3VwcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RvcmFnZUtleSA9IGF3YWl0IHRoaXMuZ2V0U3RvcmFnZUtleSgpO1xuICAgICAgY29uc3QgZGF0YSA9IHsgW3N0b3JhZ2VLZXldOiB0aGlzLnNldEdyb3VwcyB9O1xuICAgICAgXG4gICAgICAvLyBUcnkgY2hyb21lLnN0b3JhZ2UubG9jYWwgZmlyc3RcbiAgICAgIGlmIChjaHJvbWUuc3RvcmFnZT8ubG9jYWwpIHtcbiAgICAgICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGxvY2FsU3RvcmFnZVxuICAgICAgICBjb25zb2xlLndhcm4oJ2Nocm9tZS5zdG9yYWdlLmxvY2FsIG5vdCBhdmFpbGFibGUsIGZhbGxpbmcgYmFjayB0byBsb2NhbFN0b3JhZ2UnKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXRHcm91cHMpKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gTm90aWZ5IG90aGVyIHRhYnMgYWJvdXQgdGhlIHVwZGF0ZVxuICAgICAgYXdhaXQgdGhpcy5ub3RpZnlFbnZpcm9ubWVudENoYW5nZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzYXZpbmcgZ3JvdXBzOicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNhdmUgZ3JvdXBzJyk7XG4gICAgfVxuICB9XG4gIFxuICBwcml2YXRlIGFzeW5jIG5vdGlmeUVudmlyb25tZW50Q2hhbmdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFRoaXMgd2lsbCBoZWxwIG90aGVyIHRhYnMgZGV0ZWN0IGNoYW5nZXNcbiAgICBpZiAoY2hyb21lLnN0b3JhZ2U/LmxvY2FsKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdG9yYWdlS2V5ID0gYXdhaXQgdGhpcy5nZXRTdG9yYWdlS2V5KCk7XG4gICAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IFxuICAgICAgICAgIFtzdG9yYWdlS2V5XTogdGhpcy5zZXRHcm91cHMsXG4gICAgICAgICAgbGFzdFVwZGF0ZTogRGF0ZS5ub3coKSBcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBub3RpZnlpbmcgZW52aXJvbm1lbnQgY2hhbmdlOicsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByaXZhdGUgdXBkYXRlR3JvdXBTZWxlY3QoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmdyb3VwU2VsZWN0KSByZXR1cm47XG4gICAgXG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gdGhpcy5ncm91cFNlbGVjdC52YWx1ZTtcbiAgICB0aGlzLmdyb3VwU2VsZWN0LmlubmVySFRNTCA9ICcnO1xuICAgIFxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBkZWZhdWx0T3B0aW9uLnZhbHVlID0gJyc7XG4gICAgZGVmYXVsdE9wdGlvbi50ZXh0Q29udGVudCA9ICctLSBTZWxlY3QgYSBncm91cCAtLSc7XG4gICAgdGhpcy5ncm91cFNlbGVjdC5hcHBlbmRDaGlsZChkZWZhdWx0T3B0aW9uKTtcbiAgICBcbiAgICB0aGlzLnNldEdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgb3B0aW9uLnZhbHVlID0gZ3JvdXAuaWQ7XG4gICAgICBvcHRpb24udGV4dENvbnRlbnQgPSBgJHtncm91cC5uYW1lfSAoJHtncm91cC5zZXRJZHMubGVuZ3RofSBzZXRzKWA7XG4gICAgICB0aGlzLmdyb3VwU2VsZWN0Py5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIH0pO1xuICAgIFxuICAgIGlmIChjdXJyZW50VmFsdWUpIHtcbiAgICAgIHRoaXMuZ3JvdXBTZWxlY3QudmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgfVxuICB9XG4gIFxuICBwcml2YXRlIGFzeW5jIHNhdmVHcm91cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuZ3JvdXBOYW1lSW5wdXQpIHJldHVybjtcbiAgICBcbiAgICBjb25zdCBuYW1lID0gdGhpcy5ncm91cE5hbWVJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aGlzLnNldFN0YXR1cygnUGxlYXNlIGVudGVyIGEgZ3JvdXAgbmFtZScsICdlcnJvcicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBzZWxlY3RlZFNldHMgPSB0aGlzLmdldFNlbGVjdGVkU2V0cygpO1xuICAgIGlmIChzZWxlY3RlZFNldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnNldFN0YXR1cygnUGxlYXNlIHNlbGVjdCBhdCBsZWFzdCBvbmUgc2V0JywgJ2Vycm9yJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBpZiBhIGdyb3VwIHdpdGggdGhpcyBuYW1lIGFscmVhZHkgZXhpc3RzIChjYXNlLWluc2Vuc2l0aXZlKVxuICAgICAgY29uc3QgZXhpc3RpbmdHcm91cEluZGV4ID0gdGhpcy5zZXRHcm91cHMuZmluZEluZGV4KGcgPT4gZy5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICBcbiAgICAgIGlmIChleGlzdGluZ0dyb3VwSW5kZXggPj0gMCkge1xuICAgICAgICAvLyBVcGRhdGUgZXhpc3RpbmcgZ3JvdXBcbiAgICAgICAgY29uc3QgdXBkYXRlZEdyb3VwcyA9IFsuLi50aGlzLnNldEdyb3Vwc107XG4gICAgICAgIHVwZGF0ZWRHcm91cHNbZXhpc3RpbmdHcm91cEluZGV4XSA9IHtcbiAgICAgICAgICAuLi51cGRhdGVkR3JvdXBzW2V4aXN0aW5nR3JvdXBJbmRleF0sXG4gICAgICAgICAgc2V0SWRzOiBzZWxlY3RlZFNldHMubWFwKHNldCA9PiBzZXQuaWQpLFxuICAgICAgICAgIHVwZGF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldEdyb3VwcyA9IHVwZGF0ZWRHcm91cHM7XG4gICAgICAgIHRoaXMuc2V0U3RhdHVzKGBHcm91cCBcIiR7bmFtZX1cIiB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAsICdzdWNjZXNzJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDcmVhdGUgbmV3IGdyb3VwXG4gICAgICAgIGNvbnN0IG5ld0dyb3VwOiBTZXRHcm91cCA9IHtcbiAgICAgICAgICBpZDogYGdyb3VwXyR7RGF0ZS5ub3coKX1gLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgc2V0SWRzOiBzZWxlY3RlZFNldHMubWFwKHNldCA9PiBzZXQuaWQpLFxuICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICAgICAgICB1cGRhdGVkQXQ6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zZXRHcm91cHMgPSBbLi4udGhpcy5zZXRHcm91cHMsIG5ld0dyb3VwXTtcbiAgICAgICAgdGhpcy5zZXRTdGF0dXMoYEdyb3VwIFwiJHtuYW1lfVwiIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5YCwgJ3N1Y2Nlc3MnKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgYXdhaXQgdGhpcy5zYXZlR3JvdXBzKCk7XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwU2VsZWN0KCk7XG4gICAgICBcbiAgICAgIC8vIENsZWFyIHRoZSBncm91cCBuYW1lIGlucHV0XG4gICAgICBpZiAodGhpcy5ncm91cE5hbWVJbnB1dCkge1xuICAgICAgICB0aGlzLmdyb3VwTmFtZUlucHV0LnZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNhdmluZyBncm91cDonLCBlcnJvcik7XG4gICAgICB0aGlzLnNldFN0YXR1cygnRmFpbGVkIHRvIHNhdmUgZ3JvdXAnLCAnZXJyb3InKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbGV0ZUdyb3VwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5ncm91cFNlbGVjdCB8fCAhY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGdyb3VwPycpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGdyb3VwSWQgPSB0aGlzLmdyb3VwU2VsZWN0LnZhbHVlO1xuICAgIGlmICghZ3JvdXBJZCkgcmV0dXJuO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICB0aGlzLnNldEdyb3VwcyA9IHRoaXMuc2V0R3JvdXBzLmZpbHRlcihnID0+IGcuaWQgIT09IGdyb3VwSWQpO1xuICAgICAgYXdhaXQgdGhpcy5zYXZlR3JvdXBzKCk7XG4gICAgICB0aGlzLnVwZGF0ZUdyb3VwU2VsZWN0KCk7XG4gICAgICB0aGlzLnNldFN0YXR1cygnR3JvdXAgZGVsZXRlZCcsICdzdWNjZXNzJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRlbGV0aW5nIGdyb3VwOicsIGVycm9yKTtcbiAgICAgIHRoaXMuc2V0U3RhdHVzKCdGYWlsZWQgdG8gZGVsZXRlIGdyb3VwJywgJ2Vycm9yJyk7XG4gICAgfVxuICB9XG4gIFxuICBwcml2YXRlIGxvYWRTZWxlY3RlZEdyb3VwKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5ncm91cFNlbGVjdCB8fCAhdGhpcy5ncm91cE5hbWVJbnB1dCkgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IGdyb3VwSWQgPSB0aGlzLmdyb3VwU2VsZWN0LnZhbHVlO1xuICAgIGlmICghZ3JvdXBJZCkgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IGdyb3VwID0gdGhpcy5zZXRHcm91cHMuZmluZChnID0+IGcuaWQgPT09IGdyb3VwSWQpO1xuICAgIGlmICghZ3JvdXApIHJldHVybjtcbiAgICBcbiAgICAvLyBVcGRhdGUgdGhlIGdyb3VwIG5hbWUgaW5wdXRcbiAgICB0aGlzLmdyb3VwTmFtZUlucHV0LnZhbHVlID0gZ3JvdXAubmFtZTtcbiAgICBcbiAgICAvLyBVcGRhdGUgc2VsZWN0ZWQgc3RhdGUgb2Ygc2V0c1xuICAgIHRoaXMuc2V0cy5mb3JFYWNoKHNldCA9PiB7XG4gICAgICBzZXQuc2VsZWN0ZWQgPSBncm91cC5zZXRJZHMuaW5jbHVkZXMoc2V0LmlkKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBSZS1yZW5kZXIgc2V0cyB0byBzaG93IHVwZGF0ZWQgc2VsZWN0aW9uXG4gICAgdGhpcy5yZW5kZXJTZXRzKCk7XG4gIH1cbiAgXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUFjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3RlZFNldHMgPSB0aGlzLmdldFNlbGVjdGVkU2V0cygpO1xuICAgIGlmIChzZWxlY3RlZFNldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnNldFN0YXR1cygnUGxlYXNlIHNlbGVjdCBhdCBsZWFzdCBvbmUgc2V0JywgJ2Vycm9yJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuYWN0aW9uU2VsZWN0Py52YWx1ZSB8fCAndHJ1bmNhdGUnO1xuICAgIFxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICd0cnVuY2F0ZSc6XG4gICAgICAgIGlmIChjb25maXJtKGBXQVJOSU5HOiBUaGlzIHdpbGwgcGVybWFuZW50bHkgZGVsZXRlIGFsbCBkYXRhIGluICR7c2VsZWN0ZWRTZXRzLmxlbmd0aH0gc2VsZWN0ZWQgc2V0KHMpLiBUaGlzIGFjdGlvbiBjYW5ub3QgYmUgdW5kb25lLlxcblxcbkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBjb250aW51ZT9gKSkge1xuICAgICAgICAgIGZvciAoY29uc3Qgc2V0IG9mIHNlbGVjdGVkU2V0cykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50cnVuY2F0ZVNldChzZXQuaWQsIHNldC5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnY291bnQnOlxuICAgICAgICB0aGlzLnNldFN0YXR1cyhgU2VsZWN0ZWQgJHtzZWxlY3RlZFNldHMubGVuZ3RofSBzZXQocylgLCAnaW5mbycpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdleHBvcnQnOlxuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgZXhwb3J0IGZ1bmN0aW9uYWxpdHlcbiAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ0V4cG9ydCBmdW5jdGlvbmFsaXR5IGNvbWluZyBzb29uJywgJ2luZm8nKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5zZXRTdGF0dXMoJ1Vua25vd24gYWN0aW9uJywgJ2Vycm9yJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB0cnVuY2F0ZVNldChzZXRJZDogbnVtYmVyLCBzZXROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzRWxlbWVudCkgcmV0dXJuO1xuXG4gICAgdGhpcy5zZXRTdGF0dXMoYFRydW5jYXRpbmcgXCIke3NldE5hbWV9XCIuLi5gLCAnaW5mbycpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCBiYXNlVXJsID0gYXdhaXQgZ2V0Q3VycmVudERhdGF3YWxrQmFzZVVybCgpO1xuICAgICAgaWYgKCFiYXNlVXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGRldGVybWluZSBEYXRhV2FsayBiYXNlIFVSTCcpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRydW5jYXRlU2V0KGJhc2VVcmwsIHNldElkKTtcbiAgICAgIFxuICAgICAgaWYgKHJlc3BvbnNlLmRhdGE/LnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0dXMoYFN1Y2Nlc3NmdWxseSB0cnVuY2F0ZWQgXCIke3NldE5hbWV9XCJgLCAnc3VjY2VzcycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLmVycm9yPy5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yIG9jY3VycmVkJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHRydW5jYXRpbmcgc2V0ICR7c2V0SWR9OmAsIGVycm9yKTtcbiAgICAgIHRoaXMuc2V0U3RhdHVzKGBFcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdGYWlsZWQgdG8gdHJ1bmNhdGUgc2V0J31gLCAnZXJyb3InKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldFN0YXR1cyhtZXNzYWdlOiBzdHJpbmcsIHR5cGU6IFN0YXR1c1R5cGUgPSAnaW5mbycpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc3RhdHVzRWxlbWVudCkgcmV0dXJuO1xuICAgIFxuICAgIHRoaXMuc3RhdHVzRWxlbWVudC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gICAgdGhpcy5zdGF0dXNFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFxuICAgICAgdHlwZSA9PT0gJ2Vycm9yJyA/ICcjZjhkN2RhJyA6IFxuICAgICAgdHlwZSA9PT0gJ3N1Y2Nlc3MnID8gJyNkNGVkZGEnIDogXG4gICAgICB0eXBlID09PSAnd2FybmluZycgPyAnI2ZmZjNjZCcgOiAnI2QxZWNmMSc7XG4gICAgdGhpcy5zdGF0dXNFbGVtZW50LnN0eWxlLmNvbG9yID0gXG4gICAgICB0eXBlID09PSAnZXJyb3InID8gJyNkYzM1NDUnIDogXG4gICAgICB0eXBlID09PSAnc3VjY2VzcycgPyAnIzI4YTc0NScgOiBcbiAgICAgIHR5cGUgPT09ICd3YXJuaW5nJyA/ICcjODU2NDA0JyA6ICcjMGM1NDYwJztcbiAgICB0aGlzLnN0YXR1c0VsZW1lbnQuc3R5bGUuYm9yZGVyTGVmdCA9IGA0cHggc29saWQgJHtcbiAgICAgIHR5cGUgPT09ICdlcnJvcicgPyAnI2RjMzU0NScgOiBcbiAgICAgIHR5cGUgPT09ICdzdWNjZXNzJyA/ICcjMjhhNzQ1JyA6IFxuICAgICAgdHlwZSA9PT0gJ3dhcm5pbmcnID8gJyNmZmMxMDcnIDogJyMxN2EyYjgnXG4gICAgfWA7XG4gICAgdGhpcy5zdGF0dXNFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBtZXNzYWdlID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICB0aGlzLnN0YXR1c0VsZW1lbnQuc3R5bGUucGFkZGluZyA9ICcxMHB4JztcbiAgICB0aGlzLnN0YXR1c0VsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzRweCc7XG4gICAgdGhpcy5zdGF0dXNFbGVtZW50LnN0eWxlLm1hcmdpblRvcCA9ICcxMHB4JztcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnREcmFnZ2luZyhlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGUuYnV0dG9uICE9PSAwIHx8ICF0aGlzLnRvb2xFbGVtZW50KSByZXR1cm47IC8vIE9ubHkgbGVmdCBtb3VzZSBidXR0b25cbiAgICBcbiAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcG9zaXRpb24gYW5kIGRpbWVuc2lvbnMgb2YgdGhlIHRvb2xcbiAgICBjb25zdCByZWN0ID0gdGhpcy50b29sRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgdGhlIG9mZnNldCBmcm9tIHRoZSBtb3VzZSB0byB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZSB0b29sXG4gICAgdGhpcy5kcmFnU3RhcnRYID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIHRoaXMuZHJhZ1N0YXJ0WSA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIFxuICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgdGhpcy5jdXJyZW50WCA9IHJlY3QubGVmdDtcbiAgICB0aGlzLmN1cnJlbnRZID0gcmVjdC50b3A7XG4gICAgXG4gICAgLy8gQXBwbHkgc3R5bGVzIGZvciBkcmFnZ2luZ1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUudHJhbnNpdGlvbiA9ICdub25lJztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIH1cblxuICBwcml2YXRlIG9uRHJhZyhlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcgfHwgIXRoaXMudG9vbEVsZW1lbnQpIHJldHVybjtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9uXG4gICAgbGV0IG5ld1ggPSBlLmNsaWVudFggLSB0aGlzLmRyYWdTdGFydFg7XG4gICAgbGV0IG5ld1kgPSBlLmNsaWVudFkgLSB0aGlzLmRyYWdTdGFydFk7XG4gICAgXG4gICAgLy8gQ29uc3RyYWluIHRvIHZpZXdwb3J0XG4gICAgY29uc3QgcmVjdCA9IHRoaXMudG9vbEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgdmlld3BvcnRXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGNvbnN0IHZpZXdwb3J0SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIFxuICAgIC8vIEtlZXAgdG9vbCB3aXRoaW4gdmlld3BvcnQgYm91bmRzIHdpdGggc29tZSBtYXJnaW4gKDEwcHgpXG4gICAgY29uc3QgbWFyZ2luID0gMTA7XG4gICAgbmV3WCA9IE1hdGgubWF4KG1hcmdpbiAtIHJlY3Qud2lkdGggKyAyMCwgTWF0aC5taW4obmV3WCwgdmlld3BvcnRXaWR0aCAtIDIwKSk7XG4gICAgbmV3WSA9IE1hdGgubWF4KG1hcmdpbiwgTWF0aC5taW4obmV3WSwgdmlld3BvcnRIZWlnaHQgLSAyMCkpO1xuICAgIFxuICAgIC8vIFVwZGF0ZSBwb3NpdGlvblxuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUubGVmdCA9IGAke25ld1h9cHhgO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUudG9wID0gYCR7bmV3WX1weGA7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSAnbm9uZSc7XG4gIH1cblxuICBwcml2YXRlIHN0b3BEcmFnZ2luZygpOiB2b2lkIHtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnVzZXJTZWxlY3QgPSAnJztcbiAgfVxuXG4gIHB1YmxpYyBzaG93KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy50b29sRWxlbWVudCkgcmV0dXJuO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgdGhpcy5jdXJyZW50SXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAvLyBDZW50ZXIgdGhlIHRvb2wgd2hlbiBzaG93aW5nXG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzUwJSc7XG4gICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS50b3AgPSAnNTAlJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoLTUwJSwgLTUwJSknO1xuICAgIC8vIFJlZnJlc2ggc2V0cyB3aGVuIHNob3dpbmcgdGhlIHRvb2xcbiAgICB0aGlzLmxvYWRTZXRzKCk7XG4gIH1cblxuICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMudG9vbEVsZW1lbnQpIHJldHVybjtcbiAgICB0aGlzLnRvb2xFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgdGhpcy5jdXJyZW50SXNWaXNpYmxlID0gZmFsc2U7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgZXZlbnQgbGlzdGVuZXJzIHdoZW4gaGlkaW5nXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbkRyYWcuYmluZCh0aGlzKSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuc3RvcERyYWdnaW5nLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jdXJyZW50SXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93KCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGlzVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50SXNWaXNpYmxlO1xuICB9XG59XG4iLCIvLyBzcmMvdWkvRHJhZ2dhYmxlSWNvbi50c1xuXG5pbXBvcnQgeyBnZXRDdXJyZW50RGF0YXdhbGtCYXNlVXJsIH0gZnJvbSAnLi4vdXRpbHMvdXJsVXRpbHMnO1xuaW1wb3J0IHsgQ29udGV4dFJldHJpZXZhbFRvb2wgfSBmcm9tICcuL0NvbnRleHRSZXRyaWV2YWxUb29sJzsgXG5pbXBvcnQgeyBEZXBsb3llZEFwcHNUb29sIH0gZnJvbSAnLi9EZXBsb3llZEFwcHNUb29sJztcbmltcG9ydCB7IFNldFRydW5jYXRpb25Ub29sIH0gZnJvbSAnLi9TZXRUcnVuY2F0aW9uVG9vbCc7XG5cbmV4cG9ydCBjbGFzcyBEcmFnZ2FibGVJY29uIHtcbiAgcHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBpc0RyYWdnaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgb2Zmc2V0WDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBvZmZzZXRZOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNsaWNrSGFuZGxlcj86ICgpID0+IHZvaWQ7IFxuXG4gIHByaXZhdGUgaXNTdGlja3lIb3ZlckFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlOyBcbiAgcHJpdmF0ZSB0b29sSWNvbnNXcmFwcGVyOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBzZWFyY2hUb29sSWNvbjogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgY29kZVRvb2xJY29uOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBjb250ZXh0VG9vbEljb246IEhUTUxFbGVtZW50OyBcbiAgcHJpdmF0ZSBkZXBsb3llZEFwcHNUb29sSWNvbjogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2V0VHJ1bmNhdGlvbkljb246IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGhvdmVySGlkZVRpbWVvdXQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIC8vIENhbGxiYWNrcyBmb3IgdG9vbCBpY29uIGNsaWNrc1xuICBwcml2YXRlIG9uU2VhcmNoSWNvbkNsaWNrPzogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkNvZGVJY29uQ2xpY2s/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uQ29udGV4dEljb25DbGljaz86ICgpID0+IHZvaWQ7IFxuXG4gIHByaXZhdGUgY29udGV4dFRvb2w6IENvbnRleHRSZXRyaWV2YWxUb29sIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZGVwbG95ZWRBcHBzVG9vbDogRGVwbG95ZWRBcHBzVG9vbCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNldFRydW5jYXRpb25Ub29sOiBTZXRUcnVuY2F0aW9uVG9vbCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG9uU2VhcmNoQ2xpY2tDYWxsYmFjaz86ICgpID0+IHZvaWQsIFxuICAgIG9uQ29kZUNsaWNrQ2FsbGJhY2s/OiAoKSA9PiB2b2lkLFxuICAgIG9uQ29udGV4dENsaWNrQ2FsbGJhY2s/OiAoKSA9PiB2b2lkLCBcbiAgICBtYWluSWNvbkNsaWNrSGFuZGxlcj86ICgpID0+IHZvaWQgXG4gICkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAncGR3Yy1kcmFnZ2FibGUtaWNvbic7XG5cbiAgICBjb25zdCBtYWluSWNvblZpc3VhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBtYWluSWNvblZpc3VhbC5jbGFzc05hbWUgPSAnZmFzIGZhLXRvb2xzJztcbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQobWFpbkljb25WaXN1YWwpO1xuICAgIHRoaXMuZWxlbWVudC50aXRsZSA9IFwiUGFibG8ncyBEVyBDaGFkIFRvb2xzXCI7XG5cbiAgICB0aGlzLm9uU2VhcmNoSWNvbkNsaWNrID0gb25TZWFyY2hDbGlja0NhbGxiYWNrO1xuICAgIHRoaXMub25Db2RlSWNvbkNsaWNrID0gb25Db2RlQ2xpY2tDYWxsYmFjaztcbiAgICB0aGlzLm9uQ29udGV4dEljb25DbGljayA9IG9uQ29udGV4dENsaWNrQ2FsbGJhY2s7IFxuICAgIHRoaXMuY2xpY2tIYW5kbGVyID0gbWFpbkljb25DbGlja0hhbmRsZXI7IFxuXG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLmNsYXNzTmFtZSA9ICdwZHdjLXRvb2wtaWNvbnMtd3JhcHBlcic7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IFxuXG4gICAgLy8gU2VhcmNoIEljb25cbiAgICB0aGlzLnNlYXJjaFRvb2xJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5zZWFyY2hUb29sSWNvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWljb24gcGR3Yy1zZWFyY2gtYnV0dG9uJztcbiAgICB0aGlzLnNlYXJjaFRvb2xJY29uLmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhcyBmYS1zZWFyY2hcIj48L2k+JztcbiAgICB0aGlzLnNlYXJjaFRvb2xJY29uLnRpdGxlID0gJ09wZW4gU2VhcmNoIFRvb2wnO1xuICAgIHRoaXMuc2VhcmNoVG9vbEljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBTZWFyY2ggaWNvbiBjbGlja2VkIHZpYSBEcmFnZ2FibGVJY29uIGhhbmRsZXIuXCIpO1xuICAgICAgaWYgKHRoaXMub25TZWFyY2hJY29uQ2xpY2spIHtcbiAgICAgICAgdGhpcy5vblNlYXJjaEljb25DbGljaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlID0gZmFsc2U7IFxuICAgICAgdGhpcy5oaWRlVG9vbEljb25zSW5zdGFudCgpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29kZSBJY29uXG4gICAgdGhpcy5jb2RlVG9vbEljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmNvZGVUb29sSWNvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWljb24gcGR3Yy1jb2RlLWJ1dHRvbic7XG4gICAgdGhpcy5jb2RlVG9vbEljb24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmFzIGZhLWNvZGVcIj48L2k+JztcbiAgICB0aGlzLmNvZGVUb29sSWNvbi50aXRsZSA9ICdPcGVuIENvZGUgVG9vbCc7XG4gICAgdGhpcy5jb2RlVG9vbEljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBDb2RlIGljb24gY2xpY2tlZCB2aWEgRHJhZ2dhYmxlSWNvbiBoYW5kbGVyLlwiKTtcbiAgICAgIGlmICh0aGlzLm9uQ29kZUljb25DbGljaykge1xuICAgICAgICB0aGlzLm9uQ29kZUljb25DbGljaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlID0gZmFsc2U7IFxuICAgICAgdGhpcy5oaWRlVG9vbEljb25zSW5zdGFudCgpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGV4dCBSZXRyaWV2YWwgSWNvblxuICAgIHRoaXMuY29udGV4dFRvb2xJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5jb250ZXh0VG9vbEljb24uY2xhc3NOYW1lID0gJ3Bkd2MtdG9vbC1pY29uIHBkd2MtY29udGV4dC1idXR0b24nO1xuICAgIHRoaXMuY29udGV4dFRvb2xJY29uLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGhlaWdodD1cIjIwcHhcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgd2lkdGg9XCIyMHB4XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIHN0eWxlPVwidmVydGljYWwtYWxpZ246IG1pZGRsZTtcIj5cbiAgICAgICAgPHBhdGggZD1cIk0wIDBoMjR2MjRIMFYwelwiIGZpbGw9XCJub25lXCIvPlxuICAgICAgICA8cGF0aCBkPVwiTTExLjk5IDE4LjU0bC03LjM3LTUuNzNMMyAxNC4wN2w5IDcgOS03LTEuNjMtMS4yNy03LjM4IDUuNzR6TTEyIDE2bDcuMzYtNS43M0wyMSA5bC05LTctOSA3IDEuNjMgMS4yN0wxMiAxNnpcIi8+XG4gICAgICA8L3N2Zz5gO1xuICAgIHRoaXMuY29udGV4dFRvb2xJY29uLnRpdGxlID0gJ09wZW4gQ29udGV4dCBSZXRyaWV2YWwgVG9vbCc7XG4gICAgdGhpcy5jb250ZXh0VG9vbEljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBDb250ZXh0IGljb24gY2xpY2tlZCB2aWEgRHJhZ2dhYmxlSWNvbiBoYW5kbGVyLlwiKTtcbiAgICAgIGlmICh0aGlzLm9uQ29udGV4dEljb25DbGljaykge1xuICAgICAgICB0aGlzLm9uQ29udGV4dEljb25DbGljaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlID0gZmFsc2U7IFxuICAgICAgdGhpcy5oaWRlVG9vbEljb25zSW5zdGFudCgpO1xuICAgIH0pO1xuXG4gICAgLy8gU2V0IFRydW5jYXRpb24gSWNvblxuICAgIHRoaXMuc2V0VHJ1bmNhdGlvbkljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnNldFRydW5jYXRpb25JY29uLmNsYXNzTmFtZSA9ICdwZHdjLXRvb2wtaWNvbiBwZHdjLXRydW5jYXRlLWJ1dHRvbic7XG4gICAgdGhpcy5zZXRUcnVuY2F0aW9uSWNvbi5pbm5lckhUTUwgPSBgXG4gICAgICA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBoZWlnaHQ9XCIyMHB4XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIHdpZHRoPVwiMjBweFwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBzdHlsZT1cInZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XCI+XG4gICAgICAgIDxwYXRoIGQ9XCJNMCAwaDI0djI0SDBWMHpcIiBmaWxsPVwibm9uZVwiLz5cbiAgICAgICAgPHBhdGggZD1cIk02IDE5YzAgMS4xLjkgMiAyIDJoOGMxLjEgMCAyLS45IDItMlY3SDZ2MTJ6TTE5IDRoLTMuNWwtMS0xaC01bC0xIDFINXYyaDE0VjR6XCIvPlxuICAgICAgPC9zdmc+YDtcbiAgICB0aGlzLnNldFRydW5jYXRpb25JY29uLnRpdGxlID0gJ1RydW5jYXRlIFNldCc7XG4gICAgdGhpcy5zZXRUcnVuY2F0aW9uSWNvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IFNldCBUcnVuY2F0aW9uIGljb24gY2xpY2tlZFwiKTtcbiAgICAgIGlmICghdGhpcy5zZXRUcnVuY2F0aW9uVG9vbCkge1xuICAgICAgICB0aGlzLnNldFRydW5jYXRpb25Ub29sID0gbmV3IFNldFRydW5jYXRpb25Ub29sKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldFRydW5jYXRpb25Ub29sLnRvZ2dsZSgpO1xuICAgICAgdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlID0gZmFsc2U7XG4gICAgICB0aGlzLmhpZGVUb29sSWNvbnNJbnN0YW50KCk7XG4gICAgfSk7XG5cbiAgICAvLyBEZXBsb3llZCBBcHBzIFRvb2wgSWNvblxuICAgIHRoaXMuZGVwbG95ZWRBcHBzVG9vbEljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmRlcGxveWVkQXBwc1Rvb2xJY29uLmlubmVySFRNTCA9IGA8c3ZnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIGZvY3VzYWJsZT1cImZhbHNlXCIgZGF0YS1wcmVmaXg9XCJmYXNcIiBkYXRhLWljb249XCJ0YWJsZVwiIGNsYXNzPVwic3ZnLWlubGluZS0tZmEgZmEtdGFibGUgZmEtdy0xNlwiIHJvbGU9XCJpbWdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCA1MTIgNTEyXCI+PHBhdGggZmlsbD1cImN1cnJlbnRDb2xvclwiIGQ9XCJNNDY0IDMySDQ4QzIxLjQ5IDMyIDAgNTMuNDkgMCA4MHYzNTJjMCAyNi41MSAyMS40OSA0OCA0OCA0OGg0MTZjMjYuNTEgMCA0OC0yMS40OSA0OC00OFY4MGMwLTI2LjUxLTIxLjQ5LTQ4LTQ4LTQ4ek0yMjQgNDE2SDY0di05NmgxNjB2OTZ6bTAtMTYwSDY0di05NmgxNjB2OTZ6bTIyNCAxNjBIMjg4di05NmgxNjB2OTZ6bTAtMTYwSDI4OHYtOTZoMTYwdjk2elwiPjwvcGF0aD48L3N2Zz5gO1xuICAgIHRoaXMuZGVwbG95ZWRBcHBzVG9vbEljb24uY2xhc3NMaXN0LmFkZCgncGR3Yy10b29sLWljb24nLCAncGR3Yy1kZXBsb3llZC1hcHBzLWJ1dHRvbicpO1xuICAgIHRoaXMuZGVwbG95ZWRBcHBzVG9vbEljb24udGl0bGUgPSAnT3BlbiBEZXBsb3llZCBBcHBzIFRvb2wnO1xuICAgIHRoaXMuZGVwbG95ZWRBcHBzVG9vbEljb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4gdGhpcy5oYW5kbGVEZXBsb3llZEFwcHNJY29uQ2xpY2soZSkpO1xuXG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuc2VhcmNoVG9vbEljb24pO1xuICAgIHRoaXMudG9vbEljb25zV3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLmNvZGVUb29sSWNvbik7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuY29udGV4dFRvb2xJY29uKTtcbiAgICB0aGlzLnRvb2xJY29uc1dyYXBwZXIuYXBwZW5kQ2hpbGQodGhpcy5zZXRUcnVuY2F0aW9uSWNvbik7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuZGVwbG95ZWRBcHBzVG9vbEljb24pOyBcbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy50b29sSWNvbnNXcmFwcGVyKTsgXG5cbiAgICB0aGlzLmxvYWRQb3NpdGlvbigpO1xuICAgIHRoaXMuaW5pdERyYWcoKTtcbiAgICB0aGlzLmluaXRDbGljaygpO1xuICAgIHRoaXMuaW5pdEhvdmVyKCk7IFxuICB9XG5cbiAgcHJpdmF0ZSBpbml0RHJhZygpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmIChlLmJ1dHRvbiAhPT0gMCkgcmV0dXJuO1xuXG4gICAgICBpZiAoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KCcucGR3Yy10b29sLWljb24nKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnRvb2xJY29uc1dyYXBwZXIuc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKSB7XG4gICAgICAgIHRoaXMuaGlkZVRvb2xJY29uc0luc3RhbnQoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMub2Zmc2V0WCA9IGUuY2xpZW50WCAtIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgICAgdGhpcy5vZmZzZXRZID0gZS5jbGllbnRZIC0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5jdXJzb3IgPSAnZ3JhYmJpbmcnO1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnOyBcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXApO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBvbk1vdXNlTW92ZSA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7IFxuXG4gICAgbGV0IG5ld1ggPSBlLmNsaWVudFggLSB0aGlzLm9mZnNldFg7XG4gICAgbGV0IG5ld1kgPSBlLmNsaWVudFkgLSB0aGlzLm9mZnNldFk7XG5cbiAgICBjb25zdCBpY29uUmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBuZXdYID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obmV3WCwgd2luZG93LmlubmVyV2lkdGggLSBpY29uUmVjdC53aWR0aCkpO1xuICAgIG5ld1kgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihuZXdZLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSBpY29uUmVjdC5oZWlnaHQpKTtcblxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5sZWZ0ID0gYCR7bmV3WH1weGA7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLnRvcCA9IGAke25ld1l9cHhgO1xuICAgIFxuICAgIGlmICh0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tIHx8IHRoaXMuZWxlbWVudC5zdHlsZS5yaWdodCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gJyc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5yaWdodCA9ICcnO1xuICAgIH1cbiAgfTtcblxuICBwcml2YXRlIG9uTW91c2VVcCA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpIHJldHVybjtcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuY3Vyc29yID0gJ2dyYWInO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUudXNlclNlbGVjdCA9ICcnO1xuXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwKTtcbiAgICB0aGlzLnNhdmVQb3NpdGlvbigpO1xuICB9O1xuXG4gIHByaXZhdGUgaW5pdENsaWNrKCk6IHZvaWQge1xuICAgIGxldCBkcmFnVGhyZXNob2xkID0gNTsgXG4gICAgbGV0IHN0YXJ0WDogbnVtYmVyLCBzdGFydFk6IG51bWJlcjtcblxuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICBpZiAoZS5idXR0b24gIT09IDApIHJldHVybjtcbiAgICAgICAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xvc2VzdCgnLnBkd2MtdG9vbC1pY29uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdGFydFggPSBlLmNsaWVudFg7XG4gICAgICAgIHN0YXJ0WSA9IGUuY2xpZW50WTtcbiAgICB9KTtcblxuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGUuYnV0dG9uICE9PSAwKSByZXR1cm47XG5cbiAgICAgICAgaWYgKChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xvc2VzdCgnLnBkd2MtdG9vbC1pY29uJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlbHRhWCA9IE1hdGguYWJzKGUuY2xpZW50WCAtIHN0YXJ0WCk7XG4gICAgICAgIGNvbnN0IGRlbHRhWSA9IE1hdGguYWJzKGUuY2xpZW50WSAtIHN0YXJ0WSk7XG5cbiAgICAgICAgaWYgKGRlbHRhWCA8IGRyYWdUaHJlc2hvbGQgJiYgZGVsdGFZIDwgZHJhZ1RocmVzaG9sZCkge1xuICAgICAgICAgICAgdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlID0gIXRoaXMuaXNTdGlja3lIb3ZlckFjdGl2ZTsgXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzU3RpY2t5SG92ZXJBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dUb29sSWNvbnMoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ob3ZlckhpZGVUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvdmVySGlkZVRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhvdmVySGlkZVRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlVG9vbEljb25zSW5zdGFudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgb25DbGljayhoYW5kbGVyOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5jbGlja0hhbmRsZXIgPSBoYW5kbGVyO1xuICB9XG5cbiAgcHJpdmF0ZSBzYXZlUG9zaXRpb24oKTogdm9pZCB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHtcbiAgICAgIGxlZnQ6IHRoaXMuZWxlbWVudC5zdHlsZS5sZWZ0LFxuICAgICAgdG9wOiB0aGlzLmVsZW1lbnQuc3R5bGUudG9wLFxuICAgIH07XG4gICAgaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSAmJiBjaHJvbWUuc3RvcmFnZS5sb2NhbCkge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAncGR3Yy1pY29uLXBvc2l0aW9uJzogcG9zaXRpb24gfSwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogSWNvbiBwb3NpdGlvbiBzYXZlZC5gKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Bkd2MtaWNvbi1wb3NpdGlvbicsIEpTT04uc3RyaW5naWZ5KHBvc2l0aW9uKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBsb2FkUG9zaXRpb24oKTogdm9pZCB7XG4gICAgY29uc3QgbG9hZEZyb21TdG9yYWdlID0gKHN0b3JlZFBvc2l0aW9uRGF0YTogYW55KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBsb2FkRnJvbVN0b3JhZ2UgY2FsbGVkIHdpdGg6YCwgc3RvcmVkUG9zaXRpb25EYXRhKTtcbiAgICAgIGxldCBwb3NpdGlvbkFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IGljb25XaWR0aCA9IDUwO1xuICAgICAgY29uc3QgaWNvbkhlaWdodCA9IDUwO1xuXG4gICAgICBpZiAoc3RvcmVkUG9zaXRpb25EYXRhICYmIHR5cGVvZiBzdG9yZWRQb3NpdGlvbkRhdGEubGVmdCA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHN0b3JlZFBvc2l0aW9uRGF0YS50b3AgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZExlZnQgPSBwYXJzZUludChzdG9yZWRQb3NpdGlvbkRhdGEubGVmdCwgMTApO1xuICAgICAgICBjb25zdCBwYXJzZWRUb3AgPSBwYXJzZUludChzdG9yZWRQb3NpdGlvbkRhdGEudG9wLCAxMCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IFBhcnNlZCAtIExlZnQ6ICR7cGFyc2VkTGVmdH0sIFRvcDogJHtwYXJzZWRUb3B9YCk7XG5cbiAgICAgICAgaWYgKCFpc05hTihwYXJzZWRMZWZ0KSAmJiAhaXNOYU4ocGFyc2VkVG9wKSkge1xuICAgICAgICAgIGNvbnN0IGNvbnN0cmFpbmVkTGVmdCA9IE1hdGgubWF4KDAsIE1hdGgubWluKHBhcnNlZExlZnQsIHdpbmRvdy5pbm5lcldpZHRoIC0gaWNvbldpZHRoKSk7XG4gICAgICAgICAgY29uc3QgY29uc3RyYWluZWRUb3AgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihwYXJzZWRUb3AsIHdpbmRvdy5pbm5lckhlaWdodCAtIGljb25IZWlnaHQpKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBDb25zdHJhaW5lZCAtIExlZnQ6ICR7Y29uc3RyYWluZWRMZWZ0fSwgVG9wOiAke2NvbnN0cmFpbmVkVG9wfWApO1xuXG4gICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSBgJHtjb25zdHJhaW5lZExlZnR9cHhgO1xuICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50b3AgPSBgJHtjb25zdHJhaW5lZFRvcH1weGA7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcnOyBcbiAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUucmlnaHQgPSAnJzsgIFxuICAgICAgICAgIHBvc2l0aW9uQXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogQXBwbGllZCBzdG9yZWQgY29uc3RyYWluZWQgcG9zaXRpb24uYCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFwb3NpdGlvbkFwcGxpZWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogQXBwbHlpbmcgZGVmYXVsdCBwb3NpdGlvbiAoYm90dG9tLXJpZ2h0KS5gKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvdHRvbSA9ICcyMHB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzIwcHgnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9ICcnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudG9wID0gJyc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChjaHJvbWUgJiYgY2hyb21lLnN0b3JhZ2UgJiYgY2hyb21lLnN0b3JhZ2UubG9jYWwpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdwZHdjLWljb24tcG9zaXRpb24nLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQgcmVzdWx0IGZvciAncGR3Yy1pY29uLXBvc2l0aW9uJzpgLCByZXN1bHQpO1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb25Gcm9tU3RvcmFnZSA9IHJlc3VsdFsncGR3Yy1pY29uLXBvc2l0aW9uJ107XG4gICAgICAgICAgICBsb2FkRnJvbVN0b3JhZ2UocG9zaXRpb25Gcm9tU3RvcmFnZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBJY29uIHBvc2l0aW9uIGxvYWRpbmcgaW5pdGlhdGVkIGZyb20gY2hyb21lLnN0b3JhZ2UuYCk7IFxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQQUJMTydTIERXIENIQUQ6IGNocm9tZS5zdG9yYWdlLmxvY2FsIG5vdCBhdmFpbGFibGUuIFRyeWluZyBsb2NhbFN0b3JhZ2UuXCIpO1xuICAgICAgICBjb25zdCBzdG9yZWRQb3NpdGlvblN0cmluZyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwZHdjLWljb24tcG9zaXRpb24nKTtcbiAgICAgICAgaWYgKHN0b3JlZFBvc2l0aW9uU3RyaW5nKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IGxvY2FsU3RvcmFnZSBpdGVtICdwZHdjLWljb24tcG9zaXRpb24nOmAsIHN0b3JlZFBvc2l0aW9uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBsb2FkRnJvbVN0b3JhZ2UoSlNPTi5wYXJzZShzdG9yZWRQb3NpdGlvblN0cmluZykpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IEljb24gcG9zaXRpb24gbG9hZGluZyBpbml0aWF0ZWQgZnJvbSBsb2NhbFN0b3JhZ2UuYCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBFcnJvciBwYXJzaW5nIGljb24gcG9zaXRpb24gZnJvbSBsb2NhbFN0b3JhZ2UuYCwgZSk7XG4gICAgICAgICAgICAgICAgbG9hZEZyb21TdG9yYWdlKG51bGwpOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IE5vIHBvc2l0aW9uIGZvdW5kIGluIGxvY2FsU3RvcmFnZS4gQXBwbHlpbmcgZGVmYXVsdC5gKTtcbiAgICAgICAgICAgIGxvYWRGcm9tU3RvcmFnZShudWxsKTsgXG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGluaXRIb3ZlcigpOiB2b2lkIHtcbiAgICBjb25zdCBzaG93SWNvbnMgPSAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5ob3ZlckhpZGVUaW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhvdmVySGlkZVRpbWVvdXQpO1xuICAgICAgICB0aGlzLmhvdmVySGlkZVRpbWVvdXQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzU3RpY2t5SG92ZXJBY3RpdmUpIHsgXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xJY29ucygpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzdGFydEhpZGVUaW1lciA9ICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc1N0aWNreUhvdmVyQWN0aXZlKSB7IFxuICAgICAgICB0aGlzLmhvdmVySGlkZVRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5oaWRlVG9vbEljb25zKCk7XG4gICAgICAgIH0sIDMwMCk7IFxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIHNob3dJY29ucyk7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBzdGFydEhpZGVUaW1lcik7XG5cbiAgICB0aGlzLnRvb2xJY29uc1dyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmhvdmVySGlkZVRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaG92ZXJIaWRlVGltZW91dCk7XG4gICAgICAgIHRoaXMuaG92ZXJIaWRlVGltZW91dCA9IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBzdGFydEhpZGVUaW1lcik7XG4gIH1cblxuICBwcml2YXRlIHNob3dUb29sSWNvbnMoKTogdm9pZCB7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7IFxuICB9XG5cbiAgcHJpdmF0ZSBoaWRlVG9vbEljb25zKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzU3RpY2t5SG92ZXJBY3RpdmUpIHJldHVybjsgXG5cbiAgICB0aGlzLnRvb2xJY29uc1dyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgfVxuXG4gIHByaXZhdGUgaGlkZVRvb2xJY29uc0luc3RhbnQoKTogdm9pZCB7XG4gICAgdGhpcy50b29sSWNvbnNXcmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZURlcGxveWVkQXBwc0ljb25DbGljayA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBjb25zb2xlLmxvZygnUEFCTE9cXCdTIERXIENIQUQ6IERlcGxveWVkIEFwcHMgSWNvbiBjbGlja2VkLicpO1xuXG4gICAgaWYgKCF0aGlzLmRlcGxveWVkQXBwc1Rvb2wpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQQUJMT1xcJ1MgRFcgQ0hBRDogQ3JlYXRpbmcgbmV3IERlcGxveWVkQXBwc1Rvb2wgaW5zdGFuY2UuJyk7XG4gICAgICB0aGlzLmRlcGxveWVkQXBwc1Rvb2wgPSBuZXcgRGVwbG95ZWRBcHBzVG9vbCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRlcGxveWVkQXBwc1Rvb2wuaXNWaXNpYmxlKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQQUJMT1xcJ1MgRFcgQ0hBRDogRGVwbG95ZWRBcHBzVG9vbCBpcyB2aXNpYmxlLCBjYWxsaW5nIGhpZGUoKS4nKTtcbiAgICAgIHRoaXMuZGVwbG95ZWRBcHBzVG9vbC5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQQUJMT1xcJ1MgRFcgQ0hBRDogRGVwbG95ZWRBcHBzVG9vbCBpcyBoaWRkZW4sIGNhbGxpbmcgc2hvdygpLicpO1xuICAgICAgdGhpcy5kZXBsb3llZEFwcHNUb29sLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzU3RpY2t5SG92ZXJBY3RpdmUgPSBmYWxzZTsgXG4gICAgdGhpcy5oaWRlVG9vbEljb25zSW5zdGFudCgpO1xuICB9O1xuXG4gIHB1YmxpYyBhcHBlbmRUb0JvZHkoKTogdm9pZCB7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICB9XG5cbiAgcHVibGljIGdldEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gIH1cblxuICBwdWJsaWMgc2hvdygpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JzsgXG4gIH1cblxuICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgfVxufVxuIiwiLy8gc3JjL3VpL1Rvb2xNZW51LnRzXG5cbmludGVyZmFjZSBNZW51SXRlbSB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGljb25DbGFzczogc3RyaW5nOyAvLyBGb250QXdlc29tZSBpY29uIGNsYXNzLCBlLmcuLCAnZmFzIGZhLXNlYXJjaCdcbiAgYWN0aW9uOiAoaWQ6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIFRvb2xNZW51IHtcbiAgcHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBpc1Zpc2libGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBtZW51SXRlbXM6IE1lbnVJdGVtW107XG4gIHByaXZhdGUgb25Ub29sU2VsZWN0ZWQ6ICh0b29sSWQ6IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihvblRvb2xTZWxlY3RlZENhbGxiYWNrOiAodG9vbElkOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICB0aGlzLm9uVG9vbFNlbGVjdGVkID0gb25Ub29sU2VsZWN0ZWRDYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ3Bkd2MtdG9vbC1tZW51JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgLy8gSW5pdGlhbGx5IGhpZGRlblxuXG4gICAgdGhpcy5tZW51SXRlbXMgPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnc3VwZXItc2VhcmNoJyxcbiAgICAgICAgbGFiZWw6ICdTdXBlciBTZWFyY2gnLFxuICAgICAgICBpY29uQ2xhc3M6ICdmYXMgZmEtc2VhcmNoLWxvY2F0aW9uJyxcbiAgICAgICAgYWN0aW9uOiB0aGlzLmhhbmRsZUl0ZW1DbGljay5iaW5kKHRoaXMpLFxuICAgICAgfSxcbiAgICAgIC8vIEFkZCBtb3JlIHRvb2xzIGhlcmUgYXMgbmVlZGVkXG4gICAgICAvLyBFeGFtcGxlOlxuICAgICAgLy8ge1xuICAgICAgLy8gICBpZDogJ3NldHRpbmdzJyxcbiAgICAgIC8vICAgbGFiZWw6ICdTZXR0aW5ncycsXG4gICAgICAvLyAgIGljb25DbGFzczogJ2ZhcyBmYS1jb2cnLFxuICAgICAgLy8gICBhY3Rpb246IHRoaXMuaGFuZGxlSXRlbUNsaWNrLmJpbmQodGhpcyksXG4gICAgICAvLyB9LFxuICAgIF07XG5cbiAgICB0aGlzLnJlbmRlck1lbnUoKTtcbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck1lbnUoKTogdm9pZCB7XG4gICAgY29uc3QgdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIHRoaXMubWVudUl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGF0YS10b29sLWlkJywgaXRlbS5pZCk7XG4gICAgICBidXR0b24uaW5uZXJIVE1MID0gYDxpIGNsYXNzPVwiJHtpdGVtLmljb25DbGFzc31cIj48L2k+IDxzcGFuPiR7aXRlbS5sYWJlbH08L3NwYW4+YDtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGl0ZW0uYWN0aW9uKGl0ZW0uaWQpKTtcbiAgICAgIGxpLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgICB1bC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9ICcnOyAvLyBDbGVhciBwcmV2aW91cyBjb250ZW50XG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHVsKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlSXRlbUNsaWNrKHRvb2xJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc29sZS5sb2coYFRvb2xNZW51OiAke3Rvb2xJZH0gc2VsZWN0ZWRgKTtcbiAgICB0aGlzLm9uVG9vbFNlbGVjdGVkKHRvb2xJZCk7XG4gICAgdGhpcy5oaWRlKCk7IC8vIEhpZGUgbWVudSBhZnRlciBzZWxlY3Rpb25cbiAgfVxuXG4gIHByaXZhdGUgYWRkRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgLy8gQ2xvc2UgbWVudSBpZiBjbGlja2VkIG91dHNpZGVcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmlzVmlzaWJsZSkgcmV0dXJuO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIE5vZGU7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgY2xpY2sgaXMgb3V0c2lkZSB0aGUgbWVudSBhbmQgbm90IG9uIHRoZSBkcmFnZ2FibGUgaWNvbiAobGV0IGljb24gaGFuZGxlIGl0cyBvd24gY2xpY2spXG4gICAgICBpZiAoIXRoaXMuZWxlbWVudC5jb250YWlucyh0YXJnZXQpICYmICEodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KCcucGR3Yy1kcmFnZ2FibGUtaWNvbicpKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzVmlzaWJsZSkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvdyh4LCB5KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2hvdyh4OiBudW1iZXIsIHk6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICB0aGlzLmlzVmlzaWJsZSA9IHRydWU7XG5cbiAgICAvLyBQb3NpdGlvbiB0aGUgbWVudSBhYm92ZSBhbmQgc2xpZ2h0bHkgdG8gdGhlIGxlZnQgb2YgdGhlIGljb24vY29vcmRpbmF0ZXNcbiAgICBjb25zdCBtZW51UmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBsZXQgbWVudVggPSB4O1xuICAgIGxldCBtZW51WSA9IHkgLSBtZW51UmVjdC5oZWlnaHQgLSAxMDsgLy8gMTBweCBidWZmZXIgYWJvdmUgaWNvblxuXG4gICAgLy8gQWRqdXN0IGlmIG1lbnUgZ29lcyBvZmYtc2NyZWVuXG4gICAgaWYgKG1lbnVZIDwgMCkge1xuICAgICAgbWVudVkgPSB5ICsgNTAgKyAxMDsgLy8gUG9zaXRpb24gYmVsb3cgaWNvbiBpZiBubyBzcGFjZSBhYm92ZSAoaWNvbiBoZWlnaHQgfjUwcHgpXG4gICAgfVxuICAgIGlmIChtZW51WCArIG1lbnVSZWN0LndpZHRoID4gd2luZG93LmlubmVyV2lkdGgpIHtcbiAgICAgIG1lbnVYID0gd2luZG93LmlubmVyV2lkdGggLSBtZW51UmVjdC53aWR0aCAtIDU7IC8vIEFkanVzdCBpZiBnb2VzIG9mZiByaWdodCBzY3JlZW4gZWRnZVxuICAgIH1cbiAgICBpZiAobWVudVggPCAwKSB7XG4gICAgICAgIG1lbnVYID0gNTsgLy8gQWRqdXN0IGlmIGdvZXMgb2ZmIGxlZnQgc2NyZWVuIGVkZ2VcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9IGAke21lbnVYfXB4YDtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUudG9wID0gYCR7bWVudVl9cHhgO1xuICAgIGNvbnNvbGUubG9nKCdUb29sTWVudSBzaG93biBhdDonLCB7IHg6IG1lbnVYLCB5OiBtZW51WSB9KTtcbiAgfVxuXG4gIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIHRoaXMuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgY29uc29sZS5sb2coJ1Rvb2xNZW51IGhpZGRlbicpO1xuICB9XG5cbiAgcHVibGljIGdldEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gIH1cbn1cbiIsIi8vIHNyYy9jYWNoZVNlcnZpY2UudHNcbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlIH0gZnJvbSAnLi9hcGkvbW9kZWwvZ2V0X2xpc3RBdHRyaWJ1dGVzJztcbmltcG9ydCB0eXBlIHsgU2V0IH0gZnJvbSAnLi9hcGkvbW9kZWwvZ2V0X2xpc3RTZXRzJztcbmltcG9ydCB0eXBlIHsgRGF0YVdhbGtMaW5rVHlwZSB9IGZyb20gJy4vdHlwZXMvZGF0YU1vZGVscyc7XG5cbmNvbnN0IERCX05BTUUgPSAnUGFibG9zRHdDaGFkQ2FjaGUnO1xuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBTVE9SRV9OQU1FID0gJ2R3TWV0YWRhdGEnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENhY2hlZERhdGEgeyAvLyBFeHBvcnRpbmcgZm9yIHBvdGVudGlhbCB1c2UgaW4gU3VwZXJTZWFyY2ggaWYgbmVlZGVkIGZvciB0eXBlIGNoZWNraW5nXG4gIGJhc2VVcmw6IHN0cmluZzsgLy8gV2lsbCBiZSB0aGUga2V5UGF0aFxuICBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXTtcbiAgc2V0czogU2V0W107XG4gIGxpbmtUeXBlcz86IERhdGFXYWxrTGlua1R5cGVbXTtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG59XG5cbmxldCBkYlByb21pc2U6IFByb21pc2U8SURCRGF0YWJhc2U+IHwgbnVsbCA9IG51bGw7XG5cbmZ1bmN0aW9uIG9wZW5EQigpOiBQcm9taXNlPElEQkRhdGFiYXNlPiB7XG4gIGlmIChkYlByb21pc2UpIHtcbiAgICByZXR1cm4gZGJQcm9taXNlO1xuICB9XG4gIGRiUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJQQUJMTydTIERXIENIQUQ6IEluZGV4ZWREQiBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgYnJvd3Nlci5cIik7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdJbmRleGVkREIgbm90IHN1cHBvcnRlZCcpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKERCX05BTUUsIERCX1ZFUlNJT04pO1xuXG4gICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGRiID0gKGV2ZW50LnRhcmdldCBhcyBJREJPcGVuREJSZXF1ZXN0KS5yZXN1bHQ7XG4gICAgICBpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoU1RPUkVfTkFNRSkpIHtcbiAgICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoU1RPUkVfTkFNRSwgeyBrZXlQYXRoOiAnYmFzZVVybCcgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICByZXNvbHZlKChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkucmVzdWx0KTtcbiAgICB9O1xuXG4gICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiUEFCTE8nUyBEVyBDSEFEOiBJbmRleGVkREIgZXJyb3I6XCIsIChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkuZXJyb3IpO1xuICAgICAgcmVqZWN0KChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkuZXJyb3IpO1xuICAgICAgZGJQcm9taXNlID0gbnVsbDsgLy8gUmVzZXQgcHJvbWlzZSBvbiBlcnJvclxuICAgIH07XG5cbiAgICByZXF1ZXN0Lm9uYmxvY2tlZCA9ICgpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUEFCTE8nUyBEVyBDSEFEOiBJbmRleGVkREIgb3BlbiByZXF1ZXN0IGJsb2NrZWQuIFBsZWFzZSBjbG9zZSBvdGhlciB0YWJzIHVzaW5nIHRoZSBkYXRhYmFzZS5cIik7XG4gICAgICAgIC8vIFdlIGFyZSBub3QgcmVqZWN0aW5nIGhlcmUsIHRvIGFsbG93IHRoZSBicm93c2VyIHRvIHJlc29sdmUgaXQgaWYgb3RoZXIgdGFicyBhcmUgY2xvc2VkLlxuICAgIH07XG4gIH0pO1xuICByZXR1cm4gZGJQcm9taXNlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZURhdGFUb0NhY2hlKFxuICBiYXNlVXJsOiBzdHJpbmcsXG4gIGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZVtdLFxuICBzZXRzOiBTZXRbXSxcbiAgbGlua1R5cGVzOiBEYXRhV2Fsa0xpbmtUeXBlW11cbik6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGRiID0gYXdhaXQgb3BlbkRCKCk7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG4gICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcbiAgICBjb25zdCBkYXRhVG9DYWNoZTogQ2FjaGVkRGF0YSA9IHtcbiAgICAgIGJhc2VVcmwsXG4gICAgICBhdHRyaWJ1dGVzLFxuICAgICAgc2V0cyxcbiAgICAgIGxpbmtUeXBlczogbGlua1R5cGVzLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgIH07XG4gICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLnB1dChkYXRhVG9DYWNoZSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBFcnJvciBpbiBzdG9yZS5wdXQgZm9yICR7YmFzZVVybH06YCwgKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0KS5lcnJvcik7XG4gICAgICAgIHJlamVjdCgoZXZlbnQudGFyZ2V0IGFzIElEQlJlcXVlc3QpLmVycm9yKTtcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IERhdGEgc3VjY2Vzc2Z1bGx5IGNhY2hlZCBmb3IgJHtiYXNlVXJsfSBhdCAke25ldyBEYXRlKGRhdGFUb0NhY2hlLnRpbWVzdGFtcCkudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgICAgIH07XG4gICAgICB0cmFuc2FjdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gY2FjaGUgc2F2ZSB0cmFuc2FjdGlvbiBmb3IgJHtiYXNlVXJsfTpgLCAoZXZlbnQudGFyZ2V0IGFzIElEQlRyYW5zYWN0aW9uKS5lcnJvcik7XG4gICAgICAgIC8vIEVuc3VyZSByZWplY3Rpb24gaWYgbm90IGFscmVhZHkgaGFuZGxlZCBieSByZXF1ZXN0Lm9uZXJyb3JcbiAgICAgICAgLy8gTm90ZTogaWYgcmVxdWVzdC5vbmVycm9yIGZpcmVkLCB0aGlzIG1pZ2h0IGJlIHJlZHVuZGFudCBvciB0b28gbGF0ZS5cbiAgICAgICAgaWYgKCEoZXZlbnQudGFyZ2V0IGFzIElEQlRyYW5zYWN0aW9uKS5lcnJvcj8ubWVzc2FnZS5pbmNsdWRlcygnVHJhbnNhY3Rpb24gYWJvcnRlZCcpKSB7IC8vIEF2b2lkIGRvdWJsZSByZWplY3Rpb24gZm9yIHNhbWUgcm9vdCBjYXVzZSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgcmVqZWN0KChldmVudC50YXJnZXQgYXMgSURCVHJhbnNhY3Rpb24pLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEZhaWxlZCB0byBpbml0aWF0ZSBzYXZlIGRhdGEgdG8gY2FjaGUgZm9yICR7YmFzZVVybH06YCwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yOyBcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZERhdGFGcm9tQ2FjaGUoXG4gIGJhc2VVcmw6IHN0cmluZ1xuKTogUHJvbWlzZTxDYWNoZWREYXRhIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGRiID0gYXdhaXQgb3BlbkRCKCk7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZG9ubHknKTtcbiAgICBjb25zdCBzdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5nZXQoYmFzZVVybCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8Q2FjaGVkRGF0YSB8IG51bGw+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IChldmVudC50YXJnZXQgYXMgSURCUmVxdWVzdDxDYWNoZWREYXRhPikucmVzdWx0O1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRGF0YSBsb2FkZWQgZnJvbSBjYWNoZSBmb3IgJHtiYXNlVXJsfSAodGltZXN0YW1wOiAke25ldyBEYXRlKHJlc3VsdC50aW1lc3RhbXApLnRvTG9jYWxlU3RyaW5nKCl9KWApO1xuICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBObyBkYXRhIGluIGNhY2hlIGZvciAke2Jhc2VVcmx9YCk7XG4gICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEVycm9yIGxvYWRpbmcgZGF0YSBmcm9tIGNhY2hlIGZvciAke2Jhc2VVcmx9OmAsIChldmVudC50YXJnZXQgYXMgSURCUmVxdWVzdCkuZXJyb3IpO1xuICAgICAgICByZWplY3QoKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0KS5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogRmFpbGVkIHRvIGluaXRpYXRlIGxvYWQgZGF0YSBmcm9tIGNhY2hlIGZvciAke2Jhc2VVcmx9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDsgXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2FjaGVGb3JCYXNlVXJsKGJhc2VVcmw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGRiID0gYXdhaXQgb3BlbkRCKCk7XG4gICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG4gICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcbiAgICBjb25zdCByZXF1ZXN0ID0gc3RvcmUuZGVsZXRlKGJhc2VVcmwpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgaW4gc3RvcmUuZGVsZXRlIGZvciAke2Jhc2VVcmx9OmAsIChldmVudC50YXJnZXQgYXMgSURCUmVxdWVzdCkuZXJyb3IpO1xuICAgICAgICByZWplY3QoKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0KS5lcnJvcik7XG4gICAgICB9O1xuXG4gICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBDYWNoZSBzdWNjZXNzZnVsbHkgY2xlYXJlZCBmb3IgJHtiYXNlVXJsfWApO1xuICAgICAgfTtcbiAgICAgIHRyYW5zYWN0aW9uLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBFcnJvciBpbiBjYWNoZSBjbGVhciB0cmFuc2FjdGlvbiBmb3IgJHtiYXNlVXJsfTpgLCAoZXZlbnQudGFyZ2V0IGFzIElEQlRyYW5zYWN0aW9uKS5lcnJvcik7XG4gICAgICAgIGlmICghKGV2ZW50LnRhcmdldCBhcyBJREJUcmFuc2FjdGlvbikuZXJyb3I/Lm1lc3NhZ2UuaW5jbHVkZXMoJ1RyYW5zYWN0aW9uIGFib3J0ZWQnKSkge1xuICAgICAgICAgICAgcmVqZWN0KChldmVudC50YXJnZXQgYXMgSURCVHJhbnNhY3Rpb24pLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEZhaWxlZCB0byBpbml0aWF0ZSBjbGVhciBjYWNoZSBmb3IgJHtiYXNlVXJsfTpgLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cbiIsIi8vIHNyYy91aS9TdXBlclNlYXJjaC50c1xuaW1wb3J0IHsgb3BlbkdpdEh1Yklzc3VlIH0gZnJvbSAnLi4vdXRpbHMvZmVlZGJhY2tVdGlscyc7XG5pbXBvcnQgeyBcbiAgRGF0YVdhbGtBdHRyaWJ1dGUsIFxuICBEYXRhV2Fsa1NldCwgXG4gIERhdGFXYWxrTGlua1R5cGUsIFxuICBTZWFyY2hRdWVyeSwgXG4gIE5lc3RlZFByb3BlcnR5RmlsdGVyLFxuICBGaWx0ZXJHcm91cCxcbiAgRmlsdGVyYWJsZVByb3BlcnR5LFxuICBNYXRjaFR5cGVcbn0gZnJvbSAnLi4vdHlwZXMvZGF0YU1vZGVscyc7IC8vIEFkZGVkIE5lc3RlZFByb3BlcnR5RmlsdGVyXG5pbXBvcnQgeyBmZXRjaEF0dHJpYnV0ZXMsIGZldGNoU2V0cywgZmV0Y2hMaW5rVHlwZXNCeUNsYXNzSWRzIH0gZnJvbSAnLi4vYXBpL2RhdGF3YWxrU2VydmljZSc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZSB9IGZyb20gJy4uL2FwaS9tb2RlbC9nZXRfbGlzdEF0dHJpYnV0ZXMnO1xuaW1wb3J0IHR5cGUgeyBTZXQgfSBmcm9tICcuLi9hcGkvbW9kZWwvZ2V0X2xpc3RTZXRzJztcbmltcG9ydCB7IGxvYWREYXRhRnJvbUNhY2hlLCBzYXZlRGF0YVRvQ2FjaGUsIENhY2hlZERhdGEgfSBmcm9tICcuLi9jYWNoZVNlcnZpY2UnO1xuXG4vLyBEZWZpbmUgU2VhcmNoUmVzdWx0SXRlbSBzdHJ1Y3R1cmVcbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoUmVzdWx0SXRlbSB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6ICdBdHRyaWJ1dGUnIHwgJ1NldCcgfCAnTGlua1R5cGUnOyAvLyBBZGRlZCAnTGlua1R5cGUnXG4gIGxhYmVsOiBzdHJpbmc7XG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7IC8vIEFsbG93IG90aGVyIHByb3BlcnRpZXNcbiAgICBvcmlnaW5hbERhdGE6IEF0dHJpYnV0ZSB8IFNldCB8IERhdGFXYWxrTGlua1R5cGU7IC8vIEFkZGVkIERhdGFXYWxrTGlua1R5cGVcbiAgfTtcbn1cblxuY29uc3QgTUFYX1JFU1VMVFNfRElTUExBWSA9IDEwMDtcbmNvbnN0IFJFU1VMVFNfUEVSX1BBR0UgPSAyMDtcbmNvbnN0IE1BWF9ISVNUT1JZX0lURU1TID0gMTA7XG5cbmV4cG9ydCBjbGFzcyBTdXBlclNlYXJjaCB7XG4gIHByaXZhdGUgZWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2VhcmNoSW5wdXQhOiBIVE1MSW5wdXRFbGVtZW50O1xuICBwcml2YXRlIHJlc3VsdHNDb250YWluZXIhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBkZXRhaWxWaWV3Q29udGFpbmVyITogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgY3VycmVudFF1ZXJ5OiBTZWFyY2hRdWVyeSA9IHsgdGVybTogJycsIGxpbWl0OiBSRVNVTFRTX1BFUl9QQUdFLCBvZmZzZXQ6IDAgfTtcbiAgcHJpdmF0ZSBjdXJyZW50UmVzdWx0czogU2VhcmNoUmVzdWx0SXRlbVtdID0gW107XG4gIHByaXZhdGUgdG90YWxSZXN1bHRzOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGN1cnJlbnRQYWdlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGlzTG9hZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGJhc2VVcmw6IHN0cmluZztcbiAgcHJpdmF0ZSBzZWFyY2hIaXN0b3J5OiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGRhdGFsaXN0RWxlbWVudCE6IEhUTUxEYXRhTGlzdEVsZW1lbnQ7XG5cbiAgLy8gTmV3IG1lbWJlcnMgZm9yIGhvbGRpbmcgZmV0Y2hlZCBkYXRhXG4gIHByaXZhdGUgYWxsQXR0cmlidXRlczogQXR0cmlidXRlW10gPSBbXTtcbiAgcHJpdmF0ZSBhbGxTZXRzOiBTZXRbXSA9IFtdO1xuICBwcml2YXRlIGFsbExpbmtUeXBlczogRGF0YVdhbGtMaW5rVHlwZVtdID0gW107IC8vIE5ldyBwcm9wZXJ0eSBmb3IgbGluayB0eXBlc1xuICBwcml2YXRlIGRhdGFMb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBOZXcgbWVtYmVyIGZvciBzZWFyY2ggdHlwZSBmaWx0ZXJcbiAgcHJpdmF0ZSBzZWFyY2hGaWx0ZXJUeXBlOiAnYWxsJyB8ICdhdHRyaWJ1dGVzJyB8ICdzZXRzJyB8ICdsaW5rcycgPSAnYWxsJzsgLy8gQWRkZWQgJ2xpbmtzJ1xuICBwcml2YXRlIGZpbHRlckFsbFJhZGlvITogSFRNTElucHV0RWxlbWVudDtcbiAgcHJpdmF0ZSBmaWx0ZXJBdHRyaWJ1dGVzUmFkaW8hOiBIVE1MSW5wdXRFbGVtZW50O1xuICBwcml2YXRlIGZpbHRlclNldHNSYWRpbyE6IEhUTUxJbnB1dEVsZW1lbnQ7XG4gIHByaXZhdGUgZmlsdGVyTGlua3NSYWRpbyE6IEhUTUxJbnB1dEVsZW1lbnQ7IC8vIEFkZGVkIGZvciBMaW5rcyBmaWx0ZXJcblxuICAvLyBBZGRlZCBmb3IgY2FjaGVcbiAgcHJpdmF0ZSBjYWNoZVRpbWVzdGFtcDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNEYXRhRnJvbUNhY2hlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZHdBcGlUb2tlbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7IC8vIGR3QXBpVG9rZW4gaXMgbG9hZGVkIGZyb20gc3RvcmFnZSBpbiBpbml0aWFsaXplRGF0YVxuICAvLyBBdHRlbXB0aW5nIHRvIGJyZWFrIGJ1aWxkIGNhY2hlIHdpdGggdGhpcyBjb21tZW50XG5cbiAgY29uc3RydWN0b3IoZHdCYXNlVXJsOiBzdHJpbmcpIHsgLy8gUmV2ZXJ0ZWQ6IGR3QXBpVG9rZW4gcmVtb3ZlZCBmcm9tIGNvbnN0cnVjdG9yIHBhcmFtc1xuICAgIHRoaXMuYmFzZVVybCA9IGR3QmFzZVVybDtcbiAgICAvLyB0aGlzLmR3QXBpVG9rZW4gPSBkd0FwaVRva2VuOyAvLyBSZW1vdmVkOiBkd0FwaVRva2VuIGlzIG5vdCBzZXQgZnJvbSBjb25zdHJ1Y3RvclxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAncGR3Yy1tb2RhbCBwZHdjLXN1cGVyLXNlYXJjaC1tb2RhbCc7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IC8vIEhpZGRlbiBieSBkZWZhdWx0XG5cbiAgICAvLyBBdHRhY2ggaW5zdGFuY2UgdG8gdGhlIGVsZW1lbnQgZm9yIGVhc2llciByZXRyaWV2YWwgaWYgbmVlZGVkIChlLmcuLCBieSBjb250ZW50X3NjcmlwdClcbiAgICAodGhpcy5lbGVtZW50IGFzIGFueSkuX19TVVBFUl9TRUFSQ0hfSU5TVEFOQ0VfXyA9IHRoaXM7XG5cbiAgICB0aGlzLmxvYWRTZWFyY2hIaXN0b3J5KCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5pbml0aWFsaXplRGF0YSgpOyAvLyBJbml0aWFsaXplIGRhdGEgb24gY29uc3RydWN0aW9uXG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICAvKiBDb21wb25lbnQtc3BlY2lmaWMgc3R5bGVzICovXG4gICAgICAgIC5wZHdjLXN1cGVyLXNlYXJjaC1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgcGFkZGluZzogMCAyMHB4IDIwcHg7XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAucGR3Yy1zZWFyY2gtY29udHJvbHMge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZ2FwOiAxMHB4O1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC5wZHdjLXNlYXJjaC1jb250YWluZXIge1xuICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAucGR3Yy1zZWFyY2gtaW5wdXQge1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIHBhZGRpbmc6IDhweCAxMnB4O1xuICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICBoZWlnaHQ6IDM2cHg7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLnBkd2MtY29udHJvbHMtcmlnaHQge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC5wZHdjLWZpbHRlci1idXR0b24ge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgICBwYWRkaW5nOiAwIDEycHg7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y4ZjlmYTtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGVlMmU2O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgIGNvbG9yOiAjNDk1MDU3O1xuICAgICAgICAgIGhlaWdodDogMzZweDtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAucGR3Yy1maWx0ZXItYnV0dG9uOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZTllY2VmO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAucGR3Yy1maWx0ZXItYnV0dG9uIHN2ZyB7XG4gICAgICAgICAgd2lkdGg6IDE2cHg7XG4gICAgICAgICAgaGVpZ2h0OiAxNnB4O1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLXN1cGVyLXNlYXJjaC1yZXN1bHRzLWFyZWEge1xuICAgICAgICAgIG1hcmdpbi10b3A6IDE1cHg7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2RkZDtcbiAgICAgICAgICBtaW4taGVpZ2h0OiA1MHB4OyAvKiBFbnN1cmUgaXQncyB2aXNpYmxlIGV2ZW4gd2hlbiBlbXB0eSAqL1xuICAgICAgICAgIG1heC1oZWlnaHQ6IDM1MHB4OyAvKiBPciB5b3VyIHByZWZlcnJlZCBoZWlnaHQgKi9cbiAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvOyAvKiBFbmFibGUgdmVydGljYWwgc2Nyb2xsIGlmIGNvbnRlbnQgb3ZlcmZsb3dzICovXG4gICAgICAgICAgcGFkZGluZzogNXB4O1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gICAgICAgICAgZmxleC1ncm93OiAxO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLXByaW1hcnktYnRuLFxuICAgICAgICAucGR3Yy1zZWNvbmRhcnktYnRuIHtcbiAgICAgICAgICAvKiAuLi4gZXhpc3Rpbmcgc3R5bGVzIC4uLiAqL1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLXNlYXJjaC1maWx0ZXItZ3JvdXAgbGFiZWwge1xuICAgICAgICAgIG1hcmdpbi1yaWdodDogMTBweDtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1zdXBlci1zZWFyY2gtZGV0YWlsLXZpZXcge1xuICAgICAgICAgIGRpc3BsYXk6IG5vbmU7IC8qIEhpZGRlbiBieSBkZWZhdWx0ICovXG4gICAgICAgICAgcG9zaXRpb246IGZpeGVkOyAvKiBPciBhYnNvbHV0ZSwgZGVwZW5kaW5nIG9uIGRlc2lyZWQgYmVoYXZpb3IgKi9cbiAgICAgICAgICBsZWZ0OiA1MCU7XG4gICAgICAgICAgdG9wOiA1MCU7XG4gICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG4gICAgICAgICAgd2lkdGg6IDgwJTtcbiAgICAgICAgICBtYXgtd2lkdGg6IDcwMHB4O1xuICAgICAgICAgIG1heC1oZWlnaHQ6IDgwdmg7XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2NjYztcbiAgICAgICAgICBib3gtc2hhZG93OiAwIDRweCA4cHggcmdiYSgwLDAsMCwwLjIpO1xuICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgei1pbmRleDogMTAwMTsgLyogRW5zdXJlIGl0J3MgYWJvdmUgb3RoZXIgY29udGVudCAqL1xuICAgICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtZGV0YWlsLXZpZXctaGVhZGVyIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDE1cHg7XG4gICAgICAgICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlZWU7XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtZGV0YWlsLXZpZXctaGVhZGVyIGgzIHtcbiAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtZGV0YWlsLXZpZXctY2xvc2UtYnRuIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBmb250LXNpemU6IDEuNXJlbTtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIH1cbiAgICAgICAgI3JlbGF0ZWRBdHRyaWJ1dGVzU2VjdGlvbiBoNCB7XG4gICAgICAgICAgZm9udC1zaXplOiAxLjFlbTsgLyogU2xpZ2h0bHkgbGFyZ2VyIGZvbnQgKi9cbiAgICAgICAgICBmb250LXdlaWdodDogYm9sZDsgLyogQm9sZCBoZWFkaW5nICovXG4gICAgICAgICAgbWFyZ2luLXRvcDogMjBweDsgLyogQWRkIHNvbWUgc3BhY2UgYWJvdmUgdGhlIGhlYWRpbmcgKi9cbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgICAgICB9XG4gICAgICAgICNyZWxhdGVkQXR0cmlidXRlc0xpc3QgbGkge1xuICAgICAgICAgIHBhZGRpbmc6IDNweCAwOyAvKiBBZGQgYSBsaXR0bGUgcGFkZGluZyB0byBsaXN0IGl0ZW1zICovXG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtY29weS1idG4ge1xuICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGNvbG9yOiAjMDA3YmZmO1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBtYXJnaW4tbGVmdDogOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMC45ZW07XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtY29weS1idG46aG92ZXIge1xuICAgICAgICAgIGNvbG9yOiAjMDA1NmIzO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWNvcHktYnRuIC5mYXMuZmEtY2hlY2sge1xuICAgICAgICAgIGNvbG9yOiBncmVlbjtcbiAgICAgICAgfVxuICAgICAgPC9zdHlsZT5cbiAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLW1vZGFsLWhlYWRlclwiIHN0eWxlPVwiZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBhbGlnbi1pdGVtczogY2VudGVyO1wiPlxuICAgICAgICA8aDIgc3R5bGU9XCJtYXJnaW46IDA7XCI+PGkgY2xhc3M9XCJmYXMgZmEtc2VhcmNoLWxvY2F0aW9uXCI+PC9pPiBTdXBlciBTZWFyY2g8L2gyPlxuICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMHB4O1wiPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwZHdjLWZlZWRiYWNrLWJ1dHRvblwiIHRpdGxlPVwiUmVwb3J0IGFuIGlzc3VlXCIgc3R5bGU9XCJiYWNrZ3JvdW5kOiBub25lOyBib3JkZXI6IG5vbmU7IGNvbG9yOiAjZjJmMmY3OyBmb250LXNpemU6IDE2cHg7IGN1cnNvcjogcG9pbnRlcjsgb3BhY2l0eTogMC44OyB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuMnM7XCIgaWQ9XCJwZHdjLXN1cGVyLXNlYXJjaC1mZWVkYmFjay1idG5cIj7wn5CePC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBkd2MtbW9kYWwtY2xvc2UtYnRuXCIgdGl0bGU9XCJDbG9zZVwiIHN0eWxlPVwiYmFja2dyb3VuZDogbm9uZTsgYm9yZGVyOiBub25lOyBmb250LXNpemU6IDEuNXJlbTsgY3Vyc29yOiBwb2ludGVyOyBcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1zdXBlci1zZWFyY2gtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLXNlYXJjaC1jb250cm9sc1wiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLXNlYXJjaC1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwic2VhcmNoXCIgaWQ9XCJwZHdjLXN1cGVyLXNlYXJjaC1pbnB1dFwiIGxpc3Q9XCJwZHdjLXNlYXJjaC1oaXN0b3J5XCIgY2xhc3M9XCJwZHdjLXNlYXJjaC1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoLi4uXCI+XG4gICAgICAgICAgICA8ZGF0YWxpc3QgaWQ9XCJwZHdjLXNlYXJjaC1oaXN0b3J5XCI+PC9kYXRhbGlzdD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1jb250cm9scy1yaWdodFwiPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBkd2MtZmlsdGVyLWJ1dHRvblwiPlxuICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIj5cbiAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTIyIDNIMmw4IDkuNDZWMTlsNCAydi04LjU0TDIyIDN6XCI+PC9wYXRoPlxuICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgRmlsdGVyc1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1mb3JtLWdyb3VwIHBkd2Mtc2VhcmNoLWZpbHRlci1ncm91cFwiPlxuICAgICAgICAgIDxsYWJlbD5GaWx0ZXIgYnkgdHlwZTo8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInBkd2Mtc2VhcmNoLWZpbHRlclwiIHZhbHVlPVwiYWxsXCIgY2hlY2tlZD4gQWxsPC9sYWJlbD5cbiAgICAgICAgICA8bGFiZWw+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJwZHdjLXNlYXJjaC1maWx0ZXJcIiB2YWx1ZT1cImF0dHJpYnV0ZXNcIj4gQXR0cmlidXRlczwvbGFiZWw+XG4gICAgICAgICAgPGxhYmVsPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwicGR3Yy1zZWFyY2gtZmlsdGVyXCIgdmFsdWU9XCJzZXRzXCI+IFNldHM8L2xhYmVsPlxuICAgICAgICAgIDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInBkd2Mtc2VhcmNoLWZpbHRlclwiIHZhbHVlPVwibGlua3NcIj4gTGlua3M8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBkd2Mtc3VwZXItc2VhcmNoLXJlc3VsdHMtYXJlYVwiPlxuICAgICAgICAgIDwhLS0gUmVzdWx0cyB3aWxsIGJlIHNob3duIGhlcmUgLS0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1zdXBlci1zZWFyY2gtZGV0YWlsLXZpZXdcIj5cbiAgICAgICAgICA8IS0tIERldGFpbCB2aWV3IHdpbGwgYmUgZHluYW1pY2FsbHkgcG9wdWxhdGVkIGhlcmUgLS0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2FjaGUtc3RhdHVzLWRpc3BsYXlcIiBzdHlsZT1cImZvbnQtc2l6ZTogMC44ZW07IG1hcmdpbi10b3A6IDVweDsgY29sb3I6ICM1NTU7XCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuXG4gICAgdGhpcy5zZWFyY2hJbnB1dCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjcGR3Yy1zdXBlci1zZWFyY2gtaW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHRoaXMuZGF0YWxpc3RFbGVtZW50ID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwZHdjLXNlYXJjaC1oaXN0b3J5JykgYXMgSFRNTERhdGFMaXN0RWxlbWVudDtcbiAgICB0aGlzLnJlc3VsdHNDb250YWluZXIgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnBkd2Mtc3VwZXItc2VhcmNoLXJlc3VsdHMtYXJlYScpIGFzIEhUTUxFbGVtZW50O1xuICAgIHRoaXMuZGV0YWlsVmlld0NvbnRhaW5lciA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGR3Yy1zdXBlci1zZWFyY2gtZGV0YWlsLXZpZXcnKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIHRoaXMudXBkYXRlU2VhcmNoSGlzdG9yeURhdGFsaXN0KCk7XG5cbiAgICAvLyBHZXQgcmVmZXJlbmNlcyB0byBmaWx0ZXIgcmFkaW8gYnV0dG9uc1xuICAgIHRoaXMuZmlsdGVyQWxsUmFkaW8gPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBkd2Mtc2VhcmNoLWZpbHRlclwiXVt2YWx1ZT1cImFsbFwiXScpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgdGhpcy5maWx0ZXJBdHRyaWJ1dGVzUmFkaW8gPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBkd2Mtc2VhcmNoLWZpbHRlclwiXVt2YWx1ZT1cImF0dHJpYnV0ZXNcIl0nKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHRoaXMuZmlsdGVyU2V0c1JhZGlvID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJwZHdjLXNlYXJjaC1maWx0ZXJcIl1bdmFsdWU9XCJzZXRzXCJdJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICB0aGlzLmZpbHRlckxpbmtzUmFkaW8gPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBkd2Mtc2VhcmNoLWZpbHRlclwiXVt2YWx1ZT1cImxpbmtzXCJdJykgYXMgSFRNTElucHV0RWxlbWVudDsgLy8gSW5pdGlhbGl6ZSBMaW5rcyByYWRpbyBidXR0b25cbiAgICBcbiAgICB0aGlzLmF0dGFjaERldGFpbFZpZXdDb3B5TGlzdGVuZXJzKCk7IC8vIEF0dGFjaCBsaXN0ZW5lciBhZnRlciBjb250YWluZXIgaXMgZGVmaW5lZFxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTZWFyY2hDb250cm9scygpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250cm9scy5jbGFzc05hbWUgPSAncGR3Yy1zZWFyY2gtY29udHJvbHMnO1xuICAgIFxuICAgIGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNlYXJjaENvbnRhaW5lci5jbGFzc05hbWUgPSAncGR3Yy1zZWFyY2gtY29udGFpbmVyJztcbiAgICBcbiAgICBjb25zdCBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgc2VhcmNoSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICBzZWFyY2hJbnB1dC5wbGFjZWhvbGRlciA9ICdTZWFyY2guLi4nO1xuICAgIHNlYXJjaElucHV0LmNsYXNzTmFtZSA9ICdwZHdjLXNlYXJjaC1pbnB1dCc7XG4gICAgc2VhcmNoSW5wdXQudmFsdWUgPSB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtIHx8ICcnO1xuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudFF1ZXJ5LnRlcm0gPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICB0aGlzLnBlcmZvcm1TZWFyY2goKTtcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCBmaWx0ZXJCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBmaWx0ZXJCdXR0b24uY2xhc3NOYW1lID0gJ3Bkd2MtZmlsdGVyLWJ1dHRvbic7XG4gICAgZmlsdGVyQnV0dG9uLmlubmVySFRNTCA9IGBcbiAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiPlxuICAgICAgICA8cGF0aCBkPVwiTTIyIDNIMmw4IDkuNDZWMTlsNCAydi04LjU0TDIyIDN6XCI+PC9wYXRoPlxuICAgICAgPC9zdmc+XG4gICAgICBGaWx0ZXJzXG4gICAgYDtcbiAgICBmaWx0ZXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNob3dGaWx0ZXJEaWFsb2coKSk7XG4gICAgXG4gICAgY29uc3QgY29udHJvbHNSaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRyb2xzUmlnaHQuY2xhc3NOYW1lID0gJ3Bkd2MtY29udHJvbHMtcmlnaHQnO1xuICAgIGNvbnRyb2xzUmlnaHQuYXBwZW5kQ2hpbGQoZmlsdGVyQnV0dG9uKTtcbiAgICBcbiAgICBzZWFyY2hDb250YWluZXIuYXBwZW5kQ2hpbGQoc2VhcmNoSW5wdXQpO1xuICAgIGNvbnRyb2xzLmFwcGVuZENoaWxkKHNlYXJjaENvbnRhaW5lcik7XG4gICAgY29udHJvbHMuYXBwZW5kQ2hpbGQoY29udHJvbHNSaWdodCk7XG4gICAgXG4gICAgLy8gQWRkIHNvbWUgc3R5bGVzXG4gICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgLnBkd2Mtc2VhcmNoLWNvbnRyb2xzIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAxcmVtO1xuICAgICAgICBnYXA6IDFyZW07XG4gICAgICB9XG4gICAgICAucGR3Yy1zZWFyY2gtY29udGFpbmVyIHtcbiAgICAgICAgZmxleDogMTtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgfVxuICAgICAgLnBkd2Mtc2VhcmNoLWlucHV0IHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIHBhZGRpbmc6IDAuNXJlbSAxcmVtO1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGRkO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMXJlbTtcbiAgICAgIH1cbiAgICAgIC5wZHdjLWNvbnRyb2xzLXJpZ2h0IHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZ2FwOiAwLjVyZW07XG4gICAgICB9XG4gICAgICAucGR3Yy1maWx0ZXItYnV0dG9uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiAwLjVyZW07XG4gICAgICAgIHBhZGRpbmc6IDAuNXJlbSAxcmVtO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZjhmOWZhO1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZGVlMmU2O1xuICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgZm9udC1zaXplOiAwLjlyZW07XG4gICAgICAgIGNvbG9yOiAjNDk1MDU3O1xuICAgICAgfVxuICAgICAgLnBkd2MtZmlsdGVyLWJ1dHRvbjpob3ZlciB7XG4gICAgICAgIGJhY2tncm91bmQ6ICNlOWVjZWY7XG4gICAgICB9XG4gICAgICAucGR3Yy1maWx0ZXItYnV0dG9uIHN2ZyB7XG4gICAgICAgIHdpZHRoOiAxNnB4O1xuICAgICAgICBoZWlnaHQ6IDE2cHg7XG4gICAgICB9XG4gICAgYDtcbiAgICBjb250cm9scy5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgXG4gICAgcmV0dXJuIGNvbnRyb2xzO1xuICB9XG5cbiAgcHJpdmF0ZSBhdHRhY2hFdmVudExpc3RlbmVycygpOiB2b2lkIHtcbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGR3Yy1tb2RhbC1jbG9zZS1idG4nKTtcbiAgICBjbG9zZUJ1dHRvbj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG4gICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciB0aGUgZmVlZGJhY2sgYnV0dG9uXG4gICAgY29uc3QgZmVlZGJhY2tCdXR0b24gPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignI3Bkd2Mtc3VwZXItc2VhcmNoLWZlZWRiYWNrLWJ0bicpO1xuICAgIGlmIChmZWVkYmFja0J1dHRvbikge1xuICAgICAgZmVlZGJhY2tCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3BlbkdpdEh1Yklzc3VlKCdTdXBlciBTZWFyY2gnKTtcbiAgICAgICAgICAvLyBBZGQgdmlzdWFsIGZlZWRiYWNrXG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxIVE1MID0gZmVlZGJhY2tCdXR0b24uaW5uZXJIVE1MO1xuICAgICAgICAgIGNvbnN0IG9yaWdpbmFsVGl0bGUgPSBmZWVkYmFja0J1dHRvbi5nZXRBdHRyaWJ1dGUoJ3RpdGxlJykgfHwgJyc7XG4gICAgICAgICAgZmVlZGJhY2tCdXR0b24uaW5uZXJIVE1MID0gJ+Kckyc7XG4gICAgICAgICAgZmVlZGJhY2tCdXR0b24uc2V0QXR0cmlidXRlKCd0aXRsZScsICdUaGFua3MgZm9yIHlvdXIgZmVlZGJhY2shJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBmZWVkYmFja0J1dHRvbi5pbm5lckhUTUwgPSBvcmlnaW5hbEhUTUw7XG4gICAgICAgICAgICBmZWVkYmFja0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgb3JpZ2luYWxUaXRsZSk7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igb3BlbmluZyBmZWVkYmFjazonLCBlcnJvcik7XG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxIVE1MID0gZmVlZGJhY2tCdXR0b24uaW5uZXJIVE1MO1xuICAgICAgICAgIGZlZWRiYWNrQnV0dG9uLmlubmVySFRNTCA9ICchJztcbiAgICAgICAgICBmZWVkYmFja0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgJ0ZhaWxlZCB0byBvcGVuIGZlZWRiYWNrJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBmZWVkYmFja0J1dHRvbi5pbm5lckhUTUwgPSBvcmlnaW5hbEhUTUw7XG4gICAgICAgICAgICBmZWVkYmFja0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgJ1JlcG9ydCBhbiBpc3N1ZScpO1xuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBmaWx0ZXIgYnV0dG9uXG4gICAgY29uc3QgZmlsdGVyQnV0dG9uID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZHdjLWZpbHRlci1idXR0b24nKTtcbiAgICBpZiAoZmlsdGVyQnV0dG9uKSB7XG4gICAgICBmaWx0ZXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNob3dGaWx0ZXJEaWFsb2coKSk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNlYXJjaCBpbnB1dCBjaGFuZ2VzXG4gICAgdGhpcy5zZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtID0gKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgdGhpcy5jdXJyZW50UXVlcnkub2Zmc2V0ID0gMDtcbiAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtID0gdGhpcy5zZWFyY2hJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgIHRoaXMuY3VycmVudFF1ZXJ5Lm9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2goKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lcnMgZm9yIGZpbHRlciByYWRpbyBidXR0b25zXG4gICAgdGhpcy5maWx0ZXJBbGxSYWRpby5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5maWx0ZXJBbGxSYWRpby5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoRmlsdGVyVHlwZSA9ICdhbGwnO1xuICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2goKTsgLy8gUmUtcnVuIHNlYXJjaCB3aXRoIG5ldyBmaWx0ZXJcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmZpbHRlckF0dHJpYnV0ZXNSYWRpby5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5maWx0ZXJBdHRyaWJ1dGVzUmFkaW8uY2hlY2tlZCkge1xuICAgICAgICB0aGlzLnNlYXJjaEZpbHRlclR5cGUgPSAnYXR0cmlidXRlcyc7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaCgpOyAvLyBSZS1ydW4gc2VhcmNoIHdpdGggbmV3IGZpbHRlclxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuZmlsdGVyU2V0c1JhZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmZpbHRlclNldHNSYWRpby5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoRmlsdGVyVHlwZSA9ICdzZXRzJztcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKCk7IC8vIFJlLXJ1biBzZWFyY2ggd2l0aCBuZXcgZmlsdGVyXG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5maWx0ZXJMaW5rc1JhZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHsgLy8gQWRkZWQgZXZlbnQgbGlzdGVuZXIgZm9yIExpbmtzIGZpbHRlclxuICAgICAgaWYgKHRoaXMuZmlsdGVyTGlua3NSYWRpby5jaGVja2VkKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoRmlsdGVyVHlwZSA9ICdsaW5rcyc7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaCgpOyAvLyBSZS1ydW4gc2VhcmNoIHdpdGggbmV3IGZpbHRlclxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbCBjYWxsIHRvIHVwZGF0ZSBjYWNoZSBkaXNwbGF5IChpZiBuZWVkZWQsIHRob3VnaCBpbml0aWFsaXplRGF0YSBhbHNvIGNhbGxzIGl0KVxuICAgIHRoaXMudXBkYXRlQ2FjaGVTdGF0dXNEaXNwbGF5KCk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVNlYXJjaEhpc3RvcnlEYXRhbGlzdCgpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGFsaXN0RWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLnNlYXJjaEhpc3RvcnkuZm9yRWFjaCh0ZXJtID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IHRlcm07XG4gICAgICAgIHRoaXMuZGF0YWxpc3RFbGVtZW50LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvU2VhcmNoSGlzdG9yeSh0ZXJtOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRlcm0pIHJldHVybjtcbiAgICB0aGlzLnNlYXJjaEhpc3RvcnkgPSBbdGVybSwgLi4udGhpcy5zZWFyY2hIaXN0b3J5LmZpbHRlcih0ID0+IHQgIT09IHRlcm0pXS5zbGljZSgwLCBNQVhfSElTVE9SWV9JVEVNUyk7XG4gICAgdGhpcy51cGRhdGVTZWFyY2hIaXN0b3J5RGF0YWxpc3QoKTtcbiAgICB0aGlzLnNhdmVTZWFyY2hIaXN0b3J5KCk7XG4gIH1cblxuICBwcml2YXRlIHNhdmVTZWFyY2hIaXN0b3J5KCk6IHZvaWQge1xuICAgIGlmIChjaHJvbWUgJiYgY2hyb21lLnN0b3JhZ2UgJiYgY2hyb21lLnN0b3JhZ2UubG9jYWwpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ3Bkd2Mtc2VhcmNoLWhpc3RvcnknOiB0aGlzLnNlYXJjaEhpc3RvcnkgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU2VhcmNoSGlzdG9yeSgpOiB2b2lkIHtcbiAgICBpZiAoY2hyb21lICYmIGNocm9tZS5zdG9yYWdlICYmIGNocm9tZS5zdG9yYWdlLmxvY2FsKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncGR3Yy1zZWFyY2gtaGlzdG9yeScsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbJ3Bkd2Mtc2VhcmNoLWhpc3RvcnknXSAmJiBBcnJheS5pc0FycmF5KHJlc3VsdFsncGR3Yy1zZWFyY2gtaGlzdG9yeSddKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoSGlzdG9yeSA9IHJlc3VsdFsncGR3Yy1zZWFyY2gtaGlzdG9yeSddO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VhcmNoSGlzdG9yeURhdGFsaXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5ldyBtZXRob2QgdG8gbG9hZCBpbml0aWFsIGRhdGEgZnJvbSBBUElcbiAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplRGF0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogU3VwZXJTZWFyY2ggaW5pdGlhbGl6aW5nIGRhdGEuLi5cIik7XG4gICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyTG9hZGluZyh0cnVlKTtcbiAgICB0aGlzLnJlbmRlclJlc3VsdHNNZXNzYWdlKCc8ZGl2IGNsYXNzPVwicGR3Yy1sb2FkaW5nLXNwaW5uZXItY29udGFpbmVyXCI+PGRpdiBjbGFzcz1cInBkd2MtbG9hZGluZy1zcGlubmVyXCI+PC9kaXY+TG9hZGluZyBtZXRhZGF0YS4uLjwvZGl2PicsIHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFRyeSB0byBsb2FkIGZyb20gY2FjaGUgZmlyc3RcbiAgICAgIGlmICh0aGlzLmJhc2VVcmwpIHtcbiAgICAgICAgY29uc3QgY2FjaGVkID0gYXdhaXQgbG9hZERhdGFGcm9tQ2FjaGUodGhpcy5iYXNlVXJsKTtcbiAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgIHRoaXMuYWxsQXR0cmlidXRlcyA9IGNhY2hlZC5hdHRyaWJ1dGVzO1xuICAgICAgICAgIHRoaXMuYWxsU2V0cyA9IGNhY2hlZC5zZXRzO1xuICAgICAgICAgIHRoaXMuYWxsTGlua1R5cGVzID0gY2FjaGVkLmxpbmtUeXBlcyB8fCBbXTsgLy8gTG9hZCBsaW5rVHlwZXMgZnJvbSBjYWNoZVxuICAgICAgICAgIHRoaXMuY2FjaGVUaW1lc3RhbXAgPSBjYWNoZWQudGltZXN0YW1wO1xuICAgICAgICAgIHRoaXMuaXNEYXRhRnJvbUNhY2hlID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmRhdGFMb2FkZWQgPSB0cnVlOyAvLyA8LS0tIFNFVCBEQVRBIExPQURFRCBUTyBUUlVFXG4gICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogU3VwZXJTZWFyY2ggaW5pdGlhbGl6ZWQgd2l0aCBkYXRhIGZyb20gY2FjaGUgKHRpbWVzdGFtcDogJHtuZXcgRGF0ZShjYWNoZWQudGltZXN0YW1wKS50b0xvY2FsZVN0cmluZygpfSkuYCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDYWNoZVN0YXR1c0Rpc3BsYXkoKTsgXG4gICAgICAgICAgdGhpcy5yZW5kZXJMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICB0aGlzLnJlbmRlclJlc3VsdHNNZXNzYWdlKCdkYXRhIGxvYWRlZCBmcm9tIGNhY2hlJywgZmFsc2UpOyBcbiAgICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2godHJ1ZSk7IFxuICAgICAgICAgIHJldHVybjsgLy8gRGF0YSBsb2FkZWQgZnJvbSBjYWNoZSwgbm8gbmVlZCB0byBmZXRjaCBmcm9tIEFQSVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGNhY2hlIG9yIGJhc2VVcmwgbm90IHNldCBmb3IgY2FjaGUsIGZldGNoIGZyb20gQVBJXG4gICAgICB0aGlzLmlzRGF0YUZyb21DYWNoZSA9IGZhbHNlO1xuICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IE5vIGNhY2hlIGZvdW5kIG9yIGFwcGxpY2FibGUsIGZldGNoaW5nIGZyZXNoIGRhdGEgZm9yIFN1cGVyU2VhcmNoLlwiKTtcblxuICAgICAgY29uc3QgW2F0dHJpYnV0ZXMsIHNldHNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICBmZXRjaEF0dHJpYnV0ZXModGhpcy5iYXNlVXJsKSwgLy8gUmV2ZXJ0ZWQ6IGR3QXBpVG9rZW4gcmVtb3ZlZFxuICAgICAgICBmZXRjaFNldHModGhpcy5iYXNlVXJsKSAgICAgIC8vIFJldmVydGVkOiBkd0FwaVRva2VuIHJlbW92ZWRcbiAgICAgIF0pO1xuXG4gICAgICB0aGlzLmFsbEF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgICAgdGhpcy5hbGxTZXRzID0gc2V0cztcbiAgICAgIHRoaXMuYWxsTGlua1R5cGVzID0gW107IC8vIFJlc2V0IGJlZm9yZSBmZXRjaGluZ1xuXG4gICAgICAvLyBGZXRjaCBMaW5rVHlwZXMgaW4gYmF0Y2hlc1xuICAgICAgaWYgKHRoaXMuYWxsU2V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IEZvdW5kICR7dGhpcy5hbGxTZXRzLmxlbmd0aH0gc2V0cy4gRmV0Y2hpbmcgbGluayB0eXBlcyBpbiBiYXRjaGVzLmApO1xuICAgICAgICBjb25zdCBzZXRJZHMgPSB0aGlzLmFsbFNldHMubWFwKHNldCA9PiBzZXQuaWQpOyAvLyBBc3N1bWluZyAnaWQnIGlzIHRoZSBwcm9wZXJ0eSBmb3Igc2V0IElEXG4gICAgICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDUwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldElkcy5sZW5ndGg7IGkgKz0gYmF0Y2hTaXplKSB7XG4gICAgICAgICAgY29uc3QgYmF0Y2hPZlNldElkcyA9IHNldElkcy5zbGljZShpLCBpICsgYmF0Y2hTaXplKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRmV0Y2hpbmcgbGluayB0eXBlcyBmb3IgYmF0Y2ggJHtNYXRoLmZsb29yKGkgLyBiYXRjaFNpemUpICsgMX0vJHtNYXRoLmNlaWwoc2V0SWRzLmxlbmd0aCAvIGJhdGNoU2l6ZSl9IChTZXQgSURzOiAke2JhdGNoT2ZTZXRJZHMuam9pbignLCAnKX0pYCk7XG4gICAgICAgICAgICBjb25zdCBmZXRjaGVkTGlua1R5cGVzID0gYXdhaXQgZmV0Y2hMaW5rVHlwZXNCeUNsYXNzSWRzKHRoaXMuYmFzZVVybCwgYmF0Y2hPZlNldElkcyk7XG4gICAgICAgICAgICB0aGlzLmFsbExpbmtUeXBlcy5wdXNoKC4uLmZldGNoZWRMaW5rVHlwZXMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRmV0Y2hlZCAke2ZldGNoZWRMaW5rVHlwZXMubGVuZ3RofSBsaW5rIHR5cGVzIGluIHRoaXMgYmF0Y2guIFRvdGFsIGxpbmsgdHlwZXM6ICR7dGhpcy5hbGxMaW5rVHlwZXMubGVuZ3RofWApO1xuICAgICAgICAgIH0gY2F0Y2ggKGxpbmtGZXRjaEVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEVycm9yIGZldGNoaW5nIGJhdGNoIG9mIGxpbmsgdHlwZXMgZm9yIHNldCBJRHMgJHtiYXRjaE9mU2V0SWRzLmpvaW4oJywgJyl9OmAsIGxpbmtGZXRjaEVycm9yKTtcbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGRlY2lkZSBpZiBvbmUgYmF0Y2ggZmFpbHVyZSBzaG91bGQgc3RvcCBhbGwgb3IganVzdCBza2lwXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBQQUJMTydTIERXIENIQUQ6IEZpbmlzaGVkIGZldGNoaW5nIGFsbCBsaW5rIHR5cGVzLiBUb3RhbDogJHt0aGlzLmFsbExpbmtUeXBlcy5sZW5ndGh9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmJhc2VVcmwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNhdmVEYXRhVG9DYWNoZSh0aGlzLmJhc2VVcmwsIHRoaXMuYWxsQXR0cmlidXRlcywgdGhpcy5hbGxTZXRzLCB0aGlzLmFsbExpbmtUeXBlcyk7IC8vIFBhc3MgbGlua1R5cGVzIHRvIGNhY2hlXG4gICAgICAgICAgICB0aGlzLmNhY2hlVGltZXN0YW1wID0gRGF0ZS5ub3coKTsgLy8gU2V0IGN1cnJlbnQgdGltZSBhcyBjYWNoZSB0aW1lXG4gICAgICAgICAgICB0aGlzLmRhdGFMb2FkZWQgPSB0cnVlOyAvLyA8LS0tIFNFVCBEQVRBIExPQURFRCBUTyBUUlVFXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogRnJlc2ggZGF0YSBmZXRjaGVkIGFuZCBzYXZlZCB0byBjYWNoZSBmb3IgU3VwZXJTZWFyY2guXCIpO1xuICAgICAgICB9IGNhdGNoIChjYWNoZUVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUEFCTE8nUyBEVyBDSEFEOiBGYWlsZWQgdG8gc2F2ZSBmZXRjaGVkIGRhdGEgdG8gY2FjaGU6XCIsIGNhY2hlRXJyb3IpO1xuICAgICAgICAgICAgLy8gQ29udGludWUgd2l0aG91dCBjYWNoZSwgZGF0YSBpcyBzdGlsbCBsb2FkZWQgaW4gbWVtb3J5IGZvciB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgdGhpcy5kYXRhTG9hZGVkID0gdHJ1ZTsgLy8gPC0tLSBTRVQgREFUQSBMT0FERUQgVE8gVFJVRSAoZXZlbiBpZiBjYWNoZSBzYXZlIGZhaWxzLCBkYXRhIGlzIGluIG1lbW9yeSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVDYWNoZVN0YXR1c0Rpc3BsYXkoKTsgXG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogU3VwZXJTZWFyY2ggZmFpbGVkIHRvIGluaXRpYWxpemUgZGF0YTpcIiwgZXJyb3IpO1xuICAgICAgdGhpcy5yZW5kZXJSZXN1bHRzTWVzc2FnZSgnRXJyb3IgbG9hZGluZyBtZXRhZGF0YS4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlciBvciBjaGVjayBjb25zb2xlLicsIGZhbHNlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgIC8vIHRoaXMuZGF0YUxvYWRlZCBzaG91bGQgYmUgdHJ1ZSBpZiBzdWNjZXNzZnVsLCBvciBmYWxzZSBpZiBlcnJvciBvY2N1cnJlZCBiZWZvcmUgZGF0YSBhc3NpZ25tZW50XG4gICAgICB0aGlzLnJlbmRlckxvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYW4gb2JqZWN0IG1hdGNoZXMgYWxsIG5lc3RlZCBwcm9wZXJ0eSBmaWx0ZXJzXG4gICAqIEhhbmRsZXMgYm9vbGVhbiB2YWx1ZXMsIG9wdGlvbmFsIHByb3BlcnRpZXMsIGFuZCB2YXJpb3VzIG1hdGNoIHR5cGVzXG4gICAqL1xuICBwcml2YXRlIG1hdGNoZXNOZXN0ZWRGaWx0ZXJzKG9iajogUmVjb3JkPHN0cmluZywgYW55PiwgZmlsdGVyczogTmVzdGVkUHJvcGVydHlGaWx0ZXJbXSA9IFtdKTogYm9vbGVhbiB7XG4gICAgaWYgKCFmaWx0ZXJzLmxlbmd0aCkgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmlsdGVycy5ldmVyeShmaWx0ZXIgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gSGFuZGxlIHNwZWNpYWwgY2FzZSBmb3IgY2hlY2tpbmcgcHJvcGVydHkgZXhpc3RlbmNlXG4gICAgICAgIGlmIChmaWx0ZXIucGF0aC5lbmRzV2l0aCgnPycpIHx8IGZpbHRlci5tYXRjaFR5cGUgPT09ICdleGlzdHMnKSB7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IGZpbHRlci5wYXRoLmVuZHNXaXRoKCc/JykgPyBmaWx0ZXIucGF0aC5zbGljZSgwLCAtMSkgOiBmaWx0ZXIucGF0aDtcbiAgICAgICAgICBjb25zdCBleGlzdHMgPSB0aGlzLmNoZWNrUHJvcGVydHlFeGlzdHMob2JqLCBwYXRoKTtcbiAgICAgICAgICAvLyBJZiBjaGVja2luZyBmb3IgZXhpc3RlbmNlLCB0cmVhdCBhbnkgbm9uLWVtcHR5IHN0cmluZyBhcyB0cnVlXG4gICAgICAgICAgY29uc3Qgc2hvdWxkRXhpc3QgPSBmaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnIHx8IGZpbHRlci52YWx1ZSA9PT0gJzEnIHx8IGZpbHRlci52YWx1ZS50b0xvd2VyQ2FzZSgpID09PSAneWVzJztcbiAgICAgICAgICByZXR1cm4gZXhpc3RzID09PSBzaG91bGRFeGlzdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCB2YWx1ZSB1c2luZyBkb3Qgbm90YXRpb24gcGF0aFxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0TmVzdGVkVmFsdWUob2JqLCBmaWx0ZXIucGF0aCk7XG4gICAgICAgIFxuICAgICAgICAvLyBIYW5kbGUgdW5kZWZpbmVkL251bGwgdmFsdWVzXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGZpbHRlciB2YWx1ZSBpcyAnbnVsbCcgb3IgJ3VuZGVmaW5lZCcsIGNoZWNrIGZvciBleHBsaWNpdCBudWxsL3VuZGVmaW5lZFxuICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRGaWx0ZXJWYWx1ZSA9IGZpbHRlci52YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBpZiAobm9ybWFsaXplZEZpbHRlclZhbHVlID09PSAnbnVsbCcgfHwgbm9ybWFsaXplZEZpbHRlclZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gUHJvcGVydHkgZG9lc24ndCBleGlzdCBvciBpcyBudWxsL3VuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGJvb2xlYW4gdmFsdWVzXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgIGNvbnN0IGJvb2xWYWx1ZSA9IHRoaXMucGFyc2VCb29sZWFuKGZpbHRlci52YWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIGJvb2xWYWx1ZSAhPT0gbnVsbCA/IHZhbHVlID09PSBib29sVmFsdWUgOiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzdHJpbmcvbnVtYmVyIGNvbXBhcmlzb25zXG4gICAgICAgIGNvbnN0IHNlYXJjaFZhbHVlID0gZmlsdGVyLmNhc2VTZW5zaXRpdmUgPyBmaWx0ZXIudmFsdWUgOiBmaWx0ZXIudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0VmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIFxuICAgICAgICAgID8gKGZpbHRlci5jYXNlU2Vuc2l0aXZlID8gdmFsdWUgOiB2YWx1ZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgIDogU3RyaW5nKHZhbHVlKTtcblxuICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBtYXRjaCB0eXBlc1xuICAgICAgICBzd2l0Y2ggKGZpbHRlci5tYXRjaFR5cGUpIHtcbiAgICAgICAgICBjYXNlICdleGFjdCc6XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0VmFsdWUgPT09IHNlYXJjaFZhbHVlO1xuICAgICAgICAgIGNhc2UgJ3N0YXJ0c1dpdGgnOlxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFZhbHVlLnN0YXJ0c1dpdGgoc2VhcmNoVmFsdWUpO1xuICAgICAgICAgIGNhc2UgJ2VuZHNXaXRoJzpcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRWYWx1ZS5lbmRzV2l0aChzZWFyY2hWYWx1ZSk7XG4gICAgICAgICAgY2FzZSAncmVnZXgnOlxuICAgICAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHNlYXJjaFZhbHVlLCBmaWx0ZXIuY2FzZVNlbnNpdGl2ZSA/ICcnIDogJ2knKTtcbiAgICAgICAgICAgIHJldHVybiByZWdleC50ZXN0KFN0cmluZyh2YWx1ZSkpO1xuICAgICAgICAgIGNhc2UgJ2d0JzpcbiAgICAgICAgICAgIHJldHVybiAhaXNOYU4oTnVtYmVyKHZhbHVlKSkgJiYgIWlzTmFOKE51bWJlcihzZWFyY2hWYWx1ZSkpICYmIE51bWJlcih2YWx1ZSkgPiBOdW1iZXIoc2VhcmNoVmFsdWUpO1xuICAgICAgICAgIGNhc2UgJ2x0JzpcbiAgICAgICAgICAgIHJldHVybiAhaXNOYU4oTnVtYmVyKHZhbHVlKSkgJiYgIWlzTmFOKE51bWJlcihzZWFyY2hWYWx1ZSkpICYmIE51bWJlcih2YWx1ZSkgPCBOdW1iZXIoc2VhcmNoVmFsdWUpO1xuICAgICAgICAgIGNhc2UgJ2d0ZSc6XG4gICAgICAgICAgICByZXR1cm4gIWlzTmFOKE51bWJlcih2YWx1ZSkpICYmICFpc05hTihOdW1iZXIoc2VhcmNoVmFsdWUpKSAmJiBOdW1iZXIodmFsdWUpID49IE51bWJlcihzZWFyY2hWYWx1ZSk7XG4gICAgICAgICAgY2FzZSAnbHRlJzpcbiAgICAgICAgICAgIHJldHVybiAhaXNOYU4oTnVtYmVyKHZhbHVlKSkgJiYgIWlzTmFOKE51bWJlcihzZWFyY2hWYWx1ZSkpICYmIE51bWJlcih2YWx1ZSkgPD0gTnVtYmVyKHNlYXJjaFZhbHVlKTtcbiAgICAgICAgICBjYXNlICdjb250YWlucyc6XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRWYWx1ZS5pbmNsdWRlcyhzZWFyY2hWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdFcnJvciBldmFsdWF0aW5nIG5lc3RlZCBmaWx0ZXI6JywgZSwgeyBmaWx0ZXIsIG9iaiB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciB0byBzYWZlbHkgZ2V0IG5lc3RlZCBwcm9wZXJ0eSB2YWx1ZSB1c2luZyBkb3Qgbm90YXRpb25cbiAgICovXG4gIHByaXZhdGUgZ2V0TmVzdGVkVmFsdWUob2JqOiBhbnksIHBhdGg6IHN0cmluZyk6IHVua25vd24ge1xuICAgIHJldHVybiBwYXRoLnNwbGl0KCcuJykucmVkdWNlPHVua25vd24+KFxuICAgICAgKG86IHVua25vd24sIGtleTogc3RyaW5nKSA9PiBcbiAgICAgICAgbyAhPT0gbnVsbCAmJiB0eXBlb2YgbyA9PT0gJ29iamVjdCcgJiYga2V5IGluIChvIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVxuICAgICAgICAgID8gKG8gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV1cbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIG9ialxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBwcm9wZXJ0eSBleGlzdHMgaW4gdGhlIG9iamVjdCAoc3VwcG9ydHMgZG90IG5vdGF0aW9uKVxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja1Byb3BlcnR5RXhpc3RzKG9iajogYW55LCBwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmdldE5lc3RlZFZhbHVlKG9iaiwgcGF0aCk7XG4gICAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHN0cmluZyByZXByZXNlbnRhdGlvbnMgb2YgYm9vbGVhbiB2YWx1ZXNcbiAgICovXG4gIHByaXZhdGUgcGFyc2VCb29sZWFuKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHwgbnVsbCB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuIG51bGw7XG4gICAgXG4gICAgY29uc3QgbG93ZXIgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBpZiAoWyd0cnVlJywgJ3llcycsICcxJywgJ29uJ10uaW5jbHVkZXMobG93ZXIpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoWydmYWxzZScsICdubycsICcwJywgJ29mZiddLmluY2x1ZGVzKGxvd2VyKSkgcmV0dXJuIGZhbHNlO1xuICAgIFxuICAgIHJldHVybiBudWxsOyAvLyBOb3QgYSByZWNvZ25pemVkIGJvb2xlYW4gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IGZpbHRlcmFibGUgcHJvcGVydGllcyBmcm9tIHRoZSBkYXRhXG4gICAqL1xuICBwcml2YXRlIGdldEZpbHRlcmFibGVQcm9wZXJ0aWVzKCk6IEZpbHRlckdyb3VwW10ge1xuICAgIGNvbnN0IGF0dHJpYnV0ZVByb3BlcnRpZXM6IEZpbHRlcmFibGVQcm9wZXJ0eVtdID0gW1xuICAgICAgeyBwYXRoOiAnbmFtZScsIGxhYmVsOiAnTmFtZScsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICB7IHBhdGg6ICdpZCcsIGxhYmVsOiAnSUQnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgeyBwYXRoOiAnZGF0YVR5cGUnLCBsYWJlbDogJ0RhdGEgVHlwZScsIHR5cGU6ICdzdHJpbmcnLCBvcHRpb25zOiBbJ3N0cmluZycsICdudW1iZXInLCAnYm9vbGVhbicsICdkYXRlJ10gfSxcbiAgICAgIHsgcGF0aDogJ2lzSW5kZXhlZCcsIGxhYmVsOiAnSXMgSW5kZXhlZCcsIHR5cGU6ICdib29sZWFuJyB9LFxuICAgICAgeyBwYXRoOiAnaXNTeXN0ZW0nLCBsYWJlbDogJ0lzIFN5c3RlbScsIHR5cGU6ICdib29sZWFuJyB9LFxuICAgIF07XG5cbiAgICBjb25zdCBzZXRQcm9wZXJ0aWVzOiBGaWx0ZXJhYmxlUHJvcGVydHlbXSA9IFtcbiAgICAgIHsgcGF0aDogJ25hbWUnLCBsYWJlbDogJ05hbWUnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgeyBwYXRoOiAnaWQnLCBsYWJlbDogJ0lEJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgIHsgcGF0aDogJ2Rlc2NyaXB0aW9uJywgbGFiZWw6ICdEZXNjcmlwdGlvbicsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICB7IHBhdGg6ICdjb3JlJywgbGFiZWw6ICdJcyBDb3JlJywgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICB7IHBhdGg6ICdpc0hpZGRlbicsIGxhYmVsOiAnSXMgSGlkZGVuJywgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgXTtcblxuICAgIGNvbnN0IGxpbmtQcm9wZXJ0aWVzOiBGaWx0ZXJhYmxlUHJvcGVydHlbXSA9IFtcbiAgICAgIHsgcGF0aDogJ25hbWUnLCBsYWJlbDogJ05hbWUnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgeyBwYXRoOiAnaWQnLCBsYWJlbDogJ0lEJywgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgIHsgcGF0aDogJ3NvdXJjZUNvbGxlY3Rpb25JZCcsIGxhYmVsOiAnU291cmNlIENvbGxlY3Rpb24gSUQnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgeyBwYXRoOiAndGFyZ2V0Q29sbGVjdGlvbklkJywgbGFiZWw6ICdUYXJnZXQgQ29sbGVjdGlvbiBJRCcsIHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICB7IHBhdGg6ICdkaXJlY3RlZCcsIGxhYmVsOiAnSXMgRGlyZWN0ZWQnLCB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICAgIHsgcGF0aDogJ2NvcmUnLCBsYWJlbDogJ0lzIENvcmUnLCB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICAgIHsgcGF0aDogJ2NvbmZpZy50eXBlJywgbGFiZWw6ICdMaW5rIFR5cGUnLCB0eXBlOiAnc3RyaW5nJyB9LFxuICAgIF07XG5cbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICBpZDogJ2F0dHJpYnV0ZXMnLFxuICAgICAgICBsYWJlbDogJ0F0dHJpYnV0ZXMnLFxuICAgICAgICB0eXBlOiAnYXR0cmlidXRlcycsXG4gICAgICAgIHByb3BlcnRpZXM6IGF0dHJpYnV0ZVByb3BlcnRpZXMsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3NldHMnLFxuICAgICAgICBsYWJlbDogJ1NldHMnLFxuICAgICAgICB0eXBlOiAnc2V0cycsXG4gICAgICAgIHByb3BlcnRpZXM6IHNldFByb3BlcnRpZXMsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ2xpbmtzJyxcbiAgICAgICAgbGFiZWw6ICdMaW5rcycsXG4gICAgICAgIHR5cGU6ICdsaW5rcycsXG4gICAgICAgIHByb3BlcnRpZXM6IGxpbmtQcm9wZXJ0aWVzLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3cgdGhlIGZpbHRlciBkaWFsb2dcbiAgICovXG4gIHByaXZhdGUgc2hvd0ZpbHRlckRpYWxvZygpOiB2b2lkIHtcbiAgICBjb25zdCBmaWx0ZXJHcm91cHMgPSB0aGlzLmdldEZpbHRlcmFibGVQcm9wZXJ0aWVzKCk7XG4gICAgY29uc3QgY3VycmVudEZpbHRlcnMgPSB0aGlzLmN1cnJlbnRRdWVyeS5uZXN0ZWRGaWx0ZXJzIHx8IFtdO1xuICAgIFxuICAgIGNvbnN0IGRpYWxvZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpYWxvZy5jbGFzc05hbWUgPSAncGR3Yy1maWx0ZXItZGlhbG9nJztcbiAgICBkaWFsb2cuaW5uZXJIVE1MID0gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICAucGR3Yy1maWx0ZXItZGlhbG9nIHtcbiAgICAgICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICAgICAgdG9wOiA1MCU7XG4gICAgICAgICAgbGVmdDogNTAlO1xuICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICAgICAgICBib3gtc2hhZG93OiAwIDRweCAyMHB4IHJnYmEoMCwgMCwgMCwgMC4xNSk7XG4gICAgICAgICAgd2lkdGg6IDgwJTtcbiAgICAgICAgICBtYXgtd2lkdGg6IDgwMHB4O1xuICAgICAgICAgIG1heC1oZWlnaHQ6IDgwdmg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgIHotaW5kZXg6IDEwMDAxO1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtZmlsdGVyLWRpYWxvZy1oZWFkZXIge1xuICAgICAgICAgIHBhZGRpbmc6IDE2cHggMjBweDtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U5ZWNlZjtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWZpbHRlci1kaWFsb2ctdGl0bGUge1xuICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICBmb250LXNpemU6IDEuMnJlbTtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWZpbHRlci1kaWFsb2ctY2xvc2Uge1xuICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMS41cmVtO1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBjb2xvcjogIzZjNzU3ZDtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1maWx0ZXItZGlhbG9nLWJvZHkge1xuICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWZpbHRlci1ncm91cCB7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMjRweDtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1maWx0ZXItZ3JvdXAtdGl0bGUge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMXJlbTtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIG1hcmdpbjogMCAwIDEycHggMDtcbiAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogOHB4O1xuICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTllY2VmO1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWZpbHRlci1wcm9wZXJ0eSB7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTJweDtcbiAgICAgICAgICBwYWRkaW5nOiAxMnB4O1xuICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNlOWVjZWY7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4O1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLWZpbHRlci1wcm9wZXJ0eS1oZWFkZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbTogOHB4O1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1maWx0ZXItcHJvcGVydHktbmFtZSB7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1maWx0ZXItcHJvcGVydHktY29udHJvbHMge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtZmlsdGVyLXByb3BlcnR5LWJvZHkge1xuICAgICAgICAgIG1hcmdpbi10b3A6IDhweDtcbiAgICAgICAgICBwYWRkaW5nLXRvcDogOHB4O1xuICAgICAgICAgIGJvcmRlci10b3A6IDFweCBkYXNoZWQgI2U5ZWNlZjtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy1maWx0ZXItZGlhbG9nLWZvb3RlciB7XG4gICAgICAgICAgcGFkZGluZzogMTZweCAyMHB4O1xuICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjZTllY2VmO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtdGFicyB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U5ZWNlZjtcbiAgICAgICAgICBwYWRkaW5nOiAwIDIwcHg7XG4gICAgICAgIH1cbiAgICAgICAgLnBkd2MtdGFiIHtcbiAgICAgICAgICBwYWRkaW5nOiAxMnB4IDE2cHg7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCB0cmFuc3BhcmVudDtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAtMXB4O1xuICAgICAgICB9XG4gICAgICAgIC5wZHdjLXRhYi5hY3RpdmUge1xuICAgICAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICM0YTZjZjc7XG4gICAgICAgICAgY29sb3I6ICM0YTZjZjc7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy10YWItY29udGVudCB7XG4gICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgfVxuICAgICAgICAucGR3Yy10YWItY29udGVudC5hY3RpdmUge1xuICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB9XG4gICAgICA8L3N0eWxlPlxuICAgICAgPGRpdiBjbGFzcz1cInBkd2MtZmlsdGVyLWRpYWxvZy1oZWFkZXJcIj5cbiAgICAgICAgPGgzIGNsYXNzPVwicGR3Yy1maWx0ZXItZGlhbG9nLXRpdGxlXCI+QWR2YW5jZWQgRmlsdGVyczwvaDM+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJwZHdjLWZpbHRlci1kaWFsb2ctY2xvc2VcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLXRhYnNcIj5cbiAgICAgICAgJHtmaWx0ZXJHcm91cHMubWFwKGdyb3VwID0+IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy10YWIgJHtncm91cC50eXBlID09PSAnYXR0cmlidXRlcycgPyAnYWN0aXZlJyA6ICcnfVwiIGRhdGEtdGFiPVwiJHtncm91cC5pZH1cIj5cbiAgICAgICAgICAgICR7Z3JvdXAubGFiZWx9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1maWx0ZXItZGlhbG9nLWJvZHlcIj5cbiAgICAgICAgJHtmaWx0ZXJHcm91cHMubWFwKGdyb3VwID0+IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy10YWItY29udGVudCAke2dyb3VwLnR5cGUgPT09ICdhdHRyaWJ1dGVzJyA/ICdhY3RpdmUnIDogJyd9XCIgZGF0YS10YWItY29udGVudD1cIiR7Z3JvdXAuaWR9XCI+XG4gICAgICAgICAgICA8aDQgY2xhc3M9XCJwZHdjLWZpbHRlci1ncm91cC10aXRsZVwiPiR7Z3JvdXAubGFiZWx9IFByb3BlcnRpZXM8L2g0PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBkd2MtZmlsdGVyLWdyb3VwXCI+XG4gICAgICAgICAgICAgICR7Z3JvdXAucHJvcGVydGllcy5tYXAocHJvcCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyRXhpc3RzID0gY3VycmVudEZpbHRlcnMuc29tZShmID0+IGYucGF0aCA9PT0gcHJvcC5wYXRoICYmIGYudHlwZSA9PT0gZ3JvdXAudHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEZpbHRlciA9IGN1cnJlbnRGaWx0ZXJzLmZpbmQoZiA9PiBmLnBhdGggPT09IHByb3AucGF0aCAmJiBmLnR5cGUgPT09IGdyb3VwLnR5cGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1maWx0ZXItcHJvcGVydHlcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBkd2MtZmlsdGVyLXByb3BlcnR5LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLWZpbHRlci1wcm9wZXJ0eS1uYW1lXCI+JHtwcm9wLmxhYmVsfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLWZpbHRlci1wcm9wZXJ0eS1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzcz1cInBkd2MtZmlsdGVyLW9wZXJhdG9yXCIgZGF0YS1wYXRoPVwiJHtwcm9wLnBhdGh9XCIgZGF0YS10eXBlPVwiJHtncm91cC50eXBlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCIgJHshZmlsdGVyRXhpc3RzID8gJ3NlbGVjdGVkJyA6ICcnfT5ObyBmaWx0ZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImVxdWFsc1wiICR7Y3VycmVudEZpbHRlcj8ubWF0Y2hUeXBlID09PSAnZXhhY3QnID8gJ3NlbGVjdGVkJyA6ICcnfT5FcXVhbHM8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNvbnRhaW5zXCIgJHshY3VycmVudEZpbHRlcj8ubWF0Y2hUeXBlIHx8IGN1cnJlbnRGaWx0ZXI/Lm1hdGNoVHlwZSA9PT0gJ2NvbnRhaW5zJyA/ICdzZWxlY3RlZCcgOiAnJ30+Q29udGFpbnM8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgJHtwcm9wLnR5cGUgPT09ICdudW1iZXInID8gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJndFwiICR7Y3VycmVudEZpbHRlcj8ubWF0Y2hUeXBlID09PSAnZ3QnID8gJ3NlbGVjdGVkJyA6ICcnfT5HcmVhdGVyIHRoYW48L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibHRcIiAke2N1cnJlbnRGaWx0ZXI/Lm1hdGNoVHlwZSA9PT0gJ2x0JyA/ICdzZWxlY3RlZCcgOiAnJ30+TGVzcyB0aGFuPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImV4aXN0c1wiICR7Y3VycmVudEZpbHRlcj8ubWF0Y2hUeXBlID09PSAnZXhpc3RzJyA/ICdzZWxlY3RlZCcgOiAnJ30+RXhpc3RzPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7ZmlsdGVyRXhpc3RzID8gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwicGR3Yy1maWx0ZXItdmFsdWVcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtcGF0aD1cIiR7cHJvcC5wYXRofVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10eXBlPVwiJHtncm91cC50eXBlfVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9XCIke2N1cnJlbnRGaWx0ZXI/LnZhbHVlIHx8ICcnfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlZhbHVlLi4uXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICB9KS5qb2luKCcnKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInBkd2MtZmlsdGVyLWRpYWxvZy1mb290ZXJcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBkd2Mtc2Vjb25kYXJ5LWJ0blwiIGlkPVwicGR3Yy1maWx0ZXItY2xlYXJcIj5DbGVhciBBbGw8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInBkd2MtcHJpbWFyeS1idG5cIiBpZD1cInBkd2MtZmlsdGVyLWFwcGx5XCI+QXBwbHkgRmlsdGVyczwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgYDtcblxuICAgIC8vIEFkZCB0YWIgc3dpdGNoaW5nXG4gICAgY29uc3QgdGFicyA9IGRpYWxvZy5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PignLnBkd2MtdGFiJyk7XG4gICAgaWYgKHRhYnMpIHtcbiAgICAgIHRhYnMuZm9yRWFjaCh0YWIgPT4ge1xuICAgICAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgLy8gUmVtb3ZlIGFjdGl2ZSBjbGFzcyBmcm9tIGFsbCB0YWJzIGFuZCBjb250ZW50c1xuICAgICAgICAgIGRpYWxvZy5xdWVyeVNlbGVjdG9yQWxsKCcucGR3Yy10YWInKS5mb3JFYWNoKCh0OiBFbGVtZW50KSA9PiB0LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpKTtcbiAgICAgICAgICBkaWFsb2cucXVlcnlTZWxlY3RvckFsbCgnLnBkd2MtdGFiLWNvbnRlbnQnKS5mb3JFYWNoKChjOiBFbGVtZW50KSA9PiBjLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBZGQgYWN0aXZlIGNsYXNzIHRvIGNsaWNrZWQgdGFiIGFuZCBjb3JyZXNwb25kaW5nIGNvbnRlbnRcbiAgICAgICAgICBjb25zdCB0YWJJZCA9IHRhYi5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFiJyk7XG4gICAgICAgICAgaWYgKHRhYklkKSB7XG4gICAgICAgICAgICB0YWIuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZGlhbG9nLnF1ZXJ5U2VsZWN0b3IoYC5wZHdjLXRhYi1jb250ZW50W2RhdGEtdGFiLWNvbnRlbnQ9XCIke3RhYklkfVwiXWApO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIG9wZXJhdG9yIGNoYW5nZXNcbiAgICBjb25zdCBvcGVyYXRvclNlbGVjdHMgPSBkaWFsb2cucXVlcnlTZWxlY3RvckFsbDxIVE1MU2VsZWN0RWxlbWVudD4oJy5wZHdjLWZpbHRlci1vcGVyYXRvcicpO1xuICAgIG9wZXJhdG9yU2VsZWN0cy5mb3JFYWNoKHNlbGVjdCA9PiB7XG4gICAgICBzZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5RWwgPSB0YXJnZXQuY2xvc2VzdDxIVE1MRWxlbWVudD4oJy5wZHdjLWZpbHRlci1wcm9wZXJ0eScpO1xuICAgICAgICBpZiAoIXByb3BlcnR5RWwpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHZhbHVlSW5wdXQgPSBwcm9wZXJ0eUVsLnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oJy5wZHdjLWZpbHRlci12YWx1ZScpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRhcmdldC52YWx1ZSkge1xuICAgICAgICAgIGlmICghdmFsdWVJbnB1dCkge1xuICAgICAgICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgICAgIGlucHV0LmNsYXNzTmFtZSA9ICdwZHdjLWZpbHRlci12YWx1ZSc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSB0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXBhdGgnKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHBhdGgpIGlucHV0LnNldEF0dHJpYnV0ZSgnZGF0YS1wYXRoJywgcGF0aCk7XG4gICAgICAgICAgICBpZiAodHlwZSkgaW5wdXQuc2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnLCB0eXBlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5wdXQucGxhY2Vob2xkZXIgPSAnVmFsdWUuLi4nO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWVJbnB1dCkge1xuICAgICAgICAgIHZhbHVlSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gSGFuZGxlIGFwcGx5IGJ1dHRvblxuICAgIGNvbnN0IGFwcGx5QnV0dG9uID0gZGlhbG9nLnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KCcjcGR3Yy1maWx0ZXItYXBwbHknKTtcbiAgICBpZiAoYXBwbHlCdXR0b24pIHtcbiAgICAgIGFwcGx5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBmaWx0ZXJzOiBOZXN0ZWRQcm9wZXJ0eUZpbHRlcltdID0gW107XG4gICAgICAgIFxuICAgICAgICBjb25zdCBvcGVyYXRvclNlbGVjdHMgPSBkaWFsb2cucXVlcnlTZWxlY3RvckFsbDxIVE1MU2VsZWN0RWxlbWVudD4oJy5wZHdjLWZpbHRlci1vcGVyYXRvcicpO1xuICAgICAgICBvcGVyYXRvclNlbGVjdHMuZm9yRWFjaChzZWxlY3QgPT4ge1xuICAgICAgICAgIGlmIChzZWxlY3QudmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBzZWxlY3QuZ2V0QXR0cmlidXRlKCdkYXRhLXBhdGgnKTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBzZWxlY3QuZ2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5wdXQgPSBzZWxlY3QucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcjxIVE1MSW5wdXRFbGVtZW50PignLnBkd2MtZmlsdGVyLXZhbHVlJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghcGF0aCB8fCAhdHlwZSkgcmV0dXJuO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoc2VsZWN0LnZhbHVlID09PSAnZXhpc3RzJykge1xuICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIHBhdGg6IHBhdGggKyAnPycsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICd0cnVlJyxcbiAgICAgICAgICAgICAgICBtYXRjaFR5cGU6ICdleGlzdHMnLFxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUgYXMgJ2F0dHJpYnV0ZXMnIHwgJ3NldHMnIHwgJ2xpbmtzJ1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWVJbnB1dCkge1xuICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlSW5wdXQudmFsdWUsXG4gICAgICAgICAgICAgICAgbWF0Y2hUeXBlOiBzZWxlY3QudmFsdWUgYXMgTWF0Y2hUeXBlLFxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUgYXMgJ2F0dHJpYnV0ZXMnIHwgJ3NldHMnIHwgJ2xpbmtzJ1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdXJyZW50UXVlcnkubmVzdGVkRmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICAgIHRoaXMucGVyZm9ybVNlYXJjaCgpO1xuICAgICAgICBkaWFsb2cucmVtb3ZlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgY2xlYXIgYnV0dG9uXG4gICAgY29uc3QgY2xlYXJCdXR0b24gPSBkaWFsb2cucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oJyNwZHdjLWZpbHRlci1jbGVhcicpO1xuICAgIGlmIChjbGVhckJ1dHRvbikge1xuICAgICAgY2xlYXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudFF1ZXJ5Lm5lc3RlZEZpbHRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKCk7XG4gICAgICAgIGRpYWxvZy5yZW1vdmUoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBjbG9zZSBidXR0b25cbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IGRpYWxvZy5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PignLnBkd2MtZmlsdGVyLWRpYWxvZy1jbG9zZScpO1xuICAgIGlmIChjbG9zZUJ1dHRvbikge1xuICAgICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGRpYWxvZy5yZW1vdmUoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEFkZCB0byBET01cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpYWxvZyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1TZWFyY2goaXNQYWdpbmF0aW5nOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pc0xvYWRpbmcpIHJldHVybjsgLy8gRG9uJ3Qgc2VhcmNoIGlmIGluaXRpYWwgZGF0YSBpcyBzdGlsbCBsb2FkaW5nXG4gICAgaWYgKCF0aGlzLmRhdGFMb2FkZWQpIHtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0c01lc3NhZ2UoJ01ldGFkYXRhIG5vdCB5ZXQgbG9hZGVkLiBQbGVhc2Ugd2FpdC4nLCBmYWxzZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5jdXJyZW50UXVlcnkudGVybSAmJiAhaXNQYWdpbmF0aW5nICYmICF0aGlzLmN1cnJlbnRRdWVyeS5uZXN0ZWRGaWx0ZXJzPy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0c01lc3NhZ2UoJ1BsZWFzZSBlbnRlciBhIHNlYXJjaCB0ZXJtIG9yIGFwcGx5IGZpbHRlcnMuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyTG9hZGluZyh0cnVlKTtcbiAgICBcbiAgICBpZiAodGhpcy5jdXJyZW50UXVlcnkudGVybSkge1xuICAgICAgdGhpcy5hZGRUb1NlYXJjaEhpc3RvcnkodGhpcy5jdXJyZW50UXVlcnkudGVybSk7XG4gICAgfVxuXG4gICAgLy8gU2ltdWxhdGUgYXN5bmMgb3BlcmF0aW9uIGZvciBjb25zaXN0ZW5jeSwgYWN0dWFsIGZpbHRlcmluZyBpcyBzeW5jXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7IFxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5VGVybUxvd2VyID0gdGhpcy5jdXJyZW50UXVlcnkudGVybT8udG9Mb3dlckNhc2UoKSB8fCAnJztcbiAgICAgIGxldCBjb21iaW5lZFJlc3VsdHM6IFNlYXJjaFJlc3VsdEl0ZW1bXSA9IFtdO1xuXG4gICAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY2hlY2sgaWYgYW4gaXRlbSBtYXRjaGVzIHRoZSBzZWFyY2ggdGVybVxuICAgICAgY29uc3QgbWF0Y2hlc1NlYXJjaFRlcm0gPSAoaXRlbTogeyBuYW1lPzogc3RyaW5nOyBkZXNjcmlwdGlvbj86IHN0cmluZzsgaWQ6IHN0cmluZyB8IG51bWJlciB9LCBzZWFyY2hUZXJtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKCFzZWFyY2hUZXJtKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBpdGVtLm5hbWU/LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSkgfHxcbiAgICAgICAgICAoaXRlbS5kZXNjcmlwdGlvbiAmJiBpdGVtLmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSkpIHx8XG4gICAgICAgICAgaXRlbS5pZC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybSlcbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLnNlYXJjaEZpbHRlclR5cGUgPT09ICdhbGwnIHx8IHRoaXMuc2VhcmNoRmlsdGVyVHlwZSA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZWRBdHRyaWJ1dGVzID0gdGhpcy5hbGxBdHRyaWJ1dGVzLmZpbHRlcihhdHRyID0+IFxuICAgICAgICAgIG1hdGNoZXNTZWFyY2hUZXJtKGF0dHIsIHF1ZXJ5VGVybUxvd2VyKSAmJlxuICAgICAgICAgIHRoaXMubWF0Y2hlc05lc3RlZEZpbHRlcnMoYXR0ciwgdGhpcy5jdXJyZW50UXVlcnkubmVzdGVkRmlsdGVycylcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbWJpbmVkUmVzdWx0cy5wdXNoKC4uLm1hdGNoZWRBdHRyaWJ1dGVzLm1hcCgoYXR0cik6IFNlYXJjaFJlc3VsdEl0ZW0gPT4gKHtcbiAgICAgICAgICBpZDogYXR0ci5pZC50b1N0cmluZygpLFxuICAgICAgICAgIHR5cGU6ICdBdHRyaWJ1dGUnLFxuICAgICAgICAgIGxhYmVsOiBhdHRyLm5hbWUsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGF0dHIuZGVzY3JpcHRpb24gfHwgJycsXG4gICAgICAgICAgICBkYXRhVHlwZTogYXR0ci5kYXRhVHlwZSxcbiAgICAgICAgICAgIG9yaWdpbmFsRGF0YTogYXR0ciBcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNlYXJjaEZpbHRlclR5cGUgPT09ICdhbGwnIHx8IHRoaXMuc2VhcmNoRmlsdGVyVHlwZSA9PT0gJ3NldHMnKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZWRTZXRzID0gdGhpcy5hbGxTZXRzLmZpbHRlcihzZXQgPT4gXG4gICAgICAgICAgbWF0Y2hlc1NlYXJjaFRlcm0oc2V0LCBxdWVyeVRlcm1Mb3dlcikgJiZcbiAgICAgICAgICB0aGlzLm1hdGNoZXNOZXN0ZWRGaWx0ZXJzKHNldCwgdGhpcy5jdXJyZW50UXVlcnkubmVzdGVkRmlsdGVycylcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbWJpbmVkUmVzdWx0cy5wdXNoKC4uLm1hdGNoZWRTZXRzLm1hcCgoc2V0KTogU2VhcmNoUmVzdWx0SXRlbSA9PiAoe1xuICAgICAgICAgIGlkOiBzZXQuaWQudG9TdHJpbmcoKSxcbiAgICAgICAgICB0eXBlOiAnU2V0JyxcbiAgICAgICAgICBsYWJlbDogc2V0Lm5hbWUsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IHNldC5kZXNjcmlwdGlvbiB8fCAnJyxcbiAgICAgICAgICAgIGlzQ29yZTogc2V0LmNvcmUsXG4gICAgICAgICAgICBpc0hpZGRlbjogc2V0LmlzSGlkZGVuLFxuICAgICAgICAgICAgb3JpZ2luYWxEYXRhOiBzZXQgXG4gICAgICAgICAgfVxuICAgICAgICB9KSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zZWFyY2hGaWx0ZXJUeXBlID09PSAnYWxsJyB8fCB0aGlzLnNlYXJjaEZpbHRlclR5cGUgPT09ICdsaW5rcycpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlZExpbmtUeXBlcyA9IHRoaXMuYWxsTGlua1R5cGVzLmZpbHRlcihsaW5rID0+IFxuICAgICAgICAgIChxdWVyeVRlcm1Mb3dlciA/IChsaW5rLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeVRlcm1Mb3dlcikgfHxcbiAgICAgICAgICAgIGxpbmsuaWQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5VGVybUxvd2VyKSkgOiB0cnVlKSAmJlxuICAgICAgICAgIHRoaXMubWF0Y2hlc05lc3RlZEZpbHRlcnMobGluaywgdGhpcy5jdXJyZW50UXVlcnkubmVzdGVkRmlsdGVycylcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbWJpbmVkUmVzdWx0cy5wdXNoKC4uLm1hdGNoZWRMaW5rVHlwZXMubWFwKChsaW5rKTogU2VhcmNoUmVzdWx0SXRlbSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBgU291cmNlOiAke2xpbmsuc291cmNlQ29sbGVjdGlvbklkfSwgVGFyZ2V0OiAke2xpbmsudGFyZ2V0Q29sbGVjdGlvbklkfWA7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBsaW5rLmlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICB0eXBlOiAnTGlua1R5cGUnLFxuICAgICAgICAgICAgbGFiZWw6IGxpbmsubmFtZSxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICBvcmlnaW5hbERhdGE6IGxpbmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFNvcnQgcmVzdWx0cyAoZS5nLiwgYnkgbGFiZWwpXG4gICAgICBjb21iaW5lZFJlc3VsdHMuc29ydCgoYSwgYikgPT4gYS5sYWJlbC5sb2NhbGVDb21wYXJlKGIubGFiZWwpKTtcblxuICAgICAgdGhpcy50b3RhbFJlc3VsdHMgPSBjb21iaW5lZFJlc3VsdHMubGVuZ3RoO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5jdXJyZW50UXVlcnkub2Zmc2V0IHx8IDA7XG4gICAgICBjb25zdCBsaW1pdCA9IHRoaXMuY3VycmVudFF1ZXJ5LmxpbWl0IHx8IFJFU1VMVFNfUEVSX1BBR0U7XG4gICAgICB0aGlzLmN1cnJlbnRSZXN1bHRzID0gY29tYmluZWRSZXN1bHRzLnNsaWNlKG9mZnNldCwgb2Zmc2V0ICsgbGltaXQpO1xuICAgICAgXG4gICAgICB0aGlzLnJlbmRlclJlc3VsdHMoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlBBQkxPJ1MgRFcgQ0hBRDogRXJyb3IgZHVyaW5nIFN1cGVyU2VhcmNoIHBlcmZvcm1TZWFyY2g6XCIsIGVycm9yKTtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0c01lc3NhZ2UoJ0FuIGVycm9yIG9jY3VycmVkIGR1cmluZyBzZWFyY2guJywgZmFsc2UpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckxvYWRpbmcoc2hvdzogYm9vbGVhbik6IHZvaWQge1xuICAgIGxldCBsb2FkaW5nRWxlbWVudCA9IHRoaXMucmVzdWx0c0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcucGR3Yy1sb2FkaW5nLWluZGljYXRvcicpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoc2hvdykge1xuICAgICAgaWYgKCFsb2FkaW5nRWxlbWVudCkge1xuICAgICAgICBsb2FkaW5nRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsb2FkaW5nRWxlbWVudC5jbGFzc05hbWUgPSAncGR3Yy1sb2FkaW5nLWluZGljYXRvcic7XG4gICAgICAgIGxvYWRpbmdFbGVtZW50LmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhcyBmYS1zcGlubmVyIGZhLXNwaW5cIj48L2k+IExvYWRpbmcgcmVzdWx0cy4uLic7XG4gICAgICAgIC8vIFByZXBlbmQgdG8ga2VlcCBleGlzdGluZyByZXN1bHRzIHZpc2libGUgZHVyaW5nIHBhZ2luYXRpb24gbG9hZGluZ1xuICAgICAgICBpZih0aGlzLnJlc3VsdHNDb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmluc2VydEJlZm9yZShsb2FkaW5nRWxlbWVudCwgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmFwcGVuZENoaWxkKGxvYWRpbmdFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbG9hZGluZ0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsb2FkaW5nRWxlbWVudCkge1xuICAgICAgICBsb2FkaW5nRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVzdWx0c01lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBpc0h0bWw6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xuICAgIGlmIChpc0h0bWwpIHtcbiAgICAgICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmlubmVySFRNTCA9IG1lc3NhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmlubmVySFRNTCA9IGA8cCBjbGFzcz1cInBkd2MtY2VudGVyLW1lc3NhZ2VcIj4ke21lc3NhZ2V9PC9wPmA7XG4gICAgfVxufVxuXG4gIHByaXZhdGUgcmVuZGVyUmVzdWx0cygpOiB2b2lkIHtcbiAgICB0aGlzLnJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gJyc7IC8vIENsZWFyIHByZXZpb3VzIHJlc3VsdHMgb3IgbWVzc2FnZXNcblxuICAgIGlmICh0aGlzLmN1cnJlbnRSZXN1bHRzLmxlbmd0aCA9PT0gMCAmJiB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtKSB7XG4gICAgICB0aGlzLnJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwicGR3Yy1jZW50ZXItbWVzc2FnZVwiPk5vIHJlc3VsdHMgZm91bmQuPC9wPic7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmN1cnJlbnRSZXN1bHRzLmxlbmd0aCA9PT0gMCAmJiAhdGhpcy5jdXJyZW50UXVlcnkudGVybSkge1xuICAgICAgLy8gTWVzc2FnZSB3aGVuIHNlYXJjaCBpcyBjbGVhcmVkIG9yIG5vIHRlcm0gZW50ZXJlZCBhbmQgZGF0YSBpcyBsb2FkZWQuXG4gICAgICB0aGlzLnJlc3VsdHNDb250YWluZXIuaW5uZXJIVE1MID0gJzxwIGNsYXNzPVwicGR3Yy1jZW50ZXItbWVzc2FnZVwiPkVudGVyIGEgdGVybSB0byBzZWFyY2ggYXR0cmlidXRlcyBhbmQgc2V0cy48L3A+JztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgdWwuY2xhc3NOYW1lID0gJ3Bkd2MtcmVzdWx0cy1saXN0JztcbiAgICB0aGlzLmN1cnJlbnRSZXN1bHRzLnNsaWNlKDAsIE1BWF9SRVNVTFRTX0RJU1BMQVkpLmZvckVhY2goaXRlbSA9PiB7IC8vIE9ubHkgZGlzcGxheSB1cCB0byBNQVhfUkVTVUxUU19ESVNQTEFZXG4gICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBsaS5jbGFzc05hbWUgPSAncGR3Yy1zZWFyY2gtcmVzdWx0LWl0ZW0nO1xuXG4gICAgICAvLyBDb25zdHJ1Y3QgdGhlIG5ldyBsYWJlbCBmb3JtYXRcbiAgICAgIGxldCBsYWJlbEh0bWwgPSBgPHN0cm9uZz4ke2l0ZW0udHlwZX06PC9zdHJvbmc+ICR7aXRlbS5sYWJlbH0sIDxzdHJvbmc+SUQ6PC9zdHJvbmc+ICR7aXRlbS5pZH1gO1xuXG4gICAgICBsZXQgZGlzcGxheURlc2MgPSBpdGVtLnByb3BlcnRpZXMuZGVzY3JpcHRpb24gfHwgJyc7IC8vIERlZmF1bHQgdG8gcHJlLWNhbGN1bGF0ZWQgZGVzY3JpcHRpb25cbiAgICAgIGlmICghZGlzcGxheURlc2MpIHsgLy8gSWYgcHJlLWNhbGN1bGF0ZWQgaXMgZW1wdHksIHRyeSB0byBnZXQgZnJvbSBvcmlnaW5hbERhdGEgaWYgbm90IGEgTGlua1R5cGVcbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ0F0dHJpYnV0ZScpIHtcbiAgICAgICAgICBkaXNwbGF5RGVzYyA9IChpdGVtLnByb3BlcnRpZXMub3JpZ2luYWxEYXRhIGFzIEF0dHJpYnV0ZSkuZGVzY3JpcHRpb24gfHwgJyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlID09PSAnU2V0Jykge1xuICAgICAgICAgIGRpc3BsYXlEZXNjID0gKGl0ZW0ucHJvcGVydGllcy5vcmlnaW5hbERhdGEgYXMgU2V0KS5kZXNjcmlwdGlvbiB8fCAnJztcbiAgICAgICAgfVxuICAgICAgICAvLyBObyBuZWVkIGZvciBMaW5rVHlwZSBoZXJlLCBhcyBpdHMgaXRlbS5wcm9wZXJ0aWVzLmRlc2NyaXB0aW9uIHdhcyBzcGVjaWZpY2FsbHkgc2V0IGR1cmluZyBtYXBwaW5nLlxuICAgICAgfVxuXG4gICAgICBsaS5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJwZHdjLXJlc3VsdC1sYWJlbFwiPiR7bGFiZWxIdG1sfTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGR3Yy1yZXN1bHQtZGVzY3JpcHRpb25cIj4ke2Rpc3BsYXlEZXNjfTwvZGl2PlxuICAgICAgYDtcbiAgICAgIGxpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5oYW5kbGVSZXN1bHRDbGljayhpdGVtKSk7XG4gICAgICB1bC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmFwcGVuZENoaWxkKHVsKTtcblxuICAgIHRoaXMucmVuZGVyUGFnaW5hdGlvbigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJQYWdpbmF0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLmNlaWwodGhpcy50b3RhbFJlc3VsdHMgLyBSRVNVTFRTX1BFUl9QQUdFKTtcbiAgICBpZiAodG90YWxQYWdlcyA8PSAxKSByZXR1cm47XG5cbiAgICBjb25zdCBwYWdpbmF0aW9uQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcGFnaW5hdGlvbkNvbnRhaW5lci5jbGFzc05hbWUgPSAncGR3Yy1wYWdpbmF0aW9uLWNvbnRyb2xzJztcblxuICAgIC8vIFByZXZpb3VzIEJ1dHRvblxuICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlID4gMSkge1xuICAgICAgICBjb25zdCBwcmV2QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIHByZXZCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmFzIGZhLWFycm93LWxlZnRcIj48L2k+IFByZXZpb3VzJztcbiAgICAgICAgcHJldkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UtLTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFF1ZXJ5Lm9mZnNldCA9ICh0aGlzLmN1cnJlbnRQYWdlIC0gMSkgKiBSRVNVTFRTX1BFUl9QQUdFO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVzdWx0cyA9IFtdOyAvLyBDbGVhciByZXN1bHRzIGZvciB0cnVlIHBhZ2luYXRpb24gKG5vdCBpbmZpbml0ZSBzY3JvbGwpXG4gICAgICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2godHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBwYWdpbmF0aW9uQ29udGFpbmVyLmFwcGVuZENoaWxkKHByZXZCdXR0b24pO1xuICAgIH1cblxuICAgIGNvbnN0IHBhZ2VJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHBhZ2VJbmZvLnRleHRDb250ZW50ID0gYCBQYWdlICR7dGhpcy5jdXJyZW50UGFnZX0gb2YgJHt0b3RhbFBhZ2VzfSBgO1xuICAgIHBhZ2luYXRpb25Db250YWluZXIuYXBwZW5kQ2hpbGQocGFnZUluZm8pO1xuXG4gICAgLy8gTmV4dCBCdXR0b25cbiAgICBpZiAodGhpcy5jdXJyZW50UGFnZSA8IHRvdGFsUGFnZXMpIHtcbiAgICAgICAgY29uc3QgbmV4dEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBuZXh0QnV0dG9uLmlubmVySFRNTCA9ICdOZXh0IDxpIGNsYXNzPVwiZmFzIGZhLWFycm93LXJpZ2h0XCI+PC9pPic7XG4gICAgICAgIG5leHRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlKys7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRRdWVyeS5vZmZzZXQgPSAodGhpcy5jdXJyZW50UGFnZSAtIDEpICogUkVTVUxUU19QRVJfUEFHRTtcbiAgICAgICAgICAgIC8vIElmIHlvdSB3YW50IGluZmluaXRlIHNjcm9sbCBsaWtlIGJlaGF2aW9yLCBkb24ndCBjbGVhciBjdXJyZW50UmVzdWx0c1xuICAgICAgICAgICAgLy8gdGhpcy5jdXJyZW50UmVzdWx0cyA9IFtdOyAvLyBGb3IgcGFnaW5hdGVkLCBjbGVhciBwcmV2aW91cyBwYWdlJ3MgcmVzdWx0c1xuICAgICAgICAgICAgdGhpcy5wZXJmb3JtU2VhcmNoKHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGFnaW5hdGlvbkNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXh0QnV0dG9uKTtcbiAgICB9XG4gICAgdGhpcy5yZXN1bHRzQ29udGFpbmVyLmFwcGVuZENoaWxkKHBhZ2luYXRpb25Db250YWluZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVSZXN1bHRDbGljayhpdGVtOiBTZWFyY2hSZXN1bHRJdGVtKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ1Jlc3VsdCBjbGlja2VkOicsIGl0ZW0pO1xuICAgIHRoaXMuc2hvd0RldGFpbFZpZXcoKTtcblxuICAgIGNvbnN0IG9yaWdpbmFsRGF0YSA9IGl0ZW0ucHJvcGVydGllcy5vcmlnaW5hbERhdGE7XG4gICAgbGV0IGRldGFpbEh0bWwgPSBgPGRpdiBjbGFzcz1cInBkd2MtZGV0YWlsLXZpZXctaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+PGkgY2xhc3M9XCJmYXMgZmEtaW5mby1jaXJjbGVcIj48L2k+ICR7aXRlbS5sYWJlbH0gKCR7aXRlbS50eXBlfSBEZXRhaWxzKTwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwicGR3Yy1kZXRhaWwtdmlldy1jbG9zZS1idG5cIiB0aXRsZT1cIkNsb3NlIERldGFpbHNcIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+YDtcblxuICAgIGNvbnN0IGNvcHlJY29uID0gJzxpIGNsYXNzPVwiZmFzIGZhLWNvcHlcIj48L2k+JztcbiAgICBjb25zdCBlc2NhcGVBdHRyID0gKHZhbDogc3RyaW5nKSA9PiB2YWwucmVwbGFjZSgvJy9nLCAnJmFwb3M7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcblxuICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+TmFtZTo8L3N0cm9uZz4gJHtpdGVtLmxhYmVsfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihpdGVtLmxhYmVsKX0nIHRpdGxlPSdDb3B5IE5hbWUnPiR7Y29weUljb259PC9idXR0b24+PC9wPmA7XG4gICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5JRDo8L3N0cm9uZz4gJHtpdGVtLmlkfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihpdGVtLmlkKX0nIHRpdGxlPSdDb3B5IElEJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgIFxuICAgIGxldCBkZXRhaWxWaWV3RGVzY3JpcHRpb24gPSBpdGVtLnByb3BlcnRpZXMuZGVzY3JpcHRpb24gfHwgJyc7XG4gICAgaWYgKCFkZXRhaWxWaWV3RGVzY3JpcHRpb24pIHtcbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ0F0dHJpYnV0ZScpIHtcbiAgICAgICAgICAgIGRldGFpbFZpZXdEZXNjcmlwdGlvbiA9IChpdGVtLnByb3BlcnRpZXMub3JpZ2luYWxEYXRhIGFzIEF0dHJpYnV0ZSkuZGVzY3JpcHRpb24gfHwgJyc7XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlID09PSAnU2V0Jykge1xuICAgICAgICAgICAgZGV0YWlsVmlld0Rlc2NyaXB0aW9uID0gKGl0ZW0ucHJvcGVydGllcy5vcmlnaW5hbERhdGEgYXMgU2V0KS5kZXNjcmlwdGlvbiB8fCAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZXRhaWxIdG1sICs9IGA8cD48c3Ryb25nPkRlc2NyaXB0aW9uOjwvc3Ryb25nPiAke2RldGFpbFZpZXdEZXNjcmlwdGlvbn0gJHtkZXRhaWxWaWV3RGVzY3JpcHRpb24gPyBgPGJ1dHRvbiBjbGFzcz0ncGR3Yy1jb3B5LWJ0bicgZGF0YS1jb3B5LXZhbHVlPScke2VzY2FwZUF0dHIoZGV0YWlsVmlld0Rlc2NyaXB0aW9uKX0nIHRpdGxlPSdDb3B5IERlc2NyaXB0aW9uJz4ke2NvcHlJY29ufTwvYnV0dG9uPmAgOiAnJ308L3A+YDtcblxuICAgIGxldCBzZXRJZEZvckF0dHJpYnV0ZXM6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpdGVtLnR5cGUgPT09ICdBdHRyaWJ1dGUnKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBvcmlnaW5hbERhdGEgYXMgQXR0cmlidXRlO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5EYXRhIFR5cGU6PC9zdHJvbmc+ICR7YXR0cmlidXRlLmRhdGFUeXBlfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihhdHRyaWJ1dGUuZGF0YVR5cGUpfScgdGl0bGU9J0NvcHkgRGF0YSBUeXBlJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5JbmRleGVkOjwvc3Ryb25nPiAke2F0dHJpYnV0ZS5wcm9wZXJ0aWVzLmluZGV4ID8gJ1llcycgOiAnTm8nfSA8L3A+YDtcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+U2VhcmNoYWJsZTo8L3N0cm9uZz4gJHthdHRyaWJ1dGUucHJvcGVydGllcy5zZWFyY2hlciA/ICdZZXMnIDogJ05vJ30gPC9wPmA7XG4gICAgICAvLyBkZXRhaWxIdG1sICs9IGA8cD48c3Ryb25nPk11bHRpdmFsdWU6PC9zdHJvbmc+ICR7YXR0cmlidXRlLmlzTXVsdGl2YWx1ZX0gPC9wPmA7IC8vIGlzTXVsdGl2YWx1ZSBub3QgZGlyZWN0bHkgYXZhaWxhYmxlXG4gICAgICBpZiAoYXR0cmlidXRlLmNsYXNzSWQpIHsgLy8gQ2hhbmdlZCBmcm9tIGVudGl0eUNsYXNzSWQgdG8gY2xhc3NJZFxuICAgICAgICBzZXRJZEZvckF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGUuY2xhc3NJZC50b1N0cmluZygpO1xuICAgICAgICBkZXRhaWxIdG1sICs9IGA8cD48c3Ryb25nPlBhcnQgb2YgU2V0IElEOjwvc3Ryb25nPiAke2F0dHJpYnV0ZS5jbGFzc0lkfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihhdHRyaWJ1dGUuY2xhc3NJZC50b1N0cmluZygpKX0nIHRpdGxlPSdDb3B5IFNldCBJRCc+JHtjb3B5SWNvbn08L2J1dHRvbj48L3A+YDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSA9PT0gJ1NldCcpIHtcbiAgICAgIGNvbnN0IHNldCA9IG9yaWdpbmFsRGF0YSBhcyBTZXQ7XG4gICAgICBzZXRJZEZvckF0dHJpYnV0ZXMgPSBzZXQuaWQudG9TdHJpbmcoKTsgLy8gRW5zdXJlIHNldElkRm9yQXR0cmlidXRlcyBpcyBzZXQgZm9yIFNldHNcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+Q29yZTo8L3N0cm9uZz4gJHtzZXQuY29yZX08L3A+YDtcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+SGlkZGVuOjwvc3Ryb25nPiAke3NldC5pc0hpZGRlbn08L3A+YDtcbiAgICAgIC8vIEFkZCBiYWNrIGNvbmZpZ3VyYXRpb24gY29weSBVSVxuICAgICAgZGV0YWlsSHRtbCArPSBgPHAgc3R5bGU9XCJtYXJnaW4tdG9wOjE1cHg7XCI+PHN0cm9uZz5Db3B5IENvbmZpZ3VyYXRpb246PC9zdHJvbmc+PC9wPlxuICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgbWFyZ2luLWJvdHRvbTogNXB4O1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJwZHdjLWNvbmZpZy10eXBlLXNlbGVjdFwiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAxMHB4OyBwYWRkaW5nOiA1cHg7IGJvcmRlci1yYWRpdXM6IDRweDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdHJ1Y3R1cmVcIj5TdHJ1Y3R1cmUgQ29uZmlnPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZnVsbFwiPkZ1bGwgQ29uZmlndXJhdGlvbjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNvbHVtbl9uYW1lc19tYXBcIj5Db2x1bW4gTmFtZXMgTWFwPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cInBkd2MtY29weS1zZWxlY3RlZC1jb25maWctYnRuXCIgY2xhc3M9XCJwZHdjLXByaW1hcnktYnRuIHBkd2MtY29weS1idG4tZHluYW1pY1wiIHRpdGxlPVwiQ29weSBzZWxlY3RlZCBjb25maWd1cmF0aW9uXCIgc3R5bGU9XCJwYWRkaW5nOiA1cHggMTBweDtcIj4ke2NvcHlJY29ufSBDb3B5IFNlbGVjdGVkPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgICBpZiAoc2V0LmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICBjb25zdCBjb25maWdKc29uRm9yRGlzcGxheSA9IEpTT04uc3RyaW5naWZ5KHNldC5jb25maWd1cmF0aW9uLCBudWxsLCAyKTtcbiAgICAgICAgICBkZXRhaWxIdG1sICs9IGA8ZGl2IHN0eWxlPVwibWFyZ2luLXRvcDoxMHB4O1wiPjxzdHJvbmc+RnVsbCBTZXQgQ29uZmlndXJhdGlvbiAoZm9yIHJlZmVyZW5jZSk6PC9zdHJvbmc+PHByZSBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICNmMGYwZjA7IHBhZGRpbmc6MTBweDsgYm9yZGVyLXJhZGl1czo0cHg7IG1heC1oZWlnaHQ6IDIwMHB4OyBvdmVyZmxvdy15OmF1dG87XCI+JHtlc2NhcGVBdHRyKGNvbmZpZ0pzb25Gb3JEaXNwbGF5KX08L3ByZT48L2Rpdj5gO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChpdGVtLnR5cGUgPT09ICdMaW5rVHlwZScpIHsgLy8gQWRkZWQgZGV0YWlsIHZpZXcgZm9yIExpbmtUeXBlXG4gICAgICBjb25zdCBsaW5rID0gb3JpZ2luYWxEYXRhIGFzIERhdGFXYWxrTGlua1R5cGU7XG4gICAgICBkZXRhaWxIdG1sICs9IGA8cD48c3Ryb25nPlNvdXJjZSBDb2xsZWN0aW9uIElEOjwvc3Ryb25nPiAke2xpbmsuc291cmNlQ29sbGVjdGlvbklkfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihsaW5rLnNvdXJjZUNvbGxlY3Rpb25JZC50b1N0cmluZygpKX0nIHRpdGxlPSdDb3B5IFNvdXJjZSBJRCc+JHtjb3B5SWNvbn08L2J1dHRvbj48L3A+YDtcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+VGFyZ2V0IENvbGxlY3Rpb24gSUQ6PC9zdHJvbmc+ICR7bGluay50YXJnZXRDb2xsZWN0aW9uSWR9IDxidXR0b24gY2xhc3M9J3Bkd2MtY29weS1idG4nIGRhdGEtY29weS12YWx1ZT0nJHtlc2NhcGVBdHRyKGxpbmsudGFyZ2V0Q29sbGVjdGlvbklkLnRvU3RyaW5nKCkpfScgdGl0bGU9J0NvcHkgVGFyZ2V0IElEJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5EaXJlY3RlZDo8L3N0cm9uZz4gJHtsaW5rLmRpcmVjdGVkfTwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5Db3JlOjwvc3Ryb25nPiAke2xpbmsuY29yZX08L3A+YDtcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+RHluYW1pYyBMaW5rcyBPbmx5Ojwvc3Ryb25nPiAke2xpbmsuZHluYW1pY0xpbmtzT25seX08L3A+YDtcbiAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+QWxsIE1hbnVhbCBMaW5rczo8L3N0cm9uZz4gJHtsaW5rLmFsbE1hbnVhbExpbmtzfTwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5DcmVhdGlvbiBEYXRlOjwvc3Ryb25nPiAke25ldyBEYXRlKGxpbmsuY3JlYXRpb25EYXRlKS50b0xvY2FsZVN0cmluZygpfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihuZXcgRGF0ZShsaW5rLmNyZWF0aW9uRGF0ZSkudG9Mb2NhbGVTdHJpbmcoKSl9JyB0aXRsZT0nQ29weSBDcmVhdGlvbiBEYXRlJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5Vc2VyIElEOjwvc3Ryb25nPiAke2xpbmsudXNlcklkfTwvcD5gO1xuICAgICAgaWYgKGxpbmsuY29ubmVjdGluZ0VudGl0eUNsYXNzSWQpIHtcbiAgICAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+Q29ubmVjdGluZyBFbnRpdHkgQ2xhc3MgSUQ6PC9zdHJvbmc+ICR7bGluay5jb25uZWN0aW5nRW50aXR5Q2xhc3NJZH0gPGJ1dHRvbiBjbGFzcz0ncGR3Yy1jb3B5LWJ0bicgZGF0YS1jb3B5LXZhbHVlPScke2VzY2FwZUF0dHIobGluay5jb25uZWN0aW5nRW50aXR5Q2xhc3NJZC50b1N0cmluZygpKX0nIHRpdGxlPSdDb3B5IENvbm5lY3RpbmcgRW50aXR5IENsYXNzIElEJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgfVxuICAgICAgZGV0YWlsSHRtbCArPSBgPGg0PkNvbmZpZ3VyYXRpb246PC9oND5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5Db25maWcgVHlwZTo8L3N0cm9uZz4gJHtsaW5rLmNvbmZpZy50eXBlfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihsaW5rLmNvbmZpZy50eXBlKX0nIHRpdGxlPSdDb3B5IENvbmZpZyBUeXBlJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgZGV0YWlsSHRtbCArPSBgPHA+PHN0cm9uZz5MaW5rIFN0b3JhZ2UgTW9kZTo8L3N0cm9uZz4gJHtsaW5rLmNvbmZpZy5saW5rU3RvcmFnZS5tb2RlfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihsaW5rLmNvbmZpZy5saW5rU3RvcmFnZS5tb2RlKX0nIHRpdGxlPSdDb3B5IFN0b3JhZ2UgTW9kZSc+JHtjb3B5SWNvbn08L2J1dHRvbj48L3A+YDtcbiAgICAgIGlmIChsaW5rLmNvbmZpZy5saW5rU3RvcmFnZS5jb25maWd1cmF0aW9uLmNvbm5lY3RpbmdFbnRpdHlDbGFzc0lkKSB7XG4gICAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+U3RvcmFnZSBDb25uZWN0aW5nIEVudGl0eSBDbGFzcyBJRDo8L3N0cm9uZz4gJHtsaW5rLmNvbmZpZy5saW5rU3RvcmFnZS5jb25maWd1cmF0aW9uLmNvbm5lY3RpbmdFbnRpdHlDbGFzc0lkfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihsaW5rLmNvbmZpZy5saW5rU3RvcmFnZS5jb25maWd1cmF0aW9uLmNvbm5lY3RpbmdFbnRpdHlDbGFzc0lkLnRvU3RyaW5nKCkpfScgdGl0bGU9J0NvcHkgU3RvcmFnZSBDb25uZWN0aW5nIElEJz4ke2NvcHlJY29ufTwvYnV0dG9uPjwvcD5gO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmsuY29uZmlnLmNvbmRpdGlvbnMgJiYgbGluay5jb25maWcuY29uZGl0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGRldGFpbEh0bWwgKz0gYDxwPjxzdHJvbmc+Q29uZGl0aW9uczo8L3N0cm9uZz4gJHtsaW5rLmNvbmZpZy5jb25kaXRpb25zLmxlbmd0aH0gY29uZGl0aW9uKHMpIHByZXNlbnQuPC9wPmA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGl0ZW0udHlwZSA9PT0gJ0F0dHJpYnV0ZScgfHwgaXRlbS50eXBlID09PSAnU2V0Jykge1xuICAgICAgZGV0YWlsSHRtbCArPSBgPGRpdiBpZD1cInJlbGF0ZWRBdHRyaWJ1dGVzU2VjdGlvblwiPjxoND5SZWxhdGVkIEF0dHJpYnV0ZXM6PC9oND48dWwgaWQ9XCJyZWxhdGVkQXR0cmlidXRlc0xpc3RcIj48bGk+PGk+TG9hZGluZyBhdHRyaWJ1dGVzLi4uPC9pPjwvbGk+PC91bD48L2Rpdj5gO1xuICAgIH1cblxuICAgIHRoaXMuZGV0YWlsVmlld0NvbnRhaW5lci5pbm5lckhUTUwgPSBkZXRhaWxIdG1sO1xuICAgIHRoaXMuYXR0YWNoRGV0YWlsVmlld0NvcHlMaXN0ZW5lcnMoKTsgLy8gQXR0YWNoZXMgbGlzdGVuZXJzIGZvciBleGlzdGluZyAucGR3Yy1jb3B5LWJ0blxuXG4gICAgLy8gQWRkIGJhY2sgZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBuZXcgZHluYW1pYyBjb25maWcgY29weSBidXR0b25cbiAgICBjb25zdCBjb3B5U2VsZWN0ZWRDb25maWdCdG4gPSB0aGlzLmRldGFpbFZpZXdDb250YWluZXIucXVlcnlTZWxlY3RvcignI3Bkd2MtY29weS1zZWxlY3RlZC1jb25maWctYnRuJyk7XG4gICAgaWYgKGNvcHlTZWxlY3RlZENvbmZpZ0J0biAmJiBpdGVtLnR5cGUgPT09ICdTZXQnKSB7IC8vIENoZWNrIGl0ZW0udHlwZSB0byBlbnN1cmUgY3VycmVudEl0ZW1EYXRhIGlzIGEgU2V0XG4gICAgICBjb3B5U2VsZWN0ZWRDb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdEVsZW1lbnQgPSB0aGlzLmRldGFpbFZpZXdDb250YWluZXIucXVlcnlTZWxlY3RvcignI3Bkd2MtY29uZmlnLXR5cGUtc2VsZWN0JykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1R5cGUgPSBzZWxlY3RFbGVtZW50LnZhbHVlO1xuICAgICAgICBsZXQgdGV4dFRvQ29weSA9ICcnO1xuICAgICAgICBjb25zdCBjdXJyZW50U2V0ID0gaXRlbS5wcm9wZXJ0aWVzLm9yaWdpbmFsRGF0YSBhcyBTZXQ7XG5cbiAgICAgICAgaWYgKGNvbmZpZ1R5cGUgPT09ICdzdHJ1Y3R1cmUnKSB7XG4gICAgICAgICAgY29uc3Qgc2V0TmFtZSA9IGN1cnJlbnRTZXQubmFtZTtcbiAgICAgICAgICBjb25zdCBzZXRJZCA9IGN1cnJlbnRTZXQuaWQ7XG4gICAgICAgICAgY29uc3QgcmVsYXRlZEF0dHJpYnV0ZUlkcyA9IHRoaXMuYWxsQXR0cmlidXRlc1xuICAgICAgICAgICAgLmZpbHRlcihhdHRyID0+IGF0dHIuY2xhc3NJZC50b1N0cmluZygpID09PSBzZXRJZC50b1N0cmluZygpKVxuICAgICAgICAgICAgLm1hcChhdHRyID0+IGF0dHIuaWQpO1xuXG4gICAgICAgICAgY29uc3Qgc3RydWN0dXJlQ29uZmlnID0ge1xuICAgICAgICAgICAgW3NldE5hbWVdOiB7IFxuICAgICAgICAgICAgICBzZXRJZDogc2V0SWQsXG4gICAgICAgICAgICAgIGltcG9ydDoge1xuICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBcIlVQU0VSVFwiLFxuICAgICAgICAgICAgICAgIGlkZW50aWZpY2F0aW9uOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIkNPTFVNTl9WQUxVRVNcIixcbiAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uSWRzOiByZWxhdGVkQXR0cmlidXRlSWRzXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICB0ZXh0VG9Db3B5ID0gSlNPTi5zdHJpbmdpZnkoc3RydWN0dXJlQ29uZmlnLCBudWxsLCAyKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWdUeXBlID09PSAnZnVsbCcpIHtcbiAgICAgICAgICBpZiAoY3VycmVudFNldC5jb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICB0ZXh0VG9Db3B5ID0gSlNPTi5zdHJpbmdpZnkoY3VycmVudFNldC5jb25maWd1cmF0aW9uLCBudWxsLCAyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY29uZmlnVHlwZSA9PT0gJ2NvbHVtbl9uYW1lc19tYXAnKSB7XG4gICAgICAgICAgY29uc3Qgc2V0TmFtZSA9IGN1cnJlbnRTZXQubmFtZTtcbiAgICAgICAgICBjb25zdCBzZXRJZCA9IGN1cnJlbnRTZXQuaWQ7XG4gICAgICAgICAgY29uc3QgcmVsYXRlZEF0dHJpYnV0ZXMgPSB0aGlzLmFsbEF0dHJpYnV0ZXMuZmlsdGVyKGF0dHIgPT4gYXR0ci5jbGFzc0lkLnRvU3RyaW5nKCkgPT09IHNldElkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHJlbmFtZUNvbHVtbk1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuICAgICAgICAgIHJlbGF0ZWRBdHRyaWJ1dGVzLmZvckVhY2goYXR0ciA9PiB7XG4gICAgICAgICAgICBjb25zdCBzcWxGcmllbmRseU5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZSgvLHw7fFxccy9nLCAnXycpOyAvLyBFc2NhcGVkIFxccyBmb3IgcmVnZXggd2l0aGluIHN0cmluZ1xuICAgICAgICAgICAgcmVuYW1lQ29sdW1uTWFwW2F0dHIubmFtZV0gPSBzcWxGcmllbmRseU5hbWU7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zdCBjb2x1bW5OYW1lc01hcENvbmZpZyA9IHtcbiAgICAgICAgICAgIFtzZXROYW1lXToge1xuICAgICAgICAgICAgICBcInJlbmFtZV9jb2x1bW5cIjogcmVuYW1lQ29sdW1uTWFwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgICB0ZXh0VG9Db3B5ID0gSlNPTi5zdHJpbmdpZnkoY29sdW1uTmFtZXNNYXBDb25maWcsIG51bGwsIDIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGV4dFRvQ29weSkge1xuICAgICAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHRUb0NvcHkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxCdXR0b25UZXh0ID0gY29weVNlbGVjdGVkQ29uZmlnQnRuLmlubmVySFRNTDtcbiAgICAgICAgICAgIChjb3B5U2VsZWN0ZWRDb25maWdCdG4gYXMgSFRNTEVsZW1lbnQpLmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhcyBmYS1jaGVja1wiPjwvaT4gQ29waWVkISc7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgKGNvcHlTZWxlY3RlZENvbmZpZ0J0biBhcyBIVE1MRWxlbWVudCkuaW5uZXJIVE1MID0gb3JpZ2luYWxCdXR0b25UZXh0O1xuICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BBQkxPXFwnUyBEVyBDSEFEOiBGYWlsZWQgdG8gY29weSB0ZXh0OiAnLCBlcnIpOyAvLyBFc2NhcGVkIGFwb3N0cm9waGVcbiAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gY29weSBjb25maWd1cmF0aW9uLicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFsZXJ0KCdObyBjb25maWd1cmF0aW9uIGRhdGEgYXZhaWxhYmxlIHRvIGNvcHkgZm9yIHRoZSBzZWxlY3RlZCB0eXBlLicpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXN0b3JlIHRoZSBkZXRhaWwgdmlldyBjbG9zZSBidXR0b24gbGlzdGVuZXJcbiAgICB0aGlzLmRldGFpbFZpZXdDb250YWluZXIucXVlcnlTZWxlY3RvcignLnBkd2MtZGV0YWlsLXZpZXctY2xvc2UtYnRuJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5oaWRlRGV0YWlsVmlldygpKTtcblxuICAgIC8vIEZldGNoIGFuZCBkaXNwbGF5IHJlbGF0ZWQgYXR0cmlidXRlc1xuICAgIGlmIChzZXRJZEZvckF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHJlbGF0ZWRBdHRyaWJ1dGVzID0gdGhpcy5hbGxBdHRyaWJ1dGVzLmZpbHRlcihhdHRyID0+IGF0dHIuY2xhc3NJZC50b1N0cmluZygpID09PSBzZXRJZEZvckF0dHJpYnV0ZXMpOyAvLyBDaGFuZ2VkIGZyb20gZW50aXR5Q2xhc3NJZCB0byBjbGFzc0lkXG4gICAgICBjb25zdCByZWxhdGVkQXR0cmlidXRlc0xpc3RFbCA9IHRoaXMuZGV0YWlsVmlld0NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcmVsYXRlZEF0dHJpYnV0ZXNMaXN0JykgYXMgSFRNTFVMaXN0RWxlbWVudDtcbiAgICAgIFxuICAgICAgaWYgKHJlbGF0ZWRBdHRyaWJ1dGVzTGlzdEVsKSB7XG4gICAgICAgIGlmIChyZWxhdGVkQXR0cmlidXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmVsYXRlZEF0dHJpYnV0ZXNMaXN0RWwuaW5uZXJIVE1MID0gcmVsYXRlZEF0dHJpYnV0ZXMubWFwKGF0dHIgPT4gXG4gICAgICAgICAgICBgPGxpPiR7YXR0ci5uYW1lfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihhdHRyLm5hbWUpfScgdGl0bGU9J0NvcHkgTmFtZSc+JHtjb3B5SWNvbn08L2J1dHRvbj4gXG4gICAgICAgICAgICAgPHN0cm9uZz5JRDo8L3N0cm9uZz4gJHthdHRyLmlkfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihhdHRyLmlkLnRvU3RyaW5nKCkpfScgdGl0bGU9J0NvcHkgSUQnPiR7Y29weUljb259PC9idXR0b24+IFxuICAgICAgICAgICAgIDxzdHJvbmc+VHlwZTo8L3N0cm9uZz4gJHthdHRyLmRhdGFUeXBlfSA8YnV0dG9uIGNsYXNzPSdwZHdjLWNvcHktYnRuJyBkYXRhLWNvcHktdmFsdWU9JyR7ZXNjYXBlQXR0cihhdHRyLmRhdGFUeXBlKX0nIHRpdGxlPSdDb3B5IFR5cGUnPiR7Y29weUljb259PC9idXR0b24+PC9saT5gXG4gICAgICAgICAgKS5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWxhdGVkQXR0cmlidXRlc0xpc3RFbC5pbm5lckhUTUwgPSAnPGxpPk5vIGF0dHJpYnV0ZXMgZm91bmQgZm9yIHRoaXMgc2V0LjwvbGk+JztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dGFjaERldGFpbFZpZXdDb3B5TGlzdGVuZXJzKCk7IC8vIEVuc3VyZSBuZXcgYnV0dG9ucyBpbiB0aGUgbGlzdCBnZXQgbGlzdGVuZXJzXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlbGF0ZWRBdHRyaWJ1dGVzTGlzdEVsID0gdGhpcy5kZXRhaWxWaWV3Q29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNyZWxhdGVkQXR0cmlidXRlc0xpc3QnKSBhcyBIVE1MVUxpc3RFbGVtZW50O1xuICAgICAgaWYgKHJlbGF0ZWRBdHRyaWJ1dGVzTGlzdEVsKSB7XG4gICAgICAgIHJlbGF0ZWRBdHRyaWJ1dGVzTGlzdEVsLmlubmVySFRNTCA9ICc8bGk+Q291bGQgbm90IGRldGVybWluZSBzZXQgdG8gbG9hZCBhdHRyaWJ1dGVzIGZyb20uPC9saT4nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2hvd0RldGFpbFZpZXcoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGV0YWlsVmlld0NvbnRhaW5lcikge1xuICAgICAgdGhpcy5kZXRhaWxWaWV3Q29udGFpbmVyLmlubmVySFRNTCA9ICcnOyAvLyBDbGVhciBwcmV2aW91cyBjb250ZW50XG4gICAgICB0aGlzLmRldGFpbFZpZXdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7IFxuICAgICAgLy8gT3B0aW9uYWw6IGhpZGUgbWFpbiBzZWFyY2ggcmVzdWx0cyB3aGVuIGRldGFpbCBtb2RhbCBpcyBvcGVuXG4gICAgICAvLyB0aGlzLnJlc3VsdHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoaWRlRGV0YWlsVmlldygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kZXRhaWxWaWV3Q29udGFpbmVyKSB7XG4gICAgICB0aGlzLmRldGFpbFZpZXdDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuZGV0YWlsVmlld0NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgIC8vIE9wdGlvbmFsOiBzaG93IG1haW4gc2VhcmNoIHJlc3VsdHMgYWdhaW5cbiAgICAgIC8vIHRoaXMucmVzdWx0c0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhdHRhY2hEZXRhaWxWaWV3Q29weUxpc3RlbmVycygpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogQXR0YWNoaW5nIGRldGFpbCB2aWV3IGNvcHkgbGlzdGVuZXJzLi4uXCIpO1xuICAgIGlmICghdGhpcy5kZXRhaWxWaWV3Q29udGFpbmVyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiUEFCTE8nUyBEVyBDSEFEOiBkZXRhaWxWaWV3Q29udGFpbmVyIGlzIG51bGwgaW4gYXR0YWNoRGV0YWlsVmlld0NvcHlMaXN0ZW5lcnNcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvcHlCdXR0b25zID0gdGhpcy5kZXRhaWxWaWV3Q29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wZHdjLWNvcHktYnRuJyk7XG4gICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRm91bmQgJHtjb3B5QnV0dG9ucy5sZW5ndGh9IC5wZHdjLWNvcHktYnRuIGVsZW1lbnRzLmApO1xuXG4gICAgY29weUJ1dHRvbnMuZm9yRWFjaCgoYnV0dG9uLCBpbmRleCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogQXR0YWNoaW5nIHRvIGJ1dHRvbiAke2luZGV4fWAsIGJ1dHRvbik7IC8vIENhbiBiZSB2ZXJib3NlXG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXRCdXR0b24gPSBlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHZhbHVlVG9Db3B5ID0gdGFyZ2V0QnV0dG9uLmRhdGFzZXQuY29weVZhbHVlO1xuICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBDbGlja2VkIGNvcHkgYnV0dG9uLiBBdHRlbXB0aW5nIHRvIGNvcHk6ICcke3ZhbHVlVG9Db3B5fSdgLCB0YXJnZXRCdXR0b24pO1xuXG4gICAgICAgIGlmICh2YWx1ZVRvQ29weSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlVG9Db3B5ICE9PSBudWxsKSB7IC8vIENoZWNrIGV4cGxpY2l0bHkgZm9yIHVuZGVmaW5lZC9udWxsXG4gICAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodmFsdWVUb0NvcHkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IFRleHQgY29waWVkIHN1Y2Nlc3NmdWxseSB0byBjbGlwYm9hcmQ6IFwiLCB2YWx1ZVRvQ29weSk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbEJ1dHRvblRleHQgPSB0YXJnZXRCdXR0b24uaW5uZXJIVE1MO1xuICAgICAgICAgICAgdGFyZ2V0QnV0dG9uLmlubmVySFRNTCA9ICdDb3BpZWQhJzsgLy8gUHJvdmlkZSBmZWVkYmFja1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRhcmdldEJ1dHRvbi5pbm5lckhUTUwgPSBvcmlnaW5hbEJ1dHRvblRleHQ7XG4gICAgICAgICAgICB9LCAxNTAwKTsgLy8gUmV2ZXJ0IGFmdGVyIDEuNSBzZWNvbmRzXG4gICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJQQUJMTydTIERXIENIQUQ6IEZhaWxlZCB0byBjb3B5IHRleHQ6IFwiLCBlcnIpO1xuICAgICAgICAgICAgYWxlcnQoJ1BBQkxPXFwnUyBEVyBDSEFEOiBGYWlsZWQgdG8gY29weSB0ZXh0LiBTZWUgY29uc29sZSBmb3IgZGV0YWlscy4nKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJQQUJMTydTIERXIENIQUQ6IE5vIHZhbHVlIHRvIGNvcHkgKGRhdGEtY29weS12YWx1ZSBpcyBtaXNzaW5nLCBudWxsLCBvciB1bmRlZmluZWQpLlwiKTtcbiAgICAgICAgICBhbGVydCgnUEFCTE9cXCdTIERXIENIQUQ6IE5vIHZhbHVlIGZvdW5kIHRvIGNvcHkuJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDYWNoZVN0YXR1c0Rpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdHVzRWxlbWVudCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuY2FjaGUtc3RhdHVzLWRpc3BsYXknKTtcbiAgICBpZiAoc3RhdHVzRWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy5pc0RhdGFGcm9tQ2FjaGUgJiYgdGhpcy5jYWNoZVRpbWVzdGFtcCkge1xuICAgICAgICAgICAgc3RhdHVzRWxlbWVudC5pbm5lckhUTUwgPSBgVXNpbmcgY2FjaGVkIGRhdGEgZnJvbTogJHtuZXcgRGF0ZSh0aGlzLmNhY2hlVGltZXN0YW1wKS50b0xvY2FsZVN0cmluZygpfWA7XG4gICAgICAgICAgICBzdGF0dXNFbGVtZW50LmlubmVySFRNTCArPSBgIDxidXR0b24gaWQ9XCJzdXBlci1zZWFyY2gtcmVmcmVzaC1jYWNoZVwiIGNsYXNzPVwicmVmcmVzaC1jYWNoZS1idXR0b25cIiB0aXRsZT1cIlJlZnJlc2ggZGF0YSBmcm9tIHNlcnZlclwiPlJlZnJlc2g8L2J1dHRvbj5gO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2FjaGVUaW1lc3RhbXApIHtcbiAgICAgICAgICAgIHN0YXR1c0VsZW1lbnQuaW5uZXJIVE1MID0gYERhdGEgcmVmcmVzaGVkIGZyb20gc2VydmVyOiAke25ldyBEYXRlKHRoaXMuY2FjaGVUaW1lc3RhbXApLnRvTG9jYWxlU3RyaW5nKCl9YDtcbiAgICAgICAgICAgICBzdGF0dXNFbGVtZW50LmlubmVySFRNTCArPSBgIDxidXR0b24gaWQ9XCJzdXBlci1zZWFyY2gtcmVmcmVzaC1jYWNoZVwiIGNsYXNzPVwicmVmcmVzaC1jYWNoZS1idXR0b25cIiB0aXRsZT1cIlJlZnJlc2ggZGF0YSBmcm9tIHNlcnZlclwiPlJlZnJlc2g8L2J1dHRvbj5gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHVzRWxlbWVudC50ZXh0Q29udGVudCA9ICdObyBkYXRhIGNhY2hlIGF2YWlsYWJsZSBmb3IgdGhpcyBzZXJ2ZXIuJztcbiAgICAgICAgICAgICBzdGF0dXNFbGVtZW50LmlubmVySFRNTCArPSBgIDxidXR0b24gaWQ9XCJzdXBlci1zZWFyY2gtcmVmcmVzaC1jYWNoZVwiIGNsYXNzPVwicmVmcmVzaC1jYWNoZS1idXR0b25cIiB0aXRsZT1cIkZldGNoIGRhdGEgZnJvbSBzZXJ2ZXJcIj5GZXRjaCBEYXRhPC9idXR0b24+YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWZyZXNoQnV0dG9uID0gc3RhdHVzRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjc3VwZXItc2VhcmNoLXJlZnJlc2gtY2FjaGUnKTtcbiAgICAgICAgaWYgKHJlZnJlc2hCdXR0b24pIHtcbiAgICAgICAgICAgIHJlZnJlc2hCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhhbmRsZVJlZnJlc2hEYXRhKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBDYWNoZSBzdGF0dXM6ICR7dGhpcy5pc0RhdGFGcm9tQ2FjaGUgPyAnVXNpbmcgY2FjaGUnIDogJ1VzaW5nIGZyZXNoIGRhdGEnfSwgVGltZXN0YW1wOiAke3RoaXMuY2FjaGVUaW1lc3RhbXAgPyBuZXcgRGF0ZSh0aGlzLmNhY2hlVGltZXN0YW1wKS50b0xvY2FsZVN0cmluZygpIDogJ04vQSd9YCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZVJlZnJlc2hEYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMucmVuZGVyTG9hZGluZyh0cnVlKTsgXG4gICAgdGhpcy5pc0RhdGFGcm9tQ2FjaGUgPSBmYWxzZTsgLy8gTWFyayBhcyBmZXRjaGluZyBmcmVzaCBkYXRhXG5cbiAgICBpZiAoIXRoaXMuYmFzZVVybCkge1xuICAgICAgICB0aGlzLnJlbmRlclJlc3VsdHNNZXNzYWdlKCdEYXRhV2FsayBiYXNlIFVSTCBub3QgY29uZmlndXJlZC4nLCBmYWxzZSk7IFxuICAgICAgICB0aGlzLnJlbmRlckxvYWRpbmcoZmFsc2UpOyBcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IFthdHRyaWJ1dGVzLCBzZXRzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIGZldGNoQXR0cmlidXRlcyh0aGlzLmJhc2VVcmwpLCAvLyBSZXZlcnRlZDogZHdBcGlUb2tlbiByZW1vdmVkXG4gICAgICAgICAgICBmZXRjaFNldHModGhpcy5iYXNlVXJsKSAgICAgIC8vIFJldmVydGVkOiBkd0FwaVRva2VuIHJlbW92ZWRcbiAgICAgICAgXSk7XG5cbiAgICAgICAgdGhpcy5hbGxBdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICAgICAgdGhpcy5hbGxTZXRzID0gc2V0cztcbiAgICAgICAgdGhpcy5hbGxMaW5rVHlwZXMgPSBbXTsgLy8gUmVzZXQgYmVmb3JlIGZldGNoaW5nXG5cbiAgICAgICAgLy8gRmV0Y2ggTGlua1R5cGVzIGluIGJhdGNoZXNcbiAgICAgICAgaWYgKHRoaXMuYWxsU2V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRm91bmQgJHt0aGlzLmFsbFNldHMubGVuZ3RofSBzZXRzLiBGZXRjaGluZyBsaW5rIHR5cGVzIGluIGJhdGNoZXMuYCk7XG4gICAgICAgICAgY29uc3Qgc2V0SWRzID0gdGhpcy5hbGxTZXRzLm1hcChzZXQgPT4gc2V0LmlkKTsgLy8gQXNzdW1pbmcgJ2lkJyBpcyB0aGUgcHJvcGVydHkgZm9yIHNldCBJRFxuICAgICAgICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDUwO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2V0SWRzLmxlbmd0aDsgaSArPSBiYXRjaFNpemUpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhdGNoT2ZTZXRJZHMgPSBzZXRJZHMuc2xpY2UoaSwgaSArIGJhdGNoU2l6ZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBGZXRjaGluZyBsaW5rIHR5cGVzIGZvciBiYXRjaCAke01hdGguZmxvb3IoaSAvIGJhdGNoU2l6ZSkgKyAxfS8ke01hdGguY2VpbChzZXRJZHMubGVuZ3RoIC8gYmF0Y2hTaXplKX0gKFNldCBJRHM6ICR7YmF0Y2hPZlNldElkcy5qb2luKCcsICcpfSlgKTtcbiAgICAgICAgICAgICAgY29uc3QgZmV0Y2hlZExpbmtUeXBlcyA9IGF3YWl0IGZldGNoTGlua1R5cGVzQnlDbGFzc0lkcyh0aGlzLmJhc2VVcmwsIGJhdGNoT2ZTZXRJZHMpO1xuICAgICAgICAgICAgICB0aGlzLmFsbExpbmtUeXBlcy5wdXNoKC4uLmZldGNoZWRMaW5rVHlwZXMpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBGZXRjaGVkICR7ZmV0Y2hlZExpbmtUeXBlcy5sZW5ndGh9IGxpbmsgdHlwZXMgaW4gdGhpcyBiYXRjaC4gVG90YWwgbGluayB0eXBlczogJHt0aGlzLmFsbExpbmtUeXBlcy5sZW5ndGh9YCk7XG4gICAgICAgICAgICB9IGNhdGNoIChsaW5rRmV0Y2hFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEVycm9yIGZldGNoaW5nIGJhdGNoIG9mIGxpbmsgdHlwZXMgZm9yIHNldCBJRHMgJHtiYXRjaE9mU2V0SWRzLmpvaW4oJywgJyl9OmAsIGxpbmtGZXRjaEVycm9yKTtcbiAgICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgZGVjaWRlIGlmIG9uZSBiYXRjaCBmYWlsdXJlIHNob3VsZCBzdG9wIGFsbCBvciBqdXN0IHNraXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogRmluaXNoZWQgZmV0Y2hpbmcgYWxsIGxpbmsgdHlwZXMuIFRvdGFsOiAke3RoaXMuYWxsTGlua1R5cGVzLmxlbmd0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHNhdmVEYXRhVG9DYWNoZSh0aGlzLmJhc2VVcmwsIHRoaXMuYWxsQXR0cmlidXRlcywgdGhpcy5hbGxTZXRzLCB0aGlzLmFsbExpbmtUeXBlcyk7IC8vIFBhc3MgbGlua1R5cGVzIHRvIGNhY2hlXG4gICAgICAgIHRoaXMuY2FjaGVUaW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLmlzRGF0YUZyb21DYWNoZSA9IGZhbHNlOyAvLyBEYXRhIGlzIG5vdyBmcmVzaCBmcm9tIHNlcnZlciwgbm90ICdmcm9tIGNhY2hlJyBpbiB0aGUgc2Vuc2Ugb2Ygb2xkIGNhY2hlXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBEYXRhIHJlZnJlc2hlZCBmcm9tIHNlcnZlciBhbmQgc2F2ZWQgdG8gY2FjaGUuXCIpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNhY2hlU3RhdHVzRGlzcGxheSgpO1xuICAgICAgICB0aGlzLnBlcmZvcm1TZWFyY2godHJ1ZSk7IFxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVmcmVzaGluZyBTdXBlclNlYXJjaCBkYXRhOicsIGVycm9yKTtcbiAgICAgICAgdGhpcy5yZW5kZXJSZXN1bHRzTWVzc2FnZShgRmFpbGVkIHRvIHJlZnJlc2ggZGF0YTogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YCwgZmFsc2UpOyBcbiAgICAgICAgLy8gUG90ZW50aWFsbHkgcmV2ZXJ0IGlzRGF0YUZyb21DYWNoZSBvciBoYW5kbGUgc3RhdGUgYXBwcm9wcmlhdGVseVxuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMucmVuZGVyTG9hZGluZyhmYWxzZSk7IFxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBvcGVuKCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnOyAvLyBVc2UgZmxleCBpZiBtb2RhbCBpcyBmbGV4IGNvbnRhaW5lclxuICAgIHRoaXMuc2VhcmNoSW5wdXQuZm9jdXMoKTtcbiAgICAvLyBJZiB0aGVyZSdzIGEgcHJldmlvdXMgcXVlcnkgdGVybSwgeW91IG1pZ2h0IHdhbnQgdG8ga2VlcCBpdCBvciBjbGVhciBpdFxuICAgIC8vIHRoaXMuc2VhcmNoSW5wdXQudmFsdWUgPSB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtO1xuICAgIC8vIGlmICh0aGlzLmN1cnJlbnRSZXN1bHRzLmxlbmd0aCA9PT0gMCAmJiB0aGlzLmN1cnJlbnRRdWVyeS50ZXJtKSB7XG4gICAgLy8gICAgdGhpcy5wZXJmb3JtU2VhcmNoKCk7IC8vIE9wdGlvbmFsbHkgYXV0by1zZWFyY2ggaWYgdGVybSBleGlzdHMgYW5kIG5vIHJlc3VsdHMgc2hvd25cbiAgICAvLyB9XG4gICAgY29uc29sZS5sb2coJ1N1cGVyU2VhcmNoIG1vZGFsIG9wZW5lZC4nKTtcbiAgfVxuXG4gIHB1YmxpYyBjbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICBjb25zb2xlLmxvZygnU3VwZXJTZWFyY2ggbW9kYWwgY2xvc2VkLicpO1xuICB9XG5cbiAgcHVibGljIGdldEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gIH1cbn1cbiIsIi8vIHNyYy91aS9TcWxDb25maWdDb252ZXJ0ZXJUb29sLnRzXG5kZWNsYXJlIHZhciBQcmlzbTogYW55OyAvLyBUZWxscyBUeXBlU2NyaXB0IHRoYXQgUHJpc20gZXhpc3RzIGdsb2JhbGx5XG5pbXBvcnQgeyBvcGVuR2l0SHViSXNzdWUgfSBmcm9tICcuLi91dGlscy9mZWVkYmFja1V0aWxzJztcblxuZXhwb3J0IGNsYXNzIFNxbENvbmZpZ0NvbnZlcnRlclRvb2wge1xuICBwcml2YXRlIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGNsb3NlQnV0dG9uOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogU3FsQ29uZmlnQ29udmVydGVyVG9vbCB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgdGl0bGVFbDogSFRNTEhlYWRpbmdFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29ubmVjdG9yTmFtZUlucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtaW5pZnlKc29uQ2hlY2tib3hFbDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlbW92ZUNvbW1lbnRzQ2hlY2tib3hFbDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJhd1NxbElucHV0RWw6IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByYXdJbnB1dExhYmVsRWw6IEhUTUxMYWJlbEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzd2l0Y2hEaXJlY3Rpb25CdXR0b25FbDogSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvdXRwdXRDb2RlRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb3V0cHV0TGFiZWxFbDogSFRNTExhYmVsRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvcHlPdXRwdXRCdXR0b25FbDogSFRNTEJ1dHRvbkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb252ZXJ0QnV0dG9uRWw6IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdmFsaWRhdGlvbkZlZWRiYWNrRWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBpc1JldmVyc2VNb2RlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ3NxbC1jb25maWctY29udmVydGVyLXRvb2wgcGR3Yy1tb2RhbCc7IC8vIFVzZSBvdXIgbWFpbiB0b29sIGNsYXNzICsgYmFzZSBtb2RhbFxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyAvLyBIaWRkZW4gYnkgZGVmYXVsdFxuICAgIHRoaXMuc2V0dXBVSSgpO1xuICAgIHRoaXMubG9hZFJlcXVpcmVkQXNzZXRzKCk7IC8vIFJFTkFNRUQgYW5kIHdpbGwgbG9hZCBhbGwgYXNzZXRzXG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IFNxbENvbmZpZ0NvbnZlcnRlclRvb2wge1xuICAgIGlmICghU3FsQ29uZmlnQ29udmVydGVyVG9vbC5pbnN0YW5jZSkge1xuICAgICAgU3FsQ29uZmlnQ29udmVydGVyVG9vbC5pbnN0YW5jZSA9IG5ldyBTcWxDb25maWdDb252ZXJ0ZXJUb29sKCk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKFNxbENvbmZpZ0NvbnZlcnRlclRvb2wuaW5zdGFuY2UuZWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBTcWxDb25maWdDb252ZXJ0ZXJUb29sLmluc3RhbmNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkUmVxdWlyZWRBc3NldHMoKTogUHJvbWlzZTx2b2lkPiB7IC8vIE5FVyBOQU1FXG4gICAgLy8gQ2hlY2sgaWYgbWFpbiB0b29sIENTUyBpcyBsb2FkZWRcbiAgICBpZiAoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZHdjLXNjYy10b29sLWNzcycpKSB7XG4gICAgICBjb25zdCB0b29sQ3NzTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICAgIHRvb2xDc3NMaW5rLmlkID0gJ3Bkd2Mtc2NjLXRvb2wtY3NzJztcbiAgICAgIHRvb2xDc3NMaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICAgIHRvb2xDc3NMaW5rLmhyZWYgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ2Fzc2V0cy9jc3Mvc3FsLWNvbmZpZy1jb252ZXJ0ZXIuY3NzJyk7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRvb2xDc3NMaW5rKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldHVwVUkoKTogdm9pZCB7XG4gICAgLy8gVXNlIHNjYy0gc3BlY2lmaWMgY2xhc3NlcyBmb3IgaGVhZGVyLCB0aXRsZSwgY2xvc2UgYnV0dG9uLCBhbmQgYm9keSBjb250ZW50LlxuICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2NjLWhlYWRlclwiPlxuICAgICAgICA8aDIgY2xhc3M9XCJzY2MtdGl0bGVcIj5TUUwgdG8gQ29uZmlndXJhdGlvbiBDb252ZXJ0ZXI8L2gyPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwic2NjLWZlZWRiYWNrLWJ1dHRvblwiIHRpdGxlPVwiUmVwb3J0IGFuIGlzc3VlXCI+8J+QnjwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwic2NjLWNsb3NlLWJ1dHRvblwiPiZ0aW1lczs8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNjYy1ib2R5XCI+XG4gICAgICAgICR7dGhpcy5nZXRUb29sSHRtbFN0cnVjdHVyZSgpfVxuICAgICAgPC9kaXY+XG4gICAgYDtcblxuICAgIHRoaXMuY2xvc2VCdXR0b24gPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnNjYy1jbG9zZS1idXR0b24nKTtcbiAgICB0aGlzLmNsb3NlQnV0dG9uPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICAvLyBBZGQgZmVlZGJhY2sgYnV0dG9uIHdpdGggZW5oYW5jZWQgY2xpY2sgaGFuZGxlclxuICAgIGNvbnN0IGZlZWRiYWNrQnV0dG9uID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zY2MtZmVlZGJhY2stYnV0dG9uJyk7XG4gICAgaWYgKGZlZWRiYWNrQnV0dG9uKSB7XG4gICAgICBmZWVkYmFja0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvcGVuR2l0SHViSXNzdWUoJ1NRTCBDb25maWcgQ29udmVydGVyJyk7XG4gICAgICAgICAgLy8gQWRkIHZpc3VhbCBmZWVkYmFja1xuICAgICAgICAgIGZlZWRiYWNrQnV0dG9uLnRleHRDb250ZW50ID0gJ+Kckyc7XG4gICAgICAgICAgZmVlZGJhY2tCdXR0b24uc2V0QXR0cmlidXRlKCd0aXRsZScsICdUaGFua3MgZm9yIHlvdXIgZmVlZGJhY2shJyk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmVlZGJhY2tCdXR0b24pIHtcbiAgICAgICAgICAgICAgZmVlZGJhY2tCdXR0b24udGV4dENvbnRlbnQgPSAn8J+Qnic7XG4gICAgICAgICAgICAgIGZlZWRiYWNrQnV0dG9uLnNldEF0dHJpYnV0ZSgndGl0bGUnLCAnUmVwb3J0IGFuIGlzc3VlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igb3BlbmluZyBmZWVkYmFjazonLCBlcnJvcik7XG4gICAgICAgICAgZmVlZGJhY2tCdXR0b24udGV4dENvbnRlbnQgPSAnISc7XG4gICAgICAgICAgZmVlZGJhY2tCdXR0b24uc2V0QXR0cmlidXRlKCd0aXRsZScsICdGYWlsZWQgdG8gb3BlbiBmZWVkYmFjaycpO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZlZWRiYWNrQnV0dG9uKSB7XG4gICAgICAgICAgICAgIGZlZWRiYWNrQnV0dG9uLnRleHRDb250ZW50ID0gJ/CfkJ4nO1xuICAgICAgICAgICAgICBmZWVkYmFja0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgJ1JlcG9ydCBhbiBpc3N1ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgcmVmZXJlbmNlcyB0byB0b29sLXNwZWNpZmljIGVsZW1lbnRzXG4gICAgdGhpcy50aXRsZUVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zY2MtdGl0bGUnKTtcbiAgICB0aGlzLmNvbm5lY3Rvck5hbWVJbnB1dEVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2MtY29ubmVjdG9yLW5hbWUnKTtcbiAgICB0aGlzLm1pbmlmeUpzb25DaGVja2JveEVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2MtbWluaWZ5LWpzb24nKTtcbiAgICB0aGlzLnJlbW92ZUNvbW1lbnRzQ2hlY2tib3hFbCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjc2NjLXJlbW92ZS1jb21tZW50cycpO1xuICAgIHRoaXMucmF3U3FsSW5wdXRFbCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjc2NjLXJhdy1pbnB1dCcpO1xuICAgIHRoaXMucmF3SW5wdXRMYWJlbEVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2MtcmF3LWlucHV0LWxhYmVsJyk7XG4gICAgdGhpcy5zd2l0Y2hEaXJlY3Rpb25CdXR0b25FbCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjc2NjLXN3aXRjaC1kaXJlY3Rpb24nKTtcbiAgICB0aGlzLm91dHB1dENvZGVFbCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjc2NjLW91dHB1dC1jb2RlJyk7XG4gICAgdGhpcy5vdXRwdXRMYWJlbEVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2Mtb3V0cHV0LWxhYmVsJyk7XG4gICAgdGhpcy5jb3B5T3V0cHV0QnV0dG9uRWwgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignI3NjYy1jb3B5LW91dHB1dCcpO1xuICAgIHRoaXMuY29udmVydEJ1dHRvbkVsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2MtY29udmVydC1idXR0b24nKTtcbiAgICB0aGlzLnZhbGlkYXRpb25GZWVkYmFja0VsID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzY2MtdmFsaWRhdGlvbi1mZWVkYmFjaycpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycygpO1xuICAgIHRoaXMudXBkYXRlTGFiZWxzQW5kUGxhY2Vob2xkZXJzKHRoaXMuaXNSZXZlcnNlTW9kZSA/ICdqc29uVG9TcWwnIDogJ3NxbFRvSnNvbicpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUb29sSHRtbFN0cnVjdHVyZSgpOiBzdHJpbmcge1xuICAgIC8vIFJlbW92ZWQgb3V0ZXIgPGRpdiBjbGFzcz1cImNvbnRhaW5lciBzcWwtY29udmVydGVyLWNvbnRhaW5lclwiPlxuICAgIHJldHVybiBgXG4gICAgICA8ZGl2IGNsYXNzPVwic2NjLW1haW4tbGF5b3V0XCI+XG4gICAgICAgIDwhLS0gTGVmdCBDb2x1bW4gLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY2MtbGVmdC1jb2x1bW5cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic2NjLWZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJzY2MtY29ubmVjdG9yLW5hbWVcIj5Db25uZWN0b3IgTmFtZTo8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgaWQ9XCJzY2MtY29ubmVjdG9yLW5hbWVcIiBjbGFzcz1cInNjYy1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiZS5nLiwgcHJvamVjdF9tb3JnYW5zdGFubGV5bGxfc2FuZGJveF9vZ1wiPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY2MtZm9ybS1ncm91cCBzY2MtY2hlY2tib3gtZ3JvdXBcIj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cInNjYy1taW5pZnktanNvblwiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInNjYy1taW5pZnktanNvblwiIGlkPVwic2NjLW1pbmlmeS1qc29uLWxhYmVsXCI+TWluaWZ5IEpTT04gb3V0cHV0PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwic2NjLWZvcm0tZ3JvdXAgc2NjLWNoZWNrYm94LWdyb3VwXCIgaWQ9XCJzY2MtcmVtb3ZlLWNvbW1lbnRzLWdyb3VwXCI+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJzY2MtcmVtb3ZlLWNvbW1lbnRzXCI+XG4gICAgICAgICAgICA8bGFiZWwgZm9yPVwic2NjLXJlbW92ZS1jb21tZW50c1wiIGlkPVwic2NjLXJlbW92ZS1jb21tZW50cy1sYWJlbFwiPlJlbW92ZSBTUUwgY29tbWVudHM8L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY2MtZm9ybS1ncm91cCBzY2MtaW5wdXQtYXJlYVwiPlxuICAgICAgICAgICAgPGxhYmVsIGZvcj1cInNjYy1yYXctaW5wdXRcIiBpZD1cInNjYy1yYXctaW5wdXQtbGFiZWxcIj5SYXcgU1FMIElucHV0OjwvbGFiZWw+XG4gICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJzY2MtcmF3LWlucHV0XCIgY2xhc3M9XCJzY2MtdGV4dGFyZWFcIiByb3dzPVwiMTJcIiBwbGFjZWhvbGRlcj1cIlBhc3RlIHlvdXIgU1FMIHF1ZXJpZXMgaGVyZS4uLlwiPjwvdGV4dGFyZWE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gTWlkZGxlIENvbHVtbiAoU3dpdGNoIEJ1dHRvbikgLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY2MtbWlkZGxlLWNvbHVtblwiPlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJzY2Mtc3dpdGNoLWRpcmVjdGlvblwiIGNsYXNzPVwic2NjLWJ1dHRvbiBzY2Mtc3dpdGNoLWJ1dHRvblwiIHRpdGxlPVwiU3dpdGNoIGNvbnZlcnNpb24gZGlyZWN0aW9uXCI+XG4gICAgICAgICAgICAmcmxhcnI7IDwhLS0gVW5pY29kZSBmb3IgcmlnaHQtbGVmdCBhcnJvd3MgLS0+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwhLS0gUmlnaHQgQ29sdW1uIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2NjLXJpZ2h0LWNvbHVtblwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY2MtZm9ybS1ncm91cCBzY2Mtb3V0cHV0LWFyZWFcIj5cbiAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJzY2Mtb3V0cHV0LWNvZGVcIiBpZD1cInNjYy1vdXRwdXQtbGFiZWxcIj5HZW5lcmF0ZWQgQ29uZmlndXJhdGlvbiAoSlNPTik6PC9sYWJlbD5cbiAgICAgICAgICAgIDxwcmUgY2xhc3M9XCJzY2Mtb3V0cHV0LXByZVwiPjxjb2RlIGlkPVwic2NjLW91dHB1dC1jb2RlXCIgY2xhc3M9XCJzY2Mtb3V0cHV0IGxhbmd1YWdlLWpzb25cIj48L2NvZGU+PC9wcmU+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY2Mtb3V0cHV0LWFjdGlvbnNcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cInNjYy1jb3B5LW91dHB1dFwiIGNsYXNzPVwic2NjLWJ1dHRvblwiPkNvcHkgT3V0cHV0PC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJzY2MtZ2xvYmFsLWFjdGlvbnNcIj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNjYy1jb252ZXJ0LWJ1dHRvblwiIGNsYXNzPVwic2NjLWJ1dHRvblwiPkNvbnZlcnQgdG8gQ29uZmlnPC9idXR0b24+IDwhLS0gUmVtb3ZlZCBzY2MtYnV0dG9uLXByaW1hcnkgY2xhc3MgLS0+XG4gICAgICAgIDxkaXYgaWQ9XCJzY2MtdmFsaWRhdGlvbi1mZWVkYmFja1wiIGNsYXNzPVwic2NjLXZhbGlkYXRpb25cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG4gIH1cblxuICBwcml2YXRlIGF0dGFjaEV2ZW50TGlzdGVuZXJzKCk6IHZvaWQge1xuICAgIHRoaXMuY29udmVydEJ1dHRvbkVsPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZXZlcnNlTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5jb252ZXJ0SnNvblRvU3FsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnRTcWwoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5jb3B5T3V0cHV0QnV0dG9uRWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb3B5T3V0cHV0KCkpO1xuICAgIHRoaXMuc3dpdGNoRGlyZWN0aW9uQnV0dG9uRWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy50b2dnbGVEaXJlY3Rpb24oKSk7XG5cbiAgICB0aGlzLnJhd1NxbElucHV0RWw/LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKCkgPT4gdGhpcy5jbGVhclZhbGlkYXRpb25GZWVkYmFjaygpKTtcbiAgICB0aGlzLmNvbm5lY3Rvck5hbWVJbnB1dEVsPy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsICgpID0+IHRoaXMuY2xlYXJWYWxpZGF0aW9uRmVlZGJhY2soKSk7XG5cbiAgICAvLyBTYXZlIHByZWZlcmVuY2VzIHdoZW4gY2hlY2tib3hlcyBjaGFuZ2VcbiAgICB0aGlzLm1pbmlmeUpzb25DaGVja2JveEVsPy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm1pbmlmeUpzb25DaGVja2JveEVsKSB7XG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBzY2NfbWluaWZ5SnNvblByZWZlcmVuY2U6IHRoaXMubWluaWZ5SnNvbkNoZWNrYm94RWwuY2hlY2tlZCB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMucmVtb3ZlQ29tbWVudHNDaGVja2JveEVsPy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZUNvbW1lbnRzQ2hlY2tib3hFbCkge1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgc2NjX3JlbW92ZVNxbENvbW1lbnRzUHJlZmVyZW5jZTogdGhpcy5yZW1vdmVDb21tZW50c0NoZWNrYm94RWwuY2hlY2tlZCB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVEaXJlY3Rpb24oKTogdm9pZCB7XG4gICAgdGhpcy5pc1JldmVyc2VNb2RlID0gIXRoaXMuaXNSZXZlcnNlTW9kZTtcbiAgICB0aGlzLmNsZWFyVmFsaWRhdGlvbkZlZWRiYWNrKCk7XG4gICAgaWYodGhpcy5yYXdTcWxJbnB1dEVsKSB0aGlzLnJhd1NxbElucHV0RWwudmFsdWUgPSAnJztcbiAgICBpZih0aGlzLm91dHB1dENvZGVFbCkgdGhpcy5vdXRwdXRDb2RlRWwudGV4dENvbnRlbnQgPSAnJztcblxuICAgIC8vIENhbGwgdXBkYXRlTGFiZWxzQW5kUGxhY2Vob2xkZXJzIHRvIHJlZnJlc2ggYWxsIHRleHQgYmFzZWQgb24gdGhlIG5ldyBkaXJlY3Rpb25cbiAgICB0aGlzLnVwZGF0ZUxhYmVsc0FuZFBsYWNlaG9sZGVycyh0aGlzLmlzUmV2ZXJzZU1vZGUgPyAnanNvblRvU3FsJyA6ICdzcWxUb0pzb24nKTtcblxuICAgIHRoaXMuaGlnaGxpZ2h0T3V0cHV0KCk7IC8vIFRoaXMgc3RpbGwganVzdCBzZXRzIHRleHRDb250ZW50IGFzIFByaXNtIGlzIHJlbW92ZWRcbiAgfVxuXG4gIHByaXZhdGUgaGlnaGxpZ2h0T3V0cHV0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm91dHB1dENvZGVFbCAmJiB0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudCkge1xuICAgICAgICB0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudCA9IHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2hvd1ZhbGlkYXRpb25GZWVkYmFjayhtZXNzYWdlOiBzdHJpbmcsIGlzRXJyb3I6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudmFsaWRhdGlvbkZlZWRiYWNrRWwpIHtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uRmVlZGJhY2tFbC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvbkZlZWRiYWNrRWwuY2xhc3NOYW1lID0gaXNFcnJvciA/ICdzY2MtdmFsaWRhdGlvbiBzY2MtdmFsaWRhdGlvbi1lcnJvcicgOiAnc2NjLXZhbGlkYXRpb24gc2NjLXZhbGlkYXRpb24tc3VjY2Vzcyc7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclZhbGlkYXRpb25GZWVkYmFjaygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy52YWxpZGF0aW9uRmVlZGJhY2tFbCkge1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25GZWVkYmFja0VsLnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvbkZlZWRiYWNrRWwuY2xhc3NOYW1lID0gJ3NjYy12YWxpZGF0aW9uJztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRTcWwoKTogdm9pZCB7XG4gICAgY29uc3Qgc3FsVGV4dCA9IHRoaXMucmF3U3FsSW5wdXRFbD8udmFsdWU7XG4gICAgY29uc3QgY29ubmVjdG9yTmFtZSA9IHRoaXMuY29ubmVjdG9yTmFtZUlucHV0RWw/LnZhbHVlIHx8ICd1bmtub3duX2Nvbm5lY3Rvcic7XG4gICAgY29uc3QgbWluaWZ5ID0gdGhpcy5taW5pZnlKc29uQ2hlY2tib3hFbD8uY2hlY2tlZCB8fCBmYWxzZTtcbiAgICBjb25zdCBzaG91bGRSZW1vdmVDb21tZW50cyA9IHRoaXMucmVtb3ZlQ29tbWVudHNDaGVja2JveEVsPy5jaGVja2VkIHx8IGZhbHNlO1xuXG4gICAgaWYgKCFzcWxUZXh0KSB7XG4gICAgICB0aGlzLnNob3dWYWxpZGF0aW9uRmVlZGJhY2soJ1NRTCBpbnB1dCBjYW5ub3QgYmUgZW1wdHkuJyk7XG4gICAgICBpZiAodGhpcy5vdXRwdXRDb2RlRWwpIHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50ID0gJyc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghY29ubmVjdG9yTmFtZSkge1xuICAgICAgICB0aGlzLnNob3dWYWxpZGF0aW9uRmVlZGJhY2soJ0Nvbm5lY3RvciBOYW1lIGNhbm5vdCBiZSBlbXB0eS4nKTtcbiAgICAgICAgaWYgKHRoaXMub3V0cHV0Q29kZUVsKSB0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBwcm9jZXNzZWRTcWwgPSBzcWxUZXh0O1xuICAgICAgaWYgKHNob3VsZFJlbW92ZUNvbW1lbnRzKSB7XG4gICAgICAgIHByb2Nlc3NlZFNxbCA9IHRoaXMuc3RyaXBTcWxDb21tZW50cyhwcm9jZXNzZWRTcWwpO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RhdGVtZW50cyA9IHRoaXMucGFyc2VBbmRDbGVhblNxbChwcm9jZXNzZWRTcWwpO1xuICAgICAgaWYgKHN0YXRlbWVudHMubGVuZ3RoID09PSAwICYmIHNxbFRleHQudHJpbSgpICE9PSAnJykge1xuICAgICAgICAvLyBJZiBjb21tZW50cyB3ZXJlIHJlbW92ZWQsIGFuZCBzdGlsbCBubyBzdGF0ZW1lbnRzLCB0aGUgb3JpZ2luYWwgbWlnaHQgaGF2ZSBiZWVuIG9ubHkgY29tbWVudHNcbiAgICAgICAgY29uc3QgZmVlZGJhY2tNc2cgPSBzaG91bGRSZW1vdmVDb21tZW50cyBcbiAgICAgICAgICAgID8gJ05vIHZhbGlkIFNRTCBzdGF0ZW1lbnRzIGZvdW5kIGFmdGVyIHJlbW92aW5nIGNvbW1lbnRzLicgXG4gICAgICAgICAgICA6ICdObyB2YWxpZCBTUUwgc3RhdGVtZW50cyBmb3VuZC4nO1xuICAgICAgICB0aGlzLnNob3dWYWxpZGF0aW9uRmVlZGJhY2soZmVlZGJhY2tNc2cpO1xuICAgICAgICBpZiAodGhpcy5vdXRwdXRDb2RlRWwpIHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZWQgcmVkdW5kYW50IGNvbmRpdGlvbjogc3RhdGVtZW50cy5sZW5ndGggPT09IDAgJiYgc3FsVGV4dC50cmltKCkgPT09ICcnXG4gICAgICAvLyBUaGlzIGNhc2UgaXMgY292ZXJlZCBieSB0aGUgIXNxbFRleHQgY2hlY2sgb3IgdGhlIHN1YnNlcXVlbnQgbG9naWMgaWYgc3FsVGV4dCBoYXMgY29udGVudC5cblxuICAgICAgY29uc3QgY29uZmlnID0ge1xuICAgICAgICBub2RlX3R5cGU6ICdTYW5kYm94U1FMUXVlcnknLFxuICAgICAgICBjb25uZWN0b3I6IGNvbm5lY3Rvck5hbWUsXG4gICAgICAgIHNxbF9zY3JpcHQ6IHN0YXRlbWVudHMsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBvdXRwdXRKc29uID0gbWluaWZ5XG4gICAgICAgID8gSlNPTi5zdHJpbmdpZnkoY29uZmlnKVxuICAgICAgICA6IEpTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMik7XG5cbiAgICAgIGlmICh0aGlzLm91dHB1dENvZGVFbCkge1xuICAgICAgICB0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudCA9IG91dHB1dEpzb247XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0T3V0cHV0KCk7XG4gICAgICAgIHRoaXMuc2hvd1ZhbGlkYXRpb25GZWVkYmFjaygnQ29udmVyc2lvbiBzdWNjZXNzZnVsIScsIGZhbHNlKTtcblxuICAgICAgICAvLyBTYXZlIHRoZSBzdWNjZXNzZnVsbHkgdXNlZCBjb25uZWN0b3IgbmFtZVxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBzY2NfbGFzdENvbm5lY3Rvck5hbWU6IGNvbm5lY3Rvck5hbWUgfSwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IExhc3QgY29ubmVjdG9yIG5hbWUgc2F2ZWQ6XCIsIGNvbm5lY3Rvck5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLnNob3dWYWxpZGF0aW9uRmVlZGJhY2soYEVycm9yIGR1cmluZyBTUUwgY29udmVyc2lvbjogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY29udmVydEpzb25Ub1NxbCgpOiB2b2lkIHtcbiAgICBjb25zdCBqc29uVGV4dCA9IHRoaXMucmF3U3FsSW5wdXRFbD8udmFsdWU7XG4gICAgaWYgKCFqc29uVGV4dCkge1xuICAgICAgdGhpcy5zaG93VmFsaWRhdGlvbkZlZWRiYWNrKCdKU09OIGlucHV0IGNhbm5vdCBiZSBlbXB0eS4nKTtcbiAgICAgIGlmICh0aGlzLm91dHB1dENvZGVFbCkgdGhpcy5vdXRwdXRDb2RlRWwudGV4dENvbnRlbnQgPSAnJztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm91dHB1dENvZGVFbCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZEpzb24gPSBKU09OLnBhcnNlKGpzb25UZXh0KTtcbiAgICAgIGxldCBleHRyYWN0ZWRTcWxzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICBpZiAocGFyc2VkSnNvbiAmJiBcbiAgICAgICAgICBwYXJzZWRKc29uLm5vZGVfdHlwZSA9PT0gXCJTYW5kYm94U1FMUXVlcnlcIiAmJiBcbiAgICAgICAgICB0eXBlb2YgcGFyc2VkSnNvbi5jb25uZWN0b3IgPT09ICdzdHJpbmcnICYmIFxuICAgICAgICAgIEFycmF5LmlzQXJyYXkocGFyc2VkSnNvbi5zcWxfc2NyaXB0KSkge1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdG9yTmFtZUlucHV0RWwpIHtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdG9yTmFtZUlucHV0RWwudmFsdWUgPSBwYXJzZWRKc29uLmNvbm5lY3RvcjtcbiAgICAgICAgfVxuICAgICAgICBleHRyYWN0ZWRTcWxzID0gcGFyc2VkSnNvbi5zcWxfc2NyaXB0LmZpbHRlcigoaXRlbTogYW55KSA9PiB0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zaG93VmFsaWRhdGlvbkZlZWRiYWNrKCdJbnZhbGlkIEpTT04uIEV4cGVjdGVkOiB7IG5vZGVfdHlwZTogXCJTYW5kYm94U1FMUXVlcnlcIiwgY29ubmVjdG9yOiBcIi4uLlwiLCBzcWxfc2NyaXB0OiBbXCIuLi5cIl0gfScpO1xuICAgICAgICB0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICByZXR1cm47IFxuICAgICAgfVxuICAgICAgXG4gICAgICB0aGlzLm91dHB1dENvZGVFbC5jbGFzc05hbWUgPSAnc2NjLW91dHB1dCBsYW5ndWFnZS1zcWwnOyAvLyBTZXQgYmVmb3JlIGhpZ2hsaWdodFxuICAgICAgaWYgKGV4dHJhY3RlZFNxbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50ID0gZXh0cmFjdGVkU3Fscy5qb2luKCdcXG5cXG4nKTsgXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50ID0gXCIvLyBObyBTUUwgc3RhdGVtZW50cyBmb3VuZCBpbiAnc3FsX3NjcmlwdCcgYXJyYXkgb3IgYXJyYXkgaXMgZW1wdHkuXCI7XG4gICAgICB9XG4gICAgICB0aGlzLmhpZ2hsaWdodE91dHB1dCgpO1xuICAgICAgdGhpcy5jbGVhclZhbGlkYXRpb25GZWVkYmFjaygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMuc2hvd1ZhbGlkYXRpb25GZWVkYmFjaygnSW52YWxpZCBKU09OIGlucHV0IGZvciBTUUwgY29udmVyc2lvbjogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgdGhpcy5vdXRwdXRDb2RlRWwudGV4dENvbnRlbnQgPSAnJztcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIG1ldGhvZCBub3cgT05MWSBwYXJzZXMgc3RhdGVtZW50cyBmcm9tIFNRTCB0aGF0IG1heSBvciBtYXkgbm90IGhhdmUgY29tbWVudHMuXG4gIC8vIENvbW1lbnQgcmVtb3ZhbCBpcyBoYW5kbGVkIGJ5IHN0cmlwU3FsQ29tbWVudHMoKSBpZiB0aGUgdXNlciBvcHRzIGluLlxuICBwcml2YXRlIHBhcnNlQW5kQ2xlYW5TcWwoc3FsOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgLy8gMS4gTm9ybWFsaXplIG5ld2xpbmVzIHRvIFxcbiBhbmQgdHJpbSB3aGl0ZXNwYWNlIGZyb20gdGhlIHdob2xlIGJsb2NrXG4gICAgbGV0IG5vcm1hbGl6ZWRTcWwgPSBzcWwucmVwbGFjZSgvXFxyXFxuPy9nLCAnXFxuJykudHJpbSgpO1xuXG4gICAgY29uc3Qgc3RhdGVtZW50czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcmVtYWluaW5nU3FsID0gbm9ybWFsaXplZFNxbDtcblxuICAgIHdoaWxlIChyZW1haW5pbmdTcWwubGVuZ3RoID4gMCkge1xuICAgICAgICByZW1haW5pbmdTcWwgPSByZW1haW5pbmdTcWwudHJpbVN0YXJ0KCk7XG4gICAgICAgIGlmIChyZW1haW5pbmdTcWwubGVuZ3RoID09PSAwKSBicmVhaztcblxuICAgICAgICBjb25zdCBkb0Jsb2NrTWF0Y2ggPSByZW1haW5pbmdTcWwubWF0Y2goL15ET1xccypcXCRcXCQoW1xcc1xcU10qPylcXCRcXCQ7Py9pKTtcbiAgICAgICAgaWYgKGRvQmxvY2tNYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgZG9CbG9jayA9IGRvQmxvY2tNYXRjaFswXTtcbiAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaChkb0Jsb2NrLnRyaW0oKSk7XG4gICAgICAgICAgICByZW1haW5pbmdTcWwgPSByZW1haW5pbmdTcWwuc3Vic3RyaW5nKGRvQmxvY2subGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRTZW1pY29sb24gPSByZW1haW5pbmdTcWwuaW5kZXhPZignOycpO1xuICAgICAgICAgICAgaWYgKG5leHRTZW1pY29sb24gPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdCA9IHJlbWFpbmluZ1NxbC50cmltKCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2gocmVzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSByZW1haW5pbmdTcWwuc3Vic3RyaW5nKDAsIG5leHRTZW1pY29sb24gKyAxKTtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50LnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgcmVtYWluaW5nU3FsID0gcmVtYWluaW5nU3FsLnN1YnN0cmluZyhuZXh0U2VtaWNvbG9uICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlbWVudHMuZmlsdGVyKHN0bXQgPT4gc3RtdC5sZW5ndGggPiAwKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaXBTcWxDb21tZW50cyhzcWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gMS4gUmVtb3ZlIG11bHRpLWxpbmUgY29tbWVudHMgLyogLi4uICovIChub24tZ3JlZWR5KVxuICAgIGxldCBub0NvbW1lbnRzU3FsID0gc3FsLnJlcGxhY2UoL1xcL1xcKltcXHNcXFNdKj9cXCpcXC8vZ3MsICcnKTtcbiAgICBcbiAgICAvLyAyLiBSZW1vdmUgc2luZ2xlLWxpbmUgY29tbWVudHMgLS0gLi4uXG4gICAgbm9Db21tZW50c1NxbCA9IG5vQ29tbWVudHNTcWwuc3BsaXQoJ1xcbicpLm1hcChsaW5lID0+IGxpbmUucmVwbGFjZSgvLS0uKiQvLCAnJykpLmpvaW4oJ1xcbicpO1xuXG4gICAgcmV0dXJuIG5vQ29tbWVudHNTcWwudHJpbSgpOyAvLyBUcmltIG92ZXJhbGwgYWZ0ZXIgcmVtb3ZpbmcgY29tbWVudHNcbiAgfVxuXG4gIHByaXZhdGUgY29weU91dHB1dCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMub3V0cHV0Q29kZUVsIHx8ICF0aGlzLmNvcHlPdXRwdXRCdXR0b25FbCkgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMub3V0cHV0Q29kZUVsLnRleHRDb250ZW50KSB7XG4gICAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0aGlzLm91dHB1dENvZGVFbC50ZXh0Q29udGVudClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2hvd1ZhbGlkYXRpb25GZWVkYmFjaygnQ29waWVkIHRvIGNsaXBib2FyZCEnLCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb3B5T3V0cHV0QnV0dG9uRWwhLnRleHRDb250ZW50ID0gJ0NvcGllZCEnO1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29weU91dHB1dEJ1dHRvbkVsKSB0aGlzLmNvcHlPdXRwdXRCdXR0b25FbC50ZXh0Q29udGVudCA9ICdDb3B5IE91dHB1dCc7XG4gICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHRoaXMuc2hvd1ZhbGlkYXRpb25GZWVkYmFjaygnRmFpbGVkIHRvIGNvcHk6ICcgKyBlcnIsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93VmFsaWRhdGlvbkZlZWRiYWNrKCdOb3RoaW5nIHRvIGNvcHkuJywgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVMYWJlbHNBbmRQbGFjZWhvbGRlcnMoZGlyZWN0aW9uOiAnc3FsVG9Kc29uJyB8ICdqc29uVG9TcWwnKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnRpdGxlRWwgfHwgIXRoaXMucmF3SW5wdXRMYWJlbEVsIHx8ICF0aGlzLm91dHB1dExhYmVsRWwgfHwgIXRoaXMuY29udmVydEJ1dHRvbkVsIHx8IFxuICAgICAgICAhdGhpcy5taW5pZnlKc29uQ2hlY2tib3hFbCB8fCAhZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjYy1taW5pZnktanNvbi1sYWJlbCcpIHx8IFxuICAgICAgICAhdGhpcy5yZW1vdmVDb21tZW50c0NoZWNrYm94RWwgfHwgIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY2MtcmVtb3ZlLWNvbW1lbnRzLWxhYmVsJykgfHwgXG4gICAgICAgICF0aGlzLmNvbm5lY3Rvck5hbWVJbnB1dEVsIHx8ICF0aGlzLnJhd1NxbElucHV0RWwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUEFCTE8nUyBEVyBDSEFEOiBPbmUgb3IgbW9yZSBVSSBlbGVtZW50cyBmb3IgbGFiZWwgdXBkYXRlIG5vdCBmb3VuZC5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbWluaWZ5TGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NjLW1pbmlmeS1qc29uLWxhYmVsJykgYXMgSFRNTExhYmVsRWxlbWVudDtcbiAgICBjb25zdCByZW1vdmVDb21tZW50c0dyb3VwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjYy1yZW1vdmUtY29tbWVudHMtZ3JvdXAnKSBhcyBIVE1MRWxlbWVudDtcblxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdzcWxUb0pzb24nKSB7XG4gICAgICAgIHRoaXMudGl0bGVFbC50ZXh0Q29udGVudCA9ICdHZW5lcmF0ZSBTYW5kYm94IE5vZGUgQ29uZmlndXJhdGlvbic7XG4gICAgICAgIHRoaXMucmF3SW5wdXRMYWJlbEVsLnRleHRDb250ZW50ID0gJ1JhdyBTUUwgSW5wdXQ6JztcbiAgICAgICAgdGhpcy5vdXRwdXRMYWJlbEVsLnRleHRDb250ZW50ID0gJ0dlbmVyYXRlZCBTYW5kYm94IENvbmZpZ3VyYXRpb24gKEpTT04pOic7XG4gICAgICAgIHRoaXMuY29udmVydEJ1dHRvbkVsLnRleHRDb250ZW50ID0gJ0dlbmVyYXRlIENvbmZpZ3VyYXRpb24nO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5taW5pZnlKc29uQ2hlY2tib3hFbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIG1pbmlmeUxhYmVsLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgcmVtb3ZlQ29tbWVudHNHcm91cC5zdHlsZS5kaXNwbGF5ID0gJyc7IC8vIFNob3cgcmVtb3ZlIGNvbW1lbnRzIG9wdGlvblxuXG4gICAgICAgIHRoaXMuY29ubmVjdG9yTmFtZUlucHV0RWwucGxhY2Vob2xkZXIgPSAnZS5nLiwgcHJvamVjdF9tb3JnYW5zdGFubGV5bGxfc2FuZGJveF9vZyc7XG4gICAgICAgIHRoaXMucmF3U3FsSW5wdXRFbC5wbGFjZWhvbGRlciA9ICdQYXN0ZSB5b3VyIFNRTCBxdWVyaWVzIGhlcmUuLi4nO1xuICAgIH0gZWxzZSB7IC8vIGpzb25Ub1NxbFxuICAgICAgICB0aGlzLnRpdGxlRWwudGV4dENvbnRlbnQgPSAnRXh0cmFjdCBTUUwgZnJvbSBTYW5kYm94IE5vZGUnO1xuICAgICAgICB0aGlzLnJhd0lucHV0TGFiZWxFbC50ZXh0Q29udGVudCA9ICdTYW5kYm94IE5vZGUgQ29uZmlndXJhdGlvbiAoSlNPTik6JztcbiAgICAgICAgdGhpcy5vdXRwdXRMYWJlbEVsLnRleHRDb250ZW50ID0gJ0V4dHJhY3RlZCBTUUwgU2NyaXB0Oic7XG4gICAgICAgIHRoaXMuY29udmVydEJ1dHRvbkVsLnRleHRDb250ZW50ID0gJ0V4dHJhY3QgU1FMJztcblxuICAgICAgICB0aGlzLm1pbmlmeUpzb25DaGVja2JveEVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIG1pbmlmeUxhYmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHJlbW92ZUNvbW1lbnRzR3JvdXAuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgLy8gSGlkZSByZW1vdmUgY29tbWVudHMgb3B0aW9uXG5cbiAgICAgICAgdGhpcy5jb25uZWN0b3JOYW1lSW5wdXRFbC5wbGFjZWhvbGRlciA9ICdDb25uZWN0b3IgbmFtZSB3aWxsIGJlIGV4dHJhY3RlZCBmcm9tIEpTT04nO1xuICAgICAgICB0aGlzLnJhd1NxbElucHV0RWwucGxhY2Vob2xkZXIgPSAnUGFzdGUgeW91ciBTYW5kYm94IEpTT04gY29uZmlndXJhdGlvbiBoZXJlLi4uJztcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgb3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICB0aGlzLmhpZ2hsaWdodE91dHB1dCgpO1xuXG4gICAgLy8gTG9hZCBhbmQgc2V0IHByZWZlcmVuY2VzXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnc2NjX2xhc3RDb25uZWN0b3JOYW1lJywgJ3NjY19taW5pZnlKc29uUHJlZmVyZW5jZScsICdzY2NfcmVtb3ZlU3FsQ29tbWVudHNQcmVmZXJlbmNlJ10sIChkYXRhKSA9PiB7XG4gICAgICAgIGlmIChkYXRhLnNjY19sYXN0Q29ubmVjdG9yTmFtZSAmJiB0aGlzLmNvbm5lY3Rvck5hbWVJbnB1dEVsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rvck5hbWVJbnB1dEVsLnZhbHVlID0gZGF0YS5zY2NfbGFzdENvbm5lY3Rvck5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWluaWZ5SnNvbkNoZWNrYm94RWwgJiYgdHlwZW9mIGRhdGEuc2NjX21pbmlmeUpzb25QcmVmZXJlbmNlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHRoaXMubWluaWZ5SnNvbkNoZWNrYm94RWwuY2hlY2tlZCA9IGRhdGEuc2NjX21pbmlmeUpzb25QcmVmZXJlbmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlbW92ZUNvbW1lbnRzQ2hlY2tib3hFbCAmJiB0eXBlb2YgZGF0YS5zY2NfcmVtb3ZlU3FsQ29tbWVudHNQcmVmZXJlbmNlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29tbWVudHNDaGVja2JveEVsLmNoZWNrZWQgPSBkYXRhLnNjY19yZW1vdmVTcWxDb21tZW50c1ByZWZlcmVuY2U7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZW1vdmVDb21tZW50c0NoZWNrYm94RWwpIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHQgdG8gZmFsc2UgaWYgbm90IHNldFxuICAgICAgICAgICAgdGhpcy5yZW1vdmVDb21tZW50c0NoZWNrYm94RWwuY2hlY2tlZCA9IGZhbHNlOyBcbiAgICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgcHVibGljIGdldEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gIH1cbn1cbiIsIi8vIHNyYy91dGlscy9kb21VdGlscy50c1xyXG5cclxuLyoqXHJcbiAqIERpc3BsYXlzIGEgdG9hc3QgbWVzc2FnZS5cclxuICogQXNzdW1lcyBDU1MgZm9yIC5wZHdjLXRvYXN0LCAucGR3Yy10b2FzdC12aXNpYmxlLCBhbmQgLnBkd2MtdG9hc3QtW3R5cGVdIGFyZSBkZWZpbmVkLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dUb2FzdChtZXNzYWdlOiBzdHJpbmcsIHR5cGU6ICdzdWNjZXNzJyB8ICdlcnJvcicgfCAnaW5mbycgfCAnd2FybmluZycgPSAnaW5mbycsIGR1cmF0aW9uOiBudW1iZXIgPSAzMDAwKTogdm9pZCB7XHJcbiAgICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdG9hc3QuY2xhc3NOYW1lID0gYHBkd2MtdG9hc3QgcGR3Yy10b2FzdC0ke3R5cGV9YDsgLy8gQ1NTIGNsYXNzZXMgZm9yIHN0eWxpbmdcclxuICAgIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG9hc3QpO1xyXG4gIFxyXG4gICAgLy8gRm9yY2UgYSByZWZsb3cgYmVmb3JlIGFkZGluZyB0aGUgY2xhc3MgdG8gdHJpZ2dlciB0aGUgYW5pbWF0aW9uXHJcbiAgICB2b2lkIHRvYXN0Lm9mZnNldFdpZHRoOyBcclxuICBcclxuICAgIHRvYXN0LmNsYXNzTGlzdC5hZGQoJ3Bkd2MtdG9hc3QtdmlzaWJsZScpO1xyXG4gIFxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHRvYXN0LmNsYXNzTGlzdC5yZW1vdmUoJ3Bkd2MtdG9hc3QtdmlzaWJsZScpO1xyXG4gICAgICAvLyBMaXN0ZW4gZm9yIHRyYW5zaXRpb25lbmQgZXZlbnQgdG8gcmVtb3ZlIHRoZSBlbGVtZW50IGFmdGVyIGZhZGUtb3V0XHJcbiAgICAgIHRvYXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHRvYXN0LnBhcmVudEVsZW1lbnQpIHtcclxuICAgICAgICAgIHRvYXN0LnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xyXG4gICAgICAvLyBGYWxsYmFjayByZW1vdmFsIGlmIHRyYW5zaXRpb25lbmQgZG9lc24ndCBmaXJlIChlLmcuLCBubyB0cmFuc2l0aW9uIGRlZmluZWQpXHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGlmICh0b2FzdC5wYXJlbnRFbGVtZW50KSB7XHJcbiAgICAgICAgICB0b2FzdC5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIGR1cmF0aW9uICsgNTAwKTsgLy8gQSBiaXQgbG9uZ2VyIHRoYW4gZHVyYXRpb25cclxuICAgIH0sIGR1cmF0aW9uKTtcclxuICB9XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBIVE1MRGl2RWxlbWVudC5cclxuICAgKi9cclxuICBleHBvcnQgZnVuY3Rpb24gY3JlYXRlRGl2KG9wdGlvbnM/OiB7IGlkPzogc3RyaW5nOyBjbGFzc05hbWU/OiBzdHJpbmc7IHRleHRDb250ZW50Pzogc3RyaW5nOyBodG1sQ29udGVudD86IHN0cmluZyB9KTogSFRNTERpdkVsZW1lbnQge1xyXG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBpZiAob3B0aW9ucz8uaWQpIGRpdi5pZCA9IG9wdGlvbnMuaWQ7XHJcbiAgICBpZiAob3B0aW9ucz8uY2xhc3NOYW1lKSBkaXYuY2xhc3NOYW1lID0gb3B0aW9ucy5jbGFzc05hbWU7XHJcbiAgICBpZiAob3B0aW9ucz8udGV4dENvbnRlbnQpIGRpdi50ZXh0Q29udGVudCA9IG9wdGlvbnMudGV4dENvbnRlbnQ7XHJcbiAgICBpZiAob3B0aW9ucz8uaHRtbENvbnRlbnQpIGRpdi5pbm5lckhUTUwgPSBvcHRpb25zLmh0bWxDb250ZW50O1xyXG4gICAgcmV0dXJuIGRpdjtcclxuICB9XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBIVE1MQnV0dG9uRWxlbWVudC5cclxuICAgKi9cclxuICBleHBvcnQgZnVuY3Rpb24gY3JlYXRlQnV0dG9uKG9wdGlvbnM6IHsgaWQ/OiBzdHJpbmc7IGNsYXNzTmFtZT86IHN0cmluZzsgdGV4dENvbnRlbnQ/OiBzdHJpbmc7IGh0bWxDb250ZW50Pzogc3RyaW5nOyBvbkNsaWNrPzogKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB2b2lkIH0pOiBIVE1MQnV0dG9uRWxlbWVudCB7XHJcbiAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgIGlmIChvcHRpb25zLmlkKSBidXR0b24uaWQgPSBvcHRpb25zLmlkO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xhc3NOYW1lKSBidXR0b24uY2xhc3NOYW1lID0gb3B0aW9ucy5jbGFzc05hbWU7XHJcbiAgICBpZiAob3B0aW9ucy50ZXh0Q29udGVudCkgYnV0dG9uLnRleHRDb250ZW50ID0gb3B0aW9ucy50ZXh0Q29udGVudDtcclxuICAgIGlmIChvcHRpb25zLmh0bWxDb250ZW50KSBidXR0b24uaW5uZXJIVE1MID0gb3B0aW9ucy5odG1sQ29udGVudDtcclxuICAgIGlmIChvcHRpb25zLm9uQ2xpY2spIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9wdGlvbnMub25DbGljayk7XHJcbiAgICByZXR1cm4gYnV0dG9uO1xyXG4gIH1cclxuICBcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIEhUTUxFbGVtZW50IGZvciBhbiBpY29uIChlLmcuLCB1c2luZyBGb250IEF3ZXNvbWUpLlxyXG4gICAqL1xyXG4gIGV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJY29uKGljb25DbGFzczogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcclxuICAgIGljb24uY2xhc3NOYW1lID0gaWNvbkNsYXNzOyAvLyBlLmcuLCAnZmFzIGZhLXN0YXInXHJcbiAgICByZXR1cm4gaWNvbjtcclxuICB9XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBIVE1MVGV4dEFyZWFFbGVtZW50LlxyXG4gICAqL1xyXG4gIGV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0YXJlYShpZDogc3RyaW5nLCByb3dzOiBudW1iZXIsIHBsYWNlaG9sZGVyPzogc3RyaW5nKTogSFRNTFRleHRBcmVhRWxlbWVudCB7XHJcbiAgICBjb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XHJcbiAgICB0ZXh0YXJlYS5pZCA9IGlkO1xyXG4gICAgdGV4dGFyZWEucm93cyA9IHJvd3M7XHJcbiAgICBpZiAocGxhY2Vob2xkZXIpIHRleHRhcmVhLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XHJcbiAgICByZXR1cm4gdGV4dGFyZWE7XHJcbiAgfVxyXG4gIFxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gSFRNTElucHV0RWxlbWVudCBvZiB0eXBlIHJhZGlvLlxyXG4gICAqL1xyXG4gIGV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSYWRpb0J1dHRvbihuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGlkPzogc3RyaW5nLCBjaGVja2VkOiBib29sZWFuID0gZmFsc2UpOiBIVE1MSW5wdXRFbGVtZW50IHtcclxuICAgIGNvbnN0IHJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgIHJhZGlvLnR5cGUgPSAncmFkaW8nO1xyXG4gICAgcmFkaW8ubmFtZSA9IG5hbWU7XHJcbiAgICByYWRpby52YWx1ZSA9IHZhbHVlO1xyXG4gICAgaWYgKGlkKSByYWRpby5pZCA9IGlkO1xyXG4gICAgcmFkaW8uY2hlY2tlZCA9IGNoZWNrZWQ7XHJcbiAgICByZXR1cm4gcmFkaW87XHJcbiAgfVxyXG4gIFxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gSFRNTExhYmVsRWxlbWVudC5cclxuICAgKi9cclxuICBleHBvcnQgZnVuY3Rpb24gY3JlYXRlTGFiZWwoZm9yRWxlbWVudE9ySWQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQgfCBzdHJpbmcsIHRleHQ6IHN0cmluZyk6IEhUTUxMYWJlbEVsZW1lbnQge1xyXG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xyXG4gICAgaWYgKHR5cGVvZiBmb3JFbGVtZW50T3JJZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgbGFiZWwuaHRtbEZvciA9IGZvckVsZW1lbnRPcklkO1xyXG4gICAgfSBlbHNlIGlmIChmb3JFbGVtZW50T3JJZC5pZCkge1xyXG4gICAgICBsYWJlbC5odG1sRm9yID0gZm9yRWxlbWVudE9ySWQuaWQ7XHJcbiAgICB9XHJcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICByZXR1cm4gbGFiZWw7XHJcbiAgfVxyXG4gIFxyXG4gIC8qKlxyXG4gICAqIEdldHMgYW4gZWxlbWVudCBieSBJRCwgdGhyb3dpbmcgYW4gZXJyb3IgaWYgbm90IGZvdW5kLlxyXG4gICAqL1xyXG4gIGV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50PFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4oaWQ6IHN0cmluZywgY29udGFpbmVyOiBEb2N1bWVudCB8IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQpOiBUIHtcclxuICAgIGNvbnN0IGVsZW1lbnQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcjxUPihgIyR7Q1NTLmVzY2FwZShpZCl9YCk7XHJcbiAgICBpZiAoIWVsZW1lbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFbGVtZW50IHdpdGggaWQgJyR7aWR9JyBub3QgZm91bmQuYCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZWxlbWVudDtcclxuICB9XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogR2V0cyBhbiBlbGVtZW50IGJ5IElELCByZXR1cm5pbmcgbnVsbCBpZiBub3QgZm91bmQuXHJcbiAgICovXHJcbiAgZXhwb3J0IGZ1bmN0aW9uIGdldE9wdGlvbmFsRWxlbWVudDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KGlkOiBzdHJpbmcsIGNvbnRhaW5lcjogRG9jdW1lbnQgfCBIVE1MRWxlbWVudCA9IGRvY3VtZW50KTogVCB8IG51bGwge1xyXG4gICAgcmV0dXJuIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yPFQ+KGAjJHtDU1MuZXNjYXBlKGlkKX1gKTtcclxuICB9XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogRXNjYXBlcyBhIHN0cmluZyBmb3IgdXNlIGFzIGFuIEhUTUwgYXR0cmlidXRlIHZhbHVlLlxyXG4gICAqL1xyXG4gIGV4cG9ydCBmdW5jdGlvbiBlc2NhcGVBdHRyKHN0cjogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHN0cmluZyB7XHJcbiAgICBpZiAoc3RyID09PSB1bmRlZmluZWQgfHwgc3RyID09PSBudWxsKSByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gU3RyaW5nKHN0cikucmVwbGFjZSgvWyY8PlwiJ10vZywgKG1hdGNoKSA9PiB7XHJcbiAgICAgIHN3aXRjaCAobWF0Y2gpIHtcclxuICAgICAgICBjYXNlICcmJzogcmV0dXJuICcmYW1wOyc7XHJcbiAgICAgICAgY2FzZSAnPCc6IHJldHVybiAnJmx0Oyc7XHJcbiAgICAgICAgY2FzZSAnPic6IHJldHVybiAnJmd0Oyc7XHJcbiAgICAgICAgY2FzZSAnXCInOiByZXR1cm4gJyZxdW90Oyc7XHJcbiAgICAgICAgY2FzZSBcIidcIjogcmV0dXJuICcmIzM5Oyc7XHJcbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIG1hdGNoO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9IiwiaW1wb3J0IHsgZ2V0RWxlbWVudCwgZ2V0T3B0aW9uYWxFbGVtZW50LCBjcmVhdGVCdXR0b24sIGNyZWF0ZURpdiwgY3JlYXRlSWNvbiwgY3JlYXRlVGV4dGFyZWEsIGNyZWF0ZVJhZGlvQnV0dG9uLCBjcmVhdGVMYWJlbCwgc2hvd1RvYXN0LCBlc2NhcGVBdHRyIH0gZnJvbSAnLi4vdXRpbHMvZG9tVXRpbHMnOyBcbmltcG9ydCB7IGxvYWREYXRhRnJvbUNhY2hlLCBzYXZlRGF0YVRvQ2FjaGUsIENhY2hlZERhdGEgfSBmcm9tICcuLi9jYWNoZVNlcnZpY2UnOyBcbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlIH0gZnJvbSAnLi4vYXBpL21vZGVsL2dldF9saXN0QXR0cmlidXRlcyc7XG5pbXBvcnQgdHlwZSB7IFNldCB9IGZyb20gJy4uL2FwaS9tb2RlbC9nZXRfbGlzdFNldHMnO1xuaW1wb3J0IHR5cGUgeyBEYXRhV2Fsa0xpbmtUeXBlIH0gZnJvbSAnLi4vdHlwZXMvZGF0YU1vZGVscyc7IC8vIEFkZGVkIERhdGFXYWxrTGlua1R5cGVcbmltcG9ydCB7IGZldGNoQXR0cmlidXRlcywgZmV0Y2hTZXRzLCBmZXRjaExpbmtUeXBlc0J5Q2xhc3NJZHMgfSBmcm9tICcuLi9hcGkvZGF0YXdhbGtTZXJ2aWNlJzsgLy8gQWRkZWQgZmV0Y2hMaW5rVHlwZXNCeUNsYXNzSWRzXG5pbXBvcnQgeyBvcGVuR2l0SHViSXNzdWUgfSBmcm9tICcuLi91dGlscy9mZWVkYmFja1V0aWxzJztcblxuZXhwb3J0IGNsYXNzIENvbnRleHRSZXRyaWV2YWxUb29sIHtcbiAgcHJpdmF0ZSB0b29sRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb250ZW50QXJlYTogSFRNTFByZUVsZW1lbnQgfCBudWxsID0gbnVsbDsgXG4gIHByaXZhdGUgY3VzdG9tQ29udGV4dFRleHRBcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCA9IG51bGw7IFxuICBwcml2YXRlIGNvcHlGb3JtYXR0ZWRCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29weUVzY2FwZWRCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY2xvc2VCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgamluamFDaGVja2JveDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsOyBcbiAgcHJpdmF0ZSByZWZyZXNoTWV0YWRhdGFCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbCA9IG51bGw7IFxuICBwcml2YXRlIGlzVmlzaWJsZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHJhd0NvbnRleHREYXRhOiBhbnkgPSBudWxsOyBcbiAgcHJpdmF0ZSBib3VuZFN0b3JhZ2VDaGFuZ2VMaXN0ZW5lcjogKGNoYW5nZXM6IHsgW2tleTogc3RyaW5nXTogY2hyb21lLnN0b3JhZ2UuU3RvcmFnZUNoYW5nZSB9LCBuYW1lc3BhY2U6IHN0cmluZykgPT4gdm9pZDtcblxuICBwcml2YXRlIG1vZGVSYWRpb0dyb3VwOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0b3JlZENvbnRleHRSYWRpbzogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1c3RvbUNvbnRleHRSYWRpbzogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbnRleHRTb3VyY2VNb2RlOiAnc3RvcmVkJyB8ICdjdXN0b20nID0gJ3N0b3JlZCc7XG5cbiAgcHJpdmF0ZSBhbGxBdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IFtdO1xuICBwcml2YXRlIGFsbFNldHM6IFNldFtdID0gW107XG4gIHByaXZhdGUgYWxsTGlua1R5cGVzOiBEYXRhV2Fsa0xpbmtUeXBlW10gPSBbXTsgLy8gQWRkZWQgbWVtYmVyIGZvciBsaW5rIHR5cGVzXG4gIHByaXZhdGUgYmFzZVVybDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGJhc2VVcmw6IHN0cmluZykge1xuICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgLy8gQmluZCBtZXRob2RzIHRvIGVuc3VyZSAndGhpcycgY29udGV4dCBpcyBjb3JyZWN0XG4gICAgdGhpcy5zaG93ID0gdGhpcy5zaG93LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oaWRlID0gdGhpcy5oaWRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5jb3B5Rm9ybWF0dGVkQ29udGV4dFRvQ2xpcGJvYXJkID0gdGhpcy5jb3B5Rm9ybWF0dGVkQ29udGV4dFRvQ2xpcGJvYXJkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5jb3B5RXNjYXBlZENvbnRleHRUb0NsaXBib2FyZCA9IHRoaXMuY29weUVzY2FwZWRDb250ZXh0VG9DbGlwYm9hcmQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZVJlZnJlc2hNZXRhZGF0YSA9IHRoaXMuaGFuZGxlUmVmcmVzaE1ldGFkYXRhLmJpbmQodGhpcyk7IFxuICAgIHRoaXMuaGFuZGxlTW9kZUNoYW5nZSA9IHRoaXMuaGFuZGxlTW9kZUNoYW5nZS5iaW5kKHRoaXMpOyBcbiAgICB0aGlzLmJvdW5kU3RvcmFnZUNoYW5nZUxpc3RlbmVyID0gdGhpcy5zdG9yYWdlQ2hhbmdlTGlzdGVuZXIuYmluZCh0aGlzKTsgLy8gQmluZCBsaXN0ZW5lclxuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVVSSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50b29sRWxlbWVudCkgcmV0dXJuOyBcblxuICAgIHRoaXMudG9vbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnRvb2xFbGVtZW50LmNsYXNzTmFtZSA9ICdwZHdjLWNvbnRleHQtdG9vbCc7IFxuICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgXG5cbiAgICAvLyBIZWFkZXJcbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBoZWFkZXIuY2xhc3NOYW1lID0gJ3Bkd2MtdG9vbC1oZWFkZXInO1xuXG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7IFxuICAgIHRpdGxlLnRleHRDb250ZW50ID0gJ1JldHJpZXZlZCBBUEkgQ29udGV4dCc7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKHRpdGxlKTtcblxuICAgIHRoaXMuY2xvc2VCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICB0aGlzLmNsb3NlQnV0dG9uLmlubmVySFRNTCA9ICcmdGltZXM7JzsgXG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWNsb3NlLWJ1dHRvbic7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5oaWRlKCk7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuY2xvc2VCdXR0b24pO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICAgIC8vIE1vZGUgU2VsZWN0aW9uIFVJXG4gICAgdGhpcy5tb2RlUmFkaW9Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMubW9kZVJhZGlvR3JvdXAuY2xhc3NOYW1lID0gJ3Bkd2MtY29udGV4dC1tb2RlLXNlbGVjdG9yJztcblxuICAgIGNvbnN0IHN0b3JlZExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICB0aGlzLnN0b3JlZENvbnRleHRSYWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgdGhpcy5zdG9yZWRDb250ZXh0UmFkaW8udHlwZSA9ICdyYWRpbyc7XG4gICAgdGhpcy5zdG9yZWRDb250ZXh0UmFkaW8ubmFtZSA9ICdjb250ZXh0U291cmNlTW9kZSc7XG4gICAgdGhpcy5zdG9yZWRDb250ZXh0UmFkaW8udmFsdWUgPSAnc3RvcmVkJztcbiAgICB0aGlzLnN0b3JlZENvbnRleHRSYWRpby5jaGVja2VkID0gdHJ1ZTtcbiAgICB0aGlzLnN0b3JlZENvbnRleHRSYWRpby5vbmNoYW5nZSA9IHRoaXMuaGFuZGxlTW9kZUNoYW5nZTtcbiAgICBzdG9yZWRMYWJlbC5hcHBlbmRDaGlsZCh0aGlzLnN0b3JlZENvbnRleHRSYWRpbyk7XG4gICAgc3RvcmVkTGFiZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJyBVc2UgU3RvcmVkIENvbnRleHQnKSk7XG4gICAgdGhpcy5tb2RlUmFkaW9Hcm91cC5hcHBlbmRDaGlsZChzdG9yZWRMYWJlbCk7XG5cbiAgICBjb25zdCBjdXN0b21MYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgdGhpcy5jdXN0b21Db250ZXh0UmFkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIHRoaXMuY3VzdG9tQ29udGV4dFJhZGlvLnR5cGUgPSAncmFkaW8nO1xuICAgIHRoaXMuY3VzdG9tQ29udGV4dFJhZGlvLm5hbWUgPSAnY29udGV4dFNvdXJjZU1vZGUnO1xuICAgIHRoaXMuY3VzdG9tQ29udGV4dFJhZGlvLnZhbHVlID0gJ2N1c3RvbSc7XG4gICAgdGhpcy5jdXN0b21Db250ZXh0UmFkaW8ub25jaGFuZ2UgPSB0aGlzLmhhbmRsZU1vZGVDaGFuZ2U7XG4gICAgY3VzdG9tTGFiZWwuYXBwZW5kQ2hpbGQodGhpcy5jdXN0b21Db250ZXh0UmFkaW8pO1xuICAgIGN1c3RvbUxhYmVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgVXNlIEN1c3RvbSBDb250ZXh0JykpO1xuICAgIHRoaXMubW9kZVJhZGlvR3JvdXAuYXBwZW5kQ2hpbGQoY3VzdG9tTGFiZWwpO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5tb2RlUmFkaW9Hcm91cCk7XG5cbiAgICAvLyBKaW5qYSBDaGVja2JveCBDb250YWluZXJcbiAgICBjb25zdCBqaW5qYUNoZWNrYm94Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgamluamFDaGVja2JveENvbnRhaW5lci5zdHlsZS5wYWRkaW5nID0gJzEwcHggMTVweCc7XG4gICAgamluamFDaGVja2JveENvbnRhaW5lci5zdHlsZS5ib3JkZXJCb3R0b20gPSAnMXB4IHNvbGlkICNlZWUnO1xuXG4gICAgdGhpcy5qaW5qYUNoZWNrYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICB0aGlzLmppbmphQ2hlY2tib3gudHlwZSA9ICdjaGVja2JveCc7XG4gICAgdGhpcy5qaW5qYUNoZWNrYm94LmlkID0gJ3Bkd2MtamluamEtY2hlY2tib3gnO1xuICAgIHRoaXMuamluamFDaGVja2JveC5zdHlsZS5tYXJnaW5SaWdodCA9ICc1cHgnO1xuXG4gICAgY29uc3QgamluamFMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgamluamFMYWJlbC5odG1sRm9yID0gJ3Bkd2MtamluamEtY2hlY2tib3gnO1xuICAgIGppbmphTGFiZWwudGV4dENvbnRlbnQgPSAnRW5hYmxlIEppbmphIFBsYWNlaG9sZGVycyc7XG4gICAgamluamFMYWJlbC5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG5cbiAgICBqaW5qYUNoZWNrYm94Q29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuamluamFDaGVja2JveCk7XG4gICAgamluamFDaGVja2JveENvbnRhaW5lci5hcHBlbmRDaGlsZChqaW5qYUxhYmVsKTtcblxuICAgIHRoaXMudG9vbEVsZW1lbnQuYXBwZW5kQ2hpbGQoamluamFDaGVja2JveENvbnRhaW5lcik7XG5cbiAgICAvLyBDb250ZW50IERpc3BsYXkgQXJlYXNcbiAgICB0aGlzLmNvbnRlbnRBcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7IFxuICAgIHRoaXMuY29udGVudEFyZWEuY2xhc3NOYW1lID0gJ3Bkd2MtY29udGV4dC1jb250ZW50LWFyZWEnO1xuICAgIHRoaXMudG9vbEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250ZW50QXJlYSk7XG5cbiAgICB0aGlzLmN1c3RvbUNvbnRleHRUZXh0QXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7IFxuICAgIHRoaXMuY3VzdG9tQ29udGV4dFRleHRBcmVhLmNsYXNzTmFtZSA9ICdwZHdjLWN1c3RvbS1jb250ZXh0LXRleHRhcmVhJztcbiAgICB0aGlzLmN1c3RvbUNvbnRleHRUZXh0QXJlYS5wbGFjZWhvbGRlciA9ICdQYXN0ZSB5b3VyIEpTT04gY29udGV4dCBoZXJlLi4uJztcbiAgICB0aGlzLnRvb2xFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY3VzdG9tQ29udGV4dFRleHRBcmVhKTtcblxuICAgIC8vIEJ1dHRvbiBDb250YWluZXJcbiAgICBjb25zdCBmb290ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBmb290ZXIuY2xhc3NOYW1lID0gJ3Bkd2MtdG9vbC1mb290ZXInO1xuXG4gICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uLnRleHRDb250ZW50ID0gJ0NvcHkgRm9ybWF0dGVkIEpTT04nO1xuICAgIHRoaXMuY29weUZvcm1hdHRlZEJ1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWJ1dHRvbic7XG4gICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNvcHlGb3JtYXR0ZWRDb250ZXh0VG9DbGlwYm9hcmQoKTtcblxuICAgIHRoaXMuY29weUVzY2FwZWRCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICB0aGlzLmNvcHlFc2NhcGVkQnV0dG9uLnRleHRDb250ZW50ID0gJ0NvcHkgYXMgRXNjYXBlZCBTdHJpbmcnO1xuICAgIHRoaXMuY29weUVzY2FwZWRCdXR0b24uY2xhc3NOYW1lID0gJ3Bkd2MtdG9vbC1idXR0b24nO1xuICAgIHRoaXMuY29weUVzY2FwZWRCdXR0b24ub25jbGljayA9ICgpID0+IHRoaXMuY29weUVzY2FwZWRDb250ZXh0VG9DbGlwYm9hcmQoKTtcbiAgICBcbiAgICAvLyBBZGQgZmVlZGJhY2sgYnV0dG9uXG4gICAgY29uc3QgZmVlZGJhY2tCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBmZWVkYmFja0J1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy1mZWVkYmFjay1idXR0b24nO1xuICAgIGZlZWRiYWNrQnV0dG9uLnRpdGxlID0gJ1JlcG9ydCBhbiBpc3N1ZSc7XG4gICAgZmVlZGJhY2tCdXR0b24uaW5uZXJIVE1MID0gJyYjeDFGNDFFOyc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY29sb3IgPSAnI2YyZjJmNyc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnBhZGRpbmcgPSAnMCAxMHB4JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS5saW5lSGVpZ2h0ID0gJzEnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC44JztcbiAgICBmZWVkYmFja0J1dHRvbi5zdHlsZS50cmFuc2l0aW9uID0gJ29wYWNpdHkgMC4ycyc7XG4gICAgZmVlZGJhY2tCdXR0b24uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnJpZ2h0ID0gJzM1cHgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLnRvcCA9ICc1cHgnO1xuICAgIGZlZWRiYWNrQnV0dG9uLm9ubW91c2VvdmVyID0gKCkgPT4ge1xuICAgICAgZmVlZGJhY2tCdXR0b24uc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmNvbG9yID0gJyNmZjlmMGEnO1xuICAgIH07XG4gICAgZmVlZGJhY2tCdXR0b24ub25tb3VzZW91dCA9ICgpID0+IHtcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAnMC44JztcbiAgICAgIGZlZWRiYWNrQnV0dG9uLnN0eWxlLmNvbG9yID0gJyNmMmYyZjcnO1xuICAgIH07XG4gICAgZmVlZGJhY2tCdXR0b24ub25jbGljayA9ICgpID0+IG9wZW5HaXRIdWJJc3N1ZSgnQ29udGV4dCBSZXRyaWV2YWwgVG9vbCcpO1xuICAgIGhlYWRlci5hcHBlbmRDaGlsZChmZWVkYmFja0J1dHRvbik7XG5cbiAgICB0aGlzLnJlZnJlc2hNZXRhZGF0YUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLnRleHRDb250ZW50ID0gJ1JlZnJlc2ggTWV0YWRhdGEnO1xuICAgIHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLmNsYXNzTmFtZSA9ICdwZHdjLXRvb2wtYnV0dG9uJztcbiAgICB0aGlzLnJlZnJlc2hNZXRhZGF0YUJ1dHRvbi5vbmNsaWNrID0gdGhpcy5oYW5kbGVSZWZyZXNoTWV0YWRhdGE7XG5cbiAgICB0aGlzLmNsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi50ZXh0Q29udGVudCA9ICdDbG9zZSc7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5jbGFzc05hbWUgPSAncGR3Yy10b29sLWJ1dHRvbic7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy5oaWRlKCk7XG5cbiAgICBmb290ZXIuYXBwZW5kQ2hpbGQodGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uKTtcbiAgICBmb290ZXIuYXBwZW5kQ2hpbGQodGhpcy5jb3B5RXNjYXBlZEJ1dHRvbik7XG4gICAgZm9vdGVyLmFwcGVuZENoaWxkKHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uKTtcbiAgICBmb290ZXIuYXBwZW5kQ2hpbGQoZmVlZGJhY2tCdXR0b24pO1xuICAgIGZvb3Rlci5hcHBlbmRDaGlsZCh0aGlzLmNsb3NlQnV0dG9uKTtcbiAgICB0aGlzLnRvb2xFbGVtZW50LmFwcGVuZENoaWxkKGZvb3Rlcik7IFxuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLnRvb2xFbGVtZW50KTtcblxuICAgIHRoaXMudXBkYXRlQ29udGV4dERpc3BsYXlWaWV3cygpOyBcbiAgICB0aGlzLmluaXRpYWxpemVTdG9yZWRDb250ZXh0TGlzdGVuZXIoKTsgLy8gRm9yIHRoZSBhY3R1YWwgY29udGV4dCBKU09OXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvYWRJbml0aWFsTWV0YWRhdGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlZERhdGE6IENhY2hlZERhdGEgfCBudWxsID0gYXdhaXQgbG9hZERhdGFGcm9tQ2FjaGUodGhpcy5iYXNlVXJsKTtcbiAgICAgIGlmIChjYWNoZWREYXRhKSB7XG4gICAgICAgIHRoaXMuYWxsQXR0cmlidXRlcyA9IGNhY2hlZERhdGEuYXR0cmlidXRlcyB8fCBbXTtcbiAgICAgICAgdGhpcy5hbGxTZXRzID0gY2FjaGVkRGF0YS5zZXRzIHx8IFtdO1xuICAgICAgICB0aGlzLmFsbExpbmtUeXBlcyA9IGNhY2hlZERhdGEubGlua1R5cGVzIHx8IFtdOyAvLyBMb2FkIGxpbmtUeXBlc1xuICAgICAgICBjb25zb2xlLmxvZygnUEFCTE8gRFcgQ0hBRDogQ29udGV4dFRvb2wgLSBMb2FkZWQgYXR0cmlidXRlcywgc2V0cywgYW5kIGxpbmtUeXBlcyBmcm9tIGNhY2hlLicsIHRoaXMuYWxsQXR0cmlidXRlcy5sZW5ndGgsIHRoaXMuYWxsU2V0cy5sZW5ndGgsIHRoaXMuYWxsTGlua1R5cGVzLmxlbmd0aCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFsbEF0dHJpYnV0ZXMgPSBbXTtcbiAgICAgICAgdGhpcy5hbGxTZXRzID0gW107XG4gICAgICAgIHRoaXMuYWxsTGlua1R5cGVzID0gW107XG4gICAgICAgIGNvbnNvbGUud2FybignUEFCTE8gRFcgQ0hBRDogQ29udGV4dFRvb2wgLSBDb3VsZCBub3QgbG9hZCBhdHRyaWJ1dGVzL3NldHMvbGlua1R5cGVzIGZyb20gY2FjaGUgb3IgY2FjaGUgd2FzIGVtcHR5IGZvciBiYXNlVXJsOicsIHRoaXMuYmFzZVVybCk7XG4gICAgICAgIC8vIE9wdGlvbmFsbHkgdHJpZ2dlciBhIGZldGNoIGlmIGNhY2hlIGlzIGVtcHR5IG9uIGZpcnN0IGxvYWRcbiAgICAgICAgLy8gYXdhaXQgdGhpcy5oYW5kbGVSZWZyZXNoTWV0YWRhdGEoZmFsc2UpOyBcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5hbGxBdHRyaWJ1dGVzID0gW107XG4gICAgICB0aGlzLmFsbFNldHMgPSBbXTtcbiAgICAgIHRoaXMuYWxsTGlua1R5cGVzID0gW107XG4gICAgICBjb25zb2xlLmVycm9yKCdQQUJMTyBEVyBDSEFEOiBDb250ZXh0VG9vbCAtIEVycm9yIGxvYWRpbmcgaW5pdGlhbCBhdHRyaWJ1dGVzL3NldHMvbGlua1R5cGVzIGZyb20gY2FjaGU6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzaG93KCk6IFByb21pc2U8dm9pZD4geyBcbiAgICBpZiAoIXRoaXMudG9vbEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuY3JlYXRlVUkoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudG9vbEVsZW1lbnQpIHtcbiAgICAgIC8vIExvYWQgbWV0YWRhdGEgaWYgbm90IGFscmVhZHkgbG9hZGVkIG9yIGlmIGEgcmVmcmVzaCBpcyBkZXNpcmVkIGltcGxpY2l0bHkgb24gc2hvd1xuICAgICAgaWYgKHRoaXMuYWxsQXR0cmlidXRlcy5sZW5ndGggPT09IDAgJiYgdGhpcy5hbGxTZXRzLmxlbmd0aCA9PT0gMCAmJiB0aGlzLmFsbExpbmtUeXBlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkSW5pdGlhbE1ldGFkYXRhKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBkYXRlQ29udGV4dERpc3BsYXlWaWV3cygpOyBcbiAgICAgIHRoaXMudG9vbEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50b29sRWxlbWVudCAmJiB0aGlzLmlzVmlzaWJsZSkge1xuICAgICAgdGhpcy50b29sRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGppbmlmeUNvbnRleHQoY29udGV4dDogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAoIXRoaXMuYWxsQXR0cmlidXRlcy5sZW5ndGggJiYgIXRoaXMuYWxsU2V0cy5sZW5ndGggJiYgIXRoaXMuYWxsTGlua1R5cGVzLmxlbmd0aCkge1xuICAgICAgY29uc29sZS53YXJuKCdQQUJMTyBEVyBDSEFEOiBKaW5pZnlDb250ZXh0IC0gQXR0cmlidXRlcywgc2V0cywgb3IgbGlua1R5cGVzIG5vdCBsb2FkZWQgb3IgZW1wdHkuIFJldHVybmluZyBvcmlnaW5hbCBjb250ZXh0LicpO1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29udGV4dCkpOyAvLyBSZXR1cm4gYSBkZWVwIGNvcHlcbiAgICB9XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVNYXAgPSBuZXcgTWFwPG51bWJlciwgeyBuYW1lOiBzdHJpbmc7IGNsYXNzTmFtZTogc3RyaW5nIH0+KCk7XG4gICAgY29uc3Qgc2V0TWFwID0gbmV3IE1hcDxudW1iZXIsIHN0cmluZz4oKTtcbiAgICBjb25zdCBsaW5rVHlwZU1hcCA9IG5ldyBNYXA8bnVtYmVyLCB7IHNvdXJjZUNvbGxlY3Rpb25JZDogbnVtYmVyOyB0YXJnZXRDb2xsZWN0aW9uSWQ6IG51bWJlcjsgbmFtZTogc3RyaW5nIH0+KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNldCBvZiB0aGlzLmFsbFNldHMpIHtcbiAgICAgIGlmIChzZXQgJiYgdHlwZW9mIHNldC5pZCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHNldC5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBzZXRNYXAuc2V0KHNldC5pZCwgc2V0Lm5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXR0ciBvZiB0aGlzLmFsbEF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmIChhdHRyICYmIHR5cGVvZiBhdHRyLmlkID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgYXR0ci5uYW1lID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgYXR0ci5jbGFzc0lkID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBwYXJlbnRTZXROYW1lID0gc2V0TWFwLmdldChhdHRyLmNsYXNzSWQpO1xuICAgICAgICBpZiAocGFyZW50U2V0TmFtZSkge1xuICAgICAgICAgIGF0dHJpYnV0ZU1hcC5zZXQoYXR0ci5pZCwgeyBuYW1lOiBhdHRyLm5hbWUsIGNsYXNzTmFtZTogcGFyZW50U2V0TmFtZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgbGlua1R5cGUgb2YgdGhpcy5hbGxMaW5rVHlwZXMpIHtcbiAgICAgIGlmIChsaW5rVHlwZSAmJiB0eXBlb2YgbGlua1R5cGUuaWQgPT09ICdudW1iZXInICYmIHR5cGVvZiBsaW5rVHlwZS5zb3VyY2VDb2xsZWN0aW9uSWQgPT09ICdudW1iZXInICYmIHR5cGVvZiBsaW5rVHlwZS50YXJnZXRDb2xsZWN0aW9uSWQgPT09ICdudW1iZXInICYmIHR5cGVvZiBsaW5rVHlwZS5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBsaW5rVHlwZU1hcC5zZXQobGlua1R5cGUuaWQsIHsgc291cmNlQ29sbGVjdGlvbklkOiBsaW5rVHlwZS5zb3VyY2VDb2xsZWN0aW9uSWQsIHRhcmdldENvbGxlY3Rpb25JZDogbGlua1R5cGUudGFyZ2V0Q29sbGVjdGlvbklkLCBuYW1lOiBsaW5rVHlwZS5uYW1lIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5ldyBmdW5jdGlvbiB0byB0cmFuc2Zvcm0ga2V5cyBPTkxZIGlmIHRoZXkgYXJlIFNldCBJRHNcbiAgICBjb25zdCB0cmFuc2Zvcm1LZXlJZk5lZWRlZCA9IChrZXk6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBwYXJzZWROdW0gPSBwYXJzZUludChrZXksIDEwKTtcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBrZXkgaXMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBudW1iZXIgQU5EIHRoYXQgbnVtYmVyIGlzIGluIHNldE1hcFxuICAgICAgaWYgKCFpc05hTihwYXJzZWROdW0pICYmIFN0cmluZyhwYXJzZWROdW0pID09PSBrZXkudHJpbSgpICYmIHNldE1hcC5oYXMocGFyc2VkTnVtKSkge1xuICAgICAgICBjb25zdCBzZXROYW1lID0gc2V0TWFwLmdldChwYXJzZWROdW0pITtcbiAgICAgICAgcmV0dXJuIGB7eyBEV19NRVRBREFUQV9DQUNIRS5nZXRfZW50aXR5X2NsYXNzX2J5X25hbWUoJyR7c2V0TmFtZX0nKS5pZCB9fWA7XG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5OyAvLyBSZXR1cm4gb3JpZ2luYWwga2V5IGlmIG5vdCBhIG51bWVyaWMgU2V0IElEXG4gICAgfTtcblxuICAgIGNvbnN0IHRyYW5zZm9ybVZhbHVlID0gKHZhbHVlOiBhbnksIHNlbWFudGljSGludDogJ3NldCcgfCAnYXR0cmlidXRlJyB8ICdsaW5rJyB8ICd1bmtub3duJyk6IGFueSA9PiB7XG4gICAgICBsZXQgaWRUb1Rlc3Q6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZFRvVGVzdCA9IHZhbHVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZE51bSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgIGlmICghaXNOYU4ocGFyc2VkTnVtKSAmJiBTdHJpbmcocGFyc2VkTnVtKSA9PT0gdmFsdWUudHJpbSgpKSB7XG4gICAgICAgICAgaWRUb1Rlc3QgPSBwYXJzZWROdW07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlkVG9UZXN0ICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChzZW1hbnRpY0hpbnQgPT09ICdzZXQnKSB7XG4gICAgICAgICAgaWYgKHNldE1hcC5oYXMoaWRUb1Rlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBzZXROYW1lID0gc2V0TWFwLmdldChpZFRvVGVzdCkhO1xuICAgICAgICAgICAgcmV0dXJuIGB7eyBEV19NRVRBREFUQV9DQUNIRS5nZXRfZW50aXR5X2NsYXNzX2J5X25hbWUoJyR7c2V0TmFtZX0nKS5pZCB9fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBge3sgZXJyb3IgcHJvY2Vzc2luZyBpZCAke2lkVG9UZXN0fSBhcyBzZXQgLSBub3QgZm91bmQgb3IgcGVybWlzc2lvbnM/IH19YDtcbiAgICAgICAgfSBlbHNlIGlmIChzZW1hbnRpY0hpbnQgPT09ICdhdHRyaWJ1dGUnKSB7XG4gICAgICAgICAgaWYgKGF0dHJpYnV0ZU1hcC5oYXMoaWRUb1Rlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRySW5mbyA9IGF0dHJpYnV0ZU1hcC5nZXQoaWRUb1Rlc3QpITtcbiAgICAgICAgICAgIHJldHVybiBge3sgRFdfTUVUQURBVEFfQ0FDSEUuZ2V0X2F0dHJpYnV0ZV9ieV9uYW1lKCcke2F0dHJJbmZvLm5hbWV9JywgRFdfTUVUQURBVEFfQ0FDSEUuZ2V0X2VudGl0eV9jbGFzc19ieV9uYW1lKCcke2F0dHJJbmZvLmNsYXNzTmFtZX0nKS5pZCkuaWQgfX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYHt7IGVycm9yIHByb2Nlc3NpbmcgaWQgJHtpZFRvVGVzdH0gYXMgYXR0cmlidXRlIC0gbm90IGZvdW5kIG9yIHBlcm1pc3Npb25zPyB9fWA7XG4gICAgICAgIH0gZWxzZSBpZiAoc2VtYW50aWNIaW50ID09PSAnbGluaycpIHtcbiAgICAgICAgICBpZiAobGlua1R5cGVNYXAuaGFzKGlkVG9UZXN0KSkge1xuICAgICAgICAgICAgY29uc3QgbGlua1R5cGVJbmZvID0gbGlua1R5cGVNYXAuZ2V0KGlkVG9UZXN0KSE7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VDbGFzcyA9IHNldE1hcC5nZXQobGlua1R5cGVJbmZvLnNvdXJjZUNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRDbGFzcyA9IHNldE1hcC5nZXQobGlua1R5cGVJbmZvLnRhcmdldENvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICBpZiAoc291cmNlQ2xhc3MgJiYgdGFyZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGB7eyBEV19NRVRBREFUQV9DQUNIRS5nZXRfbGlua190eXBlX2J5X25hbWUoJyR7bGlua1R5cGVJbmZvLm5hbWV9JywgRFdfTUVUQURBVEFfQ0FDSEUuZ2V0X2VudGl0eV9jbGFzc19ieV9uYW1lKCcke3NvdXJjZUNsYXNzfScpLmlkLCBEV19NRVRBREFUQV9DQUNIRS5nZXRfZW50aXR5X2NsYXNzX2J5X25hbWUoJyR7dGFyZ2V0Q2xhc3N9JykuaWQpLmlkIH19YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBge3sgZXJyb3IgcHJvY2Vzc2luZyBpZCAke2lkVG9UZXN0fSBhcyBsaW5rIChtaXNzaW5nIHNvdXJjZS90YXJnZXQgY2xhc3MpIC0gbm90IGZvdW5kIG9yIHBlcm1pc3Npb25zPyB9fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBge3sgZXJyb3IgcHJvY2Vzc2luZyBpZCAke2lkVG9UZXN0fSBhcyBsaW5rIC0gbm90IGZvdW5kIG9yIHBlcm1pc3Npb25zPyB9fWA7XG4gICAgICAgIH0gZWxzZSB7IC8vIHNlbWFudGljSGludCA9PT0gJ3Vua25vd24nXG4gICAgICAgICAgaWYgKHNldE1hcC5oYXMoaWRUb1Rlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBzZXROYW1lID0gc2V0TWFwLmdldChpZFRvVGVzdCkhO1xuICAgICAgICAgICAgcmV0dXJuIGB7eyBEV19NRVRBREFUQV9DQUNIRS5nZXRfZW50aXR5X2NsYXNzX2J5X25hbWUoJyR7c2V0TmFtZX0nKS5pZCB9fWA7XG4gICAgICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGVNYXAuaGFzKGlkVG9UZXN0KSkge1xuICAgICAgICAgICAgY29uc3QgYXR0ckluZm8gPSBhdHRyaWJ1dGVNYXAuZ2V0KGlkVG9UZXN0KSE7XG4gICAgICAgICAgICByZXR1cm4gYHt7IERXX01FVEFEQVRBX0NBQ0hFLmdldF9hdHRyaWJ1dGVfYnlfbmFtZSgnJHthdHRySW5mby5uYW1lfScsIERXX01FVEFEQVRBX0NBQ0hFLmdldF9lbnRpdHlfY2xhc3NfYnlfbmFtZSgnJHthdHRySW5mby5jbGFzc05hbWV9JykuaWQpLmlkIH19YDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmtUeXBlTWFwLmhhcyhpZFRvVGVzdCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmtUeXBlSW5mbyA9IGxpbmtUeXBlTWFwLmdldChpZFRvVGVzdCkhO1xuICAgICAgICAgICAgY29uc3Qgc291cmNlQ2xhc3MgPSBzZXRNYXAuZ2V0KGxpbmtUeXBlSW5mby5zb3VyY2VDb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Q2xhc3MgPSBzZXRNYXAuZ2V0KGxpbmtUeXBlSW5mby50YXJnZXRDb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZUNsYXNzICYmIHRhcmdldENsYXNzKSB7XG4gICAgICAgICAgICAgIHJldHVybiBge3sgRFdfTUVUQURBVEFfQ0FDSEUuZ2V0X2xpbmtfdHlwZV9ieV9uYW1lKCcke2xpbmtUeXBlSW5mby5uYW1lfScsIERXX01FVEFEQVRBX0NBQ0hFLmdldF9lbnRpdHlfY2xhc3NfYnlfbmFtZSgnJHtzb3VyY2VDbGFzc30nKS5pZCwgRFdfTUVUQURBVEFfQ0FDSEUuZ2V0X2VudGl0eV9jbGFzc19ieV9uYW1lKCcke3RhcmdldENsYXNzfScpLmlkKS5pZCB9fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIGB7eyBlcnJvciBwcm9jZXNzaW5nIGlkICR7aWRUb1Rlc3R9ICh1bmtub3duIHR5cGUsIGxpbmsgd2l0aCBtaXNzaW5nIHNvdXJjZS90YXJnZXQpIC0gbm90IGZvdW5kIG9yIHBlcm1pc3Npb25zPyB9fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBge3sgZXJyb3IgcHJvY2Vzc2luZyBpZCAke2lkVG9UZXN0fSAodW5rbm93biB0eXBlKSAtIG5vdCBmb3VuZCBvciBwZXJtaXNzaW9ucz8gfX1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7IC8vIFJldHVybiBvcmlnaW5hbCB2YWx1ZSBpZiBpdCdzIG5vdCBhIHBvdGVudGlhbCBJRCBvciBpZiBubyB0cmFuc2Zvcm1hdGlvbiBhcHBsaWVkIGJhc2VkIG9uIGhpbnRcbiAgICB9O1xuXG4gICAgY29uc3QgdHJhbnNmb3JtID0gKGN1cnJlbnRDb250ZXh0UGFydDogYW55LCBzZW1hbnRpY0hpbnQ6ICdzZXQnIHwgJ2F0dHJpYnV0ZScgfCAnbGluaycgfCAndW5rbm93bicgPSAndW5rbm93bicpOiBhbnkgPT4ge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudENvbnRleHRQYXJ0KSkge1xuICAgICAgICByZXR1cm4gY3VycmVudENvbnRleHRQYXJ0Lm1hcChpdGVtID0+IHRyYW5zZm9ybShpdGVtLCBzZW1hbnRpY0hpbnQpKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1cnJlbnRDb250ZXh0UGFydCA9PT0gJ29iamVjdCcgJiYgY3VycmVudENvbnRleHRQYXJ0ICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG5ld09iajogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjdXJyZW50Q29udGV4dFBhcnQpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGN1cnJlbnRDb250ZXh0UGFydCwga2V5KSkge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWROZXdLZXkgPSB0cmFuc2Zvcm1LZXlJZk5lZWRlZChrZXkpOyAvLyBLZXlzIGFyZSBvbmx5IGhpbnRlZCBhcyBzZXRzIChvciBub3QgYXQgYWxsKVxuICAgICAgICAgICAgbGV0IG5leHRTZW1hbnRpY0hpbnQ6ICdzZXQnIHwgJ2F0dHJpYnV0ZScgfCAnbGluaycgfCAndW5rbm93bicgPSAndW5rbm93bic7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnZW50aXR5Q2xhc3NJZCcgfHwga2V5ID09PSAnZW50aXR5Q2xhc3NJZHMnIHx8IGtleSA9PT0gJ2NsYXNzSWQnKSB7XG4gICAgICAgICAgICAgIG5leHRTZW1hbnRpY0hpbnQgPSAnc2V0JztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnYXR0cmlidXRlSWQnIHx8IGtleSA9PT0gJ2F0dHJpYnV0ZUlkcycpIHtcbiAgICAgICAgICAgICAgbmV4dFNlbWFudGljSGludCA9ICdhdHRyaWJ1dGUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdsaW5rVHlwZUlkJyB8fCBrZXkgPT09ICdsaW5rVHlwZUlkcycpIHtcbiAgICAgICAgICAgICAgbmV4dFNlbWFudGljSGludCA9ICdsaW5rJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhlIGtleSBpcyAndmFsdWUnLCBwcmVzZXJ2ZSBpdHMgb3JpZ2luYWwgdmFsdWUgZGlyZWN0bHkuXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHByb2NlZWQgd2l0aCB0aGUgc3RhbmRhcmQgdHJhbnNmb3JtYXRpb24uXG4gICAgICAgICAgICBpZiAoa2V5ID09PSBcInZhbHVlXCIpIHtcbiAgICAgICAgICAgICAgbmV3T2JqW3RyYW5zZm9ybWVkTmV3S2V5XSA9IGN1cnJlbnRDb250ZXh0UGFydFtrZXldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV3T2JqW3RyYW5zZm9ybWVkTmV3S2V5XSA9IHRyYW5zZm9ybShjdXJyZW50Q29udGV4dFBhcnRba2V5XSwgbmV4dFNlbWFudGljSGludCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtVmFsdWUoY3VycmVudENvbnRleHRQYXJ0LCBzZW1hbnRpY0hpbnQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gdHJhbnNmb3JtKEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29udGV4dCkpKTsgLy8gSW5pdGlhbCBjYWxsLCBubyBzcGVjaWZpYyBoaW50IChkZWZhdWx0cyB0byAndW5rbm93bicpXG4gIH1cblxuICBwcml2YXRlIGhhbmRsZU1vZGVDaGFuZ2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc3RvcmVkQ29udGV4dFJhZGlvPy5jaGVja2VkKSB7XG4gICAgICB0aGlzLmNvbnRleHRTb3VyY2VNb2RlID0gJ3N0b3JlZCc7XG4gICAgfSBlbHNlIGlmICh0aGlzLmN1c3RvbUNvbnRleHRSYWRpbz8uY2hlY2tlZCkge1xuICAgICAgdGhpcy5jb250ZXh0U291cmNlTW9kZSA9ICdjdXN0b20nO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUNvbnRleHREaXNwbGF5Vmlld3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ29udGV4dERpc3BsYXlWaWV3cygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250ZXh0U291cmNlTW9kZSA9PT0gJ3N0b3JlZCcpIHtcbiAgICAgIGlmICh0aGlzLmNvbnRlbnRBcmVhKSB0aGlzLmNvbnRlbnRBcmVhLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgaWYgKHRoaXMuY3VzdG9tQ29udGV4dFRleHRBcmVhKSB0aGlzLmN1c3RvbUNvbnRleHRUZXh0QXJlYS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdwZHdjX2xhc3RfcmV0cmlldmVkX2NvbnRleHQnLCAocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHN0b3JlZCBjb250ZXh0OicsIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgaWYgKHRoaXMuY29udGVudEFyZWEpIHRoaXMuY29udGVudEFyZWEudGV4dENvbnRlbnQgPSAnRXJyb3IgbG9hZGluZyBzdG9yZWQgY29udGV4dC4nO1xuICAgICAgICAgIHRoaXMucmF3Q29udGV4dERhdGEgPSBudWxsO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0LnBkd2NfbGFzdF9yZXRyaWV2ZWRfY29udGV4dCkge1xuICAgICAgICAgIHRoaXMucmF3Q29udGV4dERhdGEgPSByZXN1bHQucGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0O1xuICAgICAgICAgIGlmICh0aGlzLmNvbnRlbnRBcmVhKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRBcmVhLnRleHRDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkodGhpcy5yYXdDb250ZXh0RGF0YSwgbnVsbCwgMik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN0cmluZ2lmeWluZyBzdG9yZWQgY29udGV4dDonLCBlKTtcbiAgICAgICAgICAgICAgdGhpcy5jb250ZW50QXJlYS50ZXh0Q29udGVudCA9ICdFcnJvciBkaXNwbGF5aW5nIHN0b3JlZCBjb250ZXh0OiBJbnZhbGlkIEpTT04uJztcbiAgICAgICAgICAgICAgdGhpcy5yYXdDb250ZXh0RGF0YSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLmNvbnRlbnRBcmVhKSB0aGlzLmNvbnRlbnRBcmVhLnRleHRDb250ZW50ID0gJ05vIHN0b3JlZCBjb250ZXh0IGF2YWlsYWJsZS4nO1xuICAgICAgICAgIHRoaXMucmF3Q29udGV4dERhdGEgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY29udGVudEFyZWEpIHRoaXMuY29udGVudEFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGlmICh0aGlzLmN1c3RvbUNvbnRleHRUZXh0QXJlYSkge1xuICAgICAgICB0aGlzLmN1c3RvbUNvbnRleHRUZXh0QXJlYS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjdGl2ZUNvbnRleHQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5jb250ZXh0U291cmNlTW9kZSA9PT0gJ2N1c3RvbScpIHtcbiAgICAgIGlmICghdGhpcy5jdXN0b21Db250ZXh0VGV4dEFyZWEgfHwgdGhpcy5jdXN0b21Db250ZXh0VGV4dEFyZWEudmFsdWUudHJpbSgpID09PSAnJykge1xuICAgICAgICBhbGVydCgnQ3VzdG9tIGNvbnRleHQgaXMgZW1wdHkuIFBsZWFzZSBwYXN0ZSB5b3VyIEpTT04uJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3VzdG9tRGF0YSA9IEpTT04ucGFyc2UodGhpcy5jdXN0b21Db250ZXh0VGV4dEFyZWEudmFsdWUpO1xuICAgICAgICB0aGlzLnJhd0NvbnRleHREYXRhID0gY3VzdG9tRGF0YTtcbiAgICAgICAgcmV0dXJuIGN1c3RvbURhdGE7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gJ0FuIHVua25vd24gZXJyb3Igb2NjdXJyZWQuJztcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICB9XG4gICAgICAgIGFsZXJ0KCdJbnZhbGlkIEpTT04gaW4gY3VzdG9tIGNvbnRleHQgYXJlYS4gUGxlYXNlIGNvcnJlY3QgaXQuXFxuXFxuRXJyb3I6ICcgKyBlcnJvck1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdQQUJMTyBEVyBDSEFEOiBFcnJvciBwYXJzaW5nIGN1c3RvbSBKU09OIGNvbnRleHQ6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmF3Q29udGV4dERhdGE7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGNvcHlGb3JtYXR0ZWRDb250ZXh0VG9DbGlwYm9hcmQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWN0aXZlQ29udGV4dCA9IGF3YWl0IHRoaXMuZ2V0QWN0aXZlQ29udGV4dCgpO1xuICAgIGlmICghYWN0aXZlQ29udGV4dCB8fCAhdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uKSByZXR1cm47XG5cbiAgICB0aGlzLmNvcHlGb3JtYXR0ZWRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIGxldCBkYXRhVG9Db3B5ID0gYWN0aXZlQ29udGV4dDtcblxuICAgIGlmICh0aGlzLmppbmphQ2hlY2tib3g/LmNoZWNrZWQpIHtcbiAgICAgIGRhdGFUb0NvcHkgPSBhd2FpdCB0aGlzLmppbmlmeUNvbnRleHQoYWN0aXZlQ29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGRhdGFUb0NvcHksIG51bGwsIDIpO1xuICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGpzb25TdHJpbmcpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxUZXh0ID0gdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uIS50ZXh0Q29udGVudDtcbiAgICAgIHRoaXMuY29weUZvcm1hdHRlZEJ1dHRvbiEudGV4dENvbnRlbnQgPSAnQ29waWVkISc7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uIS50ZXh0Q29udGVudCA9IG9yaWdpbmFsVGV4dDtcbiAgICAgICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uIS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgfSwgMTUwMCk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjb3B5IGZvcm1hdHRlZCBKU09OOiAnLCBlcnIpO1xuICAgICAgdGhpcy5jb3B5Rm9ybWF0dGVkQnV0dG9uIS50ZXh0Q29udGVudCA9ICdFcnJvciEnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuY29weUZvcm1hdHRlZEJ1dHRvbiEudGV4dENvbnRlbnQgPSAnQ29weSBGb3JtYXR0ZWQgSlNPTic7XG4gICAgICAgIHRoaXMuY29weUZvcm1hdHRlZEJ1dHRvbiEuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIH0sIDE1MDApO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGNvcHlFc2NhcGVkQ29udGV4dFRvQ2xpcGJvYXJkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGFjdGl2ZUNvbnRleHQgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZUNvbnRleHQoKTtcbiAgICBpZiAoIWFjdGl2ZUNvbnRleHQgfHwgIXRoaXMuY29weUVzY2FwZWRCdXR0b24pIHJldHVybjtcblxuICAgIHRoaXMuY29weUVzY2FwZWRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIGxldCBkYXRhVG9Db3B5ID0gYWN0aXZlQ29udGV4dDtcblxuICAgIGlmICh0aGlzLmppbmphQ2hlY2tib3g/LmNoZWNrZWQpIHtcbiAgICAgIGRhdGFUb0NvcHkgPSBhd2FpdCB0aGlzLmppbmlmeUNvbnRleHQoYWN0aXZlQ29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGFjdEpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShkYXRhVG9Db3B5KTtcbiAgICBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChKU09OLnN0cmluZ2lmeShjb21wYWN0SnNvblN0cmluZykpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxUZXh0ID0gdGhpcy5jb3B5RXNjYXBlZEJ1dHRvbiEudGV4dENvbnRlbnQ7XG4gICAgICB0aGlzLmNvcHlFc2NhcGVkQnV0dG9uIS50ZXh0Q29udGVudCA9ICdDb3BpZWQhJztcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmNvcHlFc2NhcGVkQnV0dG9uIS50ZXh0Q29udGVudCA9IG9yaWdpbmFsVGV4dDtcbiAgICAgICAgdGhpcy5jb3B5RXNjYXBlZEJ1dHRvbiEuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIH0sIDE1MDApO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY29weSBlc2NhcGVkIEpTT046ICcsIGVycik7XG4gICAgICB0aGlzLmNvcHlFc2NhcGVkQnV0dG9uIS50ZXh0Q29udGVudCA9ICdFcnJvciEnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuY29weUVzY2FwZWRCdXR0b24hLnRleHRDb250ZW50ID0gJ0NvcHkgYXMgRXNjYXBlZCBTdHJpbmcnO1xuICAgICAgICB0aGlzLmNvcHlFc2NhcGVkQnV0dG9uIS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgfSwgMTUwMCk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgaGFuZGxlUmVmcmVzaE1ldGFkYXRhKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5yZWZyZXNoTWV0YWRhdGFCdXR0b24pIHJldHVybjtcblxuICAgIGNvbnN0IG9yaWdpbmFsQnV0dG9uVGV4dCA9IHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLmlubmVySFRNTDtcbiAgICB0aGlzLnJlZnJlc2hNZXRhZGF0YUJ1dHRvbi5pbm5lckhUTUwgPSAnJiN4MjFCQjsgUmVmcmVzaGluZy4uLic7IFxuICAgIHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZygnUEFCTE8gRFcgQ0hBRDogQ29udGV4dFRvb2wgLSBSZWZyZXNoaW5nIG1ldGFkYXRhLi4uJyk7XG4gICAgICBjb25zdCBbbmV3QXR0cmlidXRlcywgbmV3U2V0c10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGZldGNoQXR0cmlidXRlcyh0aGlzLmJhc2VVcmwpLCAvLyBObyB0b2tlbiBuZWVkZWRcbiAgICAgICAgZmV0Y2hTZXRzKHRoaXMuYmFzZVVybCkgICAgICAvLyBObyB0b2tlbiBuZWVkZWRcbiAgICAgIF0pO1xuXG4gICAgICB0aGlzLmFsbEF0dHJpYnV0ZXMgPSBuZXdBdHRyaWJ1dGVzO1xuICAgICAgdGhpcy5hbGxTZXRzID0gbmV3U2V0cztcbiAgICAgIHRoaXMuYWxsTGlua1R5cGVzID0gW107IC8vIFJlc2V0IGJlZm9yZSBmZXRjaGluZ1xuXG4gICAgICBpZiAodGhpcy5hbGxTZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYFBBQkxPIERXIENIQUQ6IEZvdW5kICR7dGhpcy5hbGxTZXRzLmxlbmd0aH0gc2V0cy4gRmV0Y2hpbmcgbGluayB0eXBlcyBpbiBiYXRjaGVzIGZvciBDb250ZXh0UmV0cmlldmFsVG9vbC5gKTtcbiAgICAgICAgY29uc3Qgc2V0SWRzID0gdGhpcy5hbGxTZXRzLm1hcChzZXQgPT4gc2V0LmlkKTsgXG4gICAgICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDUwOyAvLyBTYW1lIGJhdGNoIHNpemUgYXMgU3VwZXJTZWFyY2ggZm9yIGNvbnNpc3RlbmN5XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2V0SWRzLmxlbmd0aDsgaSArPSBiYXRjaFNpemUpIHtcbiAgICAgICAgICBjb25zdCBiYXRjaE9mU2V0SWRzID0gc2V0SWRzLnNsaWNlKGksIGkgKyBiYXRjaFNpemUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBmZXRjaGVkTGlua1R5cGVzID0gYXdhaXQgZmV0Y2hMaW5rVHlwZXNCeUNsYXNzSWRzKHRoaXMuYmFzZVVybCwgYmF0Y2hPZlNldElkcyk7XG4gICAgICAgICAgICB0aGlzLmFsbExpbmtUeXBlcy5wdXNoKC4uLmZldGNoZWRMaW5rVHlwZXMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGxpbmtGZXRjaEVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBQQUJMTyBEVyBDSEFEOiBFcnJvciBmZXRjaGluZyBiYXRjaCBvZiBsaW5rIHR5cGVzIGZvciBDb250ZXh0UmV0cmlldmFsVG9vbCAoU2V0IElEcyAke2JhdGNoT2ZTZXRJZHMuam9pbignLCAnKX0pOmAsIGxpbmtGZXRjaEVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYFBBQkxPIERXIENIQUQ6IEZpbmlzaGVkIGZldGNoaW5nIGFsbCBsaW5rIHR5cGVzIGZvciBDb250ZXh0UmV0cmlldmFsVG9vbC4gVG90YWw6ICR7dGhpcy5hbGxMaW5rVHlwZXMubGVuZ3RofWApO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBzYXZlRGF0YVRvQ2FjaGUodGhpcy5iYXNlVXJsLCB0aGlzLmFsbEF0dHJpYnV0ZXMsIHRoaXMuYWxsU2V0cywgdGhpcy5hbGxMaW5rVHlwZXMpO1xuICAgICAgY29uc29sZS5sb2coJ1BBQkxPIERXIENIQUQ6IENvbnRleHRUb29sIC0gTWV0YWRhdGEgcmVmcmVzaGVkIGFuZCBjYWNoZWQuJywgdGhpcy5hbGxBdHRyaWJ1dGVzLmxlbmd0aCwgdGhpcy5hbGxTZXRzLmxlbmd0aCwgdGhpcy5hbGxMaW5rVHlwZXMubGVuZ3RoKTtcbiAgICAgIHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLmlubmVySFRNTCA9ICcmI3gyMUJCOyBSZWZyZXNoZWQhJzsgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1BBQkxPIERXIENIQUQ6IENvbnRleHRUb29sIC0gRmFpbGVkIHRvIHJlZnJlc2ggbWV0YWRhdGE6JywgZXJyb3IpO1xuICAgICAgdGhpcy5yZWZyZXNoTWV0YWRhdGFCdXR0b24uaW5uZXJIVE1MID0gJyYjeDIxQkI7IEVycm9yISc7IFxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uKSB7IFxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTWV0YWRhdGFCdXR0b24uaW5uZXJIVE1MID0gb3JpZ2luYWxCdXR0b25UZXh0OyBcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1ldGFkYXRhQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0sIDIwMDApOyBcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZ2V0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnRvb2xFbGVtZW50O1xuICB9XG5cbiAgcHVibGljIGdldElzVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc1Zpc2libGU7XG4gIH1cblxuICBwcml2YXRlIHN0b3JhZ2VDaGFuZ2VMaXN0ZW5lcihjaGFuZ2VzOiB7IFtrZXk6IHN0cmluZ106IGNocm9tZS5zdG9yYWdlLlN0b3JhZ2VDaGFuZ2UgfSwgbmFtZXNwYWNlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSAnbG9jYWwnICYmIGNoYW5nZXMucGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0KSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogQ1JUIC0gRGV0ZWN0ZWQgY2hhbmdlIGluIHBkd2NfbGFzdF9yZXRyaWV2ZWRfY29udGV4dCB2aWEgc3RvcmFnZSBsaXN0ZW5lci5cIik7XG4gICAgICBpZiAodGhpcy5jb250ZXh0U291cmNlTW9kZSA9PT0gJ3N0b3JlZCcpIHtcbiAgICAgICAgdGhpcy5yYXdDb250ZXh0RGF0YSA9IGNoYW5nZXMucGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0Lm5ld1ZhbHVlIHx8IG51bGw7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udGV4dERpc3BsYXlWaWV3cygpO1xuICAgICAgICBzaG93VG9hc3QoJ1N0b3JlZCBjb250ZXh0IHVwZGF0ZWQgYXV0b21hdGljYWxseS4nLCAnaW5mbycsIDIwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yYXdDb250ZXh0RGF0YSA9IGNoYW5nZXMucGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0Lm5ld1ZhbHVlIHx8IG51bGw7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBDUlQgLSBJbiBjdXN0b20gbW9kZTsgcGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0IHVwZGF0ZWQgaW4gYmFja2dyb3VuZC5cIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplU3RvcmVkQ29udGV4dExpc3RlbmVyKCk6IHZvaWQge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncGR3Y19sYXN0X3JldHJpZXZlZF9jb250ZXh0JywgKHJlc3VsdCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiUEFCTE8nUyBEVyBDSEFEOiBDUlQgLSBFcnJvciBnZXR0aW5nIGluaXRpYWwgc3RvcmVkIGNvbnRleHQ6XCIsIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhpcy5yYXdDb250ZXh0RGF0YSA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJhd0NvbnRleHREYXRhID0gcmVzdWx0LnBkd2NfbGFzdF9yZXRyaWV2ZWRfY29udGV4dCB8fCBudWxsO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogQ1JUIC0gSW5pdGlhbCBzdG9yZWQgY29udGV4dCBsb2FkZWQ6XCIsIHRoaXMucmF3Q29udGV4dERhdGEgPyAnRGF0YSBmb3VuZCcgOiAnTm8gZGF0YScpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY29udGV4dFNvdXJjZU1vZGUgPT09ICdzdG9yZWQnKSB7IFxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udGV4dERpc3BsYXlWaWV3cygpO1xuICAgICAgfVxuICAgIH0pO1xuICBcbiAgICBjaHJvbWUuc3RvcmFnZS5vbkNoYW5nZWQuYWRkTGlzdGVuZXIodGhpcy5ib3VuZFN0b3JhZ2VDaGFuZ2VMaXN0ZW5lcik7XG4gIH1cbn1cbiIsIi8vIHNyYy9jb250ZW50X3NjcmlwdHMvY29udGVudF9zY3JpcHQudHNcbmltcG9ydCB7IERyYWdnYWJsZUljb24gfSBmcm9tICdAc3JjL3VpL0RyYWdnYWJsZUljb24nO1xuaW1wb3J0IHsgVG9vbE1lbnUgfSBmcm9tICdAc3JjL3VpL1Rvb2xNZW51JztcbmltcG9ydCB7IFN1cGVyU2VhcmNoIH0gZnJvbSAnQHNyYy91aS9TdXBlclNlYXJjaCc7XG5pbXBvcnQgeyBTcWxDb25maWdDb252ZXJ0ZXJUb29sIH0gZnJvbSAnLi4vdWkvU3FsQ29uZmlnQ29udmVydGVyVG9vbCc7XG5pbXBvcnQgeyBDb250ZXh0UmV0cmlldmFsVG9vbCB9IGZyb20gJy4uL3VpL0NvbnRleHRSZXRyaWV2YWxUb29sJztcblxuY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogQ29udGVudCBzY3JpcHQgbG9hZGVkLmApO1xuXG5sZXQgYmFzZVVybDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5sZXQgZGF0YXdhbGtBcHBWZXJzaW9uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbmxldCBwZHdjSW5pdGlhbGl6ZWQgPSBmYWxzZTsgLy8gRmxhZyB0byBlbnN1cmUgVUkgaXMgaW5pdGlhbGl6ZWQgb25seSBvbmNlXG5cbi8qKlxuICogSW5qZWN0cyBhIHNjcmlwdCBpbnRvIHRoZSBwYWdlIHRvIGFjY2VzcyB3aW5kb3cgdmFyaWFibGVzLlxuICovXG5mdW5jdGlvbiBpbmplY3RQYWdlU2NyaXB0KCk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5zcmMgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ2luamVjdGVkX3NjcmlwdC5qcycpO1xuICAgIChkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICBzY3JpcHQub25sb2FkID0gKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYFBBQkxPJ1MgRFcgQ0hBRDogSW5qZWN0ZWQgc2NyaXB0IGxvYWRlZC5gKTtcbiAgICAgIHNjcmlwdC5yZW1vdmUoKTsgLy8gQ2xlYW4gdXAgdGhlIHNjcmlwdCB0YWdcbiAgICB9O1xuICAgIHNjcmlwdC5vbmVycm9yID0gKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgUEFCTE8nUyBEVyBDSEFEOiBFcnJvciBsb2FkaW5nIGluamVjdGVkX3NjcmlwdC5qc2AsIGUpO1xuICAgIH07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEVycm9yIGluamVjdGluZyBwYWdlIHNjcmlwdDpgLCBlKTtcbiAgfVxufVxuXG4vKipcbiAqIEhhbmRsZXMgbWVzc2FnZXMgZnJvbSB0aGUgaW5qZWN0ZWQgc2NyaXB0LlxuICovXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xuICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEudHlwZSB8fCAhZXZlbnQuZGF0YS5zb3VyY2U/LnN0YXJ0c1dpdGgoJ3BhYmxvcy1kdy1jaGFkLWluamVjdGVkJykpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBNZXNzYWdlIHJlY2VpdmVkIGluIGNvbnRlbnQgc2NyaXB0IGZyb20gaW5qZWN0ZWQgc2NyaXB0OmAsIGV2ZW50LmRhdGEpO1xuXG4gIGlmIChldmVudC5kYXRhLnR5cGUgPT09ICdEQVRBV0FMS19BUFBfSU5GTycpIHtcbiAgICBiYXNlVXJsID0gZXZlbnQuZGF0YS5iYXNlVXJsO1xuICAgIGRhdGF3YWxrQXBwVmVyc2lvbiA9IGV2ZW50LmRhdGEudmVyc2lvbjtcbiAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBSZWNlaXZlZCBEYXRhV2FsayBpbmZvOmAsIHsgYmFzZVVybCwgZGF0YXdhbGtBcHBWZXJzaW9uIH0pO1xuXG4gICAgaWYgKGJhc2VVcmwgJiYgZGF0YXdhbGtBcHBWZXJzaW9uKSB7XG4gICAgICBpbml0aWFsaXplRXh0ZW5zaW9uVUkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKGBQQUJMTydTIERXIENIQUQ6IENvdWxkIG5vdCByZXRyaWV2ZSBuZWNlc3NhcnkgRGF0YVdhbGsgaW5mbyBmcm9tIHBhZ2UuYCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGV2ZW50LmRhdGEudHlwZSA9PT0gJ0RBVEFXQUxLX0FQUF9JTkZPX05PVF9GT1VORCcpe1xuICAgIGNvbnNvbGUud2FybihgUEFCTE8nUyBEVyBDSEFEOiBEQVRBV0FMS19BUFBfVkVSU0lPTiBvciBiYXNlVXJsIG5vdCBmb3VuZCBieSBpbmplY3RlZCBzY3JpcHQuYCk7XG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplRXh0ZW5zaW9uVUkoKTogdm9pZCB7XG4gIGlmIChwZHdjSW5pdGlhbGl6ZWQpIHtcbiAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBVSSBhbHJlYWR5IGluaXRpYWxpemVkLmApO1xuICAgIHJldHVybjtcbiAgfVxuICBwZHdjSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBJbml0aWFsaXppbmcgVUkuLi5gKTtcblxuICAvLyBJbmplY3QgRm9udEF3ZXNvbWUgaWYgbm90IGFscmVhZHkgYXZhaWxhYmxlXG4gIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbGlua1tocmVmKj1cImZvbnRhd2Vzb21lXCJdJykgJiYgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N0eWxlW2lkKj1cImZvbnRhd2Vzb21lXCJdJykpIHtcbiAgICBjb25zdCBmYUxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgZmFMaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICBmYUxpbmsuaHJlZiA9ICdodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9mb250LWF3ZXNvbWUvNi41LjEvY3NzL2FsbC5taW4uY3NzJzsgLy8gVXNpbmcgYSBzcGVjaWZpYywgcmVjZW50IHZlcnNpb25cbiAgICBmYUxpbmsuaW50ZWdyaXR5ID0gJ3NoYTUxMi1EVE9RTzlSV0NIM3BwR3FjV2FFQTFCSVpPQzZ4eGFsd0VzdzljMlFRZUFJZnRsK1ZlZ292bG5lZTFjOVFYNFRjdG5XTW4xM1RaeWUrZ2lNbThlMkx3QT09JztcbiAgICBmYUxpbmsuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcbiAgICBmYUxpbmsucmVmZXJyZXJQb2xpY3kgPSAnbm8tcmVmZXJyZXInO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZmFMaW5rKTtcbiAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBGb250QXdlc29tZSBDU1MgaW5qZWN0ZWQuYCk7XG4gIH1cblxuICAvLyBEZWZpbmUgdGhlIFN1cGVyU2VhcmNoIGluc3RhbmNlIGdsb2JhbGx5IG9yIGluIGEgd2F5IGl0IGNhbiBiZSBhY2Nlc3NlZC9yZXVzZWRcbiAgbGV0IHN1cGVyU2VhcmNoSW5zdGFuY2U6IFN1cGVyU2VhcmNoIHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gSW5zdGFudGlhdGUgdGhlIG5ldyBDb250ZXh0UmV0cmlldmFsVG9vbFxuICBsZXQgY29udGV4dFJldHJpZXZhbFRvb2w6IENvbnRleHRSZXRyaWV2YWxUb29sIHwgbnVsbCA9IG51bGw7XG4gIGlmIChiYXNlVXJsKSB7XG4gICAgY29udGV4dFJldHJpZXZhbFRvb2wgPSBuZXcgQ29udGV4dFJldHJpZXZhbFRvb2woYmFzZVVybCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS53YXJuKFwiUEFCTE8nUyBEVyBDSEFEOiBCYXNlVVJMIG5vdCBhdmFpbGFibGUsIENvbnRleHRSZXRyaWV2YWxUb29sIG5vdCBpbml0aWFsaXplZC5cIik7XG4gIH1cblxuICBjb25zdCBvcGVuU3VwZXJTZWFyY2ggPSAoKSA9PiB7XG4gICAgaWYgKCFiYXNlVXJsKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBQQUJMTydTIERXIENIQUQ6IEJhc2UgVVJMIG5vdCBhdmFpbGFibGUgZm9yIFN1cGVyIFNlYXJjaC5gKTtcbiAgICAgIGFsZXJ0KCdFcnJvcjogRGF0YVdhbGsgQmFzZSBVUkwgbm90IGZvdW5kLiBDYW5ub3Qgb3BlbiBTdXBlciBTZWFyY2guJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghc3VwZXJTZWFyY2hJbnN0YW5jZSB8fCAhZG9jdW1lbnQuYm9keS5jb250YWlucyhzdXBlclNlYXJjaEluc3RhbmNlLmdldEVsZW1lbnQoKSkpIHtcbiAgICAgIHN1cGVyU2VhcmNoSW5zdGFuY2UgPSBuZXcgU3VwZXJTZWFyY2goYmFzZVVybCk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN1cGVyU2VhcmNoSW5zdGFuY2UuZ2V0RWxlbWVudCgpKTtcbiAgICB9XG4gICAgc3VwZXJTZWFyY2hJbnN0YW5jZS5vcGVuKCk7XG4gICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IFN1cGVyU2VhcmNoIG9wZW5lZCB2aWEgaWNvbiBjbGljay5cIik7XG4gIH07XG5cbiAgY29uc3Qgb3BlbkNvZGVUb29sID0gKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUEFCTE8nUyBEVyBDSEFEOiBDb2RlIHRvb2wgaWNvbiBjbGlja2VkLCBvcGVuaW5nIFNRTCBDb25maWcgQ29udmVydGVyLlwiKTtcbiAgICBjb25zdCBjb252ZXJ0ZXJUb29sID0gU3FsQ29uZmlnQ29udmVydGVyVG9vbC5nZXRJbnN0YW5jZSgpO1xuICAgIGNvbnZlcnRlclRvb2wub3BlbigpO1xuICB9O1xuXG4gIGNvbnN0IG9wZW5Db250ZXh0UmV0cmlldmFsVG9vbCA9ICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhcIlBBQkxPJ1MgRFcgQ0hBRDogQ29udGV4dCByZXRyaWV2YWwgaWNvbiBjbGlja2VkLCB0b2dnbGluZyB0b29sLlwiKTtcbiAgICBpZiAoY29udGV4dFJldHJpZXZhbFRvb2wpIHtcbiAgICAgIGlmIChjb250ZXh0UmV0cmlldmFsVG9vbC5nZXRJc1Zpc2libGUoKSkge1xuICAgICAgICBjb250ZXh0UmV0cmlldmFsVG9vbC5oaWRlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0UmV0cmlldmFsVG9vbC5zaG93KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIlBBQkxPJ1MgRFcgQ0hBRDogQ29udGV4dFJldHJpZXZhbFRvb2wgbm90IGluaXRpYWxpemVkIGJlY2F1c2UgYmFzZVVybCB3YXMgbm90IGF2YWlsYWJsZS5cIik7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHRvb2xNZW51ID0gbmV3IFRvb2xNZW51KCh0b29sSWQpID0+IHtcbiAgICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBUb29sIHNlbGVjdGVkIGZyb20gbWVudTpgLCB0b29sSWQpO1xuICAgIGlmICh0b29sSWQgPT09ICdzdXBlci1zZWFyY2gnKSB7XG4gICAgICBvcGVuU3VwZXJTZWFyY2goKTsgLy8gVXNlIHRoZSByZWZhY3RvcmVkIGZ1bmN0aW9uXG4gICAgfVxuICAgIC8vIEFkZCBvdGhlciB0b29sIG1lbnUgaXRlbSBoYW5kbGVycyBoZXJlIGlmIGFueVxuICB9KTtcbiAgLy8gQXBwZW5kIG1lbnUgdG8gYm9keSwgaXQgd2lsbCBiZSBoaWRkZW4gYnkgZGVmYXVsdFxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRvb2xNZW51LmdldEVsZW1lbnQoKSk7XG5cbiAgLy8gSW5zdGFudGlhdGUgRHJhZ2dhYmxlSWNvbiB3aXRoIGNhbGxiYWNrcyBmb3IgdGhlIG5ldyB0b29sIGljb25zXG4gIC8vIGFuZCB0aGUgb3JpZ2luYWwgbWFpbiBpY29uIGNsaWNrIGhhbmRsZXIgZm9yIHRoZSBUb29sTWVudVxuICBjb25zdCBkcmFnZ2FibGVJY29uID0gbmV3IERyYWdnYWJsZUljb24oXG4gICAgb3BlblN1cGVyU2VhcmNoLCAgICAvLyBDYWxsYmFjayBmb3Igc2VhcmNoIGljb25cbiAgICBvcGVuQ29kZVRvb2wsICAgICAgIC8vIENhbGxiYWNrIGZvciBjb2RlIGljb25cbiAgICBvcGVuQ29udGV4dFJldHJpZXZhbFRvb2wsIC8vIENhbGxiYWNrIGZvciB0aGUgbmV3IGNvbnRleHQgaWNvblxuICAgICgpID0+IHsgICAgICAgICAgICAgLy8gQ2FsbGJhY2sgZm9yIG1haW4gZHJhZ2dhYmxlIGljb24gY2xpY2sgKG9wZW5zIFRvb2xNZW51KVxuICAgICAgY29uc29sZS5sb2coXCJQQUJMTydTIERXIENIQUQ6IE1haW4gRHJhZ2dhYmxlSWNvbiBvbkNsaWNrIHRyaWdnZXJlZCwgb3BlbmluZyBUb29sTWVudS5cIik7XG4gICAgICBjb25zdCBpY29uUmVjdCA9IGRyYWdnYWJsZUljb24uZ2V0RWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdG9vbE1lbnUudG9nZ2xlKGljb25SZWN0LmxlZnQsIGljb25SZWN0LnRvcCk7XG4gICAgfVxuICApO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRyYWdnYWJsZUljb24uZ2V0RWxlbWVudCgpKTtcblxuICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBEcmFnZ2FibGUgaWNvbiwgdG9vbCBtZW51LCBhbmQgbmV3IGljb24gaGFuZGxlcnMgaW5pdGlhbGl6ZWQuYCk7XG59XG5cbi8qKlxuICogQ2hlY2sgZm9yIERBVEFXQUxLX0FQUF9WRVJTSU9OIGFuZCBiYXNlVXJsLlxuICovXG5mdW5jdGlvbiBjaGVja0ZvckRhdGF3YWxrKCk6IHZvaWQge1xuICBjb25zb2xlLmxvZyhgUEFCTE8nUyBEVyBDSEFEOiBDaGVja2luZyBmb3IgRGF0YVdhbGsgZW52aXJvbm1lbnQgYnkgaW5qZWN0aW5nIHNjcmlwdC4uLmApO1xuICBpbmplY3RQYWdlU2NyaXB0KCk7IC8vIFRoZSBpbmplY3RlZCBzY3JpcHQgd2lsbCBwb3N0IGEgbWVzc2FnZSBiYWNrXG59XG5cbi8vIFN0YXJ0IHRoZSBhY3RpdmF0aW9uIGNoZWNrXG4vLyBSdW4gYWZ0ZXIgdGhlIERPTSBpcyBsb2FkZWQgdG8gZW5zdXJlIGRvY3VtZW50LmhlYWQgaXMgYXZhaWxhYmxlXG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBjaGVja0ZvckRhdGF3YWxrKTtcbn0gZWxzZSB7XG4gIGNoZWNrRm9yRGF0YXdhbGsoKTtcbn1cblxuLy8gRW5zdXJlIHRoYXQgaWYgdGhlIHBhZ2UgdXNlcyBkeW5hbWljIGxvYWRpbmcgKFNQQSksIHdlIG1pZ2h0IG5lZWQgdG8gcmUtY2hlY2sgb3IgdXNlIGEgbW9yZSByb2J1c3QgZGV0ZWN0aW9uLlxuLy8gRm9yIG5vdywgc3RhbmRhcmQgRE9NIGxvYWRpbmcgaXMgYXNzdW1lZC5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7RUFRQSxNQUFNLGNBQWMsR0FBRztFQUNyQixJQUFBLFFBQVEsRUFBRSxrQkFBa0I7TUFDNUIsaUJBQWlCLEVBQUUseUJBQXlCOztHQUU3QztFQUVEOzs7O0VBSUc7RUFDSSxlQUFlLGVBQWUsQ0FBQyxPQUFlLEVBQUE7RUFDbkQsSUFBQSxNQUFNLFFBQVEsR0FBRyxDQUFHLEVBQUEsT0FBTyxpQ0FBaUM7RUFFNUQsSUFBQSxJQUFJO0VBQ0YsUUFBQSxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxRQUFRLEVBQUU7RUFDckMsWUFBQSxNQUFNLEVBQUUsS0FBSztFQUNiLFlBQUEsT0FBTyxFQUFFLGNBQWM7RUFDdkIsWUFBQSxXQUFXLEVBQUUsU0FBUztFQUN0QixZQUFBLElBQUksRUFBRSxNQUFNO0VBQ2IsU0FBQSxDQUFDO0VBRUYsUUFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtFQUNoQixZQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQSx3REFBQSxFQUEyRCxRQUFRLENBQUMsTUFBTSxDQUFFLENBQUEsRUFBRSxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztjQUNsSCxNQUFNLElBQUksS0FBSyxDQUFDLENBQUEsNEJBQUEsRUFBK0IsUUFBUSxDQUFDLE1BQU0sQ0FBRSxDQUFB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
