(function () {
    "use strict";
    var lastTime = 0,
        x,
        currTime,
        timeToCall,
        id,
        vendors = ['ms', 'moz', 'webkit', 'o'];
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

function ListView(element, options) {
    "use strict";
    var listView = this,
        parent = element,
        wrapper = element.firstElementChild,
        direction = (options && options.direction) ? options.direction : "vertical",
        FRICTION_FACTOR = 0.94,
        MAX_VELOCITY = 10,
        MIN_VELOCITY = 0.01,

        clearCancel,
        velocity = 0,
        requestAnim,
        lastTickTime,
        isDown = false,
        startPoint,
        wrapperPosition = 0;

    function extractMove(e, eventName, pressed) {
        var currentPoint = (direction === "vertical") ? e[eventName].screenY : e[eventName].screenX,
            delta = startPoint - currentPoint;
        if (pressed && delta !== 0) {
            listView.shift(delta);
        }
        startPoint = currentPoint;
    }

    function tick() {
        var now = new Date().getTime(),
            delta = (now - lastTickTime) * velocity;
        listView.shift(delta);
        velocity *= FRICTION_FACTOR;
        if (typeof velocity === 'number' && Math.abs(velocity) > MIN_VELOCITY && !isDown) {
            lastTickTime = now;
            requestAnim = window.requestAnimationFrame(tick, null);
        } else {
            velocity = 0;
            listView.shift(wrapperPosition % 1);
        }
    }

    function swipe(e) {
        var isVertical = (direction === "vertical" && (e.swipe.direction === "top" || e.swipe.direction === "bottom")),
            isHorizontal = (direction !== "vertical" && (e.swipe.direction === "left" || e.swipe.direction === "right"));

        if (isVertical || isHorizontal) {
            velocity = (e.swipe.direction === "top" || e.swipe.direction === "left") ? e.swipe.speed : -e.swipe.speed;
            velocity = (Math.abs(velocity) > MAX_VELOCITY) ? MAX_VELOCITY * (velocity / Math.abs(velocity)) : velocity;
            isDown = false;
            lastTickTime = new Date().getTime();
            tick();
        }
    }

    function tapDown(e) {
        isDown = true;
        window.cancelAnimationFrame(requestAnim);
        startPoint = (direction === "vertical") ? e.tapdown.screenY : e.tapdown.screenX;
    }

    function tapMove(e) {
        extractMove(e, 'tapmove', isDown);
    }

    function tapUp(e) {
        extractMove(e, 'tapup', isDown);
        isDown = false;
    }

    function tapCancel(e) {
        clearCancel = setTimeout(function () {
            isDown = false;
        }, 50);
    }

    function tapClear(e) {
        if (isDown) {
            clearTimeout(clearCancel);
        }
    }

    listView.shift = function (delta) {
        var value;
        if (typeof delta !== 'number' || delta === 0) {
            return;
        }
        wrapperPosition -= delta;
        value = (direction === "vertical") ? "translate(0px, " + wrapperPosition + "px) scale(1) translateZ(0px)"
            : "translate(" + wrapperPosition + "px, 0) scale(1) translateZ(0px)";

        wrapper.style.webkitTransform = value;
        wrapper.style.transform = value;
        wrapper.style.oTransform = value;
        wrapper.style.msTransform = value;
        wrapper.style.mozTransform = value;
    };

    listView.getPosition = function () {
        return wrapperPosition;
    };

    listView.destroy = function () {
        parent.removeEventListener('swipe', swipe);
        parent.removeEventListener('tapdown', tapDown);
        parent.removeEventListener('tapmove', tapMove);
        parent.removeEventListener('tapup', tapUp);
        parent.removeEventListener('tapcancel', tapCancel);
        parent.removeEventListener('tapclear', tapClear);
    };

    //constructor part
    parent.addEventListener('swipe', swipe, false);
    parent.addEventListener('tapdown', tapDown, false);
    parent.addEventListener('tapmove', tapMove, false);
    parent.addEventListener('tapup', tapUp, false);
    parent.addEventListener('tapcancel', tapCancel, false);
    parent.addEventListener('tapclear', tapClear, false);

    listView.shift(0);

    return listView;
}