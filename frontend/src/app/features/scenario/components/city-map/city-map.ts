import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NzIconModule } from 'ng-zorro-antd/icon';
import * as L from 'leaflet';
import type { FeatureCollection, MultiPolygon } from 'geojson';
import { ScenarioStoreService } from '../../services/scenario-store.service';

interface DistrictGeometryProperties {
  id: string;
  name: string;
  label: [number, number]; // GeoJSON order: longitude, latitude.
}

@Component({
  selector: 'app-city-map',
  imports: [DecimalPipe, NzIconModule, CdkTrapFocus],
  templateUrl: './city-map.html',
  styleUrl: './city-map.scss',
})
export class CityMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true })
  private mapElement!: ElementRef<HTMLDivElement>;
  @ViewChild('mapPanel', { static: true })
  private mapPanel!: ElementRef<HTMLElement>;
  @ViewChild('fullscreenButton', { static: true })
  private fullscreenButton!: ElementRef<HTMLButtonElement>;

  protected readonly store = inject(ScenarioStoreService);
  private readonly document = inject(DOCUMENT);
  protected readonly isFullscreen = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  private readonly hoveredDistrictId = signal<string | null>(null);
  protected readonly tooltipPosition = signal({ x: 0, y: 0 });
  protected readonly hoveredDistrict = computed(() => {
    const id = this.hoveredDistrictId();
    const district = this.mapDistricts().find((item) => item.id === id);
    if (!district) return null;
    return {
      ...district,
      data: this.store.districtById(district.id),
      score: this.store.baselineResult()?.districts.find((item) => item.districtId === id)?.before,
    };
  });
  protected readonly mapDistricts = computed(() => [
    ...this.store.districts().map(({ id, name, color }) => ({ id, name, color, available: true })),
    ...(!this.store.districtById('sarayshyk')
      ? [{ id: 'sarayshyk', name: 'Сарайшык', color: '#d6a516', available: false }]
      : []),
  ]);
  private map?: L.Map;
  private bounds?: L.LatLngBounds;
  private resizeObserver?: ResizeObserver;
  private readonly abortController = new AbortController();
  private readonly polygonLayers = new Map<string, L.GeoJSON>();
  private nativeFullscreen = false;
  private previousBodyOverflow = '';

  constructor() {
    effect(() => {
      const selectedId = this.store.selectedDistrictId();
      for (const [id, polygon] of this.polygonLayers) {
        polygon.setStyle(this.districtStyle(id, selectedId));
        if (id === selectedId) polygon.bringToFront();
      }
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [51.13, 71.45],
      zoom: 10,
      minZoom: 8,
      zoomSnap: 0.25,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize({ pan: false });
      this.showCity();
    });
    this.resizeObserver.observe(this.mapElement.nativeElement);
    void this.loadDistricts();
  }

  protected async loadDistricts(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const response = await fetch(new URL('maps/astana-districts.geojson', this.document.baseURI), {
        signal: this.abortController.signal,
      });
      if (!response.ok) throw new Error('District boundaries unavailable');
      const data: FeatureCollection<MultiPolygon, DistrictGeometryProperties> = await response.json();
      if (this.abortController.signal.aborted) return;
      if (data.type !== 'FeatureCollection' || data.features.length !== this.mapDistricts().length ||
          !this.mapDistricts().every((district) => data.features.some((f) => f.properties.id === district.id))) {
        throw new Error('Incomplete district boundaries');
      }

      const bounds = L.latLngBounds([]);
      for (const feature of data.features) {
        const district = this.mapDistricts().find((item) => item.id === feature.properties.id)!;
        const polygon = L.geoJSON(feature, {
          style: this.districtStyle(district.id, this.store.selectedDistrictId()),
        }).addTo(this.map!);
        bounds.extend(polygon.getBounds());
        this.polygonLayers.set(district.id, polygon);
        polygon.on({
          mouseover: (event: L.LeafletMouseEvent) => this.showDistrictTooltip(district.id, event.originalEvent),
          mousemove: (event: L.LeafletMouseEvent) => this.positionTooltip(event.originalEvent.clientX, event.originalEvent.clientY),
          mouseout: () => this.hideDistrictTooltip(),
        });
        if (district.available) {
          polygon.on('click', () => this.store.selectDistrict(district.id));
        } else {
          polygon.bindPopup('Сарайшык: в текущем сценарии пока нет данных для расчёта мер.');
        }
        const [longitude, latitude] = feature.properties.label;
        const label = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'district-map-label',
          interactive: true,
        })
          .setLatLng([latitude, longitude])
          .setContent(district.name)
          .addTo(this.map!)
          .on({
            click: () => this.selectDistrict(district.id),
            mouseover: (event: L.LeafletMouseEvent) => this.showDistrictTooltip(district.id, event.originalEvent),
            mousemove: (event: L.LeafletMouseEvent) => this.positionTooltip(event.originalEvent.clientX, event.originalEvent.clientY),
            mouseout: () => this.hideDistrictTooltip(),
          });
        const element = label.getElement();
        if (element) {
          element.tabIndex = 0;
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', `Район ${district.name}: сведения и выбор`);
          element.setAttribute('aria-describedby', 'district-map-tooltip');
          element.addEventListener('focus', () => {
            const rect = element.getBoundingClientRect();
            this.hoveredDistrictId.set(district.id);
            this.positionTooltip(rect.right, rect.bottom);
          });
          element.addEventListener('blur', () => this.hideDistrictTooltip());
          element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.selectDistrict(district.id);
            }
          });
        }
      }
      this.bounds = bounds;
      this.showCity();
    } catch {
      if (!this.abortController.signal.aborted) this.loadError.set(true);
    } finally {
      if (!this.abortController.signal.aborted) this.loading.set(false);
    }
  }

  protected selectDistrict(id: string): void {
    if (this.mapDistricts().find((district) => district.id === id)?.available) {
      this.store.selectDistrict(id);
    } else {
      this.polygonLayers.get(id)?.openPopup();
    }
  }

  protected showCity(): void {
    this.hideDistrictTooltip();
    if (this.bounds && this.map) {
      this.map.fitBounds(this.bounds, { padding: [24, 24], animate: false });
    }
  }

  protected async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      if (this.document.fullscreenElement === this.mapPanel.nativeElement) {
        await this.document.exitFullscreen();
      } else {
        this.setExpanded(false);
      }
      return;
    }
    this.setExpanded(true);
    try {
      // Browsers without Fullscreen API support retain the viewport-sized fallback.
      await this.mapPanel.nativeElement.requestFullscreen?.();
    } catch {
      // The same map stays expanded when fullscreen permission is unavailable.
    }
  }

  @HostListener('document:fullscreenchange')
  protected onFullscreenChange(): void {
    if (this.document.fullscreenElement === this.mapPanel.nativeElement) {
      this.nativeFullscreen = true;
      this.setExpanded(true);
    } else if (this.nativeFullscreen) {
      this.nativeFullscreen = false;
      this.setExpanded(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    this.hideDistrictTooltip();
    if (this.isFullscreen() && !this.document.fullscreenElement) {
      event.preventDefault();
      this.setExpanded(false);
    }
  }

  private setExpanded(expanded: boolean): void {
    if (expanded === this.isFullscreen()) return;
    if (expanded) {
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
      this.map?.scrollWheelZoom.enable();
    } else {
      this.document.body.style.overflow = this.previousBodyOverflow;
      this.map?.scrollWheelZoom.disable();
    }
    this.isFullscreen.set(expanded);
    this.hideDistrictTooltip();
    this.fullscreenButton.nativeElement.focus();
  }

  protected hideDistrictTooltip(): void {
    this.hoveredDistrictId.set(null);
  }

  private showDistrictTooltip(id: string, event: MouseEvent): void {
    this.hoveredDistrictId.set(id);
    this.positionTooltip(event.clientX, event.clientY);
  }

  private positionTooltip(clientX: number, clientY: number): void {
    const viewport = this.document.documentElement;
    const width = Math.min(248, viewport.clientWidth - 24);
    const x = clientX + width + 16 > viewport.clientWidth
      ? clientX - width - 12 : clientX + 12;
    this.tooltipPosition.set({
      x: Math.max(12, Math.min(x, viewport.clientWidth - width - 12)),
      y: Math.max(12, Math.min(clientY + 12, viewport.clientHeight - 210)),
    });
  }

  private districtStyle(id: string, selectedId: string): L.PathOptions {
    const color = this.mapDistricts().find((district) => district.id === id)?.color ?? '#8598ac';
    return {
      color,
      fillColor: color,
      weight: id === selectedId ? 3 : 1.5,
      opacity: 0.95,
      fillOpacity: id === selectedId ? 0.3 : 0.14,
      lineJoin: 'round',
    };
  }

  ngOnDestroy(): void {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    if (this.isFullscreen()) this.document.body.style.overflow = this.previousBodyOverflow;
    this.map?.remove();
  }
}
