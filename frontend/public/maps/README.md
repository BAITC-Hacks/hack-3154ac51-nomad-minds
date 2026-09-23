# Astana administrative boundaries

`astana-districts.geojson` is a local snapshot of OpenStreetMap administrative
relations, retrieved on 2026-09-23 from the OSM API (`/api/0.6/relation/{id}/full.json`).

| District | OpenStreetMap relation |
| --- | --- |
| Есиль | https://www.openstreetmap.org/relation/3479876 |
| Алматы | https://www.openstreetmap.org/relation/3482819 |
| Сарыарка | https://www.openstreetmap.org/relation/3486954 |
| Байконур | https://www.openstreetmap.org/relation/8593081 |
| Нура | https://www.openstreetmap.org/relation/20593940 |
| Сарайшык | https://www.openstreetmap.org/relation/19733918 |

Way segments are joined by their OSM endpoint node IDs into closed outer rings.
All source coordinates and detached polygons are preserved, without simplification.
None of these source relations contains inner rings. Coordinates use WGS84 and
GeoJSON order (longitude, latitude). Label positions are area centroids of the
largest polygon. Each feature records its source relation version and timestamp.

Data © OpenStreetMap contributors, licensed under ODbL 1.0:
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

These are community-maintained geographical boundaries, not a cadastral survey.
When updating the snapshot, fetch all six relations together and verify closed
rings, shared borders, non-overlap and labels before replacing the file.

Geography and simulation inputs are separate: Sarayshyk is displayed on the map,
but cannot receive scenario measures until the simulation dataset includes its
indicators and population weight. The existing five-district model is unchanged.
