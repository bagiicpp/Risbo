**Title:** Decoding EuroLeague Positions — Data-Driven Approach to Winning Rosters

### Methodology: Player Clustering

Traditional five-position model (PG/SG/SF/PF/C) fails to capture modern positionless basketball. Approach: classify players by actual statistical contributions, not predefined positions.

**Dataset:** 10 seasons of EuroLeague data.

**Steps:**
1. **Normalization:** Standardized all metrics (height, percentages exist on vastly different scales).
2. **Optimal cluster count:** Elbow Method (identifies point where adding clusters no longer improves differentiation) + Silhouette Score (measures cluster separation and internal cohesion).
3. **Result:** 7 clusters as optimal.
4. **Algorithm:** K-Means clustering — assigns each player to one of 7 groups based on statistical profile.
5. **Visualization:** PCA (Principal Component Analysis) reduces 20+ statistical features to 2 dimensions for 2D scatter plot visualization.

### The 7 Player Clusters (Identified Positions)

Per-cluster identification via top/bottom 5 distinguishing statistical features:
- **Cluster 1:** Perimeter Threats
- **Cluster 2:** (Traditional Bigs / interior-oriented)
- **Cluster 3:** Two-Way Forwards
- **Cluster 4:** Floor Generals (pass-first guards)
- **Cluster 5:** High-Usage Scorers
- **Cluster 6:** High-Volume Three-Point Shooters
- **Cluster 7:** Scoring & Rebounding Bigs

Centers show less differentiation (most fall into Clusters 2 or 7). Guards split by role: playmaking vs. scoring.

### Roster Construction Analysis (2024 EuroLeague)

| Team | Pattern | Outcome |
|------|---------|---------|
| EA7 | Heavy playmakers + traditional bigs, lacks Cluster 7 | 14th of 18 in 2PT attempts |
| Zalgiris (ZAL) | Versatile wings + bigs, few playmakers/scorers | Last in points scored per game |
| Maccabi (MTA) | Balanced across clusters, emphasis Cluster 7 | 2nd most 2PTM per game (behind BAR) |
| Real Madrid (RMB) | No true floor general; high-usage scorers + 3PT shooters | Campazzo, Hezonja as primary scorers |
| AS Monaco (ASM) | No true floor general; Mike James, Okobo as shot creators | Similar to RMB philosophy |
| Partizan (PAR) | High concentration two-way forwards, low diversity | — |
| Fenerbahçe (FBB) | High concentration two-way forwards | Strong standings despite low diversity |

### Roster Diversity Metrics

- **Unique Clusters:** Count of distinct player position types on a team — measures diversity.
- **Cluster Balance Score:** Distribution evenness across roles — measures specialization vs. balance.

**Linear regression results:**
- Unique Clusters: statistically significant predictor (p = 0.001); alone predicts 8.1% of W% variance.
- When combined with Cluster Balance Score: Unique Clusters effect drops to 5% (shared variance with balance).
- **Conclusion:** Roster diversity matters, but completely even distribution is not optimal. Teams must lean into specific strengths.

### Ideal Roster Composition

Comparing top vs. bottom 25% by W%:
- **Winning teams:** higher Cluster 1 (Perimeter Threats) and Cluster 6 (High-Volume 3PT Shooters).
- **Declining:** classic Floor Generals (Cluster 4); shift away from pass-first guards toward self-creating scorers.
- **Cluster 5 alone ≠ success:** Roster Cluster 4 (1.73 Cluster 5 players avg) among least successful due to lacking perimeter threats (Clusters 1 and 6).
- **Best-performing roster type:** High-Usage Scorers (C5) + High-Volume 3PT Shooters (C6) + Scoring/Rebounding Bigs (C7).
- **Traditional playmaking-heavy (Cluster 4 guards dominant) → underperforms** in modern EuroLeague.

**Takeaway for front offices:** Data-driven precision in roster construction. Prioritize perimeter threats and 3PT shooting over traditional playmakers. High-scoring players most effective when complemented by floor spacing.

---

**Source:** https://www.mdpi.com/2076-3417/15/23/12401
**Title:** From Data to Decisions: Using Explainable ML to Predict EuroLeague Basketball Outcomes

**Published:** 21 November 2025 | **Authors:** Foteinakis et al., Democritus University of Thrace + Aristotle University of Thessaloniki + Guangdong University of Science and Technology

### Abstract

Supervised ML framework applied to predict EuroLeague game outcomes using team-level game-related statistics. Four algorithms (LR, SVM, RF, NB) trained and compared following Recursive Feature Elimination (RFE). Dataset: shooting efficiency, rebounding, ball security, spatial shot distribution. SHAP interpretability applied to best-performing model.

**Top predictors:** True Shooting % (TS%), Defensive Rebounds (DR), Steals (ST), Turnovers (TO).

### Model Performance

| Model | AUC | Accuracy | Precision | Recall | F1 |
|-------|-----|----------|-----------|--------|-----|
| SVM (RBF kernel) | 0.922 | 0.841 | 0.836 | 0.848 | 0.842 |
| Logistic Regression | 0.933 | 0.818 | 0.828 | 0.803 | 0.815 |
| Random Forest | 0.854 | 0.758 | 0.736 | 0.803 | 0.768 |
| Naïve Bayes | 0.789 | 0.652 | 0.917 | 0.333 | 0.489 |

- **SVM:** best overall accuracy + AUC balance; captures non-linear relationships; selected 18 features via RFE.
- **LR:** highest AUC (0.933); strong interpretability; performs comparably to complex models when predictors are moderately correlated.
- **RF:** reliable but slightly lower; collinearity among features dilutes ensemble importance.
- **NB:** independence assumption violated in interdependent team stats → weakest performance.

### Methodology

- **Dataset:** 330 EuroLeague games (2024–25 season), 660 observations (2 per game), sourced from Hack-a-Stat.
- **Initial features:** 127 raw statistical variables per team.
- **After expert review + preprocessing:** 28 predictor variables (leakage-free — outcome-dependent variables removed).
- **Data split:** 80% training/validation (stratified 5-fold CV) + 20% held-out test set.
- **Pipeline:** median imputation → StandardScaler → RFE → classifier.
- **Hyperparameter tuning:** Grid Search CV with ROC-AUC as metric; RFE subset size tuned from 1–28 features.

### SHAP Feature Importance (SVM)

**Positive predictors (higher value → higher win probability):**
- DR (Defensive Rebounds) — strongest predictor
- TS% (True Shooting Percentage)
- ST (Steals)
- 3PTM (Three-Point Made)
- FGM (Field Goals Made)
- Home/Away indicator (modest but consistent home advantage)

**Negative predictors (higher value → lower win probability):**
- TO (Turnovers) — strong negative effect
- PF (Personal Fouls)
- SHOT_RANGE_MIDDLE (Mid-range attempts)

**Spatial shot distribution:**
- Lower mid-range reliance → higher win probability (aligns with modern efficiency philosophy)
- Balanced/increased 3PT frequency → higher win probability, especially with elevated accuracy

### Key Findings

- Winning EuroLeague teams: accurate shooting + disciplined defensive play + possession management.
- 3PTM remains strong predictor despite 3PT volume increases: each 1% increase in 3P% correlates with ~5 percentage-point increase in W%.
- High-efficiency close-range shots (paint area) also associated with winning.
- Home-court advantage confirmed: court familiarity, supporter effect, travel impact on opponents.
- Turnover management critical: reducing TO through decision-making training + structured offensive sets.

### Practical Applications

- **Offense:** favor paint + beyond-arc attempts; minimize mid-range sets.
- **Defense:** prioritize rebounding fundamentals, coordinated rotations, situational steal drills.
- **Roster:** balance high-usage playmakers with low-turnover support players.
- **Training:** decision-making drills for high-pressure scenarios; ball security focus.

### Limitations

- Single season (2024–25) — limited generalizability; no player-level data, injury status, or lineup structures.
- Classical ML algorithms — may not capture high-order temporal/spatial effects. Transformer-based possession modeling and player-interaction graphs identified as future directions.
- SHAP provides correlational, not causal, explanations.

---

**Source:** https://www.eurobasket.com/Holland/news/993005/How-Advanced-Data-Analytics-Are-Shaping-Team-Strategy-in-the-EuroLeague
**Title:** Advanced Data Analytics in EuroLeague Team Strategy

### Core Applications

**Shot quality models:** Evaluate shot selection by defender proximity and movement patterns around the arc and inside the paint — not just volume metrics.

**Lineup efficiency:** Pace-control indicators and net rating calculations per player combination; identifies which lineups generate stronger net ratings and at which tempo.

**Defensive refinement:** Large dataset analysis helps coaches refine defensive coverages and responses to pick-and-roll situations; data-driven in-game decision support.

**Player workload:** Fatigue management during high-pressure stretches; matchup strengths flagged for specific situations.

**Opposition scouting:** In-depth video matched with statistical tags; during playoff series enables anticipation of adjustments and faster response to evolving dynamics.

**Roster evaluation:** Impact metrics identify bench contributors who influence games beyond obvious statistics; multi-season performance indicators used to target specific skill profiles rather than headline names.

---

**Source:** Clutch Data (https://clutchdata.net) — EuroLeague Case Studies
**Title:** EuroLeague Lineup & Player Analytics Case Studies

*(Note: Clutch Data is a basketball analytics consultancy with MIT Sloan 2026 accepted paper: "Scouting Anyone: Probabilistic Player Archetypes for Any League" — 152 leagues, 56,000+ players, 3 million actions.)*

### Case Studies

**Panathinaikos (PAO) — Lineup Toxicity:**
- Shorts + Sloukas + Nunn trio on court together → Net Rating: **−10.4** (driven by defensive collapse, not offensive failure).
- Without all three sharing the floor → Net Rating: **+4.8**.
- Lesson: individual player quality ≠ lineup compatibility.

**Biberovic (Barcelona) — System Exposure:**
- 10th percentile in isolation possessions (0.57 PPS); 23rd percentile as P&R handler (0.85 PPS).
- Catch-and-shoot immediately: **0.86 PPS**; puts ball on floor: **0.55 PPS**.
- Almería's switching defensive scheme forced him into his weakest creation mode → design problem, not player problem.

**Brizuela — Role Assignment:**
- Before coaching change: 4 isolation possessions all season.
- Under Pascual: 21 isolations at **1.24 PPP** (best in EuroLeague among players with 20+ isolations).
- Player did not improve; he was given the right role. Data can identify role mismatch proactively.

**Markus Howard — Spacing Mismatch:**
- 72% Shooter Specialist profile; 99th percentile in 3PT attempts.
- On-court Net Rating: **−7.0**.
- Root cause: **57% of his minutes** alongside archetypes that compress spacing.
- Paired with correct 3&D profiles → immediate improvement projected.

---

## ═══════════════════════════════════
## TEMA 3: EUROLEAGUE — OFFICIAL STATISTICS CRITERIA MANUAL
## ═══════════════════════════════════

**Source:** https://ftpserver.euroleague.net/general/EB_Statistics_Criteria_Manual.pdf
**Title:** EuroLeague & EuroCup Statistics Criteria Manual (2024–25 season, Version 1.2)

### Abbreviations

| Code | Stat | Code | Stat |
|------|------|------|------|
| 2P | Two-pointer | 3P | Three-pointer |
| AS | Assist | BLK | Block |
| CC | Coach's challenge | DR | Defensive rebound |
| DQFOUL | Disqualifying foul | FB | Fast break |
| FD | Foul drawn | FTM | Free throw made |
| IRS | Instant Replay System | JB | Jump ball |
| MFT | Missed free throw | M3P | Missed three-pointer |
| M2P | Missed two-pointer | OFFOUL | Offensive foul |
| OR | Offensive rebound | PF | Personal foul |
| SR | Shot rejected | ST | Steal |
| SUBS | Substitution | TECH | Technical foul |
| TOUT | Time-out | TO | Turnover |
| UF | Unsportsmanlike foul | — | — |

### 1. Jump Ball

The jump ball is credited to the team gaining first control of the ball. This includes violations or fouls before any player gets the ball. If fouls occur before/during the jump ball without giving control to either team, these are recorded first, then the jump ball proceeds.

### 2. Shots and Scoring

A shot attempt is recorded when a player shoots toward the basket or tips the ball with intent to score. Classification (2P or 3P) based on player location on court; takes precedence over referee signal unless shot results in a score.

**Missed shot:** Recorded unless player is fouled in the act of shooting (in that case, no missed shot recorded). Missed shot IS entered if any other foul/violation is called after releasing the ball.

**Made shot:** Points credited to the last offensive player touching the ball before it enters the hoop, even if not an intentional scoring attempt. Exception: own goals credited to the court captain of the scoring team.

**Goaltending violation:** Basket cancelled → missed shot remains + team rebound for defensive team; no turnover charged.

**Free throws:** Made when validated by referee. If not made with no violation → missed free throw recorded. If violation by opposing team and free throw repeated → previous missed FT not entered. If violation by shooter → missed FT remains. If free throw cancelled (wrong shooter) → turnover charged to team, no free throws recorded.

### 3. Assists

Assist credited for every pass to a teammate generating an advantage to score, provided scorer's intention is to shoot. Includes:
- Pass to post player who scores without leaving the post area
- Pass to player who scores without dribbling (no active defense or immediate action)
- Pass to unguarded player who scores on the way to basket (unless forced to dribble around a defender)

Assist credited for free throws from shooting fouls (recorded after first free throw made), but NOT for bonus situation free throws (after 5th team foul).

**No assist if:** Pass deflected by defender; pass so inaccurate receiver must move to different location; scorer benefited from a screen set after receiving the ball while guarded.

### 4. Rebounds

Recorded after any missed shot unless shot clock or game clock sounds before either team gains control.

**Individual rebound:** Player gains first control of live ball; or intentionally tips to opponent causing it to go out of bounds (without establishing control); or wins jump ball situation.

**Team rebound:** Ball becomes dead before any player takes control (exceptions: held ball jump ball). Credited to team gaining new possession.

**Tipped ball:** Only counts as intentional if clearly aimed at a teammate allowing them to clearly receive it.

**Goaltending:** Basket cancelled → missed shot + team rebound for defensive team; no turnover.

### 5. Blocks

Always credited to a player. Block recorded when: deflection occurs during a shooting action, ball is above shooter's shoulder, intended as a shot, and shot does NOT result in a score. Ball need not have left shooter's hands. If conditions not met and opposing team gains control → turnover; if same team retains → no statistic.

Block NOT entered if shooting action results in a foul called against the shooter.

When block credited: also charge missed shot + shot rejected to blocked player; then apply standard rebound criteria.

### 6. Steals

Always credited to a player. Steal recorded whenever a team gains new possession of a live ball (or after jump ball due to held ball), as long as no shot occurred. Credited to player who recovers control, unless obtained after a teammate's deflection — in that case, steal goes to the player who deflected.

Deflection only counts if intentional (deliberate touch with legal body part).

**No steal:** When new possession gained following an out-of-bounds play.

### 7. Turnovers

A steal is always preceded by a turnover, but a turnover does not always result in a steal.

Turnover recorded whenever a team loses control of the ball (dead ball or live ball), except shots where rebound criteria apply.

**Time violation turnovers:**
- 3-second violation → Player turnover
- 5-second inbound violation → Team turnover
- 5-second closely guarded → Player turnover
- 8-second backcourt → Team turnover
- 24/14-second shot clock → Team turnover

**Player turnover:** Charged to player who, in statistician's judgment, caused the loss — not necessarily the last player to control it. Violations (foot violation, 3-second, travelling, illegal dribbling) → player turnover. Offensive foul, unsportsmanlike foul, disqualifying foul while team has possession → turnover to fouling player. Bench disqualifying foul → team turnover.

### 8. Fouls

Personal and unsportsmanlike fouls → charged to player. Technical and disqualifying fouls → may be charged to player, coach, or bench. Player technical fouls do NOT count as team fouls.

Foul drawn recorded for player receiving the foul (except technical/disqualifying fouls without physical contact).

For double fouls: only fouls and fouls drawn recorded; no turnovers or additional statistics.

### 9. Substitutions

Must be recorded at exact minute and second. After time-outs or start of quarters: all players on court removed from software, new players entered. Substitution cannot occur if players involved already substituted and game clock has not restarted. All end-of-quarter substitutions recorded after End Quarter command, before next Begin Quarter command.

### 10. Fast Breaks

Any basket scored quickly after a change of possession with a numerical advantage = fast break. Includes free throws from a foul during the fast break action.

### 11. Time-Outs

Credited to requesting team. First time-out of quarter → also record TV time-out. If no team has requested a time-out in a quarter and one is called on the first dead ball with <5 min remaining → TV time-out. Referee-called time-out not matching above → also TV time-out.

**IRS/CC:** Instant Replay System or Coach's Challenge recorded at exact game clock time after review. If review upholds original decision → no changes to recorded stats. If overturned → affected statistics edited; IRS/CC entry remains unchanged unless game clock time modified.

### 13. Timing

All actions recorded at correct game clock time. In stopped-clock situations (turnovers, fouls, free throws, IRS/CC, time-outs, substitutions): adjust time accurately before recording. Actions with <1 second remaining → entered as 1 second. In live ball situations: maximum 10-second margin of error from actual game clock time.

### 14. Special Situations

**Statistical criteria override:** Cannot apply criteria when:
- Bonus situation involved (e.g., attacking team commits offensive foul but opposing team awarded free throws due to bonus — no change of possession recorded even though criteria would indicate one)
- Shot clock situation involved (e.g., no change of possession but shot clock resets)

**Criteria applied regardless:** If offensive/regular foul called differently but no bonus affecting call; if shot clock contradiction doesn't alter what happened on court; if clear 2P/3P miss and referees signal differently.

### 15. Jump Ball Situations

**Lodged on basket support:** Team gaining post-jump ball possession credited with team rebound.

**Ball out of bounds after shot with no possession + jump ball called:** Gaining team gets team rebound.

**Two players hold ball simultaneously:** Player rebound to the jump ball participant from the team gaining next possession.

**After jump ball, possession changes via steal:** Steal credited over jump ball rebound.

**Ball out of bounds during jump ball:** No steal; player turnover to player who "almost" lost the ball before the jump ball.

**Multiple consecutive jump balls:** Same criteria applied; outcome of first jump ball prevails.

**Ball retained by same team after jump ball:** No statistics recorded.
