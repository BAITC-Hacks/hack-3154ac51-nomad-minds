import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import * as L from 'leaflet';
import { ScenarioStoreService } from '../../services/scenario-store.service';

const DISTRICT_SHAPES: Record<string, L.LatLngExpression[]> = {
  saryarka: [
    [51.190, 71.320], [51.202, 71.435], [51.172, 71.505],
    [51.130, 71.485], [51.128, 71.365],
  ],
  esil: [
    [51.128, 71.305], [51.130, 71.485], [51.102, 71.475],
    [51.075, 71.405], [51.090, 71.315],
  ],
  almaty: [
    [51.172, 71.505], [51.180, 71.590], [51.112, 71.615],
    [51.102, 71.475], [51.130, 71.485],
  ],
  baikonur: [
    [51.090, 71.315], [51.075, 71.405], [51.102, 71.475],
    [51.050, 71.465], [51.042, 71.350],
  ],
  nura: [
    [51.102, 71.475], [51.112, 71.615], [51.045, 71.575],
    [51.050, 71.465],
  ],
};

@Component({
  selector: 'app-city-map',
  imports: [NzIconModule],
  templateUrl: './city-map.html',
  styleUrl: './city-map.scss',
})
export class CityMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true })
  private mapElement!: ElementRef<HTMLDivElement>;

  protected readonly store = inject(ScenarioStoreService);
  private map?: L.Map;
  private readonly polygonLayers = new Map<string, L.Polygon>();

  constructor() {
    effect(() => {
      const selectedId = this.store.selectedDistrictId();
      for (const [id, polygon] of this.polygonLayers) {
        polygon.setStyle({
          weight: id === selectedId ? 4 : 2,
          fillOpacity: id === selectedId ? 0.62 : 0.38,
        });
        if (id === selectedId) polygon.bringToFront();
      }
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [51.115, 71.465],
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    for (const district of this.store.districts) {
      const polygon = L.polygon(DISTRICT_SHAPES[district.id], {
        color: '#ffffff',
        fillColor: district.color,
        fillOpacity: district.id === this.store.selectedDistrictId() ? 0.62 : 0.38,
        weight: district.id === this.store.selectedDistrictId() ? 4 : 2,
      })
        .addTo(this.map)
        .bindTooltip(district.name, {
          permanent: true,
          direction: 'center',
          className: 'district-map-label',
        });
      polygon.on('click', () => this.store.selectDistrict(district.id));
      this.polygonLayers.set(district.id, polygon);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}

