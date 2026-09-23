import { Component, inject } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AiAnalysis } from '../../components/ai-analysis/ai-analysis';
import { CityMap } from '../../components/city-map/city-map';
import { DistrictList } from '../../components/district-list/district-list';
import { MeasureCatalog } from '../../components/measure-catalog/measure-catalog';
import { ScenarioResults } from '../../components/scenario-results/scenario-results';
import { SelectedDecisions } from '../../components/selected-decisions/selected-decisions';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-scenario-page',
  imports: [
    AiAnalysis,
    CityMap,
    DistrictList,
    MeasureCatalog,
    ScenarioResults,
    SelectedDecisions,
    NzAlertModule,
    NzButtonModule,
    NzSpinModule,
  ],
  templateUrl: './scenario-page.html',
  styleUrl: './scenario-page.scss',
})
export class ScenarioPage {
  protected readonly store = inject(ScenarioStoreService);
}
