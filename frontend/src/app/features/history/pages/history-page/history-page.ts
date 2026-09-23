import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { SavedScenario } from '../../../../core/api/models/scenario-api.models';
import { ScenarioStoreService } from '../../../scenario/services/scenario-store.service';

@Component({
  selector: 'app-history-page',
  imports: [DatePipe, DecimalPipe, RouterLink, NzAlertModule, NzButtonModule, NzTableModule],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage implements OnInit {
  readonly store = inject(ScenarioStoreService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadHistory();
  }

  openScenario(scenario: SavedScenario): void {
    if (this.store.openScenario(scenario)) {
      void this.router.navigate(['/scenario']);
    }
  }
}
