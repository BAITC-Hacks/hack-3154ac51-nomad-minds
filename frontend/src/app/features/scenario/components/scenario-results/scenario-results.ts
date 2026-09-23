import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-scenario-results',
  imports: [DecimalPipe, NzIconModule, NzButtonModule],
  templateUrl: './scenario-results.html',
  styleUrl: './scenario-results.scss',
})
export class ScenarioResults {
  protected readonly store = inject(ScenarioStoreService);

  protected weakestScore(): number {
    const result = this.store.result();
    return result?.districts.find(
      (district) => district.districtId === result.weakestDistrictId,
    )?.after ?? 0;
  }
}
