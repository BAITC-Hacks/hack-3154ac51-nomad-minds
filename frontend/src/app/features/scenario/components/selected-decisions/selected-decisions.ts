import { Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-selected-decisions',
  imports: [NzButtonModule, NzIconModule, NzTagModule],
  templateUrl: './selected-decisions.html',
  styleUrl: './selected-decisions.scss',
})
export class SelectedDecisions {
  protected readonly store = inject(ScenarioStoreService);
}

