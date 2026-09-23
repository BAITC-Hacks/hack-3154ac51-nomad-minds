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
}

