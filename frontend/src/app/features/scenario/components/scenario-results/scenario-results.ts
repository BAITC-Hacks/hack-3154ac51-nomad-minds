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

  protected weakestScore(): number {
    const weakestDistrictId = this.store.result().weakestDistrictId;
    return this.store.result().districts.find(
      (district) => district.districtId === weakestDistrictId,
    )?.after ?? 0;
  }
}
