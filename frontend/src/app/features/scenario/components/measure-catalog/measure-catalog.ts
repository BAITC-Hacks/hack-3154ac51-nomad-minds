import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Direction } from '../../../../core/models/city.models';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-measure-catalog',
  imports: [FormsModule, NzIconModule, NzInputModule, NzTagModule],
  templateUrl: './measure-catalog.html',
  styleUrl: './measure-catalog.scss',
})
export class MeasureCatalog {
  protected readonly store = inject(ScenarioStoreService);

  protected selectDirection(direction: Direction | 'all'): void {
    this.store.setDirection(direction);
  }

  protected toggleMeasure(measureId: string, checkbox: HTMLInputElement): void {
    if (this.store.hasDataset() && !this.store.isSaving() && !this.store.isCalculating() && !this.store.isAnalyzing()) {
      if (checkbox.checked) {
        this.store.addMeasure(measureId);
      } else {
        this.store.removeDecision(measureId);
      }
    }
    // A rejected addition does not update the signal, so restore the native input too.
    checkbox.checked = this.store.isSelected(measureId);
  }

  protected effectLabel(effects: Partial<Record<string, number>>): string {
    return Object.entries(effects)
      .map(([code, value]) => `${code} ${(value ?? 0) > 0 ? '+' : ''}${value ?? 0}`)
      .join(', ');
  }
}
