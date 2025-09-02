// Use global Firebase objects from firebase-config.js

let currentGame = null;
let createGameFn, addGameEventFn;

// Initialize when Firebase is loaded
document.addEventListener('DOMContentLoaded', () => {
  createGameFn = firebase.functions().httpsCallable('createGame');
  addGameEventFn = firebase.functions().httpsCallable('addGameEvent');
});

// Auth state management
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    loadGames();
  } else {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('adminSection').classList.add('hidden');
  }
});

// Login function
window.login = async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    errorDiv.textContent = '';
  } catch (error) {
    errorDiv.textContent = 'Login failed: ' + error.message;
  }
};

// Logout function
window.logout = async () => {
  await firebase.auth().signOut();
};

// Load games list
function loadGames() {
  const gamesQuery = firebase.firestore().collection('games').orderBy('startDate', 'desc');
  
  gamesQuery.onSnapshot((snapshot) => {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = '';
    
    snapshot.forEach((doc) => {
      const game = doc.data();
      const gameDiv = document.createElement('div');
      gameDiv.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px;';
      
      gameDiv.innerHTML = `
        <strong>${game.name}</strong>
        <br>Status: <span class="status ${game.status}">${game.status}</span>
        <br>${game.teams.team1.name} ${game.teams.team1.score} - ${game.teams.team2.score} ${game.teams.team2.name}
        <br><button class="btn" onclick="selectGame('${doc.id}', '${game.name}')">Manage</button>
      `;
      
      gamesList.appendChild(gameDiv);
    });
  });
}

// Select game for management
window.selectGame = async (gameId, gameName) => {
  currentGame = gameId;
  document.getElementById('currentGameName').textContent = gameName;
  document.getElementById('gameControls').classList.remove('hidden');
  
  // Load game data and populate team/player dropdowns
  const gameDoc = await firebase.firestore().collection('games').doc(gameId).get();
  const game = gameDoc.data();
  
  document.getElementById('currentGameStatus').textContent = game.status;
  document.getElementById('currentGameStatus').className = `status ${game.status}`;
  document.getElementById('currentChukka').textContent = game.currentChukka;
  
  // Populate team dropdown
  const teamSelect = document.getElementById('goalTeam');
  teamSelect.innerHTML = `
    <option value="">Select Team</option>
    <option value="${game.teams.team1.name}">${game.teams.team1.name}</option>
    <option value="${game.teams.team2.name}">${game.teams.team2.name}</option>
  `;
  
  // Update player dropdown when team changes
  teamSelect.onchange = () => {
    const selectedTeam = teamSelect.value;
    const playerSelect = document.getElementById('goalPlayer');
    playerSelect.innerHTML = '<option value="">Select Player</option>';
    
    if (selectedTeam) {
      const teamKey = selectedTeam === game.teams.team1.name ? 'team1' : 'team2';
      game.teams[teamKey].players.forEach(player => {
        playerSelect.innerHTML += `<option value="${player.name}">${player.name}</option>`;
      });
    }
  };
};

// Create new game
window.createGame = async () => {
  const data = {
    name: document.getElementById('gameName').value,
    venue: document.getElementById('venue').value,
    startDate: document.getElementById('startDate').value,
    startTime: document.getElementById('startTime').value,
    team1Name: document.getElementById('team1Name').value,
    team2Name: document.getElementById('team2Name').value,
    team1Players: document.getElementById('team1Players').value
      .split(',')
      .map((name, index) => ({ name: name.trim(), position: index + 1 }))
      .filter(p => p.name),
    team2Players: document.getElementById('team2Players').value
      .split(',')
      .map((name, index) => ({ name: name.trim(), position: index + 1 }))
      .filter(p => p.name)
  };
  
  try {
    await createGameFn(data);
    // Clear form
    document.querySelectorAll('#gameName, #venue, #startDate, #startTime, #team1Name, #team1Players, #team2Name, #team2Players').forEach(input => input.value = '');
    alert('Game created successfully!');
  } catch (error) {
    alert('Error creating game: ' + error.message);
  }
};

// Add game event
window.addEvent = async (eventType) => {
  if (!currentGame) {
    alert('Please select a game first');
    return;
  }
  
  let chukka = parseInt(document.getElementById('currentChukka').textContent);
  if (eventType === 'chukka_start') {
    chukka = prompt('Enter chukka number (1-6):');
    if (!chukka || chukka < 1 || chukka > 6) return;
  }
  
  try {
    await addGameEventFn({
      gameId: currentGame,
      type: eventType,
      chukka: chukka
    });
  } catch (error) {
    alert('Error adding event: ' + error.message);
  }
};

// Add goal
window.addGoal = async () => {
  const team = document.getElementById('goalTeam').value;
  const player = document.getElementById('goalPlayer').value;
  
  if (!team || !player) {
    alert('Please select both team and player');
    return;
  }
  
  try {
    await addGameEventFn({
      gameId: currentGame,
      type: 'goal',
      team: team,
      player: player,
      chukka: parseInt(document.getElementById('currentChukka').textContent)
    });
  } catch (error) {
    alert('Error adding goal: ' + error.message);
  }
};