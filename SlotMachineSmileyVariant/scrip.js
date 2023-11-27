/* Lever System */
const lever = document.getElementById('Lever');
const text = document.getElementById('RollMe');
const rollButton = document.getElementById('rollButton');
/* Reel System */    
let reelContents = ["😂", "😍", "😅", "🤔", "😜", "🤐", "😱", "😵", "😃", "🤩"];
let reelLength = 3;
let reelContainers = document.querySelectorAll(".reel-container");
let spinningReels = [];
let spinning = false;
let reelDelay = 100;
let reelOne = [];
let reelTwo = [];
let reelThree = [];
let reels = [reelOne, reelTwo, reelThree];
let capacity = 3;
let rollNum = 8;
/* Money System */ 
let money = promptForDeposit();
let rowNum = promptForNumRows();
document.querySelector("#money").innerText = money;
let moneyToAdd = 0;
/* Sound System */ 
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterVolume = audioCtx.createGain();
masterVolume.gain.setValueAtTime(0.05, audioCtx.currentTime);
masterVolume.connect(audioCtx.destination);

function promptForDeposit() {
  let depositAmount;

  do {
    depositAmount = prompt("How much money would you like to deposit?");
    
    if (depositAmount === null) {
      return null; // User clicked cancel
    }

    depositAmount = parseFloat(depositAmount);

    if (isNaN(depositAmount) || depositAmount < 0) {
      alert("Please enter a valid number for the deposit amount.");
    }
  } while (isNaN(depositAmount) || depositAmount < 0);

  return depositAmount;
}


function promptForNumRows() {
  let numRows;

  do {
    numRows = parseFloat(prompt("How many rows would you like to bet on? (1-3)"));

    if (isNaN(numRows) || numRows < 1 || numRows > 3) {
      alert("Please enter a valid number between 1 and 3 for the number of rows.");
    }
  } while (isNaN(numRows) || numRows < 1 || numRows > 3);

  return numRows;
}

let getReelItem = () => {
  let newReel = document.createElement("div");
  let currentReelIndex = 0;

  for (let i = 0; i < reels.length; i++) {
    if (reels[i].length < capacity) {
      currentReelIndex = i;
      break;
    }
  }

  let randomNum;
  do {
    randomNum = Math.floor(Math.random() * reelContents.length);
  } while (reels[currentReelIndex].includes(randomNum));

  newReel.innerHTML = reelContents[randomNum];
  newReel.classList.add("reel-item");
  
  setTimeout(() => {
    newReel.classList.add("active");
  }, 0);

  reels[currentReelIndex].push(randomNum);

  return newReel;
};

let startSpin = () => {
  // Clear reels using a loop
  reels.forEach(reel => reel.length = 0);

  capacity = 9;
  rollButton.disabled = true;
  rollButton.style.backgroundColor = 'red';
  text.style.fontWeight = 'bold';
  text.textContent = 'X';

  // Use template literals for rotation angles
  lever.style.transform = text.style.transform = 'rotateX(180deg)';

  if (!spinning && money > 0) {
    // Use classList methods for removing class
    document.querySelectorAll(".prize-item.active").forEach(s => s.classList.remove("active"));

    // Update money and setChange in one go
    updateMoneyAndSetChange(-1 * rowNum);

    // Use a loop to push values into spinningReels
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spinningReels.push(i), reelDelay * i);
    }

    spinning = true;
    spinUpdate(rollNum);
  }
};

// Function to update money and setChange in one go
let updateMoneyAndSetChange = (value) => {
  updateMoney(value);
  setChange(value);
};


let spinUpdate = spinsLeft => {
  spinningReels.forEach(n => {
    moveReel(n);
  });
  if (spinsLeft > 0) {
    setTimeout(() => {
      spinUpdate(spinsLeft - 1);
    }, reelDelay);
  } else {
    if (spinningReels.length > 0) {
      spinningReels.splice(0, 1);

      setTimeout(() => {
        spinUpdate(0);
      }, reelDelay);
      playNote(160 - (30 - spinningReels.length * 10), 0.1);
    } else {
      text.style.fontWeight = 'normal';
      rollButton.style.backgroundColor = 'greenyellow';
      lever.style.transform = 'rotateX(0deg)';
      text.textContent = 'Roll';
      text.style.transform = 'rotateX(0deg)';
      rollButton.disabled = false;

      spinning = false;
      findWins();
    }
  }
};

let moveReel = (reelIndex) => {
  let selectedReel = reelContainers[reelIndex];
  let newReelItem = getReelItem();

  selectedReel.prepend(newReelItem);

  if (selectedReel.children.length > reelLength) {
    let lastElement = selectedReel.lastElementChild;
    lastElement.classList.add("deactivate");

    setTimeout(() => {
      selectedReel.removeChild(lastElement);
    }, reelDelay);
  }
};

let updateMoney = change => {
  money += change;
  document.querySelector("#money").innerText = money;
};

let setChange = change => {
  let changes = document.querySelector(".changes");
  let newChange = document.createElement("div");
  newChange.innerHTML = change > 0 ? `+${change}` : change;
  newChange.classList.add("change");
  if (change < 0) newChange.classList.add("negative");
  changes.prepend(newChange);
  if (changes.children.length > 6) {
    changes.removeChild(changes.lastElementChild);
  }
};

const playWinChime = amount => {
  const clampedAm = Math.min(amount, 20);
  playNote(400 + 100 * (20 - clampedAm), 0.05, "sine");

  if (--amount > 0) {
    setTimeout(() => playWinChime(amount), 70);
  }
};

let findWins = () => {
  const winlines = [[], [], []];
  const symbols = [{}, {}, {}];

  reelContainers.forEach((reel, index) => {
    for (let i = 0; i < 3; i++) {
      const symbol = reel.children[i].innerText;
      winlines[i].push(symbol);

      if (symbols[i][symbol]) symbols[i][symbol]++;
      else symbols[i][symbol] = 1;
    }
  });

  const checkWin = (lineIndex) => {
    const winline = winlines[lineIndex];

    if (
      winline.filter(s => s === winline[0]).length === 3
    ) {
      win(3, winline[0], lineIndex);
      document
        .querySelector(".triples")
        .children[reelContents.indexOf(winline[0])].classList.add("active");
    } else {
      for (let i = 0; i < 3; i++) {
        if (winline[i] == winline[i + 1]) {
          win(2, winline[i], lineIndex);
          document
            .querySelector(".doubles")
            .children[reelContents.indexOf(winline[i])].classList.add("active");
          break;
        }
      }
    }
  };

  if (rowNum == 2 || rowNum == 3) {
    checkWin(0);
  }

  if (rowNum == 2 || rowNum == 3 || rowNum == 1) {
    checkWin(1);
  }

  if (rowNum == 3) {
    checkWin(2);
  }
};


let win = (amountMatching, symbol, childNum) => {
  reelContainers.forEach(reel => {
    if (reel.children[childNum].innerText === symbol)
      reel.children[childNum].classList.add("win");
  });
  let winAmount = 1 + reelContents.indexOf(symbol);
  playWinChime(winAmount);
  if (amountMatching == 3) winAmount *= 100;

  setChange(winAmount);
  addToMoney(winAmount);
};

const addToMoney = (amount, speed = 101) => {
  const changeAmount = Math.ceil(amount / 2);
  updateMoney(changeAmount);

  const remainder = amount - changeAmount;

  speed = Math.max(speed - 5, 10);

  if (remainder) {
    setTimeout(() => addToMoney(remainder, speed), speed);
  }
};


function playNote(freq, dur, type) {
  if (!freq) freq = 1000;
  if (!dur) dur = 1;
  if (!type) type = "square";
  return new Promise(res => {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
    oscillator.connect(masterVolume);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
    oscillator.onended = res;
  });
}

//fills reels
reelContainers.forEach((reel, i) => {
  for (let n = 0; n < reelLength; n++) {
    moveReel(i);
  }
});

const addToPrizeTable = (combo, amount, target) => {
  const pt = document.querySelector(`.prize-table .${target}`);
  
  const prize = document.createElement("div");
  prize.textContent = `${combo}: ${amount}`;
  prize.classList.add("prize-item");
  prize.dataset.winAttr = combo.replace(/[-❔]/g, "");

  pt.appendChild(prize);
};


reelContents.forEach((symbol, index) => {
  const multiplier = reelContents.filter((s) => s === symbol).length === 2 ? 1 : 100;
  addToPrizeTable(`${symbol}-${symbol}-❔`, index + 1, "doubles", multiplier);
  addToPrizeTable(`${symbol}-${symbol}-${symbol}`, (index + 1) * multiplier, "triples");
});

