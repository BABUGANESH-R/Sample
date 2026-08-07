/**
 * Sample Data Generator for Dashboard Testing
 * 
 * This script generates sample game data for testing the dashboard.
 * Open dashboard.html in a browser and run this script in the console
 * to populate it with test data.
 */

function generateSampleData() {
  console.log('Generating sample game data...');

  // Generate Chess games
  const chessGames = [];
  const winners = ['white', 'black', 'draw'];
  for (let i = 0; i < 25; i++) {
    chessGames.push({
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
      winner: winners[Math.floor(Math.random() * winners.length)],
      moves: Math.floor(Math.random() * 100) + 20,
      duration: Math.floor(Math.random() * 45) + 5,
      capturedByWhite: ['pawn', 'knight', 'bishop'].slice(0, Math.floor(Math.random() * 3)),
      capturedByBlack: ['pawn', 'rook', 'queen'].slice(0, Math.floor(Math.random() * 3))
    });
  }
  localStorage.setItem('chess-stats', JSON.stringify({ games: chessGames }));
  console.log(`✓ Generated ${chessGames.length} chess games`);

  // Generate RIDDLE puzzles
  const slidePuzzles = [];
  const matchPuzzles = [];
  const echoGames = [];

  // Slide puzzles
  for (let i = 0; i < 30; i++) {
    const size = Math.random() > 0.5 ? 4 : 3;
    slidePuzzles.push({
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      size: size,
      moves: Math.floor(Math.random() * (size === 3 ? 100 : 300)) + (size === 3 ? 30 : 80),
      time: Math.floor(Math.random() * 600) + 60
    });
  }

  // Match puzzles
  for (let i = 0; i < 25; i++) {
    matchPuzzles.push({
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      tries: Math.floor(Math.random() * 15) + 8,
      pairs: 8,
      time: Math.floor(Math.random() * 180) + 30
    });
  }

  // Echo games
  for (let i = 0; i < 20; i++) {
    echoGames.push({
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      level: Math.floor(Math.random() * 15) + 1,
      duration: Math.floor(Math.random() * 10) + 1
    });
  }

  localStorage.setItem('riddle-stats', JSON.stringify({
    slide: slidePuzzles,
    match: matchPuzzles,
    echo: echoGames
  }));
  console.log(`✓ Generated ${slidePuzzles.length} slide puzzles`);
  console.log(`✓ Generated ${matchPuzzles.length} match puzzles`);
  console.log(`✓ Generated ${echoGames.length} echo games`);

  // Set best echo level
  const bestEchoLevel = Math.max(...echoGames.map(g => g.level));
  localStorage.setItem('echo-best', bestEchoLevel);

  // Generate Snake games
  const snakeGames = [];
  let bestScore = 0;
  
  for (let i = 0; i < 40; i++) {
    const score = Math.floor(Math.random() * 100) + 1;
    if (score > bestScore) bestScore = score;
    
    snakeGames.push({
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      score: score,
      duration: Math.floor(Math.random() * 15) + 1
    });
  }
  
  localStorage.setItem('snake-stats', JSON.stringify({ games: snakeGames }));
  localStorage.setItem('snake-best', bestScore);
  console.log(`✓ Generated ${snakeGames.length} snake games`);
  console.log(`✓ Snake best score: ${bestScore}`);

  console.log('\n✅ Sample data generated successfully!');
  console.log('📊 Refresh the page to see your data in the dashboard.');

  return {
    chess: chessGames.length,
    riddle: {
      slide: slidePuzzles.length,
      match: matchPuzzles.length,
      echo: echoGames.length
    },
    snake: {
      games: snakeGames.length,
      best: bestScore
    }
  };
}

function clearSampleData() {
  localStorage.removeItem('chess-stats');
  localStorage.removeItem('riddle-stats');
  localStorage.removeItem('snake-stats');
  localStorage.removeItem('snake-best');
  localStorage.removeItem('echo-best');
  console.log('✅ All sample data cleared!');
  console.log('📊 Refresh the page to see the empty dashboard.');
}

// Usage instructions
console.log('Sample Data Generator');
console.log('====================\n');
console.log('To generate sample data, run:');
console.log('  generateSampleData()\n');
console.log('To clear all data, run:');
console.log('  clearSampleData()\n');

// Auto-generate if running in a test environment
if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
  generateSampleData();
}
