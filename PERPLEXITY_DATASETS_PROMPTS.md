# Essential Datasets – Perplexity Prompts (Site Field Calculation & CFMA)

Use these prompts in **Perplexity** (or similar) to gather datasets for **site field calculation**, cost estimation, and construction norms. Outputs can feed dashboards, GST bills, and reporting.

---

## 1. Cost per Flat Casting (Indian Residential)

```
What are typical cost breakdowns for "per flat casting" or per-unit construction in Indian residential projects? Include: (a) labour cost per sq ft or per flat, (b) material cost (cement, steel, sand, brick) norms per unit, (c) typical square footage per 1BHK/2BHK/3BHK, and (d) 2024–2025 approximate rates in ₹ for Tier-1 cities (Mumbai, Pune, Bengaluru). Cite sources if possible.
```

---

## 2. Labour & Shift Norms (Construction)

```
What are standard construction labour shift patterns and wage norms in India? Include: (a) typical shift timings (e.g. 8–12, 12–4, 4–8), (b) skilled vs unskilled daily wage ranges (2024–2025) by region (Mumbai, Pune, NCR, South), (c) overtime rules, and (d) common headcount ratios (masons : helpers : steel fixers, etc.) per 100 sq m construction. Provide datasets or tables if available.
```

---

## 3. Material Consumption Norms (Residential)

```
Give typical material consumption norms for Indian residential construction per sq ft or per cubic metre: cement (bags), steel (kg), sand (cft), aggregate (cft), bricks (nos). Include breakdown for foundation, columns, beams, slab, brickwork, plastering. Reference IS codes or CPWD/state PWD norms where applicable. Provide a simple table format.
```

---

## 4. GST & Billing (Construction)

```
What are the GST rules and rates for construction services and construction materials in India (2024–2025)? Include: (a) GST on labour vs materials, (b) composition scheme vs normal, (c) TCS if applicable, (d) format requirements for tax-ready bills (e.g. HSN, place of supply). Summarise in a short, actionable checklist for a construction field management app generating automatic GST bills.
```

---

## 5. Geofence Radius & Attendance (Construction Sites)

```
For GPS-fenced attendance at construction sites in India: (a) what radius (meters) is typically used for "on-site" check-in (50m, 100m, 200m, 500m)? (b) Any labour law or compliance requirements for location-based attendance? (c) Best practices for handling multi-storey or large sites (single center vs multiple zones). Keep answer concise with bullet points.
```

---

## 6. Project Types & Budget Ranges

```
What are typical budget ranges (₹ per sq ft or total project cost) for Indian construction by project type: (a) Residential (affordable, mid, luxury), (b) Commercial (office, retail), (c) Industrial (factory, warehouse), (d) Infrastructure (roads, bridges)? Include ballpark figures for 2024–2025 and any regional variation (Mumbai vs Pune vs Tier-2).
```

---

## 7. Theft & Wastage (Materials)

```
What are commonly reported rates or benchmarks for construction material theft and wastage in India (cement, steel, sand, etc.)? Include: (a) typical wastage percentages used in estimation, (b) theft risk by material type, (c) best practices for real-time inventory (in/out) tracking to reduce loss. Brief, data-oriented answer.
```

---

## 8. Owner Dashboard KPIs (Single-Screen)

```
List essential KPIs for a "single-screen" construction owner dashboard in India: financial (budget vs spent, cost per unit, GST summary), time (schedule variance, milestone completion), and workforce (attendance rate, labour strength, turnover). Prioritise top 10–12 metrics with short definitions. Format as a checklist for implementation.
```

---

## How to Use

1. **Site field calculation:** Use prompts **1, 2, 3, 6** for cost models, shift logic, and material norms.
2. **Automatic GST bills:** Use **4** for tax-ready bill generation rules.
3. **Attendance & geofence:** Use **5** to validate radius (50–500 m) and multi-zone logic.
4. **Stock tracking / wastage alerts:** Use **7**.
5. **Owner dashboard:** Use **8** for metric definitions and UI copy.

Save Perplexity outputs (e.g. JSON or markdown) into `attached_assets/` or a `datasets/` folder and reference them in **IMPLEMENTATION_PLAN.md** and backend logic.
