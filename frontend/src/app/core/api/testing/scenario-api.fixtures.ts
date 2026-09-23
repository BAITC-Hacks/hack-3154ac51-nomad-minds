// Contract fixtures generated from backend datasets and scoring.calculate_scenario.
import { Decision } from '../../models/city.models';
import { DatasetResponse, ValidCalculationResult } from '../models/scenario-api.models';

export const REFERENCE_DECISIONS: Decision[] = [
  {
    "measureId": "M7",
    "districtId": "nura"
  },
  {
    "measureId": "M8",
    "districtId": "nura"
  },
  {
    "measureId": "M10",
    "districtId": "nura"
  },
  {
    "measureId": "M12"
  },
  {
    "measureId": "M5",
    "districtId": "saryarka"
  }
];

export const DATASET_FIXTURE: DatasetResponse = {
  "datasetVersion": "1.0.0",
  "budget": 100,
  "baselineScore": 52.55768,
  "districts": [
    {
      "id": "esil",
      "name": "Esil",
      "populationShare": 27,
      "profile": "Wealthy district, but suffers from bridge traffic and overcrowded schools.",
      "indicators": {
        "T1": 45,
        "T2": 62,
        "E1": 68,
        "E2": 72,
        "S1": 48,
        "S2": 55,
        "B1": 78,
        "B2": 60,
        "C1": 75,
        "C2": 70
      }
    },
    {
      "id": "almaty",
      "name": "Almaty",
      "populationShare": 24,
      "profile": "Old housing stock, with worn utilities and heavy traffic as the main problems.",
      "indicators": {
        "T1": 40,
        "T2": 75,
        "E1": 50,
        "E2": 55,
        "S1": 60,
        "S2": 65,
        "B1": 62,
        "B2": 52,
        "C1": 50,
        "C2": 60
      }
    },
    {
      "id": "saryarka",
      "name": "Saryarka",
      "populationShare": 20,
      "profile": "Suffers from smog caused by private housing and weak landscaping.",
      "indicators": {
        "T1": 50,
        "T2": 70,
        "E1": 42,
        "E2": 40,
        "S1": 62,
        "S2": 68,
        "B1": 58,
        "B2": 55,
        "C1": 45,
        "C2": 55
      }
    },
    {
      "id": "baikonur",
      "name": "Baikonur",
      "populationShare": 13,
      "profile": "A stable middle-performing district without major imbalances.",
      "indicators": {
        "T1": 52,
        "T2": 68,
        "E1": 55,
        "E2": 50,
        "S1": 58,
        "S2": 60,
        "B1": 52,
        "B2": 58,
        "C1": 55,
        "C2": 58
      }
    },
    {
      "id": "nura",
      "name": "Nura",
      "populationShare": 16,
      "profile": "The main outsider in social infrastructure and public transport.",
      "indicators": {
        "T1": 55,
        "T2": 40,
        "E1": 45,
        "E2": 65,
        "S1": 38,
        "S2": 35,
        "B1": 55,
        "B2": 50,
        "C1": 60,
        "C2": 50
      }
    }
  ],
  "measures": [
    {
      "id": "M1",
      "name": "Dedicated bus lanes",
      "direction": "transport",
      "scope": "district",
      "cost": 18,
      "lagQuarters": 2,
      "effects": {
        "T1": 6,
        "T2": 9
      }
    },
    {
      "id": "M2",
      "name": "Smart traffic lights and adaptive control",
      "direction": "transport",
      "scope": "city",
      "cost": 22,
      "lagQuarters": 2,
      "effects": {
        "T1": 4,
        "B2": 3
      }
    },
    {
      "id": "M3",
      "name": "LRT line or extension",
      "direction": "transport",
      "scope": "district",
      "cost": 30,
      "lagQuarters": 4,
      "effects": {
        "T1": 16,
        "T2": 20,
        "E2": 4
      }
    },
    {
      "id": "M4",
      "name": "Park or public square",
      "direction": "ecology",
      "scope": "district",
      "cost": 15,
      "lagQuarters": 2,
      "effects": {
        "E1": 12,
        "E2": 3,
        "B1": 2
      }
    },
    {
      "id": "M5",
      "name": "Clean fuel conversion for private housing",
      "direction": "ecology",
      "scope": "district",
      "cost": 25,
      "lagQuarters": 3,
      "effects": {
        "E2": 14,
        "C1": 4
      }
    },
    {
      "id": "M6",
      "name": "City greening and windbreak program",
      "direction": "ecology",
      "scope": "city",
      "cost": 20,
      "lagQuarters": 4,
      "effects": {
        "E1": 5,
        "E2": 3
      }
    },
    {
      "id": "M7",
      "name": "School and kindergarten modular construction",
      "direction": "social",
      "scope": "district",
      "cost": 24,
      "lagQuarters": 3,
      "effects": {
        "S1": 16
      }
    },
    {
      "id": "M8",
      "name": "Family health center or clinic",
      "direction": "social",
      "scope": "district",
      "cost": 20,
      "lagQuarters": 3,
      "effects": {
        "S2": 14
      }
    },
    {
      "id": "M9",
      "name": "Courtyard sports hubs",
      "direction": "social",
      "scope": "district",
      "cost": 10,
      "lagQuarters": 1,
      "effects": {
        "S1": 3,
        "S2": 3,
        "B1": 3
      }
    },
    {
      "id": "M10",
      "name": "Street lighting and Safe City cameras",
      "direction": "safety",
      "scope": "district",
      "cost": 12,
      "lagQuarters": 1,
      "effects": {
        "B1": 12,
        "B2": 2
      }
    },
    {
      "id": "M11",
      "name": "Safe crossings and school zones",
      "direction": "safety",
      "scope": "district",
      "cost": 10,
      "lagQuarters": 1,
      "effects": {
        "B2": 12,
        "T1": -2
      }
    },
    {
      "id": "M12",
      "name": "Unified digital requests platform",
      "direction": "services",
      "scope": "city",
      "cost": 14,
      "lagQuarters": 1,
      "effects": {
        "C2": 5
      }
    },
    {
      "id": "M13",
      "name": "Heating and water network modernization",
      "direction": "services",
      "scope": "district",
      "cost": 28,
      "lagQuarters": 4,
      "effects": {
        "C1": 18,
        "E2": 2
      }
    },
    {
      "id": "M14",
      "name": "Emergency utilities teams and early warning",
      "direction": "services",
      "scope": "city",
      "cost": 16,
      "lagQuarters": 1,
      "effects": {
        "C1": 5,
        "C2": 2
      }
    }
  ],
  "rules": {
    "datasetVersion": "1.0.0",
    "budget": 100,
    "requiredDecisionCount": 5,
    "maxMeasuresPerDirection": 2,
    "simulationHorizonQuarters": 8,
    "indicatorMinimum": 0,
    "indicatorMaximum": 100,
    "indicatorWeights": {
      "T1": 0.1,
      "T2": 0.1,
      "E1": 0.09,
      "E2": 0.11,
      "S1": 0.11,
      "S2": 0.11,
      "B1": 0.09,
      "B2": 0.09,
      "C1": 0.1,
      "C2": 0.1
    },
    "incompatibleMeasures": [
      [
        "M1",
        "M3"
      ]
    ],
    "incompatibleMeasureDistrictPairs": [
      [
        "M4",
        "M7"
      ],
      [
        "M5",
        "M13"
      ]
    ],
    "synergies": [
      {
        "measures": [
          "M1",
          "M2"
        ],
        "indicator": "T1",
        "bonus": 2,
        "scope": "district_of_first_measure"
      },
      {
        "measures": [
          "M10",
          "M12"
        ],
        "indicator": "B1",
        "bonus": 2,
        "scope": "district_of_first_measure"
      },
      {
        "measures": [
          "M5",
          "M6"
        ],
        "indicator": "E2",
        "bonus": 2,
        "scope": "district_of_first_measure"
      }
    ],
    "scoreWeights": {
      "weightedAverage": 0.7,
      "weakestDistrict": 0.3,
      "criticalPenalty": 1.0,
      "criticalThreshold": 40
    }
  }
};

export const CALCULATION_FIXTURE: ValidCalculationResult = {
  "datasetVersion": "1.0.0",
  "valid": true,
  "validationErrors": [],
  "budget": {
    "total": 100,
    "spent": 95,
    "remaining": 5
  },
  "score": 56.54307,
  "cityAverage": 58.077600000000004,
  "weakestDistrict": "Nura",
  "weakestDistrictId": "nura",
  "criticalCount": 0,
  "districts": [
    {
      "id": "esil",
      "name": "Esil",
      "populationShare": 27,
      "profile": "Wealthy district, but suffers from bridge traffic and overcrowded schools.",
      "indicators": {
        "T1": 45.0,
        "T2": 62.0,
        "E1": 68.0,
        "E2": 72.0,
        "S1": 48.0,
        "S2": 55.0,
        "B1": 78.0,
        "B2": 60.0,
        "C1": 75.0,
        "C2": 74.375
      },
      "score": 63.4275,
      "criticalCount": 0,
      "baselineScore": 62.99,
      "scoreDelta": 0.4375,
      "baselineIndicators": {
        "T1": 45,
        "T2": 62,
        "E1": 68,
        "E2": 72,
        "S1": 48,
        "S2": 55,
        "B1": 78,
        "B2": 60,
        "C1": 75,
        "C2": 70
      },
      "indicatorDeltas": {
        "T1": 0.0,
        "T2": 0.0,
        "E1": 0.0,
        "E2": 0.0,
        "S1": 0.0,
        "S2": 0.0,
        "B1": 0.0,
        "B2": 0.0,
        "C1": 0.0,
        "C2": 4.375
      },
      "baselineCriticalCount": 0
    },
    {
      "id": "almaty",
      "name": "Almaty",
      "populationShare": 24,
      "profile": "Old housing stock, with worn utilities and heavy traffic as the main problems.",
      "indicators": {
        "T1": 40.0,
        "T2": 75.0,
        "E1": 50.0,
        "E2": 55.0,
        "S1": 60.0,
        "S2": 65.0,
        "B1": 62.0,
        "B2": 52.0,
        "C1": 50.0,
        "C2": 64.375
      },
      "score": 57.4975,
      "criticalCount": 0,
      "baselineScore": 57.06,
      "scoreDelta": 0.4375,
      "baselineIndicators": {
        "T1": 40,
        "T2": 75,
        "E1": 50,
        "E2": 55,
        "S1": 60,
        "S2": 65,
        "B1": 62,
        "B2": 52,
        "C1": 50,
        "C2": 60
      },
      "indicatorDeltas": {
        "T1": 0.0,
        "T2": 0.0,
        "E1": 0.0,
        "E2": 0.0,
        "S1": 0.0,
        "S2": 0.0,
        "B1": 0.0,
        "B2": 0.0,
        "C1": 0.0,
        "C2": 4.375
      },
      "baselineCriticalCount": 0
    },
    {
      "id": "saryarka",
      "name": "Saryarka",
      "populationShare": 20,
      "profile": "Suffers from smog caused by private housing and weak landscaping.",
      "indicators": {
        "T1": 50.0,
        "T2": 70.0,
        "E1": 42.0,
        "E2": 48.75,
        "S1": 62.0,
        "S2": 68.0,
        "B1": 58.0,
        "B2": 55.0,
        "C1": 47.5,
        "C2": 59.375
      },
      "score": 56.3,
      "criticalCount": 0,
      "baselineScore": 54.65,
      "scoreDelta": 1.6499999999999986,
      "baselineIndicators": {
        "T1": 50,
        "T2": 70,
        "E1": 42,
        "E2": 40,
        "S1": 62,
        "S2": 68,
        "B1": 58,
        "B2": 55,
        "C1": 45,
        "C2": 55
      },
      "indicatorDeltas": {
        "T1": 0.0,
        "T2": 0.0,
        "E1": 0.0,
        "E2": 8.75,
        "S1": 0.0,
        "S2": 0.0,
        "B1": 0.0,
        "B2": 0.0,
        "C1": 2.5,
        "C2": 4.375
      },
      "baselineCriticalCount": 0
    },
    {
      "id": "baikonur",
      "name": "Baikonur",
      "populationShare": 13,
      "profile": "A stable middle-performing district without major imbalances.",
      "indicators": {
        "T1": 52.0,
        "T2": 68.0,
        "E1": 55.0,
        "E2": 50.0,
        "S1": 58.0,
        "S2": 60.0,
        "B1": 52.0,
        "B2": 58.0,
        "C1": 55.0,
        "C2": 62.375
      },
      "score": 57.0675,
      "criticalCount": 0,
      "baselineScore": 56.63,
      "scoreDelta": 0.4375,
      "baselineIndicators": {
        "T1": 52,
        "T2": 68,
        "E1": 55,
        "E2": 50,
        "S1": 58,
        "S2": 60,
        "B1": 52,
        "B2": 58,
        "C1": 55,
        "C2": 58
      },
      "indicatorDeltas": {
        "T1": 0.0,
        "T2": 0.0,
        "E1": 0.0,
        "E2": 0.0,
        "S1": 0.0,
        "S2": 0.0,
        "B1": 0.0,
        "B2": 0.0,
        "C1": 0.0,
        "C2": 4.375
      },
      "baselineCriticalCount": 0
    },
    {
      "id": "nura",
      "name": "Nura",
      "populationShare": 16,
      "profile": "The main outsider in social infrastructure and public transport.",
      "indicators": {
        "T1": 55.0,
        "T2": 40.0,
        "E1": 45.0,
        "E2": 65.0,
        "S1": 48.0,
        "S2": 43.75,
        "B1": 67.5,
        "B2": 51.75,
        "C1": 60.0,
        "C2": 54.375
      },
      "score": 52.9625,
      "criticalCount": 0,
      "baselineScore": 49.18,
      "scoreDelta": 3.782499999999999,
      "baselineIndicators": {
        "T1": 55,
        "T2": 40,
        "E1": 45,
        "E2": 65,
        "S1": 38,
        "S2": 35,
        "B1": 55,
        "B2": 50,
        "C1": 60,
        "C2": 50
      },
      "indicatorDeltas": {
        "T1": 0.0,
        "T2": 0.0,
        "E1": 0.0,
        "E2": 0.0,
        "S1": 10.0,
        "S2": 8.75,
        "B1": 12.5,
        "B2": 1.75,
        "C1": 0.0,
        "C2": 4.375
      },
      "baselineCriticalCount": 2
    }
  ],
  "baselineScore": 52.55768,
  "scoreDelta": 3.9853900000000024,
  "directionDeltas": {
    "transport": 0.0,
    "ecology": 0.875,
    "social": 1.5,
    "safety": 1.1400000000000001,
    "services": 2.4375
  },
  "directionDeltaMethod": "population_weighted_mean_indicator_change",
  "contributions": [
    {
      "measureId": "M10",
      "districtId": "nura",
      "scoreContribution": 0.4913100000000023
    },
    {
      "measureId": "M12",
      "scoreContribution": 0.4745800000000015
    },
    {
      "measureId": "M5",
      "districtId": "saryarka",
      "scoreContribution": 0.16975000000000123
    },
    {
      "measureId": "M7",
      "districtId": "nura",
      "scoreContribution": 1.4531999999999996
    },
    {
      "measureId": "M8",
      "districtId": "nura",
      "scoreContribution": 1.396549999999998
    }
  ],
  "contributionMethod": "shapley",
  "appliedSynergies": [
    {
      "measures": [
        "M10",
        "M12"
      ],
      "districtId": "nura",
      "indicator": "B1",
      "bonus": 2
    }
  ],
  "appliedEffects": [
    {
      "measureId": "M10",
      "realizationFactor": 0.875,
      "districtIds": [
        "nura"
      ],
      "effects": {
        "B1": 10.5,
        "B2": 1.75
      }
    },
    {
      "measureId": "M12",
      "realizationFactor": 0.875,
      "districtIds": [
        "esil",
        "almaty",
        "saryarka",
        "baikonur",
        "nura"
      ],
      "effects": {
        "C2": 4.375
      }
    },
    {
      "measureId": "M5",
      "realizationFactor": 0.625,
      "districtIds": [
        "saryarka"
      ],
      "effects": {
        "E2": 8.75,
        "C1": 2.5
      }
    },
    {
      "measureId": "M7",
      "realizationFactor": 0.625,
      "districtIds": [
        "nura"
      ],
      "effects": {
        "S1": 10.0
      }
    },
    {
      "measureId": "M8",
      "realizationFactor": 0.625,
      "districtIds": [
        "nura"
      ],
      "effects": {
        "S2": 8.75
      }
    }
  ]
};

