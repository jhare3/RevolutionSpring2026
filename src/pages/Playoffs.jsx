import React, { useState, useEffect } from 'react';
import { Badge, Spinner, Container } from 'react-bootstrap';
import TournamentBoxscoreModal from '../components/TournamentBoxscoreModal';
import bracketData from '../data/playoffsBracket.json';

const playoffFiles = import.meta.glob('../data/Playoffs/boxscores/*.json', { eager: true });

const Playoffs = () => {
  const [loading, setLoading] = useState(true);
  const [gameDataMap, setGameDataMap] = useState({});
  const [showBoxscore, setShowBoxscore] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const combinedMap = {};
    for (const path in playoffFiles) {
      const data = playoffFiles[path].default || playoffFiles[path];
      if (data && data.gameId) {
        combinedMap[data.gameId] = data;
      }
    }
    setGameDataMap(combinedMap);
    setLoading(false);
  }, []);

  const handleOpen = (id) => {
    const data = gameDataMap[id];
    if (data) {
      setSelectedGame(data);
      setShowBoxscore(true);
    }
  };

  const getTeamScore = (data, teamKey) => {
    if (!data) return null;
    const teamName = data[teamKey];
    return data.scores?.[teamName]?.Total ?? null;
  };

  // Seed labels shown next to team names in the bracket
  const getSeed = (game, index) => {
    if (!game.seeds) return null;
    return game.seeds[index] ?? null;
  };

  return (
    <Container fluid className="py-5 bg-light min-vh-100">

      {/* Page Header */}
      <div className="text-center mb-5">
        <h1 className="schedule-page-heading">Revolution Playoffs</h1>
        <span className="schedule-subtext">Road to the Championship</span>
      </div>

      {/* Bracket */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <div className="bracket-container d-flex justify-content-around overflow-auto">
          {bracketData.rounds.map((round) => (
            <div
              key={round.name}
              className="bracket-round d-flex flex-column mx-3"
              style={{ minWidth: '280px' }}
            >
              <h5 className="text-center fw-black italic text-uppercase border-bottom border-danger border-3 pb-2 mb-4">
                {round.name}
              </h5>

              {round.games.map((game) => {
                const data = gameDataMap[game.id];
                const teams = game.matchup.split(' vs. ');
                const visitorScore = getTeamScore(data, 'visitors');
                const homeScore = getTeamScore(data, 'home');
                const hasOT = data
                  ? Object.keys(data.scores?.[data.visitors] || {}).some((k) =>
                      k.startsWith('OT')
                    )
                  : false;

                const seed0 = getSeed(game, 0);
                const seed1 = getSeed(game, 1);

                return (
                  <div
                    key={game.id}
                    className="bracket-game bg-white p-3 my-2 shadow-sm border-start border-5 border-danger"
                    style={{
                      cursor: data ? 'pointer' : 'default',
                      borderRadius: '8px',
                    }}
                    onClick={() => data && handleOpen(game.id)}
                  >
                    {/* Game meta row */}
                    <div className="text-muted small mb-1 fw-bold d-flex justify-content-between align-items-center">
                      <span>{game.time}</span>
                      <div className="d-flex gap-1 align-items-center">
                        {hasOT && (
                          <Badge bg="warning" text="dark" style={{ fontSize: '0.55rem' }}>
                            OT
                          </Badge>
                        )}
                        {data && (
                          <Badge bg="danger" style={{ fontSize: '0.6rem' }}>
                            BOXSCORE
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Visitor row */}
                    <div className="d-flex justify-content-between fw-bold small align-items-center">
                      <span>
                        {seed0 != null && (
                          <span className="text-muted me-1" style={{ fontSize: '0.7rem' }}>
                            ({seed0})
                          </span>
                        )}
                        {teams[0]}
                      </span>
                      {visitorScore !== null && (
                        <span className="text-danger">{visitorScore}</span>
                      )}
                    </div>

                    <hr className="my-1" />

                    {/* Home row */}
                    <div className="d-flex justify-content-between fw-bold small align-items-center">
                      <span>
                        {seed1 != null && (
                          <span className="text-muted me-1" style={{ fontSize: '0.7rem' }}>
                            ({seed1})
                          </span>
                        )}
                        {teams[1]}
                      </span>
                      {homeScore !== null && (
                        <span className="text-danger">{homeScore}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <TournamentBoxscoreModal
        show={showBoxscore}
        onHide={() => setShowBoxscore(false)}
        gameData={selectedGame}
      />
    </Container>
  );
};

export default Playoffs;