/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.graph", RAD.Blanks.View.extend({
    url : 'source/views/graph/graph.html',

    events : {
        'swipe .graph_container' : 'swipeGraph',
        'tapmove .graph_container' : 'moveGraph',
        'tapdown .graph_container' : 'stopGraph',
        'tapup .graph_container' : 'toggleMove'


    },

    onInitialize : function(){
        this.scrollBio.daysFromBirth = this.getDaysFromBirth();
        this.scrollBio.currentDay = this.scrollBio.daysFromBirth;
        this.scrollBio.range = 2;

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

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    },

    scrollBio : {
        dayLength : 86400000,
        currentDay : 0,
        scrollSpeed : 0,
        range : 0
    },

    drawing : {
        canvas : null,
        context : null,
        moving : false,
        colors : ['#40b2e4', '#f75d55', '#01d5be'],
        visualDayWidth: 135
    },

    lastResult : null,

    onEndRender : function(){

        var canvas = this.$el.find('canvas').attr({width : this.$el.width(), height : this.$el.height()/2})[0],
            self = this;

        this.scrollBio.range = canvas.width / this.drawing.visualDayWidth / 2;

        _(self.drawing).extend({
            canvas : canvas,
            context : canvas.getContext('2d'),
            canvasWidth : canvas.width,
            canvasHeight : canvas.height,
            visualRange : this.scrollBio.range * 2,
            canvasHalfHeight : canvas.height / 2,
            requestAF : window.requestAnimationFrame,
            cancelAF : window.cancelAnimationFrame,
            currentAnimation : null
        });

        var daysList = self.$el.find('ul.days'),
            dayLi = daysList.find('li').css({
                'width' : (self.drawing.visualDayWidth-8) + 'px'
            }),
            daysPointer = self.$el.find('#days_pointer').css({
                top : daysList.eq(-2).css('top'),
                left : daysList.eq(-2).css('left')
            })[0];


        for (var key=0; key < self.drawing.visualRange; key++){
            var li = dayLi.clone().appendTo(daysList);
        }

        daysPointer.style.width = (self.drawing.visualDayWidth - 8) + 'px';

        self.list = daysList.find('li');
        self.pointer = daysPointer;

        self.scrollBio.currentDay = Math.floor(self.scrollBio.currentDay);
        self.lastDay = self.scrollBio.currentDay;

        this.draw(this.getBounds(this.scrollBio.currentDay));
        this.pointer.style.left = this.list[this.list.length - 2].getClientRects()[0]['left'] + 'px';
        //window.elem = this.list[this.list.length - 4];

    },

    animationStart : function(){
        var self = this;
        self.drawing.currentAnimation = window.requestAnimationFrame(callback, null);
        function callback (){
//          if (Math.abs(self.scrollBio.scrollSpeed) > 1) {
//                self.scrollBio.scrollSpeed *= 0.97;
//			} else {
//                self.scrollBio.scrollSpeed = 0;
//          }

            console.log('callback');

            self.scrollBio.currentDay += self.scrollBio.scrollSpeed / 24;

            if (Math.abs(self.scrollBio.currentDay - self.lastDay) > 1) {
                self.scrollBio.currentDay = (self.scrollBio.scrollSpeed > 0 ? Math.floor(self.scrollBio.currentDay) : Math.round(self.scrollBio.currentDay));
                self.application.currentDay = self.scrollBio.currentDay
                self.scrollBio.scrollSpeed = 0;
                self.animationStop();
                self.lastDay = self.scrollBio.currentDay;
            } else {
                //self.draw(self.getBounds(self.scrollBio.currentDay));

                self.drawing.currentAnimation = window.requestAnimationFrame(callback);
            }
            self.draw(self.getBounds(self.scrollBio.currentDay));
        }

    },

    animationStop : function(){
        window.cancelAnimationFrame(this.drawing.currentAnimation);
        var curr = this.application.currentDay;
        this.publish('view.group_today', {
            extras : {
                filter : function(item){
                    return ((new Date(item.date).getDate()) === (new Date(1989, 2, curr).getDate()));
                }
            }
        });
    },

    swipeGraph : function(e){
        //if (e.originalEvent.swipe.speed !== 'Infinity') {
            this.scrollBio.scrollSpeed = 10 * (e.originalEvent.swipe.direction === 'right' ? -1 : 1);
            this.animationStart();
        //}
        //this.scrollBio.currentDay += (e.originalEvent.swipe.direction === 'right' ? -1 : 1);
    },

    moveGraph : function(e){
        if (this.moving) {
            //this.scrollBio.currentDay = this.startCurrentDay - (e.originalEvent.tapmove.clientX - this.startX) / this.drawing.visualDayWidth;
        }
    },

	stopGraph : function(e){
		if (this.scrollBio.scrollSpeed) {
            this.scrollBio.scrollSpeed = 0;
        }

        this.moving = true;
        this.startX = e.originalEvent.tapdown.clientX;
        this.startCurrentDay = this.scrollBio.currentDay;
	},

    toggleMove : function(){
        this.moving = false;
    },

    draw : function(arr){
        var canvas = this.drawing.canvas,
            context = this.drawing.context,
            colors = this.drawing.colors,
            visualRange = this.drawing.visualRange,
            halfHeight = this.drawing.canvasHalfHeight,
            visualDayWidth = this.drawing.visualDayWidth,
            firstRedrawingDay = 0,
            lastRedrawingDay = arr.length;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 2;

        for (var bio = 0; bio < 3; bio++) {
            context.beginPath();

            for (var i = firstRedrawingDay; i < lastRedrawingDay-1; i++) {
                var begX = visualDayWidth * i;
                var begY = halfHeight - arr[i][bio]*halfHeight;
                var endX = (i+1) * visualDayWidth;
                var endY = halfHeight - arr[i+1][bio]*halfHeight;
                context.moveTo(begX, begY);
                context.lineTo(endX, endY);
            }
            context.strokeStyle = colors[bio];
            context.closePath();
            context.stroke();
        }


        //for (var days = 0; days<visualRange+1; days++) {
        for (var days = 0; days<arr.length-1; days++) {
            var begin = canvas.width - (this.scrollBio.currentDay - Math.floor(this.scrollBio.currentDay)) * visualDayWidth,
                value= 'translate(' + (begin - days * visualDayWidth) + 'px)';

            this.list[days].style.webkitTransform = value;
            this.list[days].style.transform = value;
            this.list[days].style.oTransform = value;
            this.list[days].style.msTransform = value;
            this.list[days].style.mozTransform = value;
            //this.list[days].data_coord = begin - days * visualDayWidth;

//            if (this.list[0].data_coord == canvas.width) {
//                console.log('jump');
//
//            }
//
            this.list.eq(arr.length - days - 2).find('.monthday').text(arr[days] ? arr[days][3] : '');
            this.list.eq(arr.length - days - 2).find('.weekday').text(arr[days] ? arr[days][4] : '');
            //this.list.eq(days).find('.weekday').text(new Date(1989, 2, 1, (this.scrollBio.currentDay-days) * 24).getDay()); //a.toLocaleFormat('%a')


            //this.list[days].innerHTML = Math.floor(this.scrollBio.currentDay - days + this.scrollBio.range + 1);

            //context.moveTo(begin - days * visualDayWidth, 0);
            //context.fillText(arr[visualRange-days][3].toLocaleFormat('%a'), begin - days * visualDayWidth, 30);
//            //context.bezierCurveTo(begX + halfWidth, 5 + begY - 10 * arr[i+3], endX - halfHeight, 5 + endY - 10 * arr[i], endX, 5 + endY);
//            context.lineTo(begin - days * visualDayWidth, 100);
        }
    },

    getBounds : function(current){
        var birth = new Date(1989, 2, 1),
            middleDay = new Date (1989, 2, 1, current * 24);

        //var b = new Date();

        middleDay = middleDay || b;
        var range = this.scrollBio.range;
        var dates = [];
        var middleDayTimestamp = middleDay.getTime();
//        for (var d=-this.scrollBio.range - 1; d<= this.scrollBio.range + 1; d++) {
        for (var d= - 1; d<= this.scrollBio.range*2 + 1; d++) {
            dates.push(new Date(middleDayTimestamp + this.scrollBio.dayLength*d));
            //dates.push(new Date(1989, 2, middleDay));
        }
//        dates.push(new Date(middleDay.getTime() - this.scrollBio.dayLength*range));
//        dates.push(new Date(middleDay.getTime() + this.scrollBio.dayLength*range));
        var periods = [23, 28, 33];

        var res = [];

        for (var date in dates)
        {
            var day = [];

            for (var per in periods){
                var d = (dates[date] - birth)/this.scrollBio.dayLength;
                day[per] = (Math.sin(2*Math.PI*d/periods[per]));
            }
            day[3] = dates[date].getDate();
            day[4] = dates[date].toDateString().split(' ')[0];
            res.push(day);
        }
        return res;
    },

    getDaysFromBirth : function(){
        var birth = new Date(1989, 2, 1);
        var currentDate = new Date();
        return (currentDate - birth)/this.scrollBio.dayLength;
    }

}));

