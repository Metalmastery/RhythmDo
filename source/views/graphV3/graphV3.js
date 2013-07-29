/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.graphV3", RAD.Blanks.View.extend({
    url : 'source/views/graphV3/graphV3.html',

    events : {
        'swipe .graph_container' : 'swipeGraph',
        'tapmove .graph_container' : 'moveGraph',
        'tapdown .graph_container' : 'stopGraph',
        'tapup .graph_container' : 'toggleMove'
    },

    drawing : {
        colors : ['#40b2e4', '#f75d55', '#01d5be'],
        visualDayWidth: 135,
        wrapperPosition : 0,
	    canvasArray : [],
	    contextArray : [],
	    monthDayArray : [],
	    weekDayArray : [],
	    canvasHeight : 100
    },

	onEndRender : function(){
		var visualRange = Math.round(this.$el.width() / this.drawing.visualDayWidth) + 3,
			aniWrap = this.$('.animationWrap');


		_(this.drawing).extend({
			canvasWidth : this.drawing.visualDayWidth,
			canvasHeight : this.drawing.canvasHeight,
			visualRange : visualRange,
			canvasHalfHeight : this.drawing.canvasHeight / 2,
			requestAF : window.requestAnimationFrame,
			cancelAF : window.cancelAnimationFrame,
			currentAnimation : null,
			animationWrapper : aniWrap
		});

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
				margin : 0,
				padding: '0 4px'
			});
			listSize += self.drawing.visualDayWidth;
			var canvas = li.find('canvas').attr({
					width : self.drawing.visualDayWidth,
					height: 100
				}).css({
					position: 'absolute',
					top : 0
				});
			self.drawing.canvasArray.push(canvas[0]);
			self.drawing.contextArray.push(canvas[0].getContext('2d'));
			self.drawing.monthDayArray.push(li.find('.monthday')[0]);
			self.drawing.weekDayArray.push(li.find('.weekday')[0]);

		}
		dayLi.remove();
		daysList[0].style.width = listSize + 'px';

		this.drawing.list = daysList;

		this.moveWrapper(-self.drawing.visualDayWidth, true);

		this.drawRange(this.getBounds(this.application.bio.currentDay));
	},

    swipeGraph : function(e){
        var directions = {
            'left' : -1,
            'right' : 1
        }, speed = e.originalEvent.swipe.speed < 0 ? 20 : 20;

        this.startAnimation(speed * directions[e.originalEvent.swipe.direction]);
    },

    onInitialize : function(){
        var vendors = ['ms', 'moz', 'webkit', 'o'];
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
    },

    startAnimation : function(speed, limit){
        var self = this,
            diff = 0;
        limit = limit || 1;

        self.drawing.currentAnimation = window.requestAnimationFrame(callback, null);
        function callback (){
            diff += speed;

            if (Math.abs(diff) > 135 * limit) {
                self.stopAnimation();
                diff = (diff > 0 ? 135 : -135);
                self.moveWrapper(diff, true);

                self.rearrangeDaysList(speed);
                diff = 0;
            } else {
                self.moveWrapper(self.drawing.wrapperPosition + diff, false);

                self.drawing.currentAnimation = window.requestAnimationFrame(callback, null);
            }
        }
    },

    stopAnimation : function(){
        window.cancelAnimationFrame(this.drawing.currentAnimation);
    },

    rearrangeDaysList : function(speed){
        var side = speed > 0 ? 1 : -1,
	        list = this.drawing.list,
	        elem = null,
	        dayWidth = this.drawing.visualDayWidth;

	    this.application.bio.currentDay -= side;
	    var curr = this.application.bio.currentDay;
	    this.publish('current_day_changed', {
		    currentDay : curr
	    });

        if (side < 0) {
	        elem = list.find('li:first').detach().appendTo(list);
        } else {
	        elem = list.find('li:last').detach().prependTo(list);
        }
	    this.prepareDay(side, elem);
	    this.moveWrapper(-side*dayWidth, true);
    },

	prepareDay : function(side, elem){
		var redrawingDay;
		if (side < 0) {
			redrawingDay = this.application.bio.currentDay + this.drawing.visualRange - 2
		} else {
			redrawingDay = this.application.bio.currentDay - 1
		}

		var days = this.getBounds(redrawingDay, 1, 0, 0);
		this.drawOneDay(days, elem);
	},

    toggleMoving : function(){

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

        var canvas = null,
            context = null,
	        monthDay = null,
	        weekDay = null,
            colors = this.drawing.colors,
            halfHeight = this.drawing.canvasHalfHeight,
            visualDayWidth = this.drawing.visualDayWidth,
	        firstRedrawingDay = index || 0,
            self = this;

	    for (var i = firstRedrawingDay; i < days.length-3; i++) {

		    canvas = this.drawing.canvasArray[i]
		    context = this.drawing.contextArray[i];
		    monthDay = this.drawing.monthDayArray[i];
		    weekDay = this.drawing.weekDayArray[i];

		    context.clearRect(0, 0, canvas.width, canvas.height);
		    context.lineWidth = 2;

	        for (var bio = 0; bio < 3; bio++) {
		        context.beginPath();

			    var begX = 0;
			    var begY = halfHeight - days[i][bio]*(halfHeight-3);
			    var endX = visualDayWidth;
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

	        window.canvas = canvas

		    for (var bio = 0; bio < 3; bio++) {
			    context.beginPath();

			    var begX = 0;
			    var begY = halfHeight - days[0][bio]*(halfHeight-3);
			    var endX = visualDayWidth;
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

