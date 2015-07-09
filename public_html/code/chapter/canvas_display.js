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

//This var scales a pixel by its value.
var scale = 20;

function flipHorizontally(context, around) {
    context.translate(around, 0);
    context.scale(-1, 1);
    context.translate(-around, 0);
}

function CanvasDisplay(parent, level) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(600, level.width * scale);
    this.canvas.height = Math.min(450, level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");

    this.level = level;
    this.animationTime = 0;
    this.flipPlayer = false;

    this.viewport = {
        left: 0,
        top: 0,
        width: this.canvas.width / scale,
        height: this.canvas.height / scale
    };

    this.drawFrame(0);
}

CanvasDisplay.prototype.clear = function () {
    this.canvas.parentNode.removeChild(this.canvas);
};

CanvasDisplay.prototype.drawFrame = function (step) {
    this.animationTime += step;

    this.updateViewport();
    this.clearDisplay();
    this.drawBackground();
    this.drawActors();
};

CanvasDisplay.prototype.updateViewport = function () {
    var view = this.viewport, margin = view.width / 3;
    var player = this.level.player;
    var center = player.pos.plus(player.size.times(0.5));
   
    view.left = updateWithParameters(center.x,view.left,view.width,this.level.width);
    
    view.top = updateWithParameters(center.y,view.top,view.height,this.level.height);
    
    //function to prevent code duplication
    function updateWithParameters(centerAxis, viewDirection, viewDimension, levelDimension) {
        if (centerAxis < viewDirection + margin) {
            viewDirection = Math.max(centerAxis - margin, 0);
        } else if (centerAxis > viewDirection + viewDimension - margin) {
            viewDirection = Math.min(centerAxis + margin - viewDimension,levelDimension - viewDimension);
        }
        return viewDirection;
    }
};


CanvasDisplay.prototype.clearDisplay = function () {
    if (this.level.status === "won") {
        this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (this.level.status === "lost") {
        this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
        this.cx.fillStyle = "rgb(52, 166, 251)";
    }
    
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

CanvasDisplay.prototype.drawBackground = function () {
    var view = this.viewport;
    var xStart = Math.floor(view.left);
    var xEnd = Math.ceil(view.left + view.width);
    var yStart = Math.floor(view.top);
    var yEnd = Math.ceil(view.top + view.height);

    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var tile = this.level.grid[y][x];
            if (tile === null) {
                continue;
            }
            var screenX = (x - view.left) * scale;
            var screenY = (y - view.top) * scale;
            var tileX = tile === "lava" ? scale : 0;
            this.cx.drawImage(otherSprites,
                    tileX, 0, scale, scale,
                    screenX, screenY, scale, scale);
        }
    }
};

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

CanvasDisplay.prototype.drawPlayer = function (x, y, width,
        height) {
    var sprite = 8, player = this.level.player;
    width += playerXOverlap * 2;
    x -= playerXOverlap;
    if (player.speed.x !== 0)
        this.flipPlayer = player.speed.x < 0;

    if (player.speed.y !== 0) {
        sprite = 9;
    } else if (player.speed.x !== 0) {
        sprite = Math.floor(this.animationTime * 12) % 8;
    }
    this.cx.save();
    
    if (this.flipPlayer) {
        flipHorizontally(this.cx, x + width / 2);
    }
    
    this.cx.drawImage(playerSprites,
            sprite * width, 0, width, height,
            x, y, width, height);

    this.cx.restore();
};

CanvasDisplay.prototype.drawActors = function () {
    this.level.actors.forEach(function (actor) {
        var width = actor.size.x * scale;
        var height = actor.size.y * scale;
        var x = (actor.pos.x - this.viewport.left) * scale;
        var y = (actor.pos.y - this.viewport.top) * scale;
        if (actor.type === "player") {
            this.drawPlayer(x, y, width, height);
        } else {
            var tileX;
            
            if (actor.type === "lava") {
                tileX = scale; //it's like 1 * scale
            } else if (actor.type === "stalactite") {
                tileX = 2 * scale;
            } else if (actor.type === "enemy") {
                tileX = 3 * scale;
            } if (actor.type === "coin") {
                tileX = 4 * scale;
            }  
            
            this.cx.drawImage(otherSprites,
                    tileX, 0, width, height,
                    x, y, width, height);
        }
    }, this);
};