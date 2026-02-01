# 🛡️ Tank Battleship 🎯

A web-based tank-themed battleship game featuring 5 historical nations, strategic 20x20 grid warfare, and AI opponents with multiple difficulty levels.

## 🎮 Features

### Nations
Choose from 5 powerful nations, each with unique tank forces:
- **🇺🇸 United States** - Versatile and powerful armored forces
- **🇩🇪 Germany** - Superior engineering and firepower
- **🇷🇺 Soviet Union** - Mass production and rugged reliability
- **🇬🇧 Britain** - Traditional excellence in armor
- **🇯🇵 Japan** - Agile and tactical tank warfare

### Tank Units (Per Nation)
- **4 Light Tanks** (2 squares each)
- **2 Medium Tanks** (3 squares each)
- **1 Heavy Tank** (4 squares)
- **2 Tank Destroyers** (2 squares each)
- **1 Command Tank** (3 squares) - **Destroy this to win!**

### Game Modes
- **⚔️ Two Player Mode**: Face off against a friend in turn-based tactical combat
- **🤖 AI - Normal**: Perfect for beginners, random attack patterns
- **🤖 AI - Hard**: Intelligent targeting after successful hits
- **🤖 AI - Nightmare**: Advanced AI with pattern recognition and strategic targeting

### Account Features
- User registration and login
- Battle statistics tracking (wins, losses, win rate)
- Complete game history
- Secure password-based authentication

### Admin Panel
- User account management
- Game history management
- Accessible only to promoted administrators

## 🚀 Quick Start

### First Time Setup

1. **Register an Account**
   - Visit the application and click "Register here"
   - Create your username, email, and password

2. **Set Up Admin Access** (Optional)
   - Register a user account first
   - Promote your account to admin:
     ```bash
     python promote_admin.py <your-username>
     ```
   - Access admin panel at `/admin` after logging in

3. **Start Playing!**
   - Login with your credentials
   - Choose a game mode from the lobby
   - Select your nation
   - Place your tanks strategically on the 20x20 grid
   - Engage in turn-based tactical warfare!

## 🎯 How to Play

1. **Nation Selection**: Choose from 5 historical nations
2. **Placement Phase**: 
   - Place all your tank units on your half of the board
   - Use rotate button (or press 'R') to change orientation
   - Random placement option available
3. **Battle Phase**:
   - Take turns attacking enemy positions
   - Hit enemy tanks to damage them
   - First to destroy the opponent's Command Tank wins!

## 🛠️ Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: PostgreSQL
- **Authentication**: Flask-Login
- **Game Logic**: Custom JavaScript implementation with AI algorithms

## 📁 Project Structure

```
/
├── app.py                 # Main Flask application
├── init_db.py            # Database initialization
├── promote_admin.py      # Admin promotion utility
├── requirements.txt      # Python dependencies
├── templates/            # HTML templates
│   ├── login.html       # Login page
│   ├── register.html    # Registration page
│   ├── lobby.html       # Game lobby
│   ├── account.html     # User account page
│   ├── admin.html       # Admin panel
│   └── game.html        # Main game interface
└── static/
    ├── css/
    │   └── style.css    # Complete styling
    └── js/
        └── game.js      # Game logic & AI
```

## 🔒 Security

- Passwords are hashed using Werkzeug's security functions
- No default admin credentials (must be manually promoted)
- Session-based authentication
- CSRF protection through Flask sessions
- Admin-only routes protected by decorators

## 🎨 Game Mechanics

### AI Difficulty Levels

- **Normal**: Random targeting - good for practice
- **Hard**: Hunts ships after successful hits
- **Nightmare**: Uses advanced pattern recognition and strategic grid coverage

### Win Conditions

- Destroy all enemy tanks **OR**
- Destroy the enemy Command Tank (instant victory)

## 📊 Statistics Tracked

- Total battles fought
- Victories and defeats
- Win rate percentage
- Game history with dates and outcomes

## 🌐 Deployment

The application runs on port 5000 and is ready for deployment through Replit's built-in publishing feature.

## 📝 Notes

- The game board is 20x20 cells (larger than classic battleship)
- All tank placements must fit within the grid
- No tank overlap allowed during placement
- In 2-player mode, players take turns placing and then battling
- AI opponents are available in 3 difficulty levels for solo play

---

**Ready your tanks, commander! Victory awaits!** 🎖️
