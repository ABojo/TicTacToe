const Player = (name, symbol, color) => {
    if(!name) name = `Player ${symbol}`;
    return {getName: () => name, getSymbol: () => symbol, getColor: () => color};
};

const gameboard = (function() {
    let _gameboardArray = new Array(9).fill(null);

    const updateGameBoard = (tile, mark) =>  _gameboardArray[tile] = mark;
    const getGameBoard = () => _gameboardArray
    const resetGameBoard = () => _gameboardArray = new Array(9).fill(null);

    return {updateGameBoard, getGameBoard, resetGameBoard}
})();

const displayController = (function() {
    const createElement = (options) => {
        const newElement = document.createElement(options.type);

        Object.keys(options).forEach(prop => {
            if (prop !== 'type') { 
                //if the property is an object then loop through the object and add its property values if not add it directly to element
                options[prop] instanceof Object ? Object.keys(options[prop]).forEach(styleName => newElement[prop][styleName] = options[prop][styleName]) : newElement[prop] = options[prop]
            }
        });

        return newElement;
    }

    const removeSetup = () => {document.querySelector('.setup').remove()};

    const buildBoard = () => {
        const board = createElement({type: 'div', className: 'gameboard'});

        for(let i=0; i < 9; i++) {
            const newTile = createElement({type: 'div', className: 'gameboard__tile open__tile'})
            newTile.addEventListener('click', () => game.executeTurn(i));
            board.append(newTile);
        }

        document.body.append(board);
    }

    const buildGameButtons = () => {
        const restartButton = createElement({type: 'button', className: 'game-button restart', textContent: 'Restart Game'});
        const stopButton = createElement({type: 'button', className: 'game-button end', textContent: 'End Game'});
        const buttonContainer = createElement({type: 'div', className: 'game-button-container'});

        buttonContainer.append(restartButton, stopButton);
        restartButton.addEventListener('click', game.restartGame);
        stopButton.addEventListener('click', game.endGame);
        document.body.append(buttonContainer);
    }

    const setGameMessage = (html, important) => {
        let gameStatus = document.querySelector('.game-status');

        if(!gameStatus) {
            gameStatus = createElement({type: 'h1', className: 'game-status'});
            document.body.append(gameStatus);
        }


        important ? gameStatus.classList.add('important') : gameStatus.classList.remove('important');


        gameStatus.innerHTML = html;
    }

    const markBoard = (tileNumber, player) => {
        const currentTile = document.querySelector(`.gameboard__tile:nth-of-type(${tileNumber + 1})`)
        const newMark = createElement({type: 'p', className: 'tile__mark', innerHTML: player.getSymbol(), style: {color: player.getColor()}});
        currentTile.classList.remove('open__tile');
        currentTile.append(newMark);
    };

    const clearBoard = () => {
        Array.from(document.querySelectorAll('.gameboard__tile')).forEach(el => {
            el.classList.add('open__tile');
            el.classList.remove('winning__tile');
            if(el.children.length > 0) {
                el.children[0].remove();
            }
        });
    }

    const removeTileHover = () => {
        Array.from(document.querySelectorAll('.gameboard__tile')).forEach(el => {
            el.classList.remove('open__tile');
        });
    }

    const buildSetup = () => {
        const setup = createElement({type: 'div', className: 'setup'});
        const setupHeading = createElement({type: 'h1', className: 'setup__heading', textContent: 'Enter usernames'});
        const inputBoxOne = createElement({type: 'div', className: 'setup__input-box'});
        const inputBoxTwo = createElement({type: 'div', className: 'setup__input-box'})
        const colorPickerOne = createElement({type: 'div', className: 'setup__input-color', style : {backgroundColor: '#3498db'}});
        const colorPickerTwo = createElement({type: 'div', className: 'setup__input-color', style : {backgroundColor: '#e74c3c'}});
        const playerOneInput = createElement({type: 'input', className: 'setup__input', placeholder: 'Player X'});
        const playerTwoInput = createElement({type: 'input', className: 'setup__input', placeholder: 'Player O'});
        const startButton = createElement({type: 'button', className: 'setup__button', textContent: 'Start Game'});

        startButton.addEventListener('click', game.startGame);
        [colorPickerOne, colorPickerTwo].forEach(el => el.addEventListener('click', (e)=> {buildColorPicker(e)}));
        inputBoxOne.append(colorPickerOne, playerOneInput);
        inputBoxTwo.append(colorPickerTwo, playerTwoInput);
        setup.append(setupHeading, inputBoxOne, inputBoxTwo, startButton);
        document.body.append(setup);
    }

    const clearGameUI = () => {
        document.querySelector('.game-status').remove();
        document.querySelector('.gameboard').remove();
        document.querySelector('.game-button-container').remove();
    }

    const highlightTiles = (tiles) => { 
        tiles.forEach(index => {
            document.querySelector(`.gameboard__tile:nth-of-type(${index + 1})`).classList.add('winning__tile');
        });
    }   

    const buildColorPicker = (event) => {
        const colorPicker = event.currentTarget;
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22'];
        const popup = createElement({type:'div', className: 'popup'});
        const popupBox = createElement({type:'div', className: 'popup__box'});
        const colorGrid = createElement({type:'div', className: 'color-grid'});
        const closeButton = createElement({type: 'p', className: 'popup__close', innerHTML: '<i class="fas fa-times-circle"></i>'});
        closeButton.addEventListener('click', ()=> {popupBox.remove()});



        colors.forEach(el => {
            //Temp element for converting hex value to RGB and testing for equality
            const tempElement = createElement({type:'div', style: {backgroundColor: el}});

            const className = tempElement.style.backgroundColor === colorPicker.style.backgroundColor ?  'color-grid__item selected' : 'color-grid__item'
            const newColor = createElement({type:'div', className: className, style: {backgroundColor: el}});

            newColor.addEventListener('click', (e) => {
                document.querySelector('.selected').classList.remove('selected');
                e.currentTarget.classList.add('selected');
                colorPicker.style.backgroundColor = e.currentTarget.style.backgroundColor;
            });
            colorGrid.append(newColor);
        });

        const currentPopUp = document.querySelector('.popup__box');
        if(currentPopUp) currentPopUp.remove();

        popupBox.append(closeButton, colorGrid);
        colorPicker.parentElement.append(popupBox);
        //popup.append(popupBox);
        //document.body.prepend(popup);
    };

    return {markBoard, buildBoard, setGameMessage, removeSetup, buildGameButtons, clearBoard, clearGameUI, buildSetup, removeTileHover, highlightTiles};
})();


const game = (function(){
    const state = {
        players: [],
        activePlayer: null,
        gameIsActive: true
    }

    const executeTurn = function(tile) {
        //If game is running and the tiles value is still null then execute the turn and render it to the board
        if(state.gameIsActive && gameboard.getGameBoard()[tile] === null) {
            gameboard.updateGameBoard(tile, state.activePlayer.getSymbol());
            displayController.markBoard(tile, state.activePlayer);
            const winningTiles = getWinningTiles();

            if(winningTiles) {
                displayController.setGameMessage(`<span style='color:${state.activePlayer.getColor()}'>Congratulations ${state.activePlayer.getName()} you have won the game!</span>`, true);
                displayController.highlightTiles(winningTiles);
                state.gameIsActive = false;
                displayController.removeTileHover();
                return null;
            }

            if(boardIsFull()) return displayController.setGameMessage(`It's a draw!`, true);
        
            swapActivePlayer();
            displayController.setGameMessage(`${state.activePlayer.getName()} it's your turn!`)
        }
    }

    const getWinningTiles = () => {
        let winningTiles = null;
        const currentBoard = gameboard.getGameBoard();
        const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

        winConditions.forEach(el => {
            //Only check for equality if one of the win conditions has not already been marked as a winner and theres no unmarked tile in the win conditions
            if(!winningTiles && ![currentBoard[el[0]], currentBoard[el[1]], currentBoard[el[2]]].includes(null)) {
                if(currentBoard[el[0]] === currentBoard[el[1]] && currentBoard[el[1]] === currentBoard[el[2]]) {
                    winningTiles = el;
                }
            }
        });

        return winningTiles;
    };

    const boardIsFull = () => {return gameboard.getGameBoard().find(el => el === null) === undefined ? true : false}

    const swapActivePlayer = () => {state.activePlayer = state.players.find(el => el !== state.activePlayer)}

    const startGame = function() {
        const playerOneInputBox = document.querySelector('.setup__input-box:nth-of-type(1)');
        const playerTwoInputBox  = document.querySelector('.setup__input-box:nth-of-type(2)');

        state.players.push(Player(playerOneInputBox.children[1].value, 'X', playerOneInputBox.children[0].style.backgroundColor));
        state.players.push(Player(playerTwoInputBox.children[1].value, 'O', playerTwoInputBox.children[0].style.backgroundColor));
        state.activePlayer = state.players[0];
        state.gameIsActive = true;
        

        displayController.removeSetup();
        displayController.setGameMessage(`${state.activePlayer.getName()} it's your turn!`)
        displayController.buildBoard();
        displayController.buildGameButtons();
    }

    const restartGame = () => {
        state.activePlayer = state.players[0];
        state.gameIsActive = true;
        displayController.setGameMessage(`${state.activePlayer.getName()} it's your turn!`);
        displayController.clearBoard();
        gameboard.resetGameBoard();
    };  

    const endGame = function() {        
        state.gameIsActive = false;
        state.activePlayer = null;
        state.players = [];

        displayController.clearGameUI();
        gameboard.resetGameBoard();
        displayController.buildSetup();
    };

    return {executeTurn, startGame, restartGame, endGame}
})();

displayController.buildSetup();


