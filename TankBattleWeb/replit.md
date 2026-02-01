# Tank Battleship Game

## Project Overview
A web-based tank-themed battleship game built with Python Flask backend and HTML/CSS/JavaScript frontend. Players command armored forces from 5 different nations in strategic turn-based warfare on a 20x20 grid.

## Recent Changes (October 26, 2025)
- Created complete Flask application with user authentication
- Implemented 20x20 game board with tank placement mechanics
- Added 5 nations with unique tank units: US, Germany, USSR, Britain, Japan
- Built 2-player mode and AI opponent with 3 difficulty levels (normal, hard, nightmare)
- Created PostgreSQL database for user accounts and game history
- Developed admin panel for user management and history clearing
- Implemented complete game flow: nation selection → placement → battle → victory

## Game Features

### Nations & Units
Each nation has the following tank units:
- 4 Light Tanks (2 squares each)
- 2 Medium Tanks (3 squares each)
- 1 Heavy Tank (4 squares)
- 2 Tank Destroyers (2 squares each)
- 1 Command Tank (3 squares) - **must be destroyed to win**

### Game Modes
1. **Two Player Mode**: Sequential nation selection and placement, then turn-based combat
2. **AI Mode - Normal**: Random attack AI
3. **AI Mode - Hard**: Intelligent targeting after hits
4. **AI Mode - Nightmare**: Advanced pattern recognition and strategic targeting

### User System
- User registration and login
- Account statistics (wins, losses, win rate)
- Game history tracking
- Admin panel for user and history management

## Technical Architecture

### Backend (Python/Flask)
- `app.py`: Main Flask application with routes and game logic
- `init_db.py`: Database initialization script
- Authentication: Flask-Login for session management
- Database: PostgreSQL with psycopg2

### Frontend
- `templates/`: HTML templates for all pages
- `static/css/style.css`: Complete styling with nation themes
- `static/js/game.js`: Game logic, AI, and board management

### Database Schema
- **users**: id, username, email, password_hash, is_admin, created_at
- **game_history**: id, player1_id, player1_nation, player2_id, player2_nation, winner_id, game_mode, played_at

## Security Notes
✅ **SECURE SETUP**: No default admin account is created for security reasons.

To set up an admin account:
1. Register a regular user account through the web interface
2. Run: `python promote_admin.py <username>` to promote that user to admin
3. The promoted user will then have access to the admin panel at `/admin`

## How to Run
The application runs on port 5000 automatically via the Server workflow.

## Project Structure
```
/
├── app.py                 # Main Flask application
├── init_db.py            # Database initialization
├── requirements.txt      # Python dependencies
├── templates/            # HTML templates
│   ├── login.html
│   ├── register.html
│   ├── lobby.html
│   ├── account.html
│   ├── admin.html
│   └── game.html
└── static/
    ├── css/
    │   └── style.css     # All styling
    └── js/
        └── game.js       # Game logic and AI
```

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SESSION_SECRET: Flask session secret key
- PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE: Database credentials
