import { Component, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-scenario-summary',
  imports: [NzIconModule, NzProgressModule],
  templateUrl: './scenario-summary.html',
  styleUrl: './scenario-summary.scss',
})
export class ScenarioSummary {
  protected readonly store = inject(ScenarioStoreService);
}

