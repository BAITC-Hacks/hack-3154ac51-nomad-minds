"""Deterministic calculations for IMPLEMENTATION_PLAN.md, sections 5 and 10.

Population shares are percentages (27 means 27%). No results are rounded here.
Effects and fixed synergy bonuses are summed before clipping each indicator once.
appliedEffects and appliedSynergies report nominal effects before clipping;
district indicatorDeltas report the actual changes after clipping.
Direction deltas are population-weighted changes of the mean of their two
indicators, in indicator points (not contributions to the final Score).

The plan leaves the contribution method unspecified. We use exact Shapley values:
each measure's marginal Score gain averaged over all possible selection orders.
This includes penalties, clipping, the weakest district and shared synergies.
Contributions sum to scoreDelta within floating-point precision. With five
decisions only 32 subsets are evaluated. Those internal subsets may contain fewer
than five decisions; public scenario calculation always enforces all eight rules.
"""

from collections import Counter
from copy import deepcopy
from math import factorial, fsum
from typing import Any

from .dataset_repository import load_all_datasets


INDICATORS = ("T1", "T2", "E1", "E2", "S1", "S2", "B1", "B2", "C1", "C2")
DIRECTION_INDICATORS = {
    "transport": ("T1", "T2"),
    "ecology": ("E1", "E2"),
    "social": ("S1", "S2"),
    "safety": ("B1", "B2"),
    "services": ("C1", "C2"),
}
Dataset = dict[str, Any]
Decision = dict[str, Any]


def _get_data(data: Dataset | None) -> Dataset:
    data = load_all_datasets() if data is None else data
    versions = [data[key]["datasetVersion"] for key in ("districts", "measures", "rules")]
    if len(set(versions)) != 1:
        raise ValueError("Districts, measures and rules must have the same datasetVersion.")
    return data


def _known_decisions(decisions: Any, measures: dict[str, Any]) -> list[Decision]:
    """Select well-shaped, known IDs for budget reporting, even on invalid input."""
    if not isinstance(decisions, list):
        return []
    return [
        item for item in decisions
        if isinstance(item, dict)
        and isinstance(item.get("measureId"), str)
        and item["measureId"] in measures
    ]


def _budget(decisions: Any, data: Dataset) -> dict[str, int]:
    measures = {item["id"]: item for item in data["measures"]["measures"]}
    spent = sum(
        measures[item["measureId"]]["cost"]
        for item in _known_decisions(decisions, measures)
    )
    total = data["rules"]["budget"]
    return {"total": total, "spent": spent, "remaining": total - spent}


def validate_decisions(
    decisions: Any, data: Dataset, *, allow_partial: bool = False
) -> list[str]:
    """Validate complete calculations or a partial selection for the future API."""
    if not isinstance(decisions, list):
        return ["Decisions must be a list of objects."]

    rules = data["rules"]
    measures = {item["id"]: item for item in data["measures"]["measures"]}
    district_ids = {item["id"] for item in data["districts"]["districts"]}
    required = rules["requiredDecisionCount"]
    errors: list[str] = []
    if allow_partial:
        if len(decisions) > required:
            errors.append(f"At most {required} decisions are allowed.")
    elif len(decisions) != required:
        errors.append(f"Exactly {required} decisions are required.")

    selected: dict[str, set[str]] = {}
    directions: Counter[str] = Counter()
    for index, decision in enumerate(decisions):
        if not isinstance(decision, dict):
            errors.append(f"Decision {index + 1} must be an object.")
            continue
        measure_id = decision.get("measureId")
        if not isinstance(measure_id, str) or measure_id not in measures:
            errors.append(f"Unknown or invalid measureId in decision {index + 1}: {measure_id!r}.")
            continue
        if measure_id in selected:
            errors.append(f"Measure {measure_id} cannot be selected more than once.")
        selected.setdefault(measure_id, set())

        measure = measures[measure_id]
        directions[measure["direction"]] += 1
        district_id = decision.get("districtId")
        if measure["scope"] == "district":
            if not isinstance(district_id, str) or district_id not in district_ids:
                errors.append(f"Measure {measure_id} requires a valid district.")
            else:
                selected[measure_id].add(district_id)
        elif district_id is not None:
            errors.append(f"City measure {measure_id} must not specify a district.")

    budget = _budget(decisions, data)
    if budget["spent"] > budget["total"]:
        errors.append(f"Budget exceeded: {budget['spent']} of {budget['total']}.")
    for direction, count in sorted(directions.items()):
        if count > rules["maxMeasuresPerDirection"]:
            errors.append(f"At most {rules['maxMeasuresPerDirection']} measures are allowed in {direction}.")
    for first, second in rules["incompatibleMeasures"]:
        if first in selected and second in selected:
            errors.append(f"Measures {first} and {second} are incompatible in one scenario.")
    for first, second in rules["incompatibleMeasureDistrictPairs"]:
        for district_id in sorted(selected.get(first, set()) & selected.get(second, set())):
            errors.append(
                f"Measures {first} and {second} are incompatible in the same district: {district_id}."
            )
    return errors


def _summarize(districts: list[dict[str, Any]], rules: dict[str, Any]) -> dict[str, Any]:
    weights = rules["indicatorWeights"]
    score_weights = rules["scoreWeights"]
    results = []
    for district in districts:
        result = deepcopy(district)
        result["score"] = fsum(weights[key] * district["indicators"][key] for key in INDICATORS)
        result["criticalCount"] = sum(
            district["indicators"][key] < score_weights["criticalThreshold"] for key in INDICATORS
        )
        results.append(result)
    city_average = fsum(item["score"] * item["populationShare"] / 100 for item in results)
    weakest = min(results, key=lambda item: (item["score"], item["id"]))
    critical_count = sum(item["criticalCount"] for item in results)
    score = fsum((
        score_weights["weightedAverage"] * city_average,
        score_weights["weakestDistrict"] * weakest["score"],
        -score_weights["criticalPenalty"] * critical_count,
    ))
    return {
        "score": score,
        "cityAverage": city_average,
        "weakestDistrict": weakest["name"],
        "weakestDistrictId": weakest["id"],
        "criticalCount": critical_count,
        "districts": results,
    }


def calculate_baseline(data: Dataset | None = None) -> dict[str, Any]:
    """Compute the baseline from data and rules, with no display rounding."""
    data = _get_data(data)
    return {
        "datasetVersion": data["rules"]["datasetVersion"],
        **_summarize(data["districts"]["districts"], data["rules"]),
    }


def _apply_effects(
    decisions: list[Decision], data: Dataset
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Evaluate a validated selection/subset from an unmodified baseline."""
    rules = data["rules"]
    measures = {item["id"]: item for item in data["measures"]["measures"]}
    districts = deepcopy(data["districts"]["districts"])
    changes: dict[str, dict[str, list[float]]] = {
        district["id"]: {key: [] for key in INDICATORS} for district in districts
    }
    applied_effects = []
    for decision in decisions:
        measure = measures[decision["measureId"]]
        horizon = rules["simulationHorizonQuarters"]
        factor = (horizon - measure["lagQuarters"]) / horizon
        target_ids = list(changes) if measure["scope"] == "city" else [decision["districtId"]]
        effects = {key: value * factor for key, value in measure["effects"].items()}
        for district_id in target_ids:
            for indicator, effect in effects.items():
                changes[district_id][indicator].append(effect)
        applied_effects.append({
            "measureId": measure["id"], "realizationFactor": factor,
            "districtIds": target_ids, "effects": effects,
        })

    selected = {item["measureId"]: item for item in decisions}
    applied_synergies = []
    for synergy in rules["synergies"]:
        first, second = synergy["measures"]
        if first not in selected or second not in selected:
            continue
        if synergy["scope"] != "district_of_first_measure":
            raise ValueError(f"Unsupported synergy scope: {synergy['scope']}")
        district_id = selected[first]["districtId"]
        changes[district_id][synergy["indicator"]].append(synergy["bonus"])
        applied_synergies.append({
            "measures": list(synergy["measures"]), "districtId": district_id,
            "indicator": synergy["indicator"], "bonus": synergy["bonus"],
        })

    for district in districts:
        for key in INDICATORS:
            value = fsum([district["indicators"][key], *changes[district["id"]][key]])
            district["indicators"][key] = max(
                rules["indicatorMinimum"], min(rules["indicatorMaximum"], value)
            )
    return districts, applied_effects, applied_synergies


def _contributions(
    decisions: list[Decision], data: Dataset, baseline_score: float, final_score: float
) -> list[dict[str, Any]]:
    """Exact order-independent allocation of Score gain, including interactions."""
    size = len(decisions)
    full_mask = (1 << size) - 1
    scores = {0: baseline_score, full_mask: final_score}
    for mask in range(1, full_mask):
        subset = [item for i, item in enumerate(decisions) if mask & (1 << i)]
        districts, _, _ = _apply_effects(subset, data)
        scores[mask] = _summarize(districts, data["rules"])["score"]
    contributions = []
    for index, decision in enumerate(decisions):
        terms = []
        bit = 1 << index
        for mask in range(full_mask + 1):
            if mask & bit:
                continue
            count = mask.bit_count()
            weight = factorial(count) * factorial(size - count - 1) / factorial(size)
            terms.append(weight * (scores[mask | bit] - scores[mask]))
        contributions.append({**decision, "scoreContribution": fsum(terms)})
    return contributions


def calculate_scenario(decisions: Any, data: Dataset | None = None) -> dict[str, Any]:
    """Validate and calculate a complete scenario; never modify the inputs."""
    data = _get_data(data)
    validation_errors = validate_decisions(decisions, data)
    metadata = {
        "datasetVersion": data["rules"]["datasetVersion"],
        "valid": not validation_errors,
        "validationErrors": validation_errors,
        "budget": _budget(decisions, data),
    }
    if validation_errors:
        return metadata

    # Fixed ordering keeps both arithmetic and response lists reproducible.
    decisions = sorted(deepcopy(decisions), key=lambda item: item["measureId"])
    baseline = calculate_baseline(data)
    districts, applied_effects, applied_synergies = _apply_effects(decisions, data)
    result = _summarize(districts, data["rules"])
    before_by_id = {item["id"]: item for item in baseline["districts"]}
    for district in result["districts"]:
        before = before_by_id[district["id"]]
        district.update({
            "baselineScore": before["score"],
            "scoreDelta": district["score"] - before["score"],
            "baselineIndicators": deepcopy(before["indicators"]),
            "indicatorDeltas": {
                key: district["indicators"][key] - before["indicators"][key] for key in INDICATORS
            },
            "baselineCriticalCount": before["criticalCount"],
        })
    direction_deltas = {
        direction: fsum(
            district["populationShare"] / 100
            * fsum(district["indicatorDeltas"][key] for key in keys) / len(keys)
            for district in result["districts"]
        )
        for direction, keys in DIRECTION_INDICATORS.items()
    }
    return {
        **metadata,
        **result,
        "baselineScore": baseline["score"],
        "scoreDelta": result["score"] - baseline["score"],
        "directionDeltas": direction_deltas,
        "directionDeltaMethod": "population_weighted_mean_indicator_change",
        "contributions": _contributions(decisions, data, baseline["score"], result["score"]),
        "contributionMethod": "shapley",
        "appliedSynergies": applied_synergies,
        "appliedEffects": applied_effects,
    }
