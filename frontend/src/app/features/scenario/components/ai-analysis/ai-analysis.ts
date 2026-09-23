import { Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-ai-analysis',
  imports: [NzButtonModule, NzIconModule],
  templateUrl: './ai-analysis.html',
  styleUrl: './ai-analysis.scss',
})
export class AiAnalysis {
  protected readonly store = inject(ScenarioStoreService);
  protected analyzing = false;

  protected runAnalysis(): void {
    this.analyzing = true;
    window.setTimeout(() => {
      this.analyzing = false;
      this.store.message.set('Моковый AI-разбор сценария обновлён.');
    }, 700);
  }

  protected radarPoints(kind: 'before' | 'after'): string {
    const values = this.store.result().directions.map((item) => item[kind]);
    return values.map((value, index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / values.length);
      const radius = 45 * (value / 100);
      return `${80 + Math.cos(angle) * radius},${62 + Math.sin(angle) * radius}`;
    }).join(' ');
  }
}
