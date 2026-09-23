import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-selected-decisions',
  imports: [FormsModule, NzButtonModule, NzIconModule, NzInputModule, NzTagModule],
  templateUrl: './selected-decisions.html',
  styleUrl: './selected-decisions.scss',
})
export class SelectedDecisions {
  protected readonly store = inject(ScenarioStoreService);
  private readonly router = inject(Router);

  protected calculateAndOpenResults(): void {
    if (!this.store.canCalculate()) return;
    this.store.calculateScenario();
    void this.router.navigate(['/scenario/results']);
  }
}
