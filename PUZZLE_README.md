# 🧩 Sliding Puzzle Game

A beautiful, modern sliding puzzle game built with vanilla HTML, CSS, and JavaScript.

## Features

- **Multiple Difficulty Levels**: Choose from Easy (3×3), Medium (4×4), or Hard (5×5) puzzle sizes
- **Move Counter**: Track the number of moves you make
- **Timer**: See how fast you can solve the puzzle
- **Best Score Tracking**: Your best scores are saved locally for each difficulty level
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations
- **Win Detection**: Automatically detects when you've solved the puzzle
- **Show Solution**: Get help by revealing the solution

## How to Play

1. Open `puzzle.html` in your web browser
2. Click on any tile adjacent to the empty space to move it
3. Arrange all tiles in numerical order (1-8 for 3×3, 1-15 for 4×4, etc.)
4. Try to solve it in the fewest moves and shortest time!

## Game Controls

- **New Game**: Start a new shuffled puzzle
- **Show Solution**: Reveal the solved state
- **Difficulty Buttons**: Switch between Easy, Medium, and Hard modes

## Technologies Used

- HTML5
- CSS3 (with gradients, animations, and flexbox/grid)
- Vanilla JavaScript (ES6+)
- LocalStorage for best score persistence

## Project Structure

```
puzzle.html    - Main HTML structure
puzzle.css     - Styling and animations
puzzle.js      - Game logic and interactivity
```

## Code Highlights

- **Clean Object-Oriented Design**: The game uses a `SlidingPuzzle` class for better organization
- **Efficient Shuffle Algorithm**: Uses random valid moves to ensure solvable puzzles
- **Smooth Animations**: CSS transitions for delightful user experience
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Proper semantic HTML and keyboard-friendly controls

## Future Enhancements

- Image-based puzzles (upload your own photos)
- Leaderboard with time records
- Hint system
- Multiple themes
- Sound effects
- Undo/Redo functionality

## Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Feel free to use and modify!

---

**Enjoy the game!** 🎮
