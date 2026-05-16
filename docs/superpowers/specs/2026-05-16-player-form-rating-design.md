# Player Form Rating Design

## Goal

Add an internal group rating system that makes team generation fairer over time. The existing manual FIFA-style stats remain the stable base rating, while the app calculates a current form rating from recent games, MVP votes, streaks, and absences.

The system should help players in bad runs instead of punishing them. A player in poor form should tend to be paired with stronger or in-form teammates, while players on winning runs can help balance teams with players who are struggling.

## Scope

This design covers the first internal group version:

- automatic current rating per player;
- five visible form levels;
- MVP voting after completed games;
- team generation that considers both rating and form distribution;
- player/admin visibility of form;
- data structures that do not block a future public/social rating.

Out of scope for this first implementation:

- public player marketplace;
- public cross-group rating;
- matchmaking/search for open games;
- monetization or reputation moderation.

## Rating Model

Each player keeps the existing manual stats:

- `pace`
- `shooting`
- `passing`
- `dribbling`
- `defending`
- `physical`
- `overall`

`overall` remains the base rating. The app derives a current rating for balancing:

```text
currentRating = clamp(baseOverall + formAdjustment, baseOverall - 7, baseOverall + 7)
```

The exact formula can evolve, but the first version should keep movement small and explainable.

## Form Levels

The app shows five Portuguese form levels:

- `Em grande forma`
- `Boa forma`
- `Normal`
- `Ma fase`
- `A recuperar`

Suggested mapping:

```text
Em grande forma: +5 to +7
Boa forma:       +2 to +4
Normal:          -1 to +1
Ma fase:         -2 to -4
A recuperar:    -5 to -7
```

The UI should show the form level to admins and to the linked player. The exact current rating can be shown in admin/player contexts, but the public-facing profile should avoid exposing private group form by default.

## Inputs

The internal form calculation uses group history only:

- recent wins and losses;
- current win/loss streak;
- MVP awards;
- absence from recent games;
- whether the player actually participated in a game, including attendance overrides.

Draws count as neutral.

## MVP Voting

After a game is finished, participating players can vote for MVP.

Rules:

- only players who participated in that game can vote;
- each voter can vote once;
- a player cannot vote for themselves;
- votes can be changed until the MVP is finalized;
- there must be at least 5 valid votes for an official MVP;
- if there is a tie, the first version records a shared MVP instead of forcing a winner.

MVP is an internal group signal. It gives a temporary form boost, ideally for the next two games the MVP attends.

## Team Balancing

The generator should score candidate teams with both rating and form distribution.

The existing team rating balance remains the primary goal, but the scoring should add penalties for:

- too much current-rating difference;
- concentrating several `Em grande forma` players on one side;
- concentrating several `Ma fase` or `A recuperar` players on one side;
- repeatedly leaving a struggling player in the weaker team when alternatives exist.

The intended behavior:

- players in `Ma fase` or `A recuperar` are more likely to be paired with players in `Boa forma` or `Em grande forma`;
- players on long winning streaks can help balance teams with players on losing streaks;
- the app should still avoid absurd teams by keeping current rating balance important.

## UI

Player profile:

- show base overall;
- show current rating;
- show form level;
- show recent record summary, such as last 5 games;
- show MVP count or latest MVP when available.

Game detail after result:

- show MVP voting panel if the current user is linked to a participating player;
- show vote status and whether the game has enough votes;
- show official MVP or shared MVP once threshold is met.

Team generator:

- show team average using current rating;
- optionally show form mix per team;
- keep the interface compact so the generator remains fast to use on mobile.

## Data Model

Add tables for MVP voting and stored form snapshots.

`game_mvp_votes`

- `id`
- `game_id`
- `voter_player_id`
- `candidate_player_id`
- `user_id`
- `created_at`
- `updated_at`

Unique key:

- one vote per `game_id` and `voter_player_id`.

Validation:

- voter and candidate must both have participated in the game;
- voter cannot equal candidate;
- authenticated users can only vote as their linked player;
- admins can read/manage for moderation.

`player_form_snapshots`

- `id`
- `player_id`
- `game_id`
- `base_overall`
- `current_rating`
- `form_adjustment`
- `form_level`
- `win_streak`
- `loss_streak`
- `recent_games_count`
- `recent_absences`
- `mvp_boost`
- `calculated_at`

The first implementation may calculate form client-side from loaded games and votes, but the schema should allow storing snapshots later for auditability and performance.

## Future Public Rating

Public/social rating must be separate from internal group form.

Future concepts:

- public rating is based on ratings from people who actually played with or against the player;
- public events can generate public rating votes;
- private group games do not automatically update public rating;
- players may hide public rating, expose it only when applying to games, or keep it visible;
- team search can compare a player's public rating with the host team's average and recommend good fits.

This separation prevents one group's private jokes, roles, or form swings from becoming a permanent public reputation.

## Success Criteria

The feature is successful when:

- admins and linked players can see a clear form state;
- completed games allow valid MVP voting;
- MVP is only official with at least 5 valid votes;
- generated teams use current rating and avoid concentrating bad-form players together;
- base ratings remain stable and editable;
- future public rating can be added without rewriting the internal rating model.

