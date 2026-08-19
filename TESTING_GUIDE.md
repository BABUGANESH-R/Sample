# Dashboard Testing Guide

This guide helps you test the dashboard system thoroughly.

## 🧪 Quick Test

### 1. Generate Sample Data

1. Open `dashboard.html` in your browser
2. Open the browser console (F12)
3. Copy and paste the contents of `generate-sample-data.js`
4. Run: `generateSampleData()`
5. Refresh the page

You should now see a populated dashboard with sample data for all games.

### 2. Verify Dashboard Features

#### Navigation
- [ ] Click each sidebar navigation item
- [ ] Verify the correct view displays for each game
- [ ] Check that the active state highlights correctly

#### Overview Page
- [ ] Verify total games count for Chess
- [ ] Verify total puzzles count for RIDDLE
- [ ] Verify high score for Snake
- [ ] Check total play time calculation
- [ ] Click quick play links (should navigate to game files)

#### Chess Dashboard
- [ ] Check total games count
- [ ] Verify white/black wins and draws add up correctly
- [ ] Check average moves calculation
- [ ] Verify recent games list shows up to 10 games
- [ ] Check game history shows winner, moves, and date

#### RIDDLE Dashboard
- [ ] Switch between Slide, Match, and Echo tabs
- [ ] Verify tab active states
- [ ] Check statistics for each puzzle type

**Slide:**
- [ ] Verify completion count
- [ ] Check best moves for 3×3
- [ ] Check best moves for 4×4
- [ ] Check best time format (MM:SS)
- [ ] Verify recent completions list

**Match:**
- [ ] Check games completed
- [ ] Verify best tries
- [ ] Check average tries calculation
- [ ] Verify perfect games count (tries === 8)
- [ ] Check recent completions list

**Echo:**
- [ ] Check games played
- [ ] Verify best level
- [ ] Check average level calculation
- [ ] Verify total patterns count
- [ ] Check recent games list

#### Snake Dashboard
- [ ] Verify high score displays prominently
- [ ] Check games played count
- [ ] Verify average score calculation
- [ ] Check total food count
- [ ] Verify top 10 leaderboard shows scores in descending order
- [ ] Check rank medals (gold #1, silver #2, bronze #3)
- [ ] Verify recent games list
- [ ] Check for record indicator (🏆) on high scores

#### Military Dashboard
- [ ] Verify high score displays prominently
- [ ] Check games played count
- [ ] Verify best wave
- [ ] Check total kills
- [ ] Verify average score calculation
- [ ] Verify top 10 leaderboard shows scores in descending order
- [ ] Verify recent missions list
- [ ] Check for record indicator (🏆) on high scores

#### Data Management
- [ ] Click "Clear All Data" button
- [ ] Verify confirmation modal appears
- [ ] Click "Cancel" - modal closes, data remains
- [ ] Click "Clear All Data" again
- [ ] Click "Clear Data" in modal
- [ ] Refresh page - all data should be empty
- [ ] Verify empty states display with helpful messages

## 🎮 Game Integration Testing

### Testing Chess Integration

1. Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chess Test</title>
</head>
<body>
  <h1>Chess Integration Test</h1>
  <button id="test-game">Simulate Game</button>
  
  <script src="game-stats-tracker.js"></script>
  <script>
    document.getElementById('test-game').addEventListener('click', () => {
      GameStatsTracker.saveChessGame({
        winner: 'white',
        moves: 45,
        duration: 15,
        capturedByWhite: ['pawn', 'knight'],
        capturedByBlack: ['pawn', 'bishop']
      });
    });
    
    GameStatsTracker.addDashboardLink();
  </script>
</body>
</html>
```

2. Open the test file
3. Click "Simulate Game"
4. Check for success notification
5. Open dashboard and verify game appears

### Testing RIDDLE Integration

Test each puzzle type:

**Slide:**
```javascript
GameStatsTracker.saveSlidePuzzle({
  size: 4,
  moves: 156,
  time: 245
});
```

**Match:**
```javascript
GameStatsTracker.saveMatchPuzzle({
  tries: 12,
  pairs: 8,
  time: 87
});
```

**Echo:**
```javascript
GameStatsTracker.saveEchoGame({
  level: 7,
  duration: 5
});
```

### Testing Snake Integration

```javascript
GameStatsTracker.saveSnakeGame({
  score: 42,
  duration: 3
});
```

## 📱 Responsive Testing

Test the dashboard at different screen sizes:

### Desktop (1920×1080)
- [ ] Sidebar fully visible
- [ ] Stats grid shows 4 columns
- [ ] All text readable
- [ ] Proper spacing

### Tablet (768×1024)
- [ ] Sidebar adjusts width
- [ ] Stats grid shows 2-3 columns
- [ ] Navigation still accessible
- [ ] Content readable

### Mobile (375×667)
- [ ] Sidebar collapses or stacks
- [ ] Stats grid shows 1 column
- [ ] Touch-friendly buttons
- [ ] Scrolling works smoothly

## 🌐 Browser Compatibility

Test in multiple browsers:

### Chrome
- [ ] Dashboard loads
- [ ] localStorage works
- [ ] Animations smooth
- [ ] No console errors

### Firefox
- [ ] Dashboard loads
- [ ] localStorage works
- [ ] Animations smooth
- [ ] No console errors

### Safari
- [ ] Dashboard loads
- [ ] localStorage works
- [ ] Animations smooth
- [ ] No console errors

### Edge
- [ ] Dashboard loads
- [ ] localStorage works
- [ ] Animations smooth
- [ ] No console errors

## 🔍 localStorage Testing

### Verify Data Structure

Open browser console and check:

```javascript
// Chess
console.log(JSON.parse(localStorage.getItem('chess-stats')));
// Should show: { games: [...] }

// RIDDLE
console.log(JSON.parse(localStorage.getItem('riddle-stats')));
// Should show: { slide: [...], match: [...], echo: [...] }

// Snake
console.log(JSON.parse(localStorage.getItem('snake-stats')));
// Should show: { games: [...] }

console.log(localStorage.getItem('snake-best'));
// Should show: number

console.log(localStorage.getItem('echo-best'));
// Should show: number

// Military
console.log(JSON.parse(localStorage.getItem('military-stats')));
// Should show: { games: [...] }

console.log(localStorage.getItem('military-best'));
// Should show: number
```

### Test Data Limits

Verify that data is limited:

1. Generate 200 chess games
2. Check that only last 100 are kept:
   ```javascript
   const chess = JSON.parse(localStorage.getItem('chess-stats'));
   console.log(chess.games.length); // Should be 100
   ```

3. Generate 100 slide puzzles
4. Check that only last 50 are kept:
   ```javascript
   const riddle = JSON.parse(localStorage.getItem('riddle-stats'));
   console.log(riddle.slide.length); // Should be 50
   ```

## 🎨 UI/UX Testing

### Visual Checks
- [ ] Colors match dark theme
- [ ] Gradients render correctly
- [ ] Icons display properly
- [ ] Font weights readable
- [ ] Hover effects smooth
- [ ] Active states clear
- [ ] Empty states styled well

### Interaction Checks
- [ ] Buttons have hover feedback
- [ ] Clicks responsive
- [ ] Navigation smooth
- [ ] Modals center correctly
- [ ] Notifications appear/disappear
- [ ] Scrolling smooth

### Animation Checks
- [ ] Page transitions smooth
- [ ] Notification slide-in works
- [ ] Modal fade-in works
- [ ] Hover effects smooth
- [ ] No janky animations

## ⚡ Performance Testing

### Load Time
1. Clear localStorage
2. Open dashboard
3. Check load time (should be instant)

### With Data
1. Generate max sample data (100 games per type)
2. Open dashboard
3. Check load time (should still be fast)
4. Switch between views (should be instant)

### Memory
1. Open browser dev tools
2. Go to Performance/Memory tab
3. Generate sample data
4. Refresh dashboard
5. Check memory usage (should be minimal)

## 🐛 Edge Cases

### Empty Data
- [ ] New user sees helpful empty states
- [ ] "No games played" messages clear
- [ ] Dashboard doesn't break

### Single Game
- [ ] Dashboard shows single game correctly
- [ ] Averages calculated correctly
- [ ] No division by zero errors

### Large Numbers
- [ ] Test with score of 999+
- [ ] Test with 100+ moves
- [ ] Test with 50+ levels
- [ ] Numbers display correctly

### Invalid Data
Test resilience to bad data:

```javascript
// Bad chess data
localStorage.setItem('chess-stats', '{"games": [{"invalid": true}]}');

// Bad RIDDLE data
localStorage.setItem('riddle-stats', '{"slide": "not an array"}');

// Refresh dashboard - should handle gracefully
```

## 📋 Checklist Summary

### Core Functionality
- [ ] Dashboard loads without errors
- [ ] All views accessible via navigation
- [ ] Statistics calculate correctly
- [ ] History displays properly
- [ ] Data persists after refresh
- [ ] Clear data works correctly

### Integration
- [ ] Chess tracking works
- [ ] All RIDDLE puzzles track correctly
- [ ] Snake tracking works
- [ ] Dashboard link appears
- [ ] Notifications show correctly

### Cross-browser
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### Responsive
- [ ] Works on desktop
- [ ] Works on tablet
- [ ] Works on mobile

### Performance
- [ ] Loads quickly
- [ ] No lag when switching views
- [ ] Smooth animations
- [ ] No memory leaks

## 🚨 Known Issues

Document any issues found during testing:

1. Issue: _____
   - How to reproduce: _____
   - Expected: _____
   - Actual: _____
   - Browser: _____

## ✅ Sign-off

- [ ] All core features tested
- [ ] All games integration tested
- [ ] All browsers tested
- [ ] Responsive design tested
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Documentation reviewed

Tester: _________
Date: _________
Version: _________

## 🔧 Debugging Tips

### Dashboard not showing data?
1. Check console for errors
2. Verify localStorage:
   ```javascript
   Object.keys(localStorage).filter(k => k.includes('stats') || k.includes('best'))
   ```
3. Check data format matches expected structure

### Notifications not appearing?
1. Check if body has notifications
2. Verify CSS animations loaded
3. Check z-index conflicts

### Stats calculating wrong?
1. Console.log the raw data
2. Verify calculation logic
3. Check for NaN or undefined values

### Dashboard link not showing?
1. Verify game-stats-tracker.js loaded
2. Check if addDashboardLink() was called
3. Look for console errors
