/**
* Created with JetBrains WebStorm.
* User: ihor
* Date: 7/31/13
* Time: 3:06 PM
* To change this template use File | Settings | File Templates.
*/

//RAD.view("view.graphV3", RAD.views.graphV3Base.extend({}));

RAD.view("view.statGraph", RAD.views.graphV3Base.extend({
    url :  'source/views/statGraph/statGraph.html',

    events : {
        'tapdown .graph_container' : 'tapdownEvent',
        'tapup .graph_container' : 'tapupEvent',
        'tapmove .graph_container' : 'tapmoveEvent',
        'tapcancel .graph_container' : 'tapcancelEvent',
        'tap .graph_container' : 'tapEvent',
        'swipe .graph_container' : 'swipeEvent'
    },

    drawing: {
        canvasWidth : 38,
        visualDayWidth : 38,
        daysMargin : 2,
        daysPosAbsolute : true,
        graphParts : [[],[],[]]
    },

    animation : {
        pointerIsDown: false,
        lastPointCoordinate : 0,
        animationWrapper : null,
        currentRAF : null,
        animationWrapperPosition : 0,
        lastAdapterPosition : 0
    },

    initVisual : function(){
        var aniWrap = this.$('.animationWrap'),
            canvasWidth = $('ul.days li canvas').width(),
            canvasHeight = $('ul.days li canvas').height(),
            halfHeight = canvasHeight / 2;

        _(this.drawing).defaults({
            canvasWidth : canvasWidth,
            canvasHeight : canvasHeight,
            canvasHalfHeight : halfHeight,
            currentAnimation : null,
            animationWrapper : aniWrap,
            visualDayWidth: 135,
            daysMargin : 4,
            colors : ['#40b2e4', '#f75d55', '#01d5be'],
            wrapperPosition : 0,
            visibleArray : [],
            firstElementIndex : 0,
            lastElementIndex : 0,
            canvasArray : [],
            contextArray : [],
            monthDayArray : [],
            weekDayArray : [],
            isMoving : false,
            isAnimating : false,
            moveBasePosition : 0,
            daysPosAbsolute : false
        });

        this.drawing.visibleScreenWidth = this.$el.width();
        this.drawing.visualRange = Math.round(this.$el.width() / this.drawing.visualDayWidth) * 1 + 3;

        var self = this,
            daysList = self.$el.find('ul.days'),
            dayLi = daysList.find('li'),
            daysPointer = self.$el.find('#days_pointer').css({
                top : daysList.eq(-2).css('top'),
                left : daysList.eq(-2).css('left')
            })[0],
            listSize = self.drawing.visualDayWidth;

        for (var key=0; key < self.drawing.visualRange; key++){
            var li = dayLi.clone().appendTo(daysList).css({
               // margin: '0 ' + self.drawing.daysMargin + 'px',
//                left: self.drawing.daysPosAbsolute ? listSize : '',
                width: self.drawing.visualDayWidth //- 2*self.drawing.daysMargin
            });

            this.setItemPosition(li[0], listSize);

            var canvas = li.find('canvas').attr({
                width : self.drawing.canvasWidth,
                height: self.drawing.canvasHeight
            }).css({
                    position: 'absolute',
                    top : 0,
                    marginLeft : -this.drawing.daysMargin
                });
            self.drawing.visibleArray.push({
                element : li[0],
                id : key,
                position : listSize
            });
            self.drawing.canvasArray.push(canvas[0]);
            self.drawing.contextArray.push(canvas[0].getContext('2d'));
            self.drawing.monthDayArray.push(li.find('.monthday')[0]);
            self.drawing.weekDayArray.push(li.find('.weekday')[0]);
            listSize += self.drawing.visualDayWidth;
        }
        dayLi.remove();
        daysList[0].style.width = listSize + 'px';
        self.drawing.listSize = listSize;


        this.drawing.list = daysList;

//        this.moveWrapper(-self.drawing.visualDayWidth * self.drawing.visualRange / 3, true);

        this.animation.animationWrapperPosition = -self.drawing.visualDayWidth * self.drawing.visualRange / 3;

        this.drawRange(this.getBounds(this.application.bio.currentDay, null));
//        this.drawRange(this.getBounds(15, null, -self.drawing.visualRange / 3,-self.drawing.visualRange / 3));
    },

    rearrangeDaysList : function(side){
        var index1, index2, el, leftBorderOut, rightBorderOut, sideSign = side < 0 ? 1 : -1;
        if (side < 0) {
            index1 = 0;
            index2 = this.drawing.visualRange-1;
        } else {
            index1 = this.drawing.visualRange-1;
            index2 = 0;
        }
        var flag = true;
        while (flag) {
            flag = false;
            el = this.drawing.visibleArray[index1];

            leftBorderOut = el.position + this.animation.animationWrapperPosition < -100;
            rightBorderOut = el.position + this.animation.animationWrapperPosition > this.drawing.visibleScreenWidth + 100;

            if (leftBorderOut || rightBorderOut) {
                flag = true;
                el.position = this.drawing.visibleArray[index2].position + (this.drawing.visualDayWidth) * sideSign ;
                el.dayFromBirth = this.drawing.visibleArray[index2].dayFromBirth + sideSign;

                this.setItemPosition(el.element, el.position);

                this.drawOneDay(el.dayFromBirth, el.canvas, true);

                this.drawing.visibleArray.splice(index1, 1);

                leftBorderOut ? this.drawing.visibleArray.push(el) : this.drawing.visibleArray.unshift(el);
            }
        }
    },

    removeInvisibleItems : function(){
        var i, itemHandler,
            fromDownOrRight;

        for (i = this.drawing.visibleArray.length - 1; i >= 0; i -= 1) {
            itemHandler = this.drawing.visibleArray[i];
            fromDownOrRight = itemHandler.position - this.drawing.visualDayWidth > this.drawing.visibleScreenWidth - this.animation.animationWrapperPosition;

            if ((itemHandler.position + this.drawing.visualDayWidth < -this.animation.animationWrapperPosition) || fromDownOrRight) {
                //console.log('removing', itemHandler);
                //this.drawing.list[0].removeChild(itemHandler.element);
                //this.drawing.visibleArray.splice(i,1);
//
//                if (fromDownOrRht) {
//                    mLastAdapterPosition = itemHandr.id;
//                }
            }
        }
    },

    setItemPosition : function (item, position) {
        item.style.position = 'absolute';
        var value = "translate3d(" + position + "px, 0, 0)";

        item.style.webkitTransform = value;
        item.style.transform = value;
        item.style.oTransform = value;
        item.style.msTransform = value;
        item.style.mozTransform = value;
    },

    fillFromLeft : function(itemPosition){
//        var item, i = itemPosition - this.drawing.visualRange - 1, fragment;
//
//        fragment = document.createDocumentFragment();
//        while (i >= 0 && i * this.drawing.visualDayWidth > -this.drawing.visualDayWidth - this.animation.animationWrapperPosition) {
//            item = this.adapter.getItem(i);
//            this.setItemPosition(item, i * this.drawing.visualDayWidth);
//            fragment.appendChild(item);
//
//            this.drawing.liVisibleArray.unshift({item: item, position: i * this.drawing.visualDayWidth, id: i});
//            i -= 1;
//        }
//        mListWrapper.appendChild(fragment);
    },

    fillToRight : function(itemPosition){

    },

    rearrangeFromLeft : function(){

    },

    rearrangeToRight : function(){

    },

    shiftList : function(delta, forced){
        var value;
        if (!forced && (typeof delta !== 'number' || delta === 0)) {
            return;
        }
        this.animation.animationWrapperPosition += delta;
        value = "translate3d(" + this.animation.animationWrapperPosition + "px, 0, 0) scale(1)";

        this.animation.animationWrapper.style.webkitTransform = value;
        this.animation.animationWrapper.style.transform = value;
        this.animation.animationWrapper.style.oTransform = value;
        this.animation.animationWrapper.style.msTransform = value;
        this.animation.animationWrapper.style.mozTransform = value;

        this.rearrangeDaysList(delta);
//        console.log(delta);
        //this.removeInvisibleItems();
        if (delta < 0) {
            this.fillToRight(this.animation.lastAdapterPosition);
        } else {
            this.fillFromLeft(this.animation.lastAdapterPosition);
        }
    },

    scroller : {
        easeInQuad: function (t, b, c, d) {
            t /= d;
            return c * t * t + b;
        },

        signum: function (number) {
            return number && number / Math.abs(number);
        },

        start: function (startVelocity, min, max, type) {
            var FRICTION_FACTOR = 0.6;

            this.startVelocity = startVelocity;
            this.deltaVelocity = -startVelocity; // to 0
            this.duration = (startVelocity / FRICTION_FACTOR) * 1000;

            this.startTime = new Date().getTime();
            this.lastTime = this.startTime;
            this.type = type;

            this.min = min;
            this.max = max;
        },

        computeScrollOffset: function () {
            var MIN_VELOCITY = 0.01,
                velocity,
                now = new Date().getTime(),
                animationTime = now - this.startTime,
                deltaTime  = now - this.lastTime;

            this.lastTime = now;
            velocity = this[this.type](animationTime, this.startVelocity, this.deltaVelocity, this.duration);
            if ((Math.abs(velocity) < MIN_VELOCITY) || (this.signum(velocity) !== this.signum(this.startVelocity))) {
                velocity = 0;
            }
            //check bounds

            return deltaTime * velocity;
        }
    },

    adapter : {
        count : 100,
        setCountItems : function(count){
            this.count = count;
        },

        getCountItems : function () {
            return this.count;
        },

        getItem : function (position) {
            var element = document.createElement('div');
            element.innerHTML = '<div class="img" style="' + "background: #cccccc url('http://lorempixel.com/60/60/') no-repeat;" + '"></div><span>item:' + position + '</span>';

            element.className = 'item';
            return element;
        }
    },

    stopAnimation : function(){
        window.cancelAnimationFrame(this.animation.currentRAF);
    },

    extractLastCoordinate : function(e, eventName, pressed) {
        var currentPoint = e.originalEvent[eventName].screenX,
            delta = currentPoint - this.animation.lastPointCoordinate;
        if (pressed && delta !== 0) {
            this.shiftList(delta, false);
        }

        this.animation.lastPointCoordinate = currentPoint;
    },

    swipeEvent : function(e){
        var velocity,
            DRAG_FACTOR = 0.98,
            MAX_VELOCITY = 10;


        velocity = (e.originalEvent.swipe.direction === "left") ? -e.originalEvent.swipe.speed : e.originalEvent.swipe.speed;
        velocity = DRAG_FACTOR * parseFloat((Math.abs(velocity) > MAX_VELOCITY) ? MAX_VELOCITY * (velocity / Math.abs(velocity)) : velocity);
        this.animation.pointerIsDown = false;

        this.scroller.start(velocity, 0, this.adapter.getCountItems() * this.drawing.visualDayWidth, "easeInQuad");
        this.stepAnimation();

    },

    stepAnimation : function(tickTime){
        var self = this;
        var callback = function(){
            var shift = self.scroller.computeScrollOffset();
            self.shiftList(shift);

            if (shift !== 0 || tickTime === undefined) {
                self.animation.currentRAF = window.requestAnimationFrame(callback, null);
            } else {
                self.shiftList(this.animation.animationWrapperPosition % 1, false);
            }
        };
        callback();
    },

    tapdownEvent : function(e){
        this.animation.pointerIsDown = true;
        this.stopAnimation();
        this.animation.lastPointCoordinate = e.originalEvent.tapdown.screenX;
    },

    tapupEvent : function(){
        this.animation.pointerIsDown = true;
    },

    tapmoveEvent : function(e){
        this.extractLastCoordinate(e, 'tapmove', this.animation.pointerIsDown);
    },

    getBioRange : function(startDay, range){
        var birth = this.application.bio.birthDateTimestamp,
            res = [];
        for (var d= startDay; d <= startDay + range; d++) {
            res.push(this.application.bio.getBioForDay(new Date(birth + 86400000*d)));
        }
        return res;
    },

    prepareGraphParts : function(width, height, lineWidth){

        this.animation.animationWrapper = $('.animationWrap')[0];

        console.log(arguments);

        if (!width || !height) {
            return false;
        }

        var self = this,
            canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            halfHeight = height / 2,
            days = this.getBioRange(0, 34),
            colors = this.drawing.colors,
            periods = [23, 28, 33],
            offset = 10;

            canvas.width = width;
            canvas.height = height;

        for (var i = 0; i < periods.length; i++){
            for (var j = 0; j < periods[i]; j++){
                var begX = 0;
                var begY = Math.floor(halfHeight - days[j][i]*(halfHeight-offset));
                var endX = canvas.width;
                var endY = Math.floor(halfHeight - days[j+1][i]*(halfHeight-offset));

                self.drawing.graphParts[i][j] = [begX, begY, endX, endY]
            }
        }
        console.log(self.drawing.graphParts);
    },

    drawOneDay : function(dayFromBirth, canvas, force){

        var self = this,
            bounds = null,
            cycleDay,
            diff,
            sideSign,
            factor = 2,
            periods = [23, 28, 33],
            context = canvas.getContext('2d'),
            width = this.drawing.visualDayWidth,
            height = 120,
            lineWidth = 10;

        console.log(canvas.width);

//        context.clearRect(0, 0, canvas.width + 100, canvas.height + 10);
        context.clearRect(0, 0, 100, canvas.height + 10);
        context.lineWidth = lineWidth;
        context.lineCap = 'square';

        if (force) {
            //return false;
        }

        for (var i = 0; i < periods.length; i++){
            cycleDay = dayFromBirth % periods[i];
            bounds = self.drawing.graphParts[i][cycleDay >= 0 ? cycleDay : periods[i] + cycleDay];

            diff = (bounds[1] - bounds[3]);
            sideSign = bounds[1] > height/2 ? 1 : -1;

            context.beginPath();
            context.moveTo(bounds[0], bounds[1]);
            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(height + 30 - Math.min(bounds[1], bounds[3])) > height/2 + 50 ? factor*sideSign : 1), bounds[2], bounds[3]);
//            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), bounds[2], bounds[3]);
//            context.lineTo(bounds[2], bounds[3]);
            // TODO completely fix the smoothing of curve & edges matching

            context.strokeStyle = self.drawing.colors[i];
            context.stroke();
        }
    },

    drawRange : function(days, index){

        var canvas = null,
            context = null,
            monthDay = null,
            weekDay = null,
            colors = this.drawing.colors,
            halfHeight = this.drawing.canvasHalfHeight,
            visualDayWidth = this.drawing.visualDayWidth,
            firstRedrawingDay = index || 0,
            factor = 2;

        this.prepareGraphParts(this.drawing.visualDayWidth, this.drawing.canvasHeight);

        for (var i = firstRedrawingDay; i < this.drawing.visibleArray.length; i++) {

            canvas = this.drawing.canvasArray[i];
            context = this.drawing.contextArray[i];
            monthDay = this.drawing.monthDayArray[i];
            weekDay = this.drawing.weekDayArray[i];

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];

            this.drawing.visibleArray[i].dayFromBirth = days[i][5];
            this.drawing.visibleArray[i].canvas = canvas;

            this.drawOneDay(days[i][5], canvas);
        }
    },
    snapToDay : function(diff){
        var dayWidth = this.drawing.visualDayWidth,
            backSwipeDelta = 30,
            side = diff > 0 ? 1 : -1,
            steps = Math.round((diff + side*backSwipeDelta) / dayWidth),
            next = steps * dayWidth,
            shift = (Math.abs(diff) > 10) ? (next - diff) : -diff;
//        this.animateTo(shift, Math.abs(steps), diff);
        this.moveWrapper(shift, true);
    }
}));