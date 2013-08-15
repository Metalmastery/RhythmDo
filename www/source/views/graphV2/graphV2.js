/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 2:15 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.graphV2", RAD.Blanks.View.extend({
    url : 'source/views/graphV2/graphV2.html',

    events : {
        'swipe .graph_container' : 'swipeGraph',
        'tapmove .graph_container' : 'moveGraph',
        'tapdown .graph_container' : 'stopGraph',
        'tapup .graph_container' : 'toggleMove'
    },

    drawing : {
        colors : ['#40b2e4', '#f75d55', '#01d5be'],
        visualDayWidth: 135,
        wrapperPosition : 0
    },

    swipeGraph : function(e){
        var directions = {
            'left' : -1,
            'right' : 1
        }, speed = e.originalEvent.swipe.speed < 0 ? 20 : 20;

        console.log(e.originalEvent.swipe.direction);


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
        console.log(speed);

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
        var side = speed > 0 ? 1 : -1;
        console.log(this.drawing.listItems.first());

        this.application.bio.currentDay -= side;
        this.moveWrapper(-side*135, true);
        this.drawRange(this.getBounds(this.application.bio.currentDay));
//        if (side < 0) {
//            this.drawing.list.find('li:first').detach().appendTo(this.drawing.list);
//        } else {
//            this.drawing.list.find('li:last').detach().appendTo(this.drawing.list);
//        }

    },

    toggleMoving : function(){

    },

    getBounds : function(current){
        var birth = this.application.bio.birthDate,
            middleDay = (new Date(birth)).setDate(current),
            range = this.drawing.visualRange,
            res = [];

        for (var d= - 2; d<= range + 2; d++) {
            res.push(this.application.bio.getBioForDay(new Date(middleDay + 86400000*d)));
        }

        return res;
    },

    drawRange : function(days){

        var canvas = this.drawing.canvas,
            context = this.drawing.context,
            colors = this.drawing.colors,
            halfHeight = this.drawing.canvasHalfHeight,
            visualDayWidth = this.drawing.visualDayWidth,
            self = this;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 2;

        for (var bio = 0; bio < 3; bio++) {
            context.beginPath();

            for (var i = 0; i < days.length-1; i++) {
                var begX = visualDayWidth * i;
                var begY = halfHeight - days[i][bio]*(halfHeight-3);
                var endX = (i+1) * visualDayWidth;
                var endY = halfHeight - days[i+1][bio]*(halfHeight-3);

                context.moveTo(begX, begY);
                context.lineTo(endX, endY);
            }
            context.strokeStyle = colors[bio];
            context.closePath();
            context.stroke();
        }

        this.drawing.list.find('li').each(function(index, el){
            self.$(el).find('.monthday').text(days[index][3]);
            self.$(el).find('.weekday').text(days[index][4]);
        })
    },
    drawOneDay : function(){

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
    },

    onEndRender : function(){
        var canvas = this.$el.find('canvas')[0],
            visualRange = Math.round(this.$el.width() / this.drawing.visualDayWidth) + 3,
            aniWrap = this.$('.animationWrap');

        canvas.width = visualRange * this.drawing.visualDayWidth - 8; /* right margin of the LI */
        canvas.height = this.$el.height()/2;

        _(this.drawing).extend({
            canvas : canvas,
            context : canvas.getContext('2d'),
            canvasWidth : canvas.width,
            canvasHeight : canvas.height,
            visualRange : visualRange,
            canvasHalfHeight : canvas.height / 2,
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
            var li = dayLi.clone().appendTo(daysList);
            listSize += self.drawing.visualDayWidth;
        }
        dayLi.remove();
        daysList[0].style.width = listSize + 'px';
        this.drawing.list = daysList;
        this.drawing.listItems = daysList.find('li');


        this.moveWrapper(-self.drawing.visualDayWidth, true);

        this.drawRange(this.getBounds(this.application.bio.currentDay));
    }


}));

