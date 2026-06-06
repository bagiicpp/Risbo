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
