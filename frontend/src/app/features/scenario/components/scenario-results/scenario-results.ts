import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-scenario-results',
  imports: [DecimalPipe, NzIconModule],
  templateUrl: './scenario-results.html',
  styleUrl: './scenario-results.scss',
})
export class ScenarioResults {
  protected readonly store = inject(ScenarioStoreService);

  protected radarPoints(kind: 'before' | 'after'): string {
    const values = this.store.result().directions.map((item) => item[kind]);
    return values.map((value, index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / values.length);
      const radius = 45 * (value / 100);
      return `${80 + Math.cos(angle) * radius},${62 + Math.sin(angle) * radius}`;
    }).join(' ');
  }
}

