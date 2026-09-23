import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AiAnalysis } from '../../components/ai-analysis/ai-analysis';
import { ScenarioResults } from '../../components/scenario-results/scenario-results';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-scenario-results-page',
  imports: [RouterLink, NzButtonModule, ScenarioResults, AiAnalysis],
  templateUrl: './scenario-results-page.html',
  styleUrl: './scenario-results-page.scss',
})
export class ScenarioResultsPage {
  protected readonly store = inject(ScenarioStoreService);
}
