"""Numerical regressions for the backend rules in IMPLEMENTATION_PLAN.md.

Small effect tests change the required decision count in an in-memory fixture;
the production dataset always requires five decisions. Expected results below
are independent, hand-calculated examples rather than copies of engine logic.
"""

from copy import deepcopy

import pytest

from backend.dataset_repository import load_all_datasets
from backend.scoring import calculate_baseline, calculate_scenario, validate_decisions


@pytest.fixture
def data():
    return load_all_datasets()


@pytest.fixture
def example():
    return [
        {"measureId": "M7", "districtId": "nura"},
        {"measureId": "M8", "districtId": "nura"},
        {"measureId": "M10", "districtId": "nura"},
        {"measureId": "M12"},
        {"measureId": "M5", "districtId": "saryarka"},
    ]


def districts_by_id(result):
    return {district["id"]: district for district in result["districts"]}


def calculate_small(decisions, data):
    data["rules"]["requiredDecisionCount"] = len(decisions)
    result = calculate_scenario(decisions, data)
    assert result["valid"], result["validationErrors"]
    return result


def test_baseline_uses_full_precision_and_population_percentages(data):
    result = calculate_baseline(data)
    assert result["score"] == pytest.approx(52.55768, abs=1e-9)
    assert result["cityAverage"] == pytest.approx(56.8624, abs=1e-9)
    assert result["weakestDistrict"] == "Nura"
    assert result["criticalCount"] == 2
    assert districts_by_id(result)["nura"]["score"] == pytest.approx(49.18)


def test_reference_scenario_scores_deltas_and_metadata(data, example):
    result = calculate_scenario(example, data)
    assert result["valid"]
    assert result["validationErrors"] == []
    assert result["datasetVersion"] == "1.0.0"
    assert result["budget"] == {"total": 100, "spent": 95, "remaining": 5}
    assert result["baselineScore"] == pytest.approx(52.55768, abs=1e-9)
    assert result["score"] == pytest.approx(56.54307, abs=1e-9)
    assert result["scoreDelta"] == pytest.approx(3.98539, abs=1e-9)
    assert result["cityAverage"] == pytest.approx(58.0776, abs=1e-9)
    assert result["weakestDistrict"] == "Nura"
    assert result["criticalCount"] == 0
    assert result["directionDeltas"] == pytest.approx({
        "transport": 0, "ecology": 0.875, "social": 1.5,
        "safety": 1.14, "services": 2.4375,
    })

    districts = districts_by_id(result)
    nura = districts["nura"]
    assert nura["indicators"] == pytest.approx({
        "T1": 55, "T2": 40, "E1": 45, "E2": 65,
        "S1": 48, "S2": 43.75, "B1": 67.5, "B2": 51.75,
        "C1": 60, "C2": 54.375,
    })
    assert nura["baselineScore"] == pytest.approx(49.18)
    assert nura["score"] == pytest.approx(52.9625)
    assert nura["scoreDelta"] == pytest.approx(3.7825)
    assert nura["baselineCriticalCount"] == 2
    assert nura["criticalCount"] == 0
    assert nura["indicatorDeltas"]["B1"] == pytest.approx(12.5)
    assert districts["saryarka"]["indicators"]["E2"] == pytest.approx(48.75)
    assert districts["saryarka"]["indicators"]["C1"] == pytest.approx(47.5)
    for original in data["districts"]["districts"]:
        actual = districts[original["id"]]
        for key in ("name", "populationShare", "profile"):
            assert actual[key] == original[key]
        assert actual["baselineIndicators"] == original["indicators"]


def test_budget_over_100_rejects_calculation(data, example):
    example[2] = {"measureId": "M2"}
    result = calculate_scenario(example, data)
    assert result["valid"] is False
    assert result["budget"] == {"total": 100, "spent": 105, "remaining": -5}
    assert any("budget" in error.lower() for error in result["validationErrors"])
    assert "score" not in result


def test_exact_budget_limit_is_allowed(data):
    result = calculate_scenario([
        {"measureId": "M2"},
        {"measureId": "M7", "districtId": "nura"},
        {"measureId": "M8", "districtId": "nura"},
        {"measureId": "M12"},
        {"measureId": "M6"},
    ], data)
    assert result["valid"], result["validationErrors"]
    assert result["budget"] == {"total": 100, "spent": 100, "remaining": 0}


@pytest.mark.parametrize("count", [4, 6])
def test_exactly_five_decisions_required(data, example, count):
    decisions = example[:count] if count < 5 else example + [{"measureId": "M14"}]
    result = calculate_scenario(decisions, data)
    assert result["valid"] is False
    assert any("5" in error and "decision" in error.lower()
               for error in result["validationErrors"])


def test_repeated_measure_rejected_even_in_different_districts(data):
    decisions = [
        {"measureId": "M7", "districtId": "nura"},
        {"measureId": "M7", "districtId": "esil"},
    ]
    errors = validate_decisions(decisions, data, allow_partial=True)
    assert errors
    assert any("once" in error.lower() or "repeat" in error.lower()
               or "duplicate" in error.lower() for error in errors)


@pytest.mark.parametrize("decision", [
    {"measureId": "M7"},
    {"measureId": "M12", "districtId": "nura"},
])
def test_district_required_only_for_district_measure(data, decision):
    errors = validate_decisions([decision], data, allow_partial=True)
    assert any(decision["measureId"] in error and "district" in error.lower()
               for error in errors)


def test_three_measures_in_one_direction_rejected(data):
    decisions = [{"measureId": measure_id, "districtId": "nura"}
                 for measure_id in ("M7", "M8", "M9")]
    errors = validate_decisions(decisions, data, allow_partial=True)
    assert any("social" in error.lower() and "2" in error for error in errors)


def test_m1_m3_conflict_applies_even_across_districts(data):
    errors = validate_decisions([
        {"measureId": "M1", "districtId": "nura"},
        {"measureId": "M3", "districtId": "esil"},
    ], data, allow_partial=True)
    assert any("M1" in error and "M3" in error for error in errors)


@pytest.mark.parametrize("pair", [("M4", "M7"), ("M5", "M13")])
@pytest.mark.parametrize("second_district", ["nura", "esil"])
def test_local_conflicts_only_apply_within_same_district(data, pair, second_district):
    errors = validate_decisions([
        {"measureId": pair[0], "districtId": "nura"},
        {"measureId": pair[1], "districtId": second_district},
    ], data, allow_partial=True)
    if second_district == "nura":
        assert any(pair[0] in error and pair[1] in error for error in errors)
    else:
        assert errors == []


def test_partial_validation_allows_incomplete_but_not_six_decisions(data, example):
    assert validate_decisions([], data, allow_partial=True) == []
    assert validate_decisions(example[:2], data, allow_partial=True) == []
    assert validate_decisions(example, data, allow_partial=True) == []
    errors = validate_decisions(example + [{"measureId": "M14"}], data,
                                allow_partial=True)
    assert any("5" in error and "decision" in error.lower() for error in errors)
    assert calculate_scenario([], data)["valid"] is False


@pytest.mark.parametrize("decision, identifier", [
    ({"measureId": "M99"}, "M99"),
    ({"measureId": "M7", "districtId": "missing"}, "M7"),
])
def test_unknown_measure_or_district_is_rejected(data, decision, identifier):
    errors = validate_decisions([decision], data, allow_partial=True)
    assert any(identifier in error for error in errors)


@pytest.mark.parametrize("payload", [
    None, {"measureId": "M12"}, [None], [{}],
    [{"measureId": []}], [{"measureId": "M7", "districtId": []}],
])
def test_malformed_decisions_return_errors_instead_of_crashing(data, payload):
    result = calculate_scenario(payload, data)
    assert result["valid"] is False
    assert result["validationErrors"]
    assert "score" not in result


@pytest.mark.parametrize("measure_id, factor, changes", [
    ("M1", 0.75, {"T1": 59.5, "T2": 46.75}),
    ("M3", 0.5, {"T1": 63, "T2": 50, "E2": 67}),
    ("M11", 0.875, {"T1": 53.25, "B2": 60.5}),
])
def test_lagged_local_effects_and_negative_traffic_effect(data, measure_id, factor, changes):
    result = calculate_small([{"measureId": measure_id, "districtId": "nura"}], data)
    districts = districts_by_id(result)
    for original in data["districts"]["districts"]:
        expected = dict(original["indicators"])
        if original["id"] == "nura":
            expected.update(changes)
        assert districts[original["id"]]["indicators"] == pytest.approx(expected)
    effect = result["appliedEffects"][0]
    assert effect["measureId"] == measure_id
    assert effect["realizationFactor"] == factor
    assert effect["districtIds"] == ["nura"]


def test_city_effect_changes_every_district(data):
    result = calculate_small([{"measureId": "M2"}], data)
    for district in result["districts"]:
        assert district["indicatorDeltas"] == pytest.approx({
            "T1": 3, "T2": 0, "E1": 0, "E2": 0, "S1": 0,
            "S2": 0, "B1": 0, "B2": 2.25, "C1": 0, "C2": 0,
        })
    effect = result["appliedEffects"][0]
    assert effect["effects"] == pytest.approx({"T1": 3, "B2": 2.25})
    assert set(effect["districtIds"]) == {"esil", "almaty", "saryarka", "baikonur", "nura"}


def test_simulation_horizon_comes_from_rules(data):
    data["rules"]["simulationHorizonQuarters"] = 4
    result = calculate_small([{"measureId": "M1", "districtId": "nura"}], data)
    nura = districts_by_id(result)["nura"]
    assert nura["indicators"]["T1"] == pytest.approx(58)
    assert nura["indicators"]["T2"] == pytest.approx(44.5)


def test_mixed_dataset_versions_are_rejected(data, example):
    data["rules"]["datasetVersion"] = "2.0.0"
    with pytest.raises(ValueError, match="datasetVersion"):
        calculate_scenario(example, data)


@pytest.mark.parametrize("local, city, indicator, target_value, other_delta", [
    ("M1", "M2", "T1", 64.5, 3),
    ("M10", "M12", "B1", 67.5, 0),
    ("M5", "M6", "E2", 77.25, 1.5),
])
def test_each_synergy_is_fixed_once_in_correct_district(
    data, local, city, indicator, target_value, other_delta,
):
    result = calculate_small([
        {"measureId": local, "districtId": "nura"}, {"measureId": city},
    ], data)
    assert len(result["appliedSynergies"]) == 1
    synergy = result["appliedSynergies"][0]
    assert synergy["measures"] == [local, city]
    assert synergy["districtId"] == "nura"
    assert synergy["indicator"] == indicator
    assert synergy["bonus"] == 2
    for district in result["districts"]:
        if district["id"] == "nura":
            assert district["indicators"][indicator] == pytest.approx(target_value)
        else:
            assert district["indicatorDeltas"][indicator] == pytest.approx(other_delta)


def test_no_synergy_when_local_partners_are_not_selected(data):
    result = calculate_small([{"measureId": code} for code in ("M2", "M6", "M12")], data)
    assert result["appliedSynergies"] == []


@pytest.mark.parametrize("initial, decisions, expected", [
    (99, [{"measureId": "M1", "districtId": "nura"},
          {"measureId": "M11", "districtId": "nura"}], 100),
    (0, [{"measureId": "M11", "districtId": "nura"}, {"measureId": "M2"}], 1.25),
    (0, [{"measureId": "M11", "districtId": "nura"}], 0),
])
def test_clip_after_summing_effects_is_order_independent(data, initial, decisions, expected):
    originals = {district["id"]: district for district in data["districts"]["districts"]}
    originals["nura"]["indicators"]["T1"] = initial
    forward = calculate_small(decisions, data)
    reverse = calculate_small(list(reversed(decisions)), data)
    assert districts_by_id(forward)["nura"]["indicators"]["T1"] == pytest.approx(expected)
    assert forward["districts"] == reverse["districts"]
    assert forward["score"] == pytest.approx(reverse["score"], abs=1e-12)


def test_critical_count_is_strictly_below_configured_threshold(data):
    for district in data["districts"]["districts"]:
        district["indicators"] = {code: 80 for code in district["indicators"]}
    nura = data["districts"]["districts"][-1]
    nura["indicators"].update(T1=39.999, T2=40, E1=40.001)
    assert calculate_baseline(data)["criticalCount"] == 1
    data["rules"]["scoreWeights"]["criticalThreshold"] = 50
    assert calculate_baseline(data)["criticalCount"] == 3


def test_indicator_weights_and_city_score_weights_come_from_rules(data):
    data["rules"]["indicatorWeights"] = {
        code: int(code == "T1") for code in data["rules"]["indicatorWeights"]
    }
    data["rules"]["scoreWeights"].update(
        weightedAverage=1, weakestDistrict=0, criticalPenalty=0,
    )
    assert calculate_baseline(data)["score"] == pytest.approx(47.31)
    result = calculate_small([{"measureId": "M2"}], data)
    assert result["baselineScore"] == pytest.approx(47.31)
    assert result["score"] == pytest.approx(50.31)
    assert result["scoreDelta"] == pytest.approx(3)


def test_weakest_weight_and_critical_penalty_come_from_rules(data):
    data["rules"]["scoreWeights"].update(
        weightedAverage=0, weakestDistrict=1, criticalPenalty=2,
    )
    assert calculate_baseline(data)["score"] == pytest.approx(45.18)


def test_clipping_bounds_come_from_rules(data):
    data["rules"].update(indicatorMinimum=10, indicatorMaximum=80)
    nura = data["districts"]["districts"][-1]
    nura["indicators"].update(T1=10, B2=79)
    result = calculate_small([{"measureId": "M11", "districtId": "nura"}], data)
    indicators = districts_by_id(result)["nura"]["indicators"]
    assert indicators["T1"] == 10
    assert indicators["B2"] == 80


def test_shapley_contributions_split_synergy_and_sum_to_total(data):
    result = calculate_small([
        {"measureId": "M10", "districtId": "esil"}, {"measureId": "M12"},
    ], data)
    contributions = {item["measureId"]: item for item in result["contributions"]}
    assert contributions["M10"]["districtId"] == "esil"
    assert contributions["M10"]["scoreContribution"] == pytest.approx(0.2253825, abs=1e-9)
    assert contributions["M12"]["scoreContribution"] == pytest.approx(0.45451, abs=1e-9)
    assert result["scoreDelta"] == pytest.approx(0.6798925, abs=1e-9)


def test_results_are_repeatable_order_independent_and_do_not_mutate_inputs(data, example):
    initial_data, initial_example = deepcopy(data), deepcopy(example)
    first = calculate_scenario(example, data)
    assert calculate_scenario(example, data) == first
    reverse = calculate_scenario(list(reversed(example)), data)
    assert reverse["score"] == pytest.approx(first["score"], abs=1e-12)
    assert reverse["districts"] == first["districts"]
    first_contributions = {item["measureId"]: item["scoreContribution"]
                           for item in first["contributions"]}
    # Nura remains weakest in every subset of this reference selection.
    # Each social measure removes its own penalty; M10/M12 split their synergy.
    assert first_contributions == pytest.approx({
        "M7": 1.4532, "M8": 1.39655, "M10": 0.49131,
        "M12": 0.47458, "M5": 0.16975,
    }, abs=1e-9)
    reverse_contributions = {item["measureId"]: item["scoreContribution"]
                             for item in reverse["contributions"]}
    assert len(first_contributions) == 5
    assert reverse_contributions == pytest.approx(first_contributions, abs=1e-12)
    assert sum(first_contributions.values()) == pytest.approx(first["scoreDelta"], abs=1e-9)
    assert data == initial_data
    assert example == initial_example
