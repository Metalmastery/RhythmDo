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
            id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            },
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

//Math.easeInOutQuad = function (currentTime, startValue, changeInValue, duration) {
//    currentTime /= duration / 2;
//    if (currentTime < 1) {
//        return changeInValue / 2 * currentTime * currentTime + startValue;
//    }
//    currentTime -= 1;
//    return -changeInValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue;
//};
//

function makeEaseInOut(delta, progress) {
    var result;
    if (progress < 0.5) {
        result = delta(2 * progress) / 2;
    } else {
        result = (2 - delta(2 * (1 - progress))) / 2;
    }
    return result;
}

function ListView(element, adapter, options) {
    "use strict";
    var FRICTION_FACTOR = 0.94,
        MAX_VELOCITY = 10,
        MIN_VELOCITY = 0.01,


        mListView = this,
        mContainer = element,
        mListWrapper,
        mDirection = (options && options.direction) ? options.direction : "vertical",
        mParentSize,

        mClearCancel,
        mLastVelocity = 0,
        mRequestAnimationID,
        mLastTickTime,
        mPointerIsDown = false,
        mLastPointerCoordinate,
        mItemSize,
        mVisibleItems = [],

        mLastAdapterPosition = 0,
        mWrapperShiftPosition = 0;

    function getFullSizeWithMargin(element) {
        var elmHeight, elmMargin;
        if (document.all) {// IE
            elmHeight = parseInt(element.currentStyle.height, 10);
            elmMargin = Math.max(parseInt(element.currentStyle.marginTop, 10), parseInt(element.currentStyle.marginBottom, 10));
        } else {
            elmHeight = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('height'), 10);
            elmMargin = Math.max(parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-top'), 10), parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-bottom'), 10));
        }
        return (elmHeight + elmMargin);
    }

    function calculateItemSize() {
        var item = adapter.getItem(0);
        if (item) {
            mContainer.appendChild(item);
            mItemSize = getFullSizeWithMargin(item);
            mContainer.removeChild(item);
        }
    }

    function setItemPosition(item, position) {
        item.style.position = 'absolute';
        var value = (mDirection === "vertical") ? "translate3d(0, " + position + "px, 0)" : "translate3d(" + position + "px, 0, 0)";

        item.style.webkitTransform = value;
        item.style.transform = value;
        item.style.oTransform = value;
        item.style.msTransform = value;
        item.style.mozTransform = value;
    }

    function fillToBottomOrRight(itemPosition) {
        //fill by items from adapter
        var lastBottom = itemPosition * mItemSize + mWrapperShiftPosition, i, l, item, fragment;

        if (!(itemPosition < adapter.getCountItems() && lastBottom < mParentSize)) {
            return;
        }

        //create container for rest items
        fragment = document.createDocumentFragment();
        for (i = itemPosition, l = adapter.getCountItems(); i < l && lastBottom < mParentSize; i += 1) {
            item = adapter.getItem(i);
            setItemPosition(item, i * mItemSize);
            fragment.appendChild(item);

            mVisibleItems.push({item: item, position: i * mItemSize, id: i});
            lastBottom += mItemSize;
        }

        mListWrapper.appendChild(fragment);
        mLastAdapterPosition = i;
    }

    function fillFromUpOrLeft(itemPosition) {
        var item, i = itemPosition - mVisibleItems.length - 1, fragment;

        fragment = document.createDocumentFragment();
        while (i >= 0 && i * mItemSize > -mItemSize - mWrapperShiftPosition) {
            item = adapter.getItem(i);
            setItemPosition(item, i * mItemSize);
            fragment.appendChild(item);

            mVisibleItems.unshift({item: item, position: i * mItemSize, id: i});
            i -= 1;
        }
        mListWrapper.appendChild(fragment);
    }

    function removeInvisibleItems() {
        var i, itemHandler,
            fromDownOrRight;

        for (i = mVisibleItems.length - 1; i >= 0; i -= 1) {
            itemHandler = mVisibleItems[i];
            fromDownOrRight = itemHandler.position > mParentSize - mWrapperShiftPosition;

            if ((itemHandler.position + mItemSize < -mWrapperShiftPosition) || fromDownOrRight) {
                mListWrapper.removeChild(itemHandler.item);
                mVisibleItems.splice(i, 1);

                if (fromDownOrRight) {
                    mLastAdapterPosition = itemHandler.id;
                }
            }
        }
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function extractLastCoordinate(e, eventName, pressed) {
        var currentPoint = (mDirection === "vertical") ? e[eventName].screenY : e[eventName].screenX,
            delta = mLastPointerCoordinate - currentPoint;
        if (pressed && delta !== 0) {
            mListView.shift(delta, false);
        }
        mLastPointerCoordinate = currentPoint;
    }

    function tick() {
        var now = new Date().getTime(),
            delta = (now - mLastTickTime) * mLastVelocity;
        mListView.shift(delta);
        mLastVelocity *= FRICTION_FACTOR;
        if (typeof mLastVelocity === 'number' && Math.abs(mLastVelocity) > MIN_VELOCITY && !mPointerIsDown) {
            mLastTickTime = now;
            mRequestAnimationID = window.requestAnimationFrame(tick, null);
        } else {
            mLastVelocity = 0;
            mListView.shift(mWrapperShiftPosition % 1, false);
        }
    }

    function eventSwipe(e) {
        var isVertical = (mDirection === "vertical" && (e.swipe.direction === "top" || e.swipe.direction === "bottom")),
            isHorizontal = (mDirection !== "vertical" && (e.swipe.direction === "left" || e.swipe.direction === "right"));

        if (isVertical || isHorizontal) {
            mLastVelocity = (e.swipe.direction === "top" || e.swipe.direction === "left") ? e.swipe.speed : -e.swipe.speed;
            mLastVelocity = (Math.abs(mLastVelocity) > MAX_VELOCITY) ? MAX_VELOCITY * (mLastVelocity / Math.abs(mLastVelocity)) : mLastVelocity;
            mPointerIsDown = false;
            mLastTickTime = new Date().getTime();

            console.log(mLastVelocity / FRICTION_FACTOR);

            tick();
        }
    }

    function eventTapDown(e) {
        mPointerIsDown = true;
        window.cancelAnimationFrame(mRequestAnimationID);
        mLastPointerCoordinate = (mDirection === "vertical") ? e.tapdown.screenY : e.tapdown.screenX;
    }

    function eventTapMove(e) {
        extractLastCoordinate(e, 'tapmove', mPointerIsDown);
    }

    function eventTapUp(e) {
        extractLastCoordinate(e, 'tapup', mPointerIsDown);
        mPointerIsDown = false;
    }

    function eventTapCancel() {
        mClearCancel = setTimeout(function () {
            mPointerIsDown = false;
        }, 50);
    }

    function eventTapClear() {
        if (mPointerIsDown) {
            clearTimeout(mClearCancel);
        }
    }

    function eventResize() {
        mParentSize = (mDirection === 'vertical') ? mListWrapper.offsetHeight : mListWrapper.offsetWidth;
        mListView.shift(mWrapperShiftPosition, true);
    }

    mListView.shift = function (delta, forced) {
        var value;
        if (!forced && (typeof delta !== 'number' || delta === 0)) {
            return;
        }
        mWrapperShiftPosition -= delta;
        value = (mDirection === "vertical") ? "translate3d(0, " + mWrapperShiftPosition + "px, 0) scale(1)"
            : "translate3d(" + mWrapperShiftPosition + "px, 0, 0) scale(1)";

        mListWrapper.style.webkitTransform = value;
        mListWrapper.style.transform = value;
        mListWrapper.style.oTransform = value;
        mListWrapper.style.msTransform = value;
        mListWrapper.style.mozTransform = value;

        removeInvisibleItems();
        if (delta < 0) {
            fillFromUpOrLeft(mLastAdapterPosition);
        } else {
            fillToBottomOrRight(mLastAdapterPosition);
        }
    };

    mListView.getPosition = function () {
        return mWrapperShiftPosition;
    };

    mListView.destroy = function () {
        mContainer.removeEventListener('swipe', eventSwipe);
        mContainer.removeEventListener('tapdown', eventTapDown);
        mContainer.removeEventListener('tapmove', eventTapMove);
        mContainer.removeEventListener('tapup', eventTapUp);
        mContainer.removeEventListener('tapcancel', eventTapCancel);
        mContainer.removeEventListener('tapclear', eventTapClear);

        window.removeEventListener('resize', eventResize);
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //constructor part
    mListWrapper = document.createElement('div');
    mListWrapper.style.width = '100%';
    mListWrapper.style.height = '100%';

    mListWrapper.style.margin = 0;
    mListWrapper.style.position = 'absolute';
    mListWrapper.style.webkitTransition = '-webkit-transform 0ms';
    mListWrapper.style.transition = '-webkit-transform 0ms';
    mListWrapper.style.webkitTransformOrigin = '0px 0px';

    mContainer.style.overflow = 'hidden';
    mContainer.style.position = 'relative';

    mContainer.appendChild(mListWrapper);

    mContainer.addEventListener('swipe', eventSwipe, false);
    mContainer.addEventListener('tapdown', eventTapDown, false);
    mContainer.addEventListener('tapmove', eventTapMove, false);
    mContainer.addEventListener('tapup', eventTapUp, false);
    mContainer.addEventListener('tapcancel', eventTapCancel, false);
    mContainer.addEventListener('tapclear', eventTapClear, false);

    window.addEventListener('resize', eventResize, false);

    mParentSize = (mDirection === 'vertical') ? mListWrapper.offsetHeight : mListWrapper.offsetWidth;
    calculateItemSize();
    fillToBottomOrRight(mLastAdapterPosition);
    mListView.shift(mWrapperShiftPosition, true);

    return mListView;
}

function ListViewAdapter(dataArray, template) {
    "use strict";
    var adapter = this;

    adapter.getCountItems = function () {
        return 1000;
    };

    adapter.getItem = function (position) {
        var element = document.createElement('div');
        element.innerHTML = '<div class="img" style="' + "background: #cccccc url('http://lorempixel.com/60/60/') no-repeat;" + '"></div><span>item:' + position + '</span>';

        element.className = 'item';
        return element;
    };

    return adapter;
}