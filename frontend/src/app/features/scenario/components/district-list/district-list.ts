import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-district-list',
  imports: [DecimalPipe, NzIconModule],
  templateUrl: './district-list.html',
  styleUrl: './district-list.scss',
})
export class DistrictList {
  protected readonly store = inject(ScenarioStoreService);

  protected scoreFor(districtId: string): number {
    return this.store.result().districts.find(
      (item) => item.districtId === districtId,
    )?.before ?? 0;
  }
}
