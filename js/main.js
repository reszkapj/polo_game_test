// Use global Firebase objects from firebase-config.js

let currentGameId = null;
let chukkaTimer = null;

// Initialize app when Firebase is ready
function initializeApp() {
  if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
    console.log('Waiting for Firebase...');
    setTimeout(initializeApp, 200);
    return;
  }
  
  console.log('Firebase ready, initializing app...');
  try {
    loadLiveGame();
    initializeNotifications();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Load current live game
function loadLiveGame() {
  const liveGameQuery = firebase.firestore().collection('games')
    .where('status', 'in', ['live', 'paused'])
    .orderBy('startDate', 'desc')
    .limit(1);
  
  liveGameQuery.onSnapshot((snapshot) => {
    if (snapshot.empty) {
      document.getElementById('noLiveGame').classList.remove('hidden');
      document.getElementById('liveGameCard').classList.add('hidden');
      return;
    }
    
    const gameDoc = snapshot.docs[0];
    const game = gameDoc.data();
    currentGameId = gameDoc.id;
    
    document.getElementById('noLiveGame').classList.add('hidden');
    document.getElementById('liveGameCard').classList.remove('hidden');
    
    updateGameDisplay(game);
    loadRecentEvents(gameDoc.id);
    
    // Start/stop timer based on game status
    if (game.status === 'live' && game.chukkaStartTime) {
      startChukkaTimer(game.chukkaStartTime.toDate());
    } else {
      stopChukkaTimer();
    }
  });
}

// Update game display
function updateGameDisplay(game) {
  document.getElementById('gameName').textContent = game.name;
  document.getElementById('team1Name').textContent = game.teams.team1.name;
  document.getElementById('team2Name').textContent = game.teams.team2.name;
  document.getElementById('team1Score').textContent = game.teams.team1.score;
  document.getElementById('team2Score').textContent = game.teams.team2.score;
  document.getElementById('currentChukka').textContent = game.currentChukka || 0;
  document.getElementById('venue').textContent = game.venue || 'TBD';
  
  // Update status indicator
  const statusIndicator = document.getElementById('gameStatus');
  if (game.status === 'live') {
    statusIndicator.style.background = '#27ae60';
    statusIndicator.style.animation = 'pulse 2s infinite';
  } else {
    statusIndicator.style.background = '#f39c12';
    statusIndicator.style.animation = 'none';
  }
  
  // Update player lists
  updatePlayersList('team1', game.teams.team1);
  updatePlayersList('team2', game.teams.team2);
}

// Update players list
function updatePlayersList(teamKey, team) {
  const playersContainer = document.getElementById(`${teamKey}Players`);
  const titleElement = document.getElementById(`${teamKey}PlayersTitle`);
  
  titleElement.textContent = team.name + ' Players';
  playersContainer.innerHTML = '';
  
  team.players.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    playerDiv.innerHTML = `
      <span>${player.name} (#${player.position})</span>
      <span style="font-weight: bold; color: #f39c12;">${player.goals} goals</span>
    `;
    playersContainer.appendChild(playerDiv);
  });
}

// Load recent events
function loadRecentEvents(gameId) {
  const eventsQuery = firebase.firestore().collection('events')
    .where('gameId', '==', gameId)
    .orderBy('timestamp', 'desc')
    .limit(10);
  
  eventsQuery.onSnapshot((snapshot) => {
    const eventsContainer = document.getElementById('recentEvents');
    eventsContainer.innerHTML = '';
    
    snapshot.forEach(doc => {
      const event = doc.data();
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event';
      
      let eventText = '';
      switch (event.type) {
        case 'goal':
          eventText = `⚽ GOAL! ${event.player} (${event.team})`;
          break;
        case 'game_start':
          eventText = '🏇 Game Started';
          break;
        case 'chukka_start':
          eventText = `🎯 Chukka ${event.chukka} Started`;
          break;
        case 'chukka_end':
          eventText = `🏁 Chukka ${event.chukka} Ended`;
          break;
        case 'pause':
          eventText = '⏸️ Game Paused';
          break;
        case 'resume':
          eventText = '▶️ Game Resumed';
          break;
        case 'game_end':
          eventText = '🏆 Game Finished';
          break;
        default:
          eventText = event.type.replace('_', ' ').toUpperCase();
      }
      
      const timeStr = event.timestamp ? 
        new Date(event.timestamp.toDate()).toLocaleTimeString() : 
        'Just now';
      
      eventDiv.innerHTML = `
        <span>${eventText}</span>
        <span class="event-time">${timeStr}</span>
      `;
      
      eventsContainer.appendChild(eventDiv);
    });
  });
}

// Chukka timer functions
function startChukkaTimer(startTime) {
  stopChukkaTimer();
  
  function updateTimer() {
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('chukkaTimer').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateTimer();
  chukkaTimer = setInterval(updateTimer, 1000);
}

function stopChukkaTimer() {
  if (chukkaTimer) {
    clearInterval(chukkaTimer);
    chukkaTimer = null;
  }
}

// Load historical games
function loadHistoricalGames() {
  const historicalQuery = firebase.firestore().collection('games')
    .where('status', '==', 'finished')
    .orderBy('startDate', 'desc');
  
  historicalQuery.onSnapshot((snapshot) => {
    const historicalContainer = document.getElementById('historicalGames');
    historicalContainer.innerHTML = '';
    
    if (snapshot.empty) {
      historicalContainer.innerHTML = '<p style="text-align: center; opacity: 0.7;">No historical games found</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const game = doc.data();
      const gameDiv = document.createElement('div');
      gameDiv.className = 'historical-game';
      
      const gameDate = game.startDate ? new Date(game.startDate.toDate()).toLocaleDateString() : 'TBD';
      
      gameDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${game.name}</strong>
            <br><small>${gameDate} • ${game.venue || 'TBD'}</small>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: bold;">
              ${game.teams.team1.name} ${game.teams.team1.score} - ${game.teams.team2.score} ${game.teams.team2.name}
            </div>
          </div>
        </div>
      `;
      
      historicalContainer.appendChild(gameDiv);
    });
  });
}

// Navigation functions
window.showLiveGame = () => {
  document.getElementById('liveGameSection').classList.remove('hidden');
  document.getElementById('historicalSection').classList.add('hidden');
};

window.showHistoricalGames = () => {
  document.getElementById('liveGameSection').classList.add('hidden');
  document.getElementById('historicalSection').classList.remove('hidden');
  loadHistoricalGames();
};

// Initialize push notifications
async function initializeNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    const token = await firebase.messaging().getToken({
      vapidKey: 'BG8tbedFo8H5yyaNS4TrgCMLbd6ggrdynd5qDItxNxzH69s4CO4IrNNlXI8-xckmN8XvJFm5_uEkfjCOevJ0nVg'
    });
    
    if (token) {
      console.log('FCM Token:', token);
    }

    firebase.messaging().onMessage((payload) => {
      console.log('Foreground message received:', payload);
      
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png'
        });
      }
    });
    
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}