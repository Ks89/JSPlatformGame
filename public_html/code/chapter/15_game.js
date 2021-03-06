/*
 Copyright 2015 Stefano Cappa
 
 Licensed under the Apache License, Version 2.0 (the "License");
 
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var actorChars = {
    "@": Player,
    "o": Coin,
    "=": Lava, "|": Lava, "v": Lava,
    "s": Stalactite,
    "e": Enemy
};

var staticSmartObjectChars = {
    "a": Animator
};

function Level(plan) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];
    this.actors = [];
    this.animators = [];
    
    //default: false because player isn't jumping over an enemy
    this.jumpOnEnemySwitch = false;

    //remember, in map:
    //sxy with x,y numbers means that s=talactite, with id=x and delay=y
    //the same things for animator, with a=animator.
    //by default, axy is x=id and y=0, because adding more delay isn't really necessary.
    //delay connected to animator isn't implemented, bacause not necessary, at the moment.

    for (var y = 0; y < this.height; y++) { //righe
        //ad ogni ciclo ci metto la riga in line
        var line = plan[y];
        var gridLine = [];
        for (var x = 0; x < this.width; x++) { //colonne
            //ad ogni ciclo interno prendo un carattere della riga in "line"
            var ch = line[x];
            var fieldType = null;
            var id = null; //carattere successivo, cioe' l'id (un numero)  
            var delay = null; //carattere successivo, cioe' il delay (un numero)

            if ((ch === "s" || ch === "a" || ch === "e") && x + 1 < this.width && x + 2 < this.width) {
                id = line[x + 1];
                delay = line[x + 2];
            }

            //manage actors
            fieldType = manageActors(this, ch, id, delay, new Vector(x, y));

            //manageAnimators
            var animator = manageAnimators(ch, id, delay, new Vector(x, y));
            if(animator !== null) {
                this.animators.push(animator);
            }

            gridLine.push(fieldType);
        }

        //dato in "plan" la mappa del livello questo metodo crea "grid" 
        //sempre in array di array ma con contenuto nelle celle: wall,lava,null
        this.grid.push(gridLine);
    }

    //per trovare tra gli actors il player e salvarlo in player
    //uso filter sull'array actors, ritornando l'elemento di type 
    //"player". Questo "type" e' una variabile in Actor con assegnata una stringa.
    //NB: Suppongo che ci sia solo un player nel livello, cioe' che
    //la mappa del livello sia stata creata in modo corretto.
    this.player = this.actors.filter(function (actor) {
        return actor.type === "player";
    })[0];

    //per sapere se il livello e' stato completato, cioe' 
    //se player ha vinto o perso.
    //
    //finishDelay=usata per tenere attivo il livello 
    //per una piccola animazione
    this.status = this.finishDelay = null;
}
function manageAnimators(ch, id, delay, vector) {
    if (staticSmartObjectChars[ch] && isNumber(id) && isNumber(delay)) {
        //console.log("animator added with ch: " + ch + " and with id: " + id + " and delay: " + delay);
        return new Animator(vector, ch, id, delay);
    } else {
        return null;
    }
}

function manageActors(level, ch, id, delay, vector) {
    //mi da l'oggetto che puo' essere Player, Coin, Lava ecc...
    //actorChars e' una funzione che restituisce oggetti
    var Actor = actorChars[ch];
    //crea nuovo Actor e lo mette nel vettore con 
    //coordinate x,y e il carattere trovato in plan
    //eventualmente anche quello successivo che rappresenta l'id
    if (Actor) {
        console.log("actor: id: " + id + ", delay: " + delay);
        console.log("inNumber id: " + isNumber(id) + "  ,  delay: " + isNumber(delay));
        if (isNumber(id) && isNumber(delay)) {
            console.log("actor with numerical id and delay");
            //cioe' e' un actor con un id associato, il quale sara'
            //anche in uno o piu' Animator, che attivano questo Actor a muoversi ecc..
            level.actors.push(new Actor(vector, ch, id, delay));
        } else {
            level.actors.push(new Actor(vector, ch));
        }

        //x e ! sono gli unici totalmente fissi, quindi non sono attori e
        //quindi li tratto in modo diverso
    } else if (ch === "x") {    
        return "wall";
    } else if (ch === "!") {
        return "lava";
    }

    return null;
}

function isNumber(ch) {
        return !isNaN(ch);
}

//metodo per scoprire se il livello e' finito
Level.prototype.isFinished = function () {
    return this.status !== null && this.finishDelay < 0;
};

/*
function Actor(pos, ch, id) {
    this.pos = pos;
    this.ch = ch;
    this.id = id;
}*/


function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function (other) {
    return new Vector(this.x + other.x, this.y + other.y);
};

//metodo utile quando serve moltiplicare un vettore velocita' 
//per un intervallo di tempo per ottenere la distanza percorsa
//durante quel tempo
Vector.prototype.times = function (factor) {
    return new Vector(this.x * factor, this.y * factor);
};

function Animator(pos, ch, id, delay) {
    this.pos = pos;
    this.ch = ch;
    this.id = id;
    this.size = new Vector(1, 1);
    this.delay = delay;
}

Animator.prototype.type = "animator";


//il giocatore e' alto 1,5 quadretti da dove appare il carattere @
function Player(pos) {
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);

    //velocita' corrente che permette di simulare movimento e gravita'
    this.speed = new Vector(0, 0);
    this.activation = true;
    this.delayActivation = 0;
}
//il tipo di Player e' "player" come stringa
Player.prototype.type = "player";

function Enemy(pos, ch, id, delay) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.id = id;
    this.activation = true;
    this.delayActivation = delay;
    this.speed = new Vector(6, 0);
    this.health = 2;
}
Enemy.prototype.type = "enemy";

Enemy.prototype.decrementDelay = function () {
    this.delayActivation = this.delayActivation - 1;
};

Enemy.prototype.decrementHealth = function () {
    this.health = this.health - 1;
};

//La creazione della lava dipende dal carattere "ch"
//cioe' se e' fissa o si muove
function Lava(pos, ch) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    if (ch === "=") {
        this.speed = new Vector(2, 0);
    } else if (ch === "|") {
        this.speed = new Vector(0, 2);
    } else if (ch === "v") {
        this.speed = new Vector(0, 3);
        this.repeatPos = pos;
    }
    this.activation = true;
    this.delayActivation = 0;
}

//il tipo di Lava e' "lava" come stringa
Lava.prototype.type = "lava";


function Stalactite(pos, ch, id, delay) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.id = id;
    if (ch === "s") {
        this.speed = new Vector(0, 10);
    }
    //di default e' false perche' voglio che all'avvio le Stalactite siano ferme
    //e cadano solo quando avvio l'animazione, toccando l'Animator.
    this.activation = false;
    this.delayActivation = delay * 10;
}


//il tipo di Stalactite e' "stalactite" come stringa
Stalactite.prototype.type = "stalactite";

Stalactite.prototype.decrementDelay = function () {
    this.delayActivation = this.delayActivation - 1;
};

function Coin(pos) {
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);

    //wobble permette di fare un leggero movimento avanti indietro 
    //delle monete, per rendere tutto meno statico
    //si usa Math.random() per evitare che tutte le monete
    //si muovino in modo sincronizzato. Cioe' moltiplico random
    //per la larghezza della fase del seno, cioe' 2PIGreco
    this.wobble = Math.random() * Math.PI * 2;
    this.activation = true;
    this.delayActivation = 0;
}
Coin.prototype.type = "coin";

//funzione che crea un elemento e lo restituisce come classe
function elt(name, className) {
    var element = document.createElement(name);
    if (className) {
        element.className = className;
    }
    return element;
}

//un display e' creato dando il parent element a cui si auto attacca
//e un oggetto livello
function DOMDisplay(parent, level) {
    //appendChild ritorna l'elemtno attaccato.
    //uso questo per creare il wrapper element e salvarlo nella 
    //proprieta' wrap  
    this.wrap = parent.appendChild(elt("div", "game"));
    this.level = level;

//lo sfondo del livello e' disegnato una sola volta, mentre gli actors
    //sono ridisegnati ogni volta che il display e' aggiornato.
    this.wrap.appendChild(this.drawBackground());

    //l'actorLayer sara' usata da drawFrame per tracciare l'elemento
    // che tiene gli actors cosi' che essi possano essere facilmente
    //rimossi e sostituiti
    this.actorLayer = null;
    this.drawFrame();
}

//variabile scale che da il numero di pixel che una 
//singola unita' prende sullo schermo
var scale = 20;

//lo sfondo e' disegnato come una tabella, che rappresenta la struttura
//della grid. Ogni riga della grid e' una riga della tabella (cioe' tr)
//Le stringhe nella grid sono usare come class name per gli 
//elementi delle celle (td).
//Per migliorare l'aspetto e' utilizzato del css
DOMDisplay.prototype.drawBackground = function () {
    var table = elt("table", "background");
    table.style.width = this.level.width * scale + "px";
    this.level.grid.forEach(function (row) {
        var rowElt = table.appendChild(elt("tr"));
        rowElt.style.height = scale + "px";
        row.forEach(function (type) {
            rowElt.appendChild(elt("td", type));
        });
    });
    return table;
};

//ogni actor e' disegnato creando un elemento DOM ciascuno.
//Per ognuno e' settata la posizione e la dimensione basata sulle 
//proprieta' degli actors. Questi valori sono moltiplicati per scale
//in modo da passare da unita' del gioco ai pixel.
DOMDisplay.prototype.drawActors = function () {
    var wrap = elt("div");
    this.level.actors.forEach(function (actor) {
        var rect = wrap.appendChild(elt("div",
                "actor " + actor.type));
        rect.style.width = actor.size.x * scale + "px";
        rect.style.height = actor.size.y * scale + "px";
        rect.style.left = actor.pos.x * scale + "px";
        rect.style.top = actor.pos.y * scale + "px";
    });
    return wrap;
};

//visto che il numero di actors e' limitato, si puo' anche 
//ridisegnarli tutti senza perdere troppe performance.
DOMDisplay.prototype.drawFrame = function () {
    if (this.actorLayer) {
        this.wrap.removeChild(this.actorLayer);
    }
    this.actorLayer = this.wrap.appendChild(this.drawActors());
    this.wrap.className = "game " + (this.level.status || "");
    //necessario perche' i livelli non stanno tutti nello schermo,
    //ma sono anche scorrevoli
    this.scrollPlayerIntoView();
};

//metodo in cui trovo la posizione del player e aggiorno la posizione
//scrolling del wrapping element. Cambio la posizione dello scroll manipolando
// le proprieta' di scrollLeft e scrollTop, quando il player e' troppo vicino al bordo
//nota, che per trovare il centro dell'actor, aggiungo la sua posizione dall'algolo
//alto sinistro e la meta' della sua larghezza. Questo da centro in coordinate del livello
//ma per averlo in pixel, bisogna moltiplicare il vettore risultante per scale
DOMDisplay.prototype.scrollPlayerIntoView = function () {
    var width = this.wrap.clientWidth;
    var height = this.wrap.clientHeight;
    var margin = width / 3;

    // The viewport
    var left = this.wrap.scrollLeft, right = left + width;
    var top = this.wrap.scrollTop, bottom = top + height;

    var player = this.level.player;
    var center = player.pos.plus(player.size.times(0.5)).times(scale);

//serie di controlli per verificare che la posizione 
    //del player non sia fuori dal range,.
    //nota che questo ogni tanto setta scroll position senza senso
    //e' ok, perche' tanto il DOM li vincolera' a valori corretti.
    //nota che se si sta saltando, la visuale continuere a salire e 
    //scendere, cosi' si usa una regione al centro dello schermo, 
    //in cui ci si puo' muovere senza causare scrolling.
    if (center.x < left + margin) {
        this.wrap.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
        this.wrap.scrollLeft = center.x + margin - width;
    }
    
    if (center.y < top + margin) {
        this.wrap.scrollTop = center.y - margin;
    } else if (center.y > bottom - margin) {
        this.wrap.scrollTop = center.y + margin - height;
    }
};

//cancellare il livello, perche' serve quando ci si muove al 
//livello successivo o si resetta il livello corrente 
DOMDisplay.prototype.clear = function () {
    this.wrap.parentNode.removeChild(this.wrap);
};

//aggiunta movimento e collisioni

Level.prototype.obstacleAt = function (pos, size) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0) {
        return "wall";
    }
    
    if (yEnd > this.height) {
        return "lava";
    }
    
    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var fieldType = this.grid[y][x];
            if (fieldType) {
                return fieldType;
            }
        }
    }
};

Level.prototype.actorAt = function (actor) {
    for (var i = 0; i < this.actors.length; i++) {
        var other = this.actors[i];
        if (other !== actor &&
                actor.pos.x + actor.size.x > other.pos.x &&
                actor.pos.x < other.pos.x + other.size.x &&
                actor.pos.y + actor.size.y > other.pos.y &&
                actor.pos.y < other.pos.y + other.size.y) {
            return other;
        }
    }
};


Level.prototype.animatorAt = function (actor) {
    for (var i = 0; i < this.animators.length; i++) {
        var animator = this.animators[i];
        if (actor.pos.x + actor.size.x > animator.pos.x &&
                actor.pos.x < animator.pos.x + animator.size.x &&
                actor.pos.y + actor.size.y > animator.pos.y &&
                actor.pos.y < animator.pos.y + animator.size.y) {

            return animator;
        }
    }
};



var maxStep = 0.05;

Level.prototype.animate = function (step, keys) {
    if (this.status !== null) {
        this.finishDelay -= step;
    }
    
    while (step > 0) {
        var thisStep = Math.min(step, maxStep);
        this.actors.forEach(iterateActors, this);
        step -= thisStep;
    }
    
    function iterateActors(actor) {
        //mi permette di animare solo gli actors con activation===true
        //cioe' solo quelli abilitati di default, o abilitati grazie
        //all'nimator che setta in modo manuale a true, l'activation.
        if (actor.activation === true) {
            if ((actor.type === "stalactite" || actor.type === "enemy") && actor.delayActivation > 0) {
                //console.log("actor type: " + actor.type +  ", id: " + actor.id + ", delay before= " + actor.delayActivation);
                actor.decrementDelay();
                //console.log("actor type: " + actor.type +  ", id: " + actor.id + ", delay after= " + actor.delayActivation);
            }
            if (actor.delayActivation === 0) {
                actor.act(thisStep, this, keys);
            }
        }
    }
};

Lava.prototype.act = function (step, level) {
    var newPos = this.pos.plus(this.speed.times(step));
    if (!level.obstacleAt(newPos, this.size)) {
        this.pos = newPos;
    } else if (this.repeatPos) {
        this.pos = this.repeatPos;
    } else {
        this.speed = this.speed.times(-1);
    }
};

Enemy.prototype.act = function (step, level) {
    var newPos = this.pos.plus(this.speed.times(step));

    //now i compute a new position under the enemy's feet
    var tempPos = newPos.plus(new Vector(0, 0.01 * 100));

    //console.log("newpos: (" + newPos.x + " , " + newPos.y + ") ----- tempPos: (" + tempPos.x + " , " + tempPos.y + ")" +  " ---- Obstacle in tempPos: " + level.obstacleAt(tempPos, this.size));

    //if there aren't obstacles at newPos (horizontally) AND
    //if under the enemy's feet there isn't wall / ground
    if (!level.obstacleAt(newPos, this.size) && level.obstacleAt(tempPos, this.size)) {
        this.pos = newPos;
    } else if (this.repeatPos) {
        this.pos = this.repeatPos;
    } else {
        this.speed = this.speed.times(-1);
    }
};

Stalactite.prototype.act = function (step, level) {
    var newPos = this.pos.plus(this.speed.times(step));
    if (!level.obstacleAt(newPos, this.size)) {
        this.pos = newPos;
    } else if (this.repeatPos) {
        this.pos = this.repeatPos;
    }
};

var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.act = function (step) {
    this.wobble += step * wobbleSpeed;
    var wobblePos = Math.sin(this.wobble) * wobbleDist;
    this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

var playerXSpeed = 7;

Player.prototype.moveX = function (step, level, keys) {
    this.speed.x = 0;
    if (keys.left) {
        this.speed.x -= playerXSpeed;
    }
    if (keys.right) {
        this.speed.x += playerXSpeed;
    }

    var motion = new Vector(this.speed.x * step, 0);
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) {
        level.playerTouched(obstacle);
    } else {
        this.pos = newPos;
    }
};

var gravity = 30;
var jumpSpeed = 17;

Player.prototype.moveY = function (step, level, keys) {
    this.speed.y += step * gravity;
    var motion = new Vector(0, this.speed.y * step);
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) {
        level.playerTouched(obstacle);
        if (keys.up && this.speed.y > 0) {
            this.speed.y = -jumpSpeed;
        } else {
            this.speed.y = 0;
        }
    } else {
        this.pos = newPos;
    }
};

Player.prototype.act = function (step, level, keys) {
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);

    var otherActor = level.actorAt(this);


    //TODO Here i can catch if player jumped over an enemy BUT ALSO IF A PLAYER
    //TOUCH AN ENEMY HORIZONTALLY.
    //attention, this will called several times (>30 times).
    //and this condition will be true several times ;)
    //NOW I MUST IMPLEMENT THE LOGIC TO CATCH ONLY ONE OF THESE EVENTS (ONLY VERTICALLY)
    //AND I MUST REDUCE ENEMY'S HEALTH. 
    //FINALLY, I CAN CREATE A SPRING EFFECT jumping over an enemy.
    if (otherActor && otherActor.type === "enemy" && this.speed.y> 5) {
        console.log("FIRST IF WITH speed y = " + this.speed.y + ", and :" + level.jumpOnEnemySwitch);
        if(level.jumpOnEnemySwitch === false) {
            level.jumpOnEnemySwitch = true;
            console.log("JUMPED ON AN ENEMY (" + otherActor.health + ") with speed: (" + this.speed.x + "," + this.speed.y + ")");
            otherActor.decrementHealth();
            console.log("NEW HEALTH (" + otherActor.health + ")");
            
            if(otherActor.health<=0) {
                console.log("Enemy Killed");
                //enemy killed
                //remove otherActor from the array level.actors
                //level.actors //TODO
                otherActor = null;
            }
        }
    } else {
        if(level.jumpOnEnemySwitch === true) {
            level.jumpOnEnemySwitch = false;
            console.log("jumpOnEnemySwitch restored");
        }
    }

    
    if (otherActor) {
        level.playerTouched(otherActor.type, otherActor);
    }
    
    var otherAnimator = level.animatorAt(this);
    if (otherAnimator) {
        level.playerTouchedAnimator(otherAnimator);
    }

    // se player perde partita c'e' animazione apposta
    if (level.status === "lost") {
        this.pos.y += step;
        this.size.y -= step;
    }
};

//se passo actor e' per prendere le monete, se no e' per lava, muri, stalattiti ecc
Level.prototype.playerTouched = function (type, actor) {
    //var type = actor.type;
    if ((type === "lava" || type === "stalactite" || type === "enemy") && this.status === null) {
        this.status = "lost";
        this.finishDelay = 1;
        console.log("playertouched -> lost");
    } else if (type === "coin") {
        this.actors = this.actors.filter(function (other) {
            return other !== actor;
        });
        if (!this.actors.some(function (actor) {
            return actor.type === "coin";
        })) {
            this.status = "won";
            this.finishDelay = 1;
        }
    }
};


Level.prototype.playerTouchedAnimator = function (animator) {
    var id = animator.id;

    //ottengo la lista degli actor nel livello che hanno lo stesso id
    //dell'animator, cioe' gli actors che devo animare
    var actorsFiltered = this.actors.filter(function (actor) {
        return actor.id === id;
    });

    //stampo la lista degli actors che devo animare, perche' hanno lo stesso
    //id dell'animator che il player ha toccato
    actorsFiltered.forEach(function (actor) {
        //console.log("actor filtered: " + actor.pos.x + "," + actor.pos.y);
        actor.activation = true;
    });
};


var arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
    var pressed = Object.create(null);
    function handler(event) {
        if (codes.hasOwnProperty(event.keyCode)) {
            var down = event.type === "keydown";
            pressed[codes[event.keyCode]] = down;
            event.preventDefault();
        }
    }
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);

    // This is new -- it allows runLevel to clean up its handlers
    pressed.unregister = function () {
        removeEventListener("keydown", handler);
        removeEventListener("keyup", handler);
    };
    // End of new code

    return pressed;
}

function runAnimation(frameFunc) {
    var lastTime = null;
    function frame(time) {
        var stop = false;
        if (lastTime !== null) {
            var timeStep = Math.min(time - lastTime, 100) / 1000;
            stop = frameFunc(timeStep) === false;
        }
        lastTime = time;
        if (!stop) {
            requestAnimationFrame(frame);
        }
    }
    requestAnimationFrame(frame);
}

// To know when to stop and restart the animation, a level that is
// being displayed may be in three states:
//
// * "yes":     Running normally.
// * "no":      Paused, animation isn't running
// * "pausing": Must pause, but animation is still running
//
// The key handler, when it notices escape being pressed, will do a
// different thing depending on the current state. When running is
// "yes" or "pausing", it will switch to the other of those two
// states. When it is "no", it will restart the animation and switch
// the state to "yes".
//
// The animation function, when state is "pausing", will set the state
// to "no" and return false to stop the animation.
function runLevel(level, Display, andThen) {
    var display = new Display(document.body, level);

    var running = "yes";

    function handleKey(event) {
        //intercetto il tasto ESC, cioe' in ascii il 27
        if (event.keyCode === 27) {
            if (running === "no") {
                running = "yes";
                runAnimation(animation);
            } else if (running === "pausing") {
                running = "yes";
            } else if (running === "yes") {
                running = "pausing";
            }
        }
    }

    //registro il listener con handler definito sopra per interecettare
    //la pressione del tasto esc
    addEventListener("keydown", handleKey);

    var arrows = trackKeys(arrowCodes);

    function animation(step) {
        if (running === "pausing") {
            running = "no";
            return false;
        }

        level.animate(step, arrows);
        display.drawFrame(step);
        if (level.isFinished()) {
            display.clear();
            // Here we remove all our event handlers
            removeEventListener("keydown", handleKey);
            arrows.unregister(); // (see change to trackKeys)
            if (andThen) {
                andThen(level.status);
            }
            
            return false;
        }
    }
    runAnimation(animation);
}

var lives = 3;

function runGame(plans, Display) {
    function startLevel(n) {
        runLevel(new Level(plans[n]), Display, function (status) {
            if (status === "lost") {
                lives -= 1;
                if (lives === 0) {
                    console.log("lost");
                    window.alert("No more lives");
                    startLevel(0);
                } else {
                    startLevel(n);
                }
            } else if (n < plans.length - 1) {
                startLevel(n + 1);
            } else {
                console.log("You win!");
            }
        });
    }
    startLevel(0);
}