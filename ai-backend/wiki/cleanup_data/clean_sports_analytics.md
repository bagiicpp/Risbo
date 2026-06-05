# SPORTS ANALYTICS WIKI — CLEANED & ORGANIZED
# Teme: NBA Draft Analytics | EuroLeague Analytics | EuroLeague Stats Manual | Football Recruitment & Scouting | Wyscout Platform | Analytics Tools & Platforms

---

## ═══════════════════════════════════
## TEMA 1: NBA — MACHINE LEARNING & DRAFT ANALYTICS
## ═══════════════════════════════════

**Source:** https://medium.com/@robert.mepham/decoding-the-draft-how-machine-learning-transforms-nba-talent-evaluation-641c26e4e79f
**Title:** NBA Draft: Machine Learning in Talent Evaluation

### ML vs. Traditional Scouting

Machine learning algorithms enable NBA teams to analyze vast amounts of game footage by using pattern recognition and deep learning to identify key plays, player movements, and court interactions. Teams access video databases spanning multiple seasons and leagues worldwide. ML provides objective insights into shot charts, shot selection, defensive positioning, and player movement — detail impossible to achieve manually.

Human scouts remain essential for intangibles: emotional intelligence, leadership potential, and work ethic. ML handles statistical trends and patterns; scouts interpret competitive character and context (e.g., "Player X shows up when the lights get bright").

**ML advantages over scouts:** removes recency bias and confirmation bias; quantifies feature contributions.
**Scout advantages over ML:** provides game context; no concern about data cleanliness; physically present to observe.

### Historical Draft Misses

Notable busts and overlooked players demonstrate evaluation gaps:
- **Passed over:** Steph Curry, Giannis Antetokounmpo, Nikola Jokic — all drafted far below expected value.
- **Busts:** Anthony Bennett (#1, 2013, 4.4 PPG over 4 seasons), Dragan Bender, Dante Exum.
- **2013 draft:** Giannis selected #15 by Milwaukee Bucks; Rudy Gobert selected #27 by Denver Nuggets (went on to win 3 DPOY for Utah Jazz). Demonstrates: weak top picks ≠ weak draft overall.

**Cavaliers 2013:** Prioritized "fit" over talent with Bennett, an approach rarely used by teams holding the #1 pick today.

### Foreign Player Trend

Last 5 NBA MVP awards went to foreign-born players:
- Nikola Jokic (x2) — Serbia
- Giannis Antetokounmpo (x2) — Greece
- Joel Embiid — Cameroon

Additional: Luka Doncic (Slovenia), consensus 1st-team All-NBA. The risk premium historically assigned to foreign prospects has been eliminated.

### Rishi's Position-Less Draft Model (DraftScore)

Independent analyst Rishi (IUPUI, Master's Applied Data Science, Sports Analytics focus) built a position-less NBA draft evaluation system:

1. **Data aggregation:** Player profile built from high school, college, AAU, and international game data.
2. **Archetype classification (KNN):** KNN algorithm classifies each prospect into 1 of 12 player archetypes. Number 12 determined via exhaustive unsupervised clustering of all NBA players. Archetypes include: 3&D Wings, Glue Guys, Stretch 4, etc.
3. **Multi-archetype fit:** Each prospect classified into the 4 archetypes they most likely fit.
4. **Regression per archetype:** Advanced regression predicts prospect's value in each archetypal role for their first NBA year.
5. **DraftScore:** Weighted average of 4 archetype predictions + additional features (size, wingspan, age, 3PT shooting, defensive ability, interior play) = single all-in-one first-year value metric.

**Validation set:** 2022 NBA draft prospects proxied against 2023; plans to extend to 2010–2015. Future expansions: 3-year, 5-year, 10-year projections; boom/bust floor/ceiling projections; All-Star selection prediction.

---

**Source:** https://magazine.wharton.upenn.edu/digital/basketball-management-scouts-or-stats/
**Title:** Basketball Management: Scouts or Stats?

### Why Analytics Are Harder in Basketball

Analytics work better in discontinuous games (baseball, American football) because those are modular — each play is isolated. Sabermetrics (Bill James, SABR) defines itself as "the search for objective knowledge about baseball." The Oakland A's (Moneyball/Billy Beane) famously increased their scouting budget AFTER adopting analytics — the two are complementary, not competing.

Basketball is different: dynamic, collaborative, continuous. Red Auerbach (Celtics): "The only thing modular in basketball is the shooting of free throws. Everything else turns on the interaction of 10 players." The Celtics won 17 NBA titles without ever having the league's leading scorer — team dynamics dominate individual stats.

**Conclusion:** Both scouts and stats are necessary. Analytics tip the balance; they do not replace judgment. Roughly half of all NFL games decided by 6–7 points, ~25% by 3 — even the most preparation-intensive sport requires in-game adjustment.

---

**Source:** https://www.nbastuffer.com/how-nba-teams-use-analytics-to-draft/
**Title:** How NBA Teams Use Advanced Stats to Draft Smarter

### Key Draft Metrics

| Metric | Definition |
|--------|-----------|
| PER | Player Efficiency Rating — productivity per minute |
| BPM | Box Plus-Minus — estimate of overall team impact |
| TS% | True Shooting Percentage — overall shooting efficiency |
| WS | Win Shares — extent player contributes to team wins |

Adjustments applied for pace, competition level, and team role. A player with average stat lines but strong PER and TS% may be projected as high-upside pick.

### Biomechanical & Injury Analytics

- **Wearable sensors:** measure acceleration, joint angles, movement metrics
- **Motion capture:** identifies abnormal biomechanics indicating injury risk
- **NBA standard:** motion capture labs installed at all 30 team facilities
- **Training load monitoring:** excessive loads correlate with higher injury risk

### Real-Time Tracking Technology

- **SportVU (2013):** 6 cameras tracking players + ball at 25 times/second → speed, distance, positioning
- **Second Spectrum (current provider):** cameras + ML → 3D spatial data for every action and court interaction

### International Prospect Evaluation

- Models account for differences in playing style, league difficulty, and player roles
- **PIR (Performance Index Rating):** common European metric, helps cross-league assessment
- Challenge: inconsistent competition quality (e.g., players competing in multiple leagues during draft year)

### Draft Pick Value Models

Data shows the **3rd overall pick** frequently outperforms the **2nd overall pick** in WS and BPM. The **4th pick** historically carries high variance. Teams use WS and BPM projections to evaluate trade-up/down decisions. A guard-heavy team may trade down to target a specific forward archetype.

### Hybrid Approach

NBA Draft Analyst Matt Babcock: statistics reveal trends, but only in-person observation reveals coachability and on-court demeanor. Metrics for efficiency + scouts for intangibles = comprehensive player profile.

---

**Source:** https://onlinequeso.com/blogs/trending-today/the-evolution-of-nba-scouting-how-language-and-ai-are-shaping-player-evaluations
**Title:** Language Analysis & AI in NBA Player Evaluations

### Language as a Predictive Marker

Sean Farrell (senior data scientist, Australia) and co-authors developed ML models analyzing ~26,000 transcripts from ~1,500 college players over decades. Key findings:

- **Predictive accuracy:** 63% for NBA roster placement; 87% when factoring in age and height; 69% for predicting 250+ game NBA careers.
- **Language characteristics correlated with success:** clear, honest communication; use of words like "realize," "believe," "understand."
- **Inverse correlation:** longer, more complex sentences → less likely to succeed. Clarity and simplicity correlate with focused mindset.
- **Validated predictions:** Kawhi Leonard and Draymond Green correctly forecasted as successful; model missed on Jimmy Butler.

Research presented at MIT Sloan Sports Analytics Conference; generated interest from NBA teams.

### AI Integration in NBA Scouting

- **Philadelphia 76ers:** AI models analyze scouting notes + player tracking data; AI treated as a supplementary scout.
- **Orlando Magic:** AutoStats platform enhanced accuracy in predicting player movement trends and statistics.
- **NBA Launchpad:** League initiative investing in tech startups for AI applications in on-court performance and fan experience.

### Psychological Metrics in Evaluation

- Communication style: clarity and directness → indicators of compartmentalization ability under NBA pressure.
- Present-focused players (emphasizing team over personal performance) correlate with resilience and long-term adaptability.
- Future trend: increased data scientists in front offices; psychological resilience prioritized alongside athletic metrics.

---

## ═══════════════════════════════════
## TEMA 2: EUROLEAGUE — ANALYTICS & RESEARCH
## ═══════════════════════════════════

**Source:** https://sltsportsanalytics.substack.com/p/decoding-euroleague-positions-a-data
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

---

## ═══════════════════════════════════
## TEMA 4: FOOTBALL (SOCCER) — DATA-DRIVEN RECRUITMENT & SCOUTING
## ═══════════════════════════════════

**Source:** https://breakingthelines.com/investigation-piece/the-role-of-data-in-player-recruitment-and-scouting/
**Title:** The Role of Data in Player Recruitment and Scouting

### Key Recruitment Metrics

- xG (Expected Goals), defensive duels won, progressive carries, passing accuracy
- Advanced models project career trajectory from performance data + physical attributes

### Core Applications

**1. Identifying undervalued talent:** Analytics surfaces players in less-scouted leagues/regions. Brighton unearthed Moisés Caicedo (Ecuador) via defensive duels + ball progression metrics; Alexis Mac Allister (Argentina) via creative passing + versatility — both signed for low fees, both became major assets.

**2. Tactical system fit:** Analytics evaluates how a player fits a team's playing style. Liverpool's recruitment of Andrew Robertson from Hull City (relegated) driven by progressive passing and defensive action metrics aligning with Klopp's system.

**3. Financial risk reduction:** Brentford identified Neal Maupay's xG numbers relative to minutes played → signed for modest fee from Saint-Étienne → 41 goals in 2 seasons → profitable sale to Brighton.

**4. Age profiling / career trajectory:** Borussia Dortmund's Jude Bellingham signing influenced by mature passing metrics and pressing efficiency at Birmingham City, despite being 17.

**5. Transfer negotiation:** Clubs quantify player value with analytics; agents use data to justify transfer fees and wages.

### Case Studies

**Brentford (Moneyball approach):**
- Neal Maupay: high xG relative to playing time → signed from Saint-Étienne for modest fee → 41 goals in 2 seasons → sold to Brighton for profit.

**Liverpool (precision targeting):**
- Mohamed Salah: high xG contribution + relentless pressing ability + pace → suited Klopp's high-intensity system.
- Andrew Robertson: progressive passing + defensive actions at Hull City despite relegation → key in Premier League and Champions League wins.

**Brighton (smart recruitment):**
- Moisés Caicedo + Alexis Mac Allister: defensive duels, interceptions, ball progression metrics → signed from South America for low fees → both became major Premier League assets.

**Borussia Dortmund (youth identification):**
- Erling Haaland: staggering goal conversion rate + off-ball movement at Red Bull Salzburg (video + data analysis).
- Jude Bellingham: mature passing metrics + pressing efficiency at Birmingham City at 17.

**FC Midtjylland (data pioneers):**
- Pione Sisto: exceptional dribbling success rate in youth matches.
- Set-piece analysis used to identify opposition weaknesses as competitive edge.

### Tools Used Professionally

| Platform | Function |
|----------|---------|
| Opta / StatsBomb | Detailed stats: passing, shooting, defensive metrics |
| Wyscout | Video analysis + player data |
| InStat | Video + data for holistic player evaluations |
| GPS Trackers / Wearables | Sprint speeds, distance, recovery times |
| AI / ML | Predict future performance trends, identify hidden patterns |

### Limitations

- Data cannot capture leadership, adaptability, or environmental adjustment.
- Smaller clubs lack access to advanced platforms (cost barrier).
- Overemphasis on specific metrics leads to flawed decisions.
- Best decisions combine data with experienced scout judgment.

---

**Source:** https://english-programs.sportsdatacampus.com/scouting-with-data/
**Title:** Scouting with Data in Football — AI and Big Data

### From Qualitative Observation to Quantitative Modeling

Behaviors once described in written reports (decision-making, intensity, tactical awareness) now translated into measurable variables: defensive action volume, positional advantage creation, pressing phase contribution, duel efficiency. Structured databases enable analysis of thousands of events per player across competitive contexts. ML algorithms estimate consistency, long-term development probability, and adaptation likelihood to new tactical environments.

**Advantages:**
- Metrics normalized per 90 minutes, possession-adjusted, performance linked to competitive context.
- Longitudinal consistency evaluation (multiple seasons, varying opposition levels).
- Cross-league comparisons via tempo/defensive intensity/possession volume adjustments.
- Statistical pre-filtering reduces unnecessary scouting travel.

### Case Studies

**Vedat Muriqi → Mallorca (2022) — Data-Backed Success:**
- Lazio spell: 49 matches, 2 goals → surface stats look weak.
- Deeper analysis: Fenerbahçe 2019–20: 17 goals in 36 matches; Kosovo national team: 18 goals in 37 appearances.
- Physical profile (aerial ability, high-pressing role) matched Mallorca's tactical needs.
- Outcome: January 2022 loan → 5 goals + 3 assists in 16 matches → €9.3M permanent signing (most expensive in club history) → 15 league goals in 2022–23 (team top scorer) → 65% of team goals involving Muriqi + Dani Rodríguez partnership.

**Lázaro Vinicius → Almería (2024) — System Mismatch Failure:**
- €7M signing, 20-year-old Brazilian forward.
- Strong individual moments (3 goals vs Mallorca, 1 at Bernabéu) but couldn't adapt to Almería's tactical framework.
- His strengths were optimized in different tactical setup than Almería deployed.
- Lesson: data scouting must analyze player-system fit, not only individual performance.

### AI & Sensor Technology

**Automated AI scouting (Eyeball, SkillCorner, StatsBomb):**
- Processes match recordings + tracks thousands of young players across competitions.
- Identifies profiles by movement patterns, phase-of-play involvement, technical metrics.
- Acts as first-layer talent filter; does not replace human validation.

**Biomechanical sensors (Kinexon, Catapult, Xsens):**
- IMUs record: 3D acceleration, direction changes, stride frequency, mechanical load.
- Evaluates movement efficiency, stability during support phases, high-intensity effort consistency.
- Detects structural limitations that affect adaptation to more demanding leagues.

**Injury prediction (Zone7, Orreco, Kitman Labs):**
- Combines accumulated workload, medical history, high-intensity effort frequency, recovery patterns.
- Generates probabilistic injury risk estimation → informs contract valuation, squad planning.

**Performance projection models:**
- Longitudinal data + age + seasonal progression + multi-system consistency → career trajectory projections.
- Similarity analysis: identify comparable career trajectories → estimate development probabilities.
- Reduces uncertainty for young player signings or players from low-visibility competitions.

---

**Source:** https://datasportsgroup.com/news-article/155673/data-driven-recruitment:-transforming-how-teams-scout-and-sign-talent/
**Title:** Data-Driven Recruitment — Key Areas & Applications

### Five Core Areas of Data Impact in Recruitment

**1. Objective player evaluation:** Quantifiable metrics replace subjective assessment. Football: midfielder pass progression rate. Basketball: guard shooting efficiency under pressure. Granular data enables precise cross-player comparisons.

**2. Identifying hidden talent:** Performance data from lower leagues/junior divisions reveals high-upside players before traditional scouting reaches them. Liverpool FC and Golden State Warriors cited as examples of data-driven talent discovery.

**3. Predicting future performance:** Historical data + predictive analytics → career trajectory forecasting. Will aging star maintain performance? How will young athlete's skillset develop? Data models answer these questions before long-term contract commitments.

**4. Injury prevention:** Player health, injury history, and recovery rate data integrated into selection. Evaluating injury risk reduces probability of signing players who will miss significant time.

**5. Cultural fit and team dynamics:** Passing networks, possession tendencies, communication pattern analysis → assessing whether new recruit adapts to team's playing style and culture.

---

**Source:** https://www.callplaybook.com/reports/top-10-ai-scouting-and-recruitment
**Title:** Top 10 Ways AI is Revolutionizing Player Scouting and Recruitment

### 10 AI Applications in Scouting

**1. Multi-source data integration:** Player tracking, wearable devices, game footage, social media processed simultaneously → more complete player profile than box score allows.

**2. Computer vision / AI video analysis:** Tracks every movement, pass, and decision during games. Never fatigued; processes far more data than human scouts; consistent criteria applied to every player.

**3. Predictive analytics:** Historical data → future performance trajectory. Identifies players likely to outperform current level before market recognizes them.

**4. Injury risk prediction:** Movement patterns + training loads + biometric data → up to 90% accuracy in predicting injury risk. Identifies subtle changes in movement patterns indicating elevated risk before symptoms appear.

**5. Personalized training programs:** AI analyzes performance data → custom training: technical drills, physical conditioning, tactical understanding, mental preparation. Optimized based on individual response to different training stimuli.

**6. Opposition analysis:** Identifies patterns, weaknesses, set-piece vulnerabilities, formation transition reactions from thousands of hours of footage. Enables targeted game plans impossible to develop through manual analysis.

**7. Scouting network optimization:** Identifies which regions, leagues, and tournaments are most likely to produce players matching a club's specific needs and playing style. Efficient allocation of limited scouting resources.

**8. Transfer market analysis:** Player performance data vs. contract values + wage demands + potential resale value. Predicts value trajectory → optimal buy/sell/extend timing. Particularly valuable in inflated transfer market.

**9. Career projection:** AI models simulate player performance across different tactical setups. Enables tailored recruitment aligned with club's playing philosophy rather than generic quality assessment.

**10. Psychological assessment:** Cognitive functions, decision-making skills, personality traits analyzed through interviews and game simulations.

---

**Source:** https://pro-sportagent.com/2025/01/07/scientific-advancements-in-football-revolutionizing-player-development-and-talent-identification/
**Title:** Innovative Technologies in Football — Player Development & Talent Identification

### Data Analytics in Recruitment

Clubs assess players via physical (distance covered, sprints, stamina) + technical/tactical (pass accuracy, heat maps, xG) metrics.

**Club examples:**
- **Liverpool FC:** Dedicated analytics team (Ian Graham, now retired) → Salah and Mané signings based on predictive models identifying high-intensity system fit.
- **FC Midtjylland:** Advanced analytics for all recruitment decisions (e.g., Pione Sisto based on performance data).
- **Brentford FC:** Leveraged analytics to transition from lower-tier to Premier League using undervalued player model.

### Psychological Preparation

Elite clubs use CBT, visualization, NLP for mental toughness.
- **Manchester City academy:** Mindfulness training + coping strategies for high-pressure situations.
- **Real Madrid:** Individualized mentorship programs for psychological resilience in young players.
- **Football IntelliGym:** Cognitive training software simulating on-field scenarios (anticipation, spatial awareness, decision-making).

Research: psychological skills training → improved penalty shootout accuracy, composure in high-stress matches, on-field leadership.

### Training Technologies

| Technology | Use Case | Clubs |
|-----------|---------|-------|
| GPS wearables | Real-time movement, heart rate, fatigue | Bayern Munich |
| AR/VR | Decision-making simulation in game scenarios | Borussia Dortmund |
| Holographic simulations | Penalty accuracy training | Sunderland FC |
| Catapult GPS | 1,000 data points/player/second (movement, HR, fatigue) | PSG and others |
| KINEXON sensors | Injury risk via joint stress + movement patterns | Multiple clubs |

*Journal of Sports Science:* AR integration → 15% improvement in reaction times and tactical decision-making.

### AI Scouting Platforms

- **aiScout:** AI evaluates technical, physical, tactical abilities via video submissions → ranked list of recruits per predefined criteria.
- **Scoutium:** Video analysis + AI → emerging talent in lesser-known leagues.
- **Chelsea:** Wyscout-enhanced global scouting network → Eden Hazard identification at Lille.
- **RB Leipzig:** Data-driven model targeting under-23 players fitting high-intensity playing style.
- **La Masia (Barcelona):** Technical mastery + tactical intelligence; small-sided games for close control and decision-making.
- **Ajax Academy:** Positional versatility across multiple positions; "Total Football" philosophy.
- **Southampton FC:** Video analysis + personalized development plans; produced Gareth Bale, Luke Shaw.

---

## ═══════════════════════════════════
## TEMA 5: WYSCOUT — PLATFORM, HISTORIA I USAGE
## ═══════════════════════════════════

**Sources:**
- https://www.sportperformanceanalysis.com/article/how-wyscout-has-changed-football-scouting
- https://www.skysports.com/football/news/11668/11277117/why-does-willian-use-wyscout-digital-scouting-tool-explained
- https://soccerwizdom.com/2025/02/13/wyscout-the-game-changing-soccer-analysis-tool/
- https://www.scoutmepro.com/blog/football-scouting-platforms-compared-what-scouts-actually-use
- https://www.hudl.com/blog/pro-tips-for-remote-scouting-wyscout-scouting-area
- https://www.hudl.com/blog/introducing-hudl-wyscout

**Title:** Wyscout — Platform Overview, History & Professional Usage

### Platform History

| Year | Milestone |
|------|---------|
| 2004 | Launch in Italy as Football Match Analysis + Advertising provider |
| 2008 | First user interface with basic stats (weight, height) |
| 2012 | 200,000 players captured; 300 professional clubs + 15 national sides actively using |
| 2016 | 200 analysts collecting data for 1,300 matches/week; 32,000 professional users |
| 2018 | 95% of Premier League teams using Wyscout; 500+ leagues worldwide |
| 2024+ | Rebranded as Hudl Wyscout; integrated into Hudl Pro Suite |

CEO Matteo Campodonico: "Most transfers in the January window started from Wyscout." "The first move to watch a player is not on the field, but on Wyscout." "It has made a sort of democracy — any club can watch any player in the world."

### Platform Capabilities

- **Full match replays** from 500+ leagues (top flight through semi-professional and youth)
- **Detailed player stats:** passes, shots, tackles, heatmaps, shot zones, possession-adjusted metrics
- **Defensive data unique to Wyscout:** possession-adjusted interceptions, defensive duels/actions, attacking duels/actions, forward passing numbers
- **Scouting tools:** filter players by position, age, league, performance metrics
- **Automatic video reports:** all tagged individual player events in a match
- **Custom video reports:** selected events per football action
- **Effective time:** cuts dead ball periods; reduces ~90 min match to ~60 min
- **Set-piece analysis**
- **Indexing models:** compare players across different leagues using normalized ratios
- **Wyscout Scouting Area:** curated clip database linked to scouting reports, Shadow Teams, Playlist tool

**Pricing:** Personal licence from €299/year (Copper tier, 70 min video/month). Club licences significantly more.

### Who Uses Wyscout

- **Clubs/scouts:** Analyze hundreds of players without traveling. Liverpool, AC Milan, and clubs across 87 countries.
- **Coaches:** Study opponent formations, weaknesses, set-piece trends; track own team performance.
- **Players:** Willian (Chelsea) used it to watch every pass, interception, aerial duel; also used to prepare for opponents.
- **Agents:** Promote clients with full match footage instead of highlight reels.
- **Media/journalists:** Power rankings feature to identify transfer targets; data-backed analysis.
- **Leicester City (2015–16 title season):** Gave players iPads with Wyscout for match review during the week.

### Hudl Wyscout Integrations

**Wyscout → Hudl:** Export key moments or full matches directly into Hudl for match prep + team analysis presentations.

**Wyscout + Hudl Sportscode:** Download XML files with event data → overlay Wyscout events and video in custom Sportscode coding windows. Blends recruitment with tactical analysis.

**Wyscout + Insight:** Stream videos from Wyscout into Insight; automatically align event data; connect raw tracking data with event data; ingest Wyscout Data API for centralized performance dashboards.

### Professional Scouting Workflows Using Wyscout

**Leeds United (Victor Orta, Director of Football) — 4 Pillars:**
Technical, Physical, Mental, Transition to new surroundings. Video evidence used to minimize risk in technical assessment: "If you want to minimize the risks you can use tools like Wyscout to monitor players for all the time you need."

**FC Utrecht (Chief Scout Ajie Schut) — 5-person team:**
1. Data + video in Wyscout to report on wide range of leagues/players.
2. Scouts cut specific clips demonstrating assessed qualities (e.g., 1v1 skills, crossing) for Chief Scout review.
3. Clips in Scouting Area reports → shared with coach and technical directors who lack time for full reports.
4. Playlist tool → players added to Shadow Teams when promising.

**Wolverhampton Wanderers (John Marshall, Head of Recruitment):**
Divide international youth competition games among scouts for remote viewing. Follow up with live scouting when targets come to Europe. Critical for covering global competitions cost-effectively.

### Limitations (Wyscout)

- **Over-reliance risk:** Stats don't capture mentality, work ethic, team chemistry.
- **Cost:** Expensive for lower-league clubs and academies; accessibility gap.
- **Video quality:** Poor in smaller leagues; camera angles may be suboptimal.
- **Human element remains essential:** Body language, pressure response, teammate interactions require live scouting.

### Missing Data Points in Wyscout (per professional analysts)

**Not available in Player List comparisons:**
Pressing duels/90, recoveries in opposition half, total actions successful %, accelerations, loose ball duels %, missed balls/90, losses in own half, progressive passes allowed, progressive carries.

**Missing vs. competitors (Sofascore, FBRef, StatsBomb):**
Tackles, tackle %, dispossessed, dribbled past, possession lost, error-led shots/goals, progressive passes received, switches of play, miscontrols, shot-creating/goal-creating actions. Goalkeeper: successful runs out, punches/claims, defensive actions outside box, average distance of actions, crosses stopped %. StatsBomb-exclusive: pressure %, pressures by third.

**Heatmap quality:** Sofascore offers more precise action location mapping vs. Wyscout's broader coverage areas.

**Missing: Similar player comparison tool** (FBRef has this; Wyscout does not despite having broader league coverage — needed for finding player replacements across all leagues).

### Wyscout vs. Other Platforms

| Platform | Strength | Weakness / Scope |
|----------|---------|-----------------|
| Wyscout | Industry standard; video + data; 500+ leagues; semi-pro/youth | Expensive; missing some advanced metrics; heatmap quality varies |
| InStat | Strong Eastern/lower European leagues (Poland, Ukraine, Scandinavia, Balkans) | Narrower than Wyscout overall |
| Hudl | Academy/college/semi-pro; US sports origin; coaching tool | Built for teams, not individual self-promotion; limited scouting scope |
| SkillCorner | Physical/tactical data from broadcast footage; press intensity, off-ball movement | Only televised matches; analyst tool, not player showcase |

---

**Source:** https://360scouting.com/wyscout-tips-outsmarting-everyone/
**Title:** Mastering Wyscout — Video Scouting Methods

### Three Video Scouting Methods

**1. Effective Time**
- Removes dead ball periods (~30 min saved per match)
- Retains full game context: what player does without ball, team formations, game flow
- Can evaluate multiple players simultaneously in one match
- **Disadvantage:** ~1 hour per match; need 3+ matches for reliable assessment

**2. Automatic Video Report**
- All individual player events tagged by Wyscout: on-ball actions + key off-ball events (defensive positioning, off-the-ball movements)
- Middle ground: more efficient than Effective Time; more context than Custom Report
- **Disadvantages:** Generates many low-information events (e.g., CB sideways passes; GK distributions under no pressure)

**3. Custom Video Report**
- Scout selects specific event types to include
- **Efficiency benchmarks:**
  - GK: ~40–50 clips for shot-stopping ability
  - MF: ~30–40 clips for under-pressure situations
  - Winger: ~50–60 clips for attacking contribution
- Can create themed playlists (e.g., CB: defensive actions first → then build-up; ST: goals/shots/opportunities → build-up → pressing)
- **Advantage:** Very high relevance per clip; very efficient
- **Disadvantage:** Lacks context about game flow, frequency of events, interaction with teammates

### Recommended Approach: Mix and Match

Start broad (Effective Time or Automatic Report) for wide-net screening → narrow to Custom Reports for deep evaluation of shortlisted candidates. This creates a scouting funnel: quantity first, quality second.

---

## ═══════════════════════════════════
## TEMA 6: ANALYTICS TOOLS & PLATFORMS — PROFESSIONAL GUIDE
## ═══════════════════════════════════

**Source:** https://www.liamhenshaw.com/writing/the-tools-every-football-analyst-should-know
**Title:** Football Analyst Tools in 2026 — Professional Guide

*Author: Data analyst and first team scout at a global football agency.*

### Core Tools by Career Stage

| Stage | Essential | Worth Learning | Can Wait |
|-------|---------|----------------|---------|
| Just starting | Excel, Transfermarkt, YouTube | Wyscout, FBRef (historical) | Python, Tableau |
| Building portfolio | Wyscout, Python OR Tableau | StatsBomb open data | SkillCorner, Sportscode |
| Applying for roles | All of the above + role-specific | R (if data-heavy) | — |
| Working in role | Whatever club uses | Everything else context-dependent | — |

**Key principle:** Go deep before going wide. Two or three tools at expert level beats ten tools at mediocre level.

### Accessible Tools (No Club Needed)

**Excel**
- Free (Google Sheets) or bundled with most computers.
- Use: Data cleaning, basic analysis, squad lists, scouting databases.
- Foundation for all other tools. Pivot tables solve more questions than most Python code.

**Python**
- Free. Use: Data analysis, predictive models, visualizations, workflow automation.
- Required for data analyst roles; not required for tactical analyst or scouting roles.
- Separates data analysts from spreadsheet users.

**Tableau**
- Free (Tableau Public); paid full version.
- Use: Dashboards, player comparison visuals, presentation-ready graphics.
- Learn AFTER having data to visualize, not before.

**Wyscout**
- €299/year personal (Copper tier, 70 min video/month); club licences significantly more.
- Industry standard: what clubs use, what agencies use.
- Learning to navigate efficiently (filtering, playlist-building, data-video cross-referencing) is a skill in itself.

**Transfermarkt**
- Free. Use: Squad research, transfer history, contract info, market values.
- First stop for context on any player before opening Wyscout.

### Free Data Sources

| Source | Content | Status (2026) |
|--------|---------|--------------|
| StatsBomb open data | Full event data from multiple competitions; best free resource | Active, well-documented |
| Understat | xG data for top 5 European leagues | Active |
| FotMob | Match data, player stats, heatmaps | Active |
| SofaScore | Match ratings, player stats, heat maps, shot maps | Active |
| WhoScored | Match stats, player ratings, league tables | Active |
| Kaggle datasets | Community football datasets (World Cup, event data) | Active; quality varies |
| FBRef | Advanced stats — **WARNING: lost Opta data licence January 2026** | Historical data only; no longer updated for current season |

**FBRef note:** No longer reliable for current-season advanced statistics. StatsBomb open data is now the primary alternative.

### Professional Platforms (Club/Agency Level)

**StatsBomb**
- Detailed event data; StatsBomb 360 dataset (player positioning for every event).
- Use: Recruitment longlists, player comparison, performance analysis, opposition scouting.
- Powers metrics discussed widely online (pressures, ball progression, shot-creating actions).

**SkillCorner**
- Physical + tracking data from broadcast footage (no in-stadium cameras needed).
- Use: Physical metrics, high-speed running distance, pressing intensity, off-ball movement, physical benchmarking across leagues.
- Increasingly required for combining event data with physical data in analysis.

**Impect**
- Packing rate and related metrics: how many opponents a player bypasses per action (passes, dribbles, reception).
- Answers "how many defenders does this action eliminate?" vs. "how many actions completed?"
- Increasingly used in European recruitment departments.

**Opta (Stats Perform)**
- One of the oldest providers; event data from hundreds of leagues worldwide.
- Powers TV broadcast stats; integrated directly into many clubs' internal systems.
- Previously powered FBRef's advanced stats.

**Hudl Sportscode**
- Video coding and analysis software. Club licences; expensive individually.
- Use: Tagging and coding match footage; video presentations for coaches; pre-game clip packages.
- Core tool for tactical analysts (not data analysts). Essential if pursuing coaching staff path.

**SciSports**
- Player potential modelling and development forecasting.
- Projects player development 2–3 years forward; models potential value increase.
- Popular with clubs operating a buy-develop-sell transfer model.

**Driblab**
- Analytics consultancy model; covers 300,000+ players across 200+ competitions.
- Builds custom analytical frameworks around specific club's playing philosophy.
- Example of outsourcing analytics rather than building in-house.

**Twelve Football**
- AI-powered platform (Stockholm); Earpiece product allows scouting via conversational AI.
- Builds customized metrics per club context rather than generic league-wide metrics.
- Covers Singapore Premier League through English Premier League.

**Analytics FC**
- Analytics consultancy providing services to clubs, leagues, federations.
- External consultancy model (alongside Driblab); an alternative career path to in-club roles.

### Typical Recruitment Workflow (Professional Level)

1. **Transfermarkt** — career context, contract status, transfer history
2. **Wyscout** — video footage + basic stats
3. **StatsBomb or Opta data → Python** — deeper analysis, percentile rankings, scatter plots, radar charts
4. **SkillCorner** — physical profiling
5. **Tableau / presentation software** — package into dossier for sporting director

### Common Mistakes

- **Learning Python before understanding what questions to ask.** Python answers questions; knowing the right question requires football understanding first.
- **Spending months on Tableau before watching games.** Beautiful visuals with shallow analysis = bad analysis.
- **Skipping Excel** as "too basic." It's the most-used daily tool at professional level.
- **Learning everything simultaneously** instead of going deep on 2–3 tools.
- **Buying courses** when free YouTube tutorials cover the same material.

---

**Source:** https://analyticsfc.co.uk/transferlab/
**Title:** TransferLab — Analytics FC Scouting Platform

### Platform Scale

- **Men's platform:** 90,000 players in 100+ leagues (established as market leader in data-scouting)
- **Women's platform (2021):** 20,000 players in 30+ leagues
- **TransferLab Emerge (2025):** 33 new youth leagues, 568 youth teams, 15,000 new youth players + 18,000+ players under-21 in senior football across 150 competitions globally

### Key Features

- **Unique metrics via proprietary algorithm:** Predictive metrics beyond raw stats
- **Similar player search:** Find players sharing strengths and weaknesses with a reference player (replacement identification, target alternatives when primary target is unavailable)
- **Player Plot:** Scatter graph plotting any 2 of 100+ available metrics across league, position, or age samples
- **Physical tracking:** Top speed, high-intensity sprints, distance covered — benchmarked by league tier or globally, across 70 leagues; integrated into positional profiles
- **Multilingual:** Spanish, Portuguese, Turkish, Greek

---

**Source:** https://www.statsperform.com/team-performance/performance-solutions-for-football/edge-recruitment/
**Title:** Opta Vision — Stats Perform Football Data

### Opta Vision

- **XY tracking:** Dynamic field locations for all 22 players, uninterrupted from kick-off to final whistle.
- **Volume:** 2 million+ individual data points per game.
- **Coverage:** 80+ major global leagues and competitions; fully synchronized to on-ball events.
- **AI-enriched metrics:** On-ball player decision-making, off-ball player runs, changes to team shape.
- **Integration:** Compatible with analysis and recruitment software platforms via customizable dashboards.

**Real Betis:** 5-year ProVision usage for performance analysis and scouting operations (Head of Data Analysis: Álvaro Arranz).

---

**Source:** https://skillcorner.com/
**Title:** SkillCorner — AI-Powered Tracking Data

- Trusted by 250+ teams, leagues, and federations worldwide.
- Coverage: Football, Basketball, American Football across 150+ competitions globally.
- Technology: Proprietary AI + computer vision generating tracking data from broadcast footage.
- Combines tracking data and event data for scouting, recruitment, and performance analysis.
- Provides actionable insights on player and team performance without requiring in-stadium tracking cameras.

---

**Source:** https://www.scoutmepro.com/blog/football-scouting-platforms-compared-what-scouts-actually-use
**Title:** Football Scouting Platforms — Professional Comparison

*(See also: Wyscout section above for detailed Wyscout analysis)*

### Platform Comparison (Professional Tier)

**Wyscout**
- Most widely recognized across top 5 European leagues, international federations, agents.
- Search by position, age, league, performance metrics.
- Thousands of pounds/year for club subscriptions; personal licence from €299/year.
- Scope: Professional and high-level semi-professional.

**InStat**
- Similar scope to Wyscout; particular strength in Eastern European and lower European leagues.
- Strong coverage: Poland, Ukraine, Scandinavia, Balkans.
- First choice for clubs targeting those markets specifically.

**Hudl**
- Originally American sports; expanded to football.
- Used by: academies, college teams, semi-professional clubs.
- Function: video analysis, team management, highlight reel generation.
- Coaches upload footage; tag key moments; share with scouts directly.
- Best use: players targeting college scholarships or academy trials with institutional backing.

**SkillCorner**
- Physical + tactical data from broadcast footage.
- Data: distance covered, sprints, press intensity.
- Tool for performance analysts and technical directors — not for player showcasing.
- Requires televised match coverage to generate data.

### Emerging Tier: Grassroots Discovery Platforms

Traditional platforms (Wyscout, InStat) are almost exclusively focused on players already competing professionally. Players in regional youth football or semi-professional environments are largely invisible.

New platforms (e.g., Scout Me Pro) use AI video analysis to generate structured performance breakdowns from uploaded footage — bridging the gap for talent not covered by traditional databases. AI pre-analysis surfaces key moments in a format comparable to professional scouting data, increasing discovery probability for players outside major leagues.