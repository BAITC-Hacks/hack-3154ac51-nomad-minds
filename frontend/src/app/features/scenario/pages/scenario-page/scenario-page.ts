import { Component } from '@angular/core';
import { AiAnalysis } from '../../components/ai-analysis/ai-analysis';
import { CityMap } from '../../components/city-map/city-map';
import { DistrictList } from '../../components/district-list/district-list';
import { MeasureCatalog } from '../../components/measure-catalog/measure-catalog';
import { ScenarioResults } from '../../components/scenario-results/scenario-results';
import { ScenarioSummary } from '../../components/scenario-summary/scenario-summary';
import { SelectedDecisions } from '../../components/selected-decisions/selected-decisions';

@Component({
  selector: 'app-scenario-page',
  imports: [
    AiAnalysis,
    CityMap,
    DistrictList,
    MeasureCatalog,
    ScenarioResults,
    ScenarioSummary,
    SelectedDecisions,
  ],
  templateUrl: './scenario-page.html',
  styleUrl: './scenario-page.scss',
})
export class ScenarioPage {}

