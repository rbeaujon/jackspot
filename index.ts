import createBackground  from "./src/components/createBackground/createBackground";
import createButtonSpin from "./src/components/createButtonSpin/createButtonSpin";
import createCounter from "./src/components/createCounter/createCounter";
import getRandomSymbol from "./src/components/getRandomSymbol/getRandomSymbol";
import getSymbol from "./src/components/getSymbol/getSymbol";
import createReels from "./src/components/createReels/createReels";
import createReelsContainer from "./src/components/reelsContainer/reelsContainer";

interface MachineState {
  reels: string[][];
  win: number;
}

interface MachineStatesResponse {
  'machine-state': MachineState[];
}

let machineStates: MachineState[];
let currentMachineStateIndex = 0;
let win = 0

//Get results from JSON file
fetch('./src/data/results.json')
.then(response => response.json())
.then(data => {
  machineStates = data['machine-state'];

  const app: PIXI.Application = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
  });
  document.body.appendChild(app.view);

  const targetWidth: number = app.screen.width * 0.6;
  const targetHeight: number = app.screen.height * 0.85;

  //Background image
  createBackground(app)

  //Reels container
  const reelsContainer: PIXI.Container = createReelsContainer(app)

  //Reels image
  createReels(reelsContainer, targetWidth ,targetHeight)

  //Counter image
  const counterArray: [PIXI.Sprite, PIXI.Text] = createCounter(app);
  const counter = counterArray[0]
  let counterValue =counterArray[1]

  //Create the reels for the slot machine
  const reelContainers: PIXI.Container[] = [];

  for (let i = 0; i < 3; i++) {
    const container: PIXI.Container = new PIXI.Container();
    container.x = (i - 1) * targetWidth / 3;
    container.y = container.height / 2; // Center the reelContainer vertically
    
    // Add three symbols/images to each reel
    for (let j = 0; j < 3; j++) {
      const symbol = getRandomSymbol();
      symbol.y = (j - 1) * symbol.height; // Adjust symbol position within reelContainer
      container.addChild(symbol);
    }

    reelContainers.push(container);
    reelsContainer.addChild(container);
  }

  //Button spin
  const buttonSpin: PIXI.Sprite = createButtonSpin(app);

  //Game conditions
  let animationProgress: number = 0;
  const animationDuration: number = 3000; 
  let isAnimating: boolean = false;

  //Game animations
  function animateImages() {
    
    buttonSpin.interactive = false;
    
    app.ticker.add(() => {
    
      for (let j = 0; j < 3; j++) { 
        const containerName: PIXI.Container = reelContainers[j];
        const symbols: PIXI.DisplayObject[] = containerName.children as PIXI.DisplayObject[];
        

        // Generate new symbols 
        const topSymbol:PIXI.Sprite = getRandomSymbol();
        topSymbol.y = -symbols[0].height;
        containerName.addChild(topSymbol);

        const midSymbol:PIXI.Sprite= getRandomSymbol();
        midSymbol.y =  0;
        containerName.addChild(midSymbol); 

        const bottomSymbol:PIXI.Sprite = getRandomSymbol();
        bottomSymbol.y = symbols[0].height;
        containerName.addChild(bottomSymbol); 

        //remove the old symbols
        containerName.removeChild(symbols[2]);
        containerName.removeChild(symbols[1]);
        containerName.removeChild(symbols[0]);

        //Verification if the timer is over
        if ((animationProgress * 10)/currentMachineStateIndex / animationDuration >= 1) {
          
          app.ticker.stop();
          buttonSpin.interactive = true;
          isAnimating = false;

          //remove the last symbols in the animation progress
          containerName.removeChild(symbols[2]);
          containerName.removeChild(symbols[1]);
          containerName.removeChild(symbols[0]);
            
          //Select the correct reel from dataJSON
          const reels: Array<Array<string>> = machineStates[currentMachineStateIndex - 1].reels;

          
          //Add the value the user earned
          if(j===0 && counter.children.length >= 1){
            for (let i = counter.children.length - 1; i >= 0; i--) {
              counter.removeChild(counter.children[counter.children.length - 1]); 
            }
          
            //check how much earned and sum total 
            win += machineStates[currentMachineStateIndex -1].win
            counterValue = new PIXI.Text(win.toString());
            counterValue.anchor.set(0.5);
            counterValue.style.fontFamily = "Arial";
            counterValue.style.fontSize = 80;
            counterValue.style.fill = "white";
            counter.addChild(counterValue);
          }

          //Add symbols according to the current machine state
          for (let l = 0; l < 3; l++) {
            const symbol:PIXI.Sprite = getSymbol(reels[j][l], l)
            containerName.addChild(symbol);
          }

        } else {
          animationProgress++
        }
      }
    });
    // Check if the current machine has completed and if so restart the state
    if (currentMachineStateIndex  === machineStates.length) {
      currentMachineStateIndex = 0; // restart the state
      animationProgress=0; // restart the progress indicator
    }
    currentMachineStateIndex++;
  }


  // Event listener for button click
  buttonSpin.interactive = true;
  buttonSpin.buttonMode = true;
  buttonSpin.on('pointerdown', () => {
    if (!isAnimating) {
      buttonSpin.interactive = false;
      animationProgress=0;
      isAnimating = true;
      app.ticker.start();
      animateImages();
    }
  });
})
.catch(error => {
  console.error('Error loading JSON:', error);
});