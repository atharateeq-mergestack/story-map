export type RouteData = {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: Array<{
      maneuver: {
        type: string;
        instruction: string;
        modifier?: string;
      };
      distance: number;
      duration: number;
    }>;
  }>;
};

/**
 * Custom Mapbox Control for Directions
 *
 * Displays turn-by-turn directions, route selection, and provides
 * links to open routes in Google Maps or Apple Maps.
 */
export class DirectionsControl implements mapboxgl.IControl {
  private container: HTMLElement;
  private directionsContainer: HTMLElement | null = null;
  private routes: RouteData[] = [];
  private routeDirections: string[][] = [];
  private googleMapsUrl: string = '';
  private appleMapsUrl: string = '';
  private selectedRouteIndex: number = 0;
  private onRouteChange?: (routeIndex: number, routeData: RouteData) => void;
  private map: mapboxgl.Map | null = null;
  private isVisible: boolean = false;

  constructor(
    private formatDistanceFn: (meters: number) => string,
    private formatDurationFn: (seconds: number) => string,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this.container.style.display = 'none';
  }

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    return this.container;
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  onRemove(): void {
    // Clean up ResizeObserver and window resize handler if they exist
    if (this.directionsContainer) {
      if ((this.directionsContainer as any)._resizeObserver) {
        (this.directionsContainer as any)._resizeObserver.disconnect();
        delete (this.directionsContainer as any)._resizeObserver;
      }
      if ((this.directionsContainer as any)._windowResizeHandler) {
        window.removeEventListener('resize', (this.directionsContainer as any)._windowResizeHandler);
        delete (this.directionsContainer as any)._windowResizeHandler;
      }
    }
    this.map = null;
    this.container.parentNode?.removeChild(this.container);
  }

  getDefaultPosition(): string {
    return 'top-right';
  }

  setRouteChangeCallback(callback: (routeIndex: number, routeData: RouteData) => void): void {
    this.onRouteChange = callback;
  }

  showDirections(
    routes: RouteData[],
    allDirections: string[][],
    googleMapsUrl: string,
    appleMapsUrl: string,
  ): void {
    this.routes = routes;
    this.routeDirections = allDirections;
    this.googleMapsUrl = googleMapsUrl;
    this.appleMapsUrl = appleMapsUrl;
    this.selectedRouteIndex = 0;
    this.isVisible = true;
    this.render();
    this.container.style.display = 'block';
  }

  hideDirections(): void {
    // Keep route data so we can reopen
    this.isVisible = false;
    this.container.style.display = 'none';
    if (this.directionsContainer) {
      this.directionsContainer.innerHTML = '';
    }
  }

  isDirectionsVisible(): boolean {
    return this.isVisible;
  }

  reopenDirections(): void {
    if (this.routes.length > 0 && this.routeDirections.length > 0) {
      this.isVisible = true;
      this.render();
      this.container.style.display = 'block';
      // Trigger route change callback to update map styling
      const selectedRoute = this.routes[this.selectedRouteIndex];
      if (this.onRouteChange && selectedRoute) {
        this.onRouteChange(this.selectedRouteIndex, selectedRoute);
      }
    }
  }

  switchRoute(index: number): void {
    if (index < 0 || index >= this.routes.length) {
      return;
    }
    this.selectedRouteIndex = index;
    this.render();
    if (this.onRouteChange && this.routes[index]) {
      this.onRouteChange(index, this.routes[index]);
    }
  }

  private render(): void {
    if (this.routes.length === 0 || this.routeDirections.length === 0) {
      return;
    }

    // Calculate available space within the map container
    const updateDirectionsSize = () => {
      if (!this.map || !this.directionsContainer) {
        return;
      }

      const mapContainer = this.map.getContainer();
      if (!mapContainer) {
        return;
      }

      const mapRect = mapContainer.getBoundingClientRect();
      const mapWidth = mapRect.width;
      const mapHeight = mapRect.height;

      // Calculate max dimensions: leave some padding and account for top offset (60px) and margins (20px total)
      // Ensure we don't go negative
      const maxWidth = Math.max(200, Math.min(320, mapWidth - 20)); // Min 200px, max 320px or map width minus padding
      const maxHeight = Math.max(200, mapHeight - 80); // Min 200px, map height minus top offset and bottom padding

      this.directionsContainer.style.maxWidth = `${maxWidth}px`;
      this.directionsContainer.style.maxHeight = `${maxHeight}px`;
      this.directionsContainer.style.width = `${maxWidth}px`;
    };

    if (!this.directionsContainer) {
      this.directionsContainer = document.createElement('div');
      this.directionsContainer.className = 'mapbox-directions';
      this.directionsContainer.style.cssText = `
        position: absolute;
        top: 60px;
        right: 10px;
        width: 320px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 50;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        display: flex;
        flex-direction: column;
      `;
      this.container.appendChild(this.directionsContainer);

      // Update size on map container resize
      if (this.map) {
        const mapContainer = this.map.getContainer();
        const resizeObserver = new ResizeObserver(() => {
          updateDirectionsSize();
        });
        resizeObserver.observe(mapContainer);
        // Store observer for cleanup
        (this.directionsContainer as any)._resizeObserver = resizeObserver;

        // Also update on window resize as fallback
        const windowResizeHandler = () => {
          updateDirectionsSize();
        };
        window.addEventListener('resize', windowResizeHandler);
        (this.directionsContainer as any)._windowResizeHandler = windowResizeHandler;
      }
    }

    // Update size whenever we render
    updateDirectionsSize();

    const currentRoute = this.routes[this.selectedRouteIndex];
    if (!currentRoute) {
      return;
    }
    const currentDirections = this.routeDirections[this.selectedRouteIndex] || [];

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
      position: relative;
    `;

    // Route selection buttons if multiple routes available
    let routeSelector = '';
    if (this.routes.length > 1) {
      routeSelector = `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 6px; font-weight: 500;">Select Route:</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${this.routes.map((route, index) => `
              <button 
                class="route-option-btn" 
                data-route-index="${index}"
                style="
                  flex: 1;
                  min-width: 80px;
                  padding: 6px 10px;
                  background: ${index === this.selectedRouteIndex ? '#0074D9' : 'white'};
                  color: ${index === this.selectedRouteIndex ? 'white' : '#333'};
                  border: 1px solid ${index === this.selectedRouteIndex ? '#0074D9' : '#ccc'};
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  transition: all 0.2s;
                  font-weight: ${index === this.selectedRouteIndex ? '600' : '400'};
                "
              >
                Route ${index + 1}
                <div style="font-size: 10px; margin-top: 2px; opacity: 0.9;">
                  ${this.formatDistanceFn(route.distance)}
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div style="font-weight: 600; font-size: 16px;">Directions</div>
        <button 
          class="close-directions-btn"
          style="
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
          "
          title="Close directions"
        >×</button>
      </div>
      ${routeSelector}
      <div style="font-size: 13px; color: #666;">
        <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${this.formatDistanceFn(currentRoute.distance)}</div>
        <div><strong>Duration:</strong> ${this.formatDurationFn(currentRoute.duration)}</div>
      </div>
    `;

    // Add close button handler
    const closeBtn = header.querySelector('.close-directions-btn') as HTMLElement;
    if (closeBtn) {
      closeBtn.onmouseover = () => {
        closeBtn.style.background = '#e0e0e0';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.background = 'transparent';
      };
      closeBtn.onclick = () => {
        this.hideDirections();
      };
    }

    // Add click handlers for route selection buttons
    if (this.routes.length > 1) {
      const routeButtons = header.querySelectorAll('.route-option-btn');
      routeButtons.forEach((btn) => {
        const routeIndex = Number.parseInt(btn.getAttribute('data-route-index') || '0', 10);
        btn.addEventListener('click', () => {
          this.switchRoute(routeIndex);
        });
      });
    }

    const directionsList = document.createElement('div');
    directionsList.style.cssText = `
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px 16px;
    `;
    currentDirections.forEach((direction) => {
      const directionItem = document.createElement('div');
      directionItem.style.cssText = `
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 8px;
        color: #333;
      `;
      directionItem.textContent = direction;
      directionsList.appendChild(directionItem);
    });

    const actions = document.createElement('div');
    actions.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const googleMapsBtn = document.createElement('button');
    googleMapsBtn.textContent = 'Open in Google Maps';
    googleMapsBtn.style.cssText = `
      width: 100%;
      padding: 0px 12px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    `;
    googleMapsBtn.onmouseover = () => {
      googleMapsBtn.style.background = '#f5f5f5';
    };
    googleMapsBtn.onmouseout = () => {
      googleMapsBtn.style.background = 'white';
    };
    googleMapsBtn.onclick = () => {
      window.open(this.googleMapsUrl, '_blank');
    };

    const appleMapsBtn = document.createElement('button');
    appleMapsBtn.textContent = 'Open in Apple Maps';
    appleMapsBtn.style.cssText = `
      width: 100%;
      padding: 0px 12px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    `;
    appleMapsBtn.onmouseover = () => {
      appleMapsBtn.style.background = '#f5f5f5';
    };
    appleMapsBtn.onmouseout = () => {
      appleMapsBtn.style.background = 'white';
    };
    appleMapsBtn.onclick = () => {
      window.open(this.appleMapsUrl, '_blank');
    };

    actions.appendChild(googleMapsBtn);
    actions.appendChild(appleMapsBtn);

    this.directionsContainer.innerHTML = '';
    this.directionsContainer.appendChild(header);
    this.directionsContainer.appendChild(directionsList);
    this.directionsContainer.appendChild(actions);
  }
}
