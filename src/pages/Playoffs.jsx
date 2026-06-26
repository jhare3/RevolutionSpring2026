import React, { useState, useEffect } from 'react';
import { Badge, Spinner, Container } from 'react-bootstrap';
import TournamentBoxscoreModal from '../components/TournamentBoxscoreModal';
import bracketData from '../data/playoffsBracket.json';

const playoffFiles = import.meta.glob('../data/Playoffs/*.json', { eager: true });

const Playoffs = () => {
  const [loading, setLoading] = useState(true);
  const [gameDataMap, setGameDataMap] = useState({});
  const [showBoxscore, setShowBoxscore] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const combinedMap = {};
    for (const path in playoffFiles) {
      const data = playoffFiles[path].default || playoffFiles[path];
      const fileName = path.split('/').pop().replace('.json', '');
      if (data) {
        combinedMap[fileName] = data;
      }
    }
    setGameDataMap(combinedMap);
    setLoading(false);
  }, []);

  const handleOpen = (e, game) => {
    e.stopPropagation(); 
    const rawData = gameDataMap[game.id];
    
    if (rawData) {
      const team1Name = rawData.scores?.team1?.name || game.matchup.split(' vs. ')[0];
      const team2Name = rawData.scores?.team2?.name || game.matchup.split(' vs. ')[1];

      // Split the flat stats array by detecting the alphabetical reset
      const team1Stats = [];
      const team2Stats = [];
      let isTeam2 = false;

      if (rawData.stats && Array.isArray(rawData.stats)) {
        for (let i = 0; i < rawData.stats.length; i++) {
          if (i > 0) {
            const prevName = rawData.stats[i - 1]["Player Name"].toLowerCase();
            const currName = rawData.stats[i]["Player Name"].toLowerCase();
            // Alphabetical reset detected, switch to Team 2
            if (currName.localeCompare(prevName) < 0 && !isTeam2) {
              isTeam2 = true;
            }
          }
          if (isTeam2) {
            team2Stats.push(rawData.stats[i]);
          } else {
            team1Stats.push(rawData.stats[i]);
          }
        }
      }

      // Reformat the playoff JSON structure to match the Tournament JSON structure
      const adaptedGameData = {
        ...game,
        ...rawData,
        visitors: team1Name,
        home: team2Name,
        scores: {
          [team1Name]: { 
            "1": rawData.scores?.team1?.half1, 
            "2": rawData.scores?.team1?.half2, 
            "Total": rawData.scores?.team1?.final 
          },
          [team2Name]: { 
            "1": rawData.scores?.team2?.half1, 
            "2": rawData.scores?.team2?.half2, 
            "Total": rawData.scores?.team2?.final 
          }
        },
        stats: {
          [team1Name]: team1Stats,
          [team2Name]: team2Stats
        }
      };

      setSelectedGame(adaptedGameData);
      setShowBoxscore(true);
    }
  };

  const getTeamScore = (data, teamName) => {
    if (!data || !data.scores) return null;
    if (data.scores.team1?.name === teamName) return data.scores.team1.final;
    if (data.scores.team2?.name === teamName) return data.scores.team2.final;
    return null;
  };

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

      {/* Highlights Section */}
      <div className="highlights-grid-container" style={imageGalleryGrid}>
        <div style={leftStack}>
          <div style={imageWrapper}>
            <img src="/Playoffs.JPEG" alt="Playoff Bracket Overview" style={highlightImage} />
            <p style={imageCaption}>OFFICIAL PLAYOFF BRACKET</p>
          </div>
        </div>
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
                
                // Fetch scores using the exact team names from the matchup string
                const visitorScore = getTeamScore(data, teams[0]);
                const homeScore = getTeamScore(data, teams[1]);
                
                const hasOT = data && data.scores && (
                  Object.keys(data.scores.team1 || {}).some(k => k.toLowerCase().startsWith('ot')) ||
                  Object.keys(data.scores.team2 || {}).some(k => k.toLowerCase().startsWith('ot'))
                );

                const seed0 = getSeed(game, 0);
                const seed1 = getSeed(game, 1);

                return (
                  <div
                    key={game.id}
                    className="bracket-game bg-white p-3 my-2 shadow-sm border-start border-5 border-danger"
                    style={{ borderRadius: '8px' }}
                  >
                    <div className="text-muted small mb-2 fw-bold d-flex justify-content-between align-items-center">
                      <span>{game.time}</span>
                      <div className="d-flex gap-1 align-items-center">
                        {hasOT && (
                          <Badge bg="warning" text="dark" className="rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>
                            OT
                          </Badge>
                        )}
                        {data && (
                          <Badge 
                            bg="danger" 
                            className="rounded-pill px-2 py-1 shadow-sm" 
                            style={{ fontSize: '0.65rem', cursor: 'pointer', letterSpacing: '0.5px' }}
                            onClick={(e) => handleOpen(e, game)}
                          >
                            BOXSCORE
                          </Badge>
                        )}
                      </div>
                    </div>

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
                        <span className="text-danger fs-6">{visitorScore}</span>
                      )}
                    </div>

                    <hr className="my-1" style={{ opacity: 0.1 }} />

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
                        <span className="text-danger fs-6">{homeScore}</span>
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

// Layout Styles
const imageGalleryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '30px',
  marginBottom: '60px',
  maxWidth: '1200px',
  margin: '0 auto 60px auto'
};

const leftStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const imageWrapper = {
  width: '100%',
  textAlign: 'center'
};

const highlightImage = {
  width: '100%',
  height: 'auto',
  borderRadius: '4px',
  border: '4px solid #111',
  boxShadow: '10px 10px 0px #ff4d4d'
};

const imageCaption = {
  fontWeight: '900',
  marginTop: '12px',
  textTransform: 'uppercase',
  fontSize: '14px',
  letterSpacing: '1px'
};

export default Playoffs;