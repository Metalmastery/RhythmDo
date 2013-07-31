/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.namespace("views.graphV3Base", RAD.Blanks.View.extend({
    url : 'source/views/graphV3/graphV3.html',

    events : {
        'swipe .graph_container' : 'swipeGraph',
        'tapmove .graph_container' : 'moveGraph',
        'tapdown .graph_container' : 'startMove',
        'tapup .graph_container' : 'stopMove'
    },

    drawing : {},

    onNewExtras : function(data){

    },

    initVisual : function(){
        var aniWrap = this.$('.animationWrap');

        _(this.drawing).defaults({
            canvasWidth : 135,
            canvasHeight : 100,
            canvasHalfHeight : 50,
            requestAF : window.requestAnimationFrame,
            cancelAF : window.cancelAnimationFrame,
            currentAnimation : null,
            animationWrapper : aniWrap,
            visualDayWidth: 135,
            daysMargin : 4,
            colors : ['#40b2e4', '#f75d55', '#01d5be'],
            wrapperPosition : 0,
            canvasArray : [],
            contextArray : [],
            monthDayArray : [],
            weekDayArray : [],
            isMoving : false,
            isAnimating : false,
            moveBasePosition : 0,
            daysPosAbsolute : false
        });

        this.drawing.visualRange = Math.round(this.$el.width() / this.drawing.visualDayWidth) * 3 + 3;

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
                margin: '0 ' + self.drawing.daysMargin + 'px',
                left: self.drawing.daysPosAbsolute ? listSize : '',
                width: self.drawing.visualDayWidth - 2*self.drawing.daysMargin
            });
            listSize += self.drawing.visualDayWidth;
            var canvas = li.find('canvas').attr({
                width : self.drawing.canvasWidth,
                height: self.drawing.canvasHeight
            }).css({
                    position: 'absolute',
                    top : 0,
                    left : -this.drawing.daysMargin
                });
            self.drawing.canvasArray.push(canvas[0]);
            self.drawing.contextArray.push(canvas[0].getContext('2d'));
            self.drawing.monthDayArray.push(li.find('.monthday')[0]);
            self.drawing.weekDayArray.push(li.find('.weekday')[0]);

        }
        dayLi.remove();
        daysList[0].style.width = listSize + 'px';

        this.drawing.list = daysList;

        this.moveWrapper(-self.drawing.visualDayWidth * self.drawing.visualRange / 3, true);

        this.drawRange(this.getBounds(this.application.bio.currentDay, null, -self.drawing.visualRange / 3,-self.drawing.visualRange / 3));
    },

	onEndRender : function(){
        this.initVisual();
	},

    startMove : function(e){
        if (!this.drawing.isAnimating){
            this.drawing.isMoving = true;
            this.drawing.moveBasePosition = e.originalEvent.tapdown.clientX;
        } else {
            console.log('start move cancelled');
        }
    },

    stopMove : function(e){
        if (this.drawing.isMoving && !this.drawing.isAnimating){
            this.drawing.isMoving = false
            var shift = e.originalEvent.tapup.clientX - this.drawing.moveBasePosition;

            this.moveWrapper(shift, true);

            this.snapToDay(shift);
        } else {
            console.log('stop move cancelled');
        }
    },

    moveGraph : function(e){
        if (this.drawing.isMoving && !this.drawing.isAnimating){
            this.moveWrapper(this.drawing.wrapperPosition + (e.originalEvent.tapmove.clientX - this.drawing.moveBasePosition), false);
        } else {
            console.log('moving cancelled');
        }
    },

    snapToDay : function(diff){
        var dayWidth = this.drawing.visualDayWidth,
            backSwipeDelta = 30,
            side = diff > 0 ? 1 : -1,
            steps = Math.round((diff + side*backSwipeDelta) / dayWidth),
            next = steps * dayWidth,
            shift = (Math.abs(diff) > 10) ? (next - diff) : -diff;
        this.animateTo(shift, Math.abs(steps), diff);
    },

    swipeGraph : function(e){
        var directions = {
            'left' : -1,
            'right' : 1
        }, speed = 44;

        if (!this.drawing.isMoving){
            //this.startAnimation(speed * directions[e.originalEvent.swipe.direction]);

        }
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

    startAnimation : function(speed, limit, startPosition){
        console.log('start', this.drawing.wrapperPosition / 135);
        var self = this,
            diff = 0,
            side = speed;
        limit = limit || 1;
        startPosition = startPosition || 0;
        this.drawing.isMoving = true;

        self.drawing.currentAnimation = window.requestAnimationFrame(callback, null);
        function callback (){
            diff += speed;
            console.log(diff);

            //speed *= 0.8;
            if (Math.abs(diff) > 135 * limit) {
                self.stopAnimation();
                diff = (diff > 0 ? 135 : -135);
                self.moveWrapper(diff + startPosition, true);

                self.rearrangeDaysList(side);
                diff = 0;
            } else {
                self.moveWrapper(self.drawing.wrapperPosition + diff + startPosition, false);

                self.drawing.currentAnimation = window.requestAnimationFrame(callback, null);
            }
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

        function callback(){
            self.drawing.isAnimating = false;
            container
                .removeClass('animated')
                .off(eventName, callback);
            if (left/rearrangeSide > 0 || count >= 0){
                self.rearrangeDaysList(rearrangeSide, count);
            }
        }
    },

    stopAnimation : function(){
        console.log('stop');

        window.cancelAnimationFrame(this.drawing.currentAnimation);
        this.drawing.isMoving = false;
    },

    rearrangeDaysList : function(speed, count){
        console.log('rearrange');
        var side = speed > 0 ? 1 : -1,
	        list = this.drawing.list,
	        elem = null,
            count = count || 1,
	        dayWidth = this.drawing.visualDayWidth;

        for (var day = 0; day < count; day++){
            this.application.bio.currentDay -= side;

            if (side < 0) {
                elem = list.find('li:first').detach().appendTo(list);
            } else {
                elem = list.find('li:last').detach().prependTo(list);
            }
            this.prepareDay(side, elem);
            this.moveWrapper(-side*dayWidth, true);
        }

        var curr = this.application.bio.currentDay;

        this.publish('current_day_changed', {
            currentDay : curr
        });

//	    this.application.bio.currentDay -= side;
//	    var curr = this.application.bio.currentDay;
//	    this.publish('current_day_changed', {
//		    currentDay : curr
//	    });
//
//        if (side < 0) {
//	        elem = list.find('li:first').detach().appendTo(list);
//        } else {
//	        elem = list.find('li:last').detach().prependTo(list);
//        }
//	    this.prepareDay(side, elem);
//	    this.moveWrapper(-side*dayWidth, true);
    },

	prepareDay : function(side, elem){
        console.log(this.application.bio.currentDay);
		var redrawingDay;
		if (side < 0) {
			redrawingDay = this.application.bio.currentDay + this.drawing.visualRange - 2
		} else {
			redrawingDay = this.application.bio.currentDay - 1
		}

		var days = this.getBounds(redrawingDay, 1, -this.drawing.visualRange / 3 + 1, 0);
		this.drawOneDay(days, elem);
	},

    getBounds : function(current, range, offsetLeft, offsetRight){
        var birth = this.application.bio.birthDateTimestamp,
            middleDay = birth + current * 86400000,
            visualRange = range || this.drawing.visualRange,
	        offLeft = typeof offsetLeft === 'number' ? offsetLeft : -1,
	        offRight = typeof offsetRight === 'number' ? offsetRight : 1,
            res = [];
        for (var d= offLeft; d <= visualRange + offRight; d++) {
            res.push(this.application.bio.getBioForDay(new Date(middleDay + 86400000*d)));
        }

        return res;
    },

    drawRange : function(days, index){

        console.log(days.length);
        console.log(this.drawing.canvasArray.length);

        var canvas = null,
            context = null,
	        monthDay = null,
	        weekDay = null,
            colors = this.drawing.colors,
            halfHeight = this.drawing.canvasHalfHeight,
            visualDayWidth = this.drawing.visualDayWidth,
	        firstRedrawingDay = index || 0;

	    for (var i = firstRedrawingDay; i < days.length-1; i++) {

		    canvas = this.drawing.canvasArray[i];
		    context = this.drawing.contextArray[i];
		    monthDay = this.drawing.monthDayArray[i];
		    weekDay = this.drawing.weekDayArray[i];

		    context.clearRect(0, 0, canvas.width, canvas.height);
		    context.lineWidth = 4;

	        for (var bio = 0; bio < 3; bio++) {
		        context.beginPath();

			    var begX = 0;
			    var begY = halfHeight - days[i][bio]*(halfHeight-3);
			    var endX = canvas.width;
			    var endY = halfHeight - days[i+1][bio]*(halfHeight-3);

			    context.moveTo(begX, begY);
			    context.lineTo(endX, endY);

		        context.strokeStyle = colors[bio];
		        context.closePath();
		        context.stroke();
		    }

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];
	    }

    },

    drawOneDay : function(days, elem){
	    var canvas = elem.find('canvas'),
		    context = canvas[0].getContext('2d'),
		    monthDay = elem.find('.monthday'),
		    weekDay = elem.find('.weekday'),
		    colors = this.drawing.colors,
		    halfHeight = this.drawing.canvasHalfHeight,
		    visualDayWidth = this.drawing.visualDayWidth;

		    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
		    context.lineWidth = 2;

		    for (var bio = 0; bio < 3; bio++) {
			    context.beginPath();

			    var begX = 0;
			    var begY = halfHeight - days[0][bio]*(halfHeight-3);
			    var endX = canvas[0].width;
			    var endY = halfHeight - days[1][bio]*(halfHeight-3);

			    context.moveTo(begX, begY);
			    context.lineTo(endX, endY);

			    context.strokeStyle = colors[bio];
			    context.closePath();
			    context.stroke();
		    }

		    monthDay[0].innerHTML = days[0][3];
		    weekDay[0].innerHTML = days[0][4];
    },

    moveWrapper : function(transition, relativeToCurrent){
        var currentPosition = 0;
        if (relativeToCurrent) {
            currentPosition = this.drawing.wrapperPosition;
            this.drawing.wrapperPosition += transition;
        }
        var aniWrap = this.drawing.animationWrapper,
            initTransition = 'translate(' + (currentPosition + transition) + 'px)';

        aniWrap[0].style.webkitTransform = initTransition;
        aniWrap[0].style.transform = initTransition;
        aniWrap[0].style.oTransform = initTransition;
        aniWrap[0].style.msTransform = initTransition;
        aniWrap[0].style.mozTransform = initTransition;

    }
}));

RAD.view("view.graphV3", RAD.views.graphV3Base.extend({}));

