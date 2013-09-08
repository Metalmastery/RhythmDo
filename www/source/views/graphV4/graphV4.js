/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.namespace("views.graphV4Base", RAD.Blanks.View.extend({
    url :  'source/views/graphV4/graphV4.html',

    events : {
        'tapcancel .graph_container' : 'tapCancelEvent',
        'tapdown .graph_container' : 'tapdownEvent',
        'tapup .graph_container' : 'tapupEvent',
        'tapmove .graph_container' : 'tapmoveEvent',
        'tap .graph_container' : 'tapEvent',
        'swipe .graph_container' : 'swipeEvent'
    },

    inited : false,

    drawing: {
        canvasWidth : 105,
        visualDayWidth : 105,
        daysMargin : 4,
        daysPosAbsolute : true,
        graphParts : [[],[],[]],
	    daysWithTasks : [],
	    currentDayOffset : 4
    },

    animation : {
        pointerIsDown: false,
        lastPointCoordinate : 0,
        animationWrapper : null,
        currentRAF : null,
        animationWrapperPosition : 0,
        lastAdapterPosition : 0
    },

    onEndRender : function(){
        this.initVisual();
    },

    initVisual : function(){
        if (this.inited) {
            return false;
        }

        var aniWrap = this.$('.animationWrap'),
            canvasWidth = $('div.days .day canvas').width(),
            canvasHeight = $('div.days .day canvas').height(),
            halfHeight = canvasHeight / 2;

        this.animation.animationWrapper = aniWrap[0];

        _(this.drawing).defaults({
            canvasWidth : canvasWidth,
            canvasHeight : canvasHeight,
            canvasHalfHeight : halfHeight,
            currentAnimation : null,
            animationWrapper : aniWrap,
            daysMargin : 4,
            colors : ['#01d5be', '#f75d55', '#40b2e4'],
            wrapperPosition : 0,
            visibleArray : [],
            firstElementIndex : 0,
            lastElementIndex : 0,
            canvasArray : [],
            contextArray : [],
            monthDayArray : [],
            weekDayArray : [],
	        daysPointer : {
		        item : null,
		        weekDay : null,
		        monthDay : null
	        },
            isMoving : false,
            isAnimating : false,
            moveBasePosition : 0,
            daysPosAbsolute : false
        });

        this.drawing.visibleScreenWidth = this.$el.width();
        this.drawing.visualRange = Math.round(this.$el.width() / this.drawing.visualDayWidth) + 6;

        var self = this,
            daysList = self.$el.find('div.days'),
            dayLi = daysList.find('.day'),
	        listSize = self.drawing.visualDayWidth;

        self.drawing.daysPointer.item = self.$el.find('#days_pointer').css({
            top : daysList.eq(-2).css('top'),
            left : daysList.eq(-2).css('left')
        });
	    self.drawing.daysPointer.monthDay = self.$el.find('#days_pointer .monthDay')[0];
	    self.drawing.daysPointer.weekDay = self.$el.find('#days_pointer .weekDay')[0];


        for (var key=0; key < self.drawing.visualRange; key++){
            var li = dayLi.clone().appendTo(daysList).css({
                width: self.drawing.visualDayWidth - 2*self.drawing.daysMargin
            });

            this.setItemPosition(li[0], listSize);

            var canvas = li.find('canvas').attr({
                width : self.drawing.canvasWidth,
                height: self.drawing.canvasHeight
            }).css({
                    width : self.drawing.canvasWidth
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

	    self.setItemPosition(self.drawing.daysPointer.item[0], self.drawing.visualDayWidth + self.drawing.daysMargin, 0);

        this.shiftList(-self.drawing.visualDayWidth * (self.drawing.currentDayOffset));
        this.prepareGraphParts(this.drawing.canvasWidth, this.drawing.canvasHeight);
		this.prepareTaskList();
        this.subscribe('graphPartsReady', function(){
            console.log('GRAPH PARTS READY');
            this.drawRange(this.getBounds(this.application.bio.currentDay, self.drawing.currentDayOffset));
	        this.toggleCurrentDay(true);
            this.unsubscribe('graphPartsReady');
        }, this);

        this.inited = true;
    },

    onInitialize : function(){
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

    },

	prepareTaskList : function(){
	    var model = RAD.models.task_list,
		    self = this,
		    date;
		_.each(model.toJSON(), function(item){
			date = new Date(item.date);
		    self.drawing.daysWithTasks.push(Math.floor(self.application.bio.getDaysFromBirth(date)));
		});
	},

//    startMove : function(e){
//        if (!this.drawing.isAnimating){
//            this.drawing.isMoving = true;
//            this.drawing.moveBasePosition = e.originalEvent.tapdown.clientX;
//        } else {
//            console.log('start move cancelled');
//        }
//    },
//
//    stopMove : function(e){
//        if (this.drawing.isMoving && !this.drawing.isAnimating){
//            this.drawing.isMoving = false
//            var shift = e.originalEvent.tapup.clientX - this.drawing.moveBasePosition;
//
//            this.moveWrapper(shift, true);
//
//            this.snapToDay(shift);
//        } else {
//            console.log('stop move cancelled');
//        }
//    },

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

            leftBorderOut = el.position + this.animation.animationWrapperPosition < - 3 * this.drawing.visualDayWidth;
            rightBorderOut = el.position + this.animation.animationWrapperPosition > this.drawing.visibleScreenWidth + 3 * this.drawing.visualDayWidth;

            if (leftBorderOut || rightBorderOut) {
                flag = true;
                el.position = this.drawing.visibleArray[index2].position + (this.drawing.visualDayWidth) * sideSign ;
                el.dayFromBirth = this.drawing.visibleArray[index2].dayFromBirth + sideSign;

                this.setItemPosition(el.element, el.position);

                this.rebuildOneDay(el);

                this.drawing.visibleArray.splice(index1, 1);

                leftBorderOut ? this.drawing.visibleArray.push(el) : this.drawing.visibleArray.unshift(el);
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

    shiftList : function(delta, forced){
        var value;
        if (!forced && (typeof delta !== 'number' || delta === 0)) {
            return;
            this.snapToDay();
        }

        this.animation.animationWrapperPosition += delta;
        value = "translate3d(" + this.animation.animationWrapperPosition + "px, 0, 0) scale(1)";

        this.animation.animationWrapper.style.webkitTransform = value;
        this.animation.animationWrapper.style.transform = value;
        this.animation.animationWrapper.style.oTransform = value;
        this.animation.animationWrapper.style.msTransform = value;
        this.animation.animationWrapper.style.mozTransform = value;

        this.rearrangeDaysList(delta);
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
//            var FRICTION_FACTOR = 0.6;
            var FRICTION_FACTOR = 1;

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

    stopAnimation : function(monitorOff){
        window.cancelAnimationFrame(this.animation.currentRAF);
        this.drawing.isAnimating = false;
        if (!monitorOff) {
            this.snapToDay();
        }
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
        this.drawing.isAnimating = true;
        this.stepAnimation();
    },

    stepAnimation : function(){
        var self = this;
        var callback = function(tickTime){
            var shift = self.scroller.computeScrollOffset();
            self.shiftList(shift);

            if (shift !== 0 || tickTime === undefined) {
                self.animation.currentRAF = window.requestAnimationFrame(callback, null);
            } else {
                self.shiftList(self.animation.animationWrapperPosition % 1, false);
                self.stopAnimation(true);
	            self.toggleCurrentDay(false);
                self.snapToDay();
            }
        };
        callback();
    },

	tapCancelEvent : function(){
		this.toggleCurrentDay(true);
	},

    tapdownEvent : function(e){
        this.animation.pointerIsDown = true;
        this.stopAnimation(false);
	    this.toggleCurrentDay(false);
        this.animation.lastPointCoordinate = e.originalEvent.tapdown.screenX;
    },

    tapupEvent : function(){
	    if (!this.drawing.isAnimating){
		    this.toggleCurrentDay(true);
	    }
        this.animation.pointerIsDown = false;
	    this.drawing.isMoving = false;

    },

    tapmoveEvent : function(e){
	    if (this.animation.pointerIsDown) {
		    this.drawing.isMoving = true;
	    }
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

        if (!width || !height) {
            return false;
        }
        console.log(width);
        var cnv = $('<canvas></canvas>')[0];
        var loadedImagesCount = 0;
        cnv.width = width * 23;
        cnv.height = height;

        var step = 0.01;

        var ctx = cnv.getContext('2d');

        for (var i = 0; i < 2*Math.PI; i+= step){
            var begX = i / (2 * Math.PI) * cnv.width,
                begY = cnv.height/2 - Math.sin(i) * (cnv.height/2 - 10),
                endX = (i + step) / (2 * Math.PI) * cnv.width;
            endY = cnv.height/2 - Math.sin(i + step) * (cnv.height/2 - 10) ;
            ctx.moveTo(begX, begY);
            ctx.lineTo(endX, endY);

        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = this.drawing.colors[0];
        ctx.stroke();

        var self = this,
            canvas = document.createElement('canvas'),
            context = canvas.getContext('2d'),
            halfHeight = height / 2,
            days = this.getBioRange(0, 34),
            colors = this.drawing.colors,
            periods = [23, 28, 33],
            offset = 30,
            src = '',
            factor = 1;

        canvas.width = width;
        canvas.height = height;

        for (var i = 0; i < periods.length; i++){
            for (var j = 0; j < periods[i]; j++){
                var begX = 0;
                var begY = Math.floor(halfHeight - days[j][i]*(halfHeight-offset));
                var endX = canvas.width;
                var endY = Math.floor(halfHeight - days[j+1][i]*(halfHeight-offset));

                diff = (begY - endY);
                sideSign = begY > height/2 ? 1 : -1;
//
//            context.beginPath();
//            context.moveTo(bounds[0], bounds[1]);
//            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(height + 30 - Math.min(bounds[1], bounds[3])) > height/2 + height/3 ? factor*sideSign : 1), bounds[2], bounds[3]);
////            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), bounds[2], bounds[3]);
////            context.lineTo(bounds[2], bounds[3]);

                context.clearRect(0,0,canvas.width, canvas.height);
                context.beginPath();
                context.moveTo(begX, begY);
                context.quadraticCurveTo(begX + width/2, begY - diff / 2 + (Math.abs(height + 30 - Math.min(begY, endY)) > height/2 + height/3 ? factor*sideSign : 1), endX, endY);
//                context.lineTo(endX, endY);
                context.lineWidth = 5;
                context.lineCap = 'round';
                context.strokeStyle = self.drawing.colors[i];
                context.stroke();

//                if (i==0) {
//                    context.clearRect(0,0,500,500);
//                    context.putImageData(ctx.getImageData(j * width - 1, 0, (j+1) * width+1, height),0,0);
//                    console.log(j * width, (j+1) * width);
//                }

                src = canvas.toDataURL();
                var img = $('<img>').on('load', function(){
                    loadedImagesCount += 1;
                    if (loadedImagesCount === 84) {
                        self.publish('graphPartsReady', {})
                    }
                }).attr('src', src);



                //self.drawing.graphParts[i][j] = [begX, begY, endX, endY, img[0]];
                self.drawing.graphParts[i][j] = [begX, begY, endX, endY, src];
            }
        }
    },

    rebuildOneDay : function(item) {

        var id = item.id,
            date = new Date(this.application.bio.birthDateTimestamp + item.dayFromBirth * 86400000),
            monthDay = this.drawing.monthDayArray[id],
            weekDay = this.drawing.weekDayArray[id];

        monthDay.innerHTML = date.getDate();
        weekDay.innerHTML = date.toDateString().split(' ')[0];

	    if (this.drawing.daysWithTasks.indexOf(item.dayFromBirth) >= 0) {
		    item.element.setAttribute('data-has-task', 'true');
	    } else {
		    item.element.removeAttribute('data-has-task');
	    }

        this.drawOneDay(item.dayFromBirth, item.canvas, true, item.element)
    },

    drawOneDay : function(dayFromBirth, canvas, force, el){

        var self = this,
            bounds = null,
            cycleDay,
            diff,
            sideSign,
            factor = 1,
            periods = [23, 28, 33],
            context = canvas.getContext('2d'),
            width = this.drawing.canvasWidth,
            height = canvas.height,
            lineWidth = 6;

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.lineWidth = lineWidth;

        var classes = ['.green', '.red', '.blue'];

        for (var i = 0; i < periods.length; i++){
            cycleDay = dayFromBirth % periods[i];
            bounds = self.drawing.graphParts[i][cycleDay >= 0 ? cycleDay : periods[i] + cycleDay];
//
//            diff = (bounds[1] - bounds[3]);
//            sideSign = bounds[1] > height/2 ? 1 : -1;
//
//            context.beginPath();
//            context.moveTo(bounds[0], bounds[1]);
//            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(height + 30 - Math.min(bounds[1], bounds[3])) > height/2 + height/3 ? factor*sideSign : 1), bounds[2], bounds[3]);
////            context.quadraticCurveTo(bounds[0] + width/2, bounds[1] - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), bounds[2], bounds[3]);
////            context.lineTo(bounds[2], bounds[3]);
//            // TODO completely fix the smoothing of curve & edges matching
//
//            context.strokeStyle = self.drawing.colors[i];
//            context.stroke();
//            console.log(bounds);
            //context.drawImage(bounds[4],0,0);
            $(el).find(classes[i]).attr('src', bounds[4]);
            //console.log(el, bounds[4]);
        }
    },

    getBounds : function(current, currentDayShift){
        var birth = this.application.bio.birthDateTimestamp,
            middleDay = birth + current * 86400000,
            visualRange = this.drawing.visualRange,
            currentDayShift = typeof currentDayShift === 'number' ? currentDayShift : 1,
            res = [];
        for (var d= - currentDayShift ; d <= visualRange - currentDayShift + 1; d++) {
            res.push(this.application.bio.getBioForDay(new Date(middleDay + 86400000*d)));
        }

        return res;
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

//        console.log(this.drawing.visibleArray);

        for (var i = firstRedrawingDay; i < this.drawing.visibleArray.length; i++) {

            canvas = this.drawing.canvasArray[i];
            context = this.drawing.contextArray[i];
            monthDay = this.drawing.monthDayArray[i];
            weekDay = this.drawing.weekDayArray[i];

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];

            this.drawing.visibleArray[i].dayFromBirth = days[i][5];
            this.drawing.visibleArray[i].canvas = canvas;

//            console.log(this.drawing.visibleArray[i]);
            //this.drawOneDay(days[i][5], canvas, false, days[i].el);
            this.rebuildOneDay(this.drawing.visibleArray[i]);
        }
    },

    snapToDay : function(){
        var currentDay = this.extractCurrentDay(),
            currentBio = this.application.bio.getBioForDay(currentDay.dayFromBirth, true);

	    this.publish('current_day_changed', {
		    currentDay : currentDay.dayFromBirth
	    });
	    console.log('currentDay', currentDay);

	    var diff = this.animation.animationWrapperPosition - Math.round(this.animation.animationWrapperPosition / this.drawing.visualDayWidth) * this.drawing.visualDayWidth;

	    this.shiftList(-diff);

	    this.toggleCurrentDay(true);
    },

	extractCurrentDay : function(){
	    return this.drawing.visibleArray[this.drawing.currentDayOffset];
	},

	toggleCurrentDay : function(factor){
		var currentDay = this.extractCurrentDay();
		if (factor) {
			this.drawing.daysPointer.monthDay.innerHTML = this.drawing.monthDayArray[currentDay.id].innerHTML;
			this.drawing.daysPointer.weekDay.innerHTML = this.drawing.weekDayArray[currentDay.id].innerHTML;

			this.drawing.monthDayArray[currentDay.id].style.display = 'none';
			this.drawing.weekDayArray[currentDay.id].style.display = 'none';
		} else {
			this.drawing.daysPointer.monthDay.innerHTML = '';
			this.drawing.daysPointer.weekDay.innerHTML = '';

			this.drawing.monthDayArray[currentDay.id].style.display = 'block';
			this.drawing.weekDayArray[currentDay.id].style.display = 'block';
		}

	},

    animateTo : function(left, count, rearrangeSide){

        var self = this,
            container = this.drawing.animationWrapper,
            position = this.drawing.wrapperPosition + left,
            value = 'translate3d('+position+'px, 0, 0)',
            transition = '-webkit-transform ' + (100 * count) + 'ms',
            eventName = 'webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd';

        this.drawing.isAnimating = true;
        this.drawing.wrapperPosition = position;
        this.drawing.animationWrapper
            .addClass('animated')
            .css({
                //            '-webkit-transition': transition,
                //            'transition': transition,
                '-webkit-transform': value,
                '-moz-transform': value,
                '-ms-transform': value,
                '-o-transform': value,
                'transform': value
            })
            .on(eventName, callback);
        window.setTimeout(callback, 350);

        function callback(){
            self.drawing.isAnimating = false;
            container
                .removeClass('animated')
                .off(eventName, callback);
            if (left/rearrangeSide > 0 || count >= 0){
                self.rearrangeDaysList(rearrangeSide, count);
            }
        }
    }

}));

RAD.view("view.graphV4", RAD.views.graphV4Base.extend({}));

