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
        moving : false
    },

    onEndRender : function(){

        var requestAF =  window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.requestAnimationFrame
            || function(callback){
                    setTimeout(callback, 16)
                };


        var canvas = this.$el.find('canvas').attr({width : this.$el.width(), height : this.$el.height()})[0];
        var self = this;

        //self.drawing.canvas = canvas;
        //self.drawing.context = canvas.getContext('2d');
        _(self.drawing).extend({
            canvas : canvas,
            context : canvas.getContext('2d'),
            canvasWidth : canvas.width,
            canvasHeight : canvas.height,
            visualRange : this.scrollBio.range * 2 + 1,
            visualDayWidth : canvas.width / (this.scrollBio.range * 2 + 1),
            canvasHalfHeight : canvas.height / 2

        });
        console.log(self.drawing);
        var y = 0;

        var visualRange = self.drawing.visualRange;
        var daysList = self.$el.find('ul');
        for (var key=0; key < self.drawing.visualRange + 1; key++){
            var li = $('<li/>').appendTo(daysList).css({
                'width' : self.drawing.visualDayWidth / 1.5 + 'px',
                'height' : self.drawing.canvasHalfHeight + 'px'
            });
        }
        self.list = daysList.find('li');


        var callback = function(){
            y++;
			if (Math.abs(self.scrollBio.scrollSpeed) > 1) {
                self.scrollBio.scrollSpeed *= 0.98;
			} else {
                self.scrollBio.scrollSpeed = 0;
            }

            if (y>2) {
                self.scrollBio.currentDay += self.scrollBio.scrollSpeed / 24;
                self.draw(self.getBounds(new Date(1989, 2, 1, self.scrollBio.currentDay * 24)));
                y=0;
            }

            requestAF(callback);
        };

        requestAF(callback);

    },

    swipeGraph : function(e){
        console.log(this.scrollBio);

        if (e.originalEvent.swipe.speed !== 'Infinity') this.scrollBio.scrollSpeed = e.originalEvent.swipe.speed * 30 * (e.originalEvent.swipe.direction === 'right' ? -1 : 1);
     	/*function(t, b, c, d) {
		    var ts=(t/=d)*t;
		    var tc=ts*t;
		    return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
	    }*/
    },

    moveGraph : function(e){
        if (this.moving) {
            this.scrollBio.currentDay = this.startCurrentDay - (e.originalEvent.tapmove.clientX - this.startX) / this.drawing.visualDayWidth;
        }
    },

	stopGraph : function(e){
		if (this.scrollBio.scrollSpeed) {
            this.scrollBio.scrollSpeed = 0;
        }

        this.moving = true;
        this.startX = e.originalEvent.tapdown.clientX;
        this.startCurrentDay = this.scrollBio.currentDay;

        console.log('tapdown');
	},

    toggleMove : function(){
        this.moving = false;
    },

    draw : function(arr){
        var canvas = this.drawing.canvas,
            context = this.drawing.context;

        context.clearRect(0,0,canvas.width, canvas.height);
        //context.font = "10pt Arial";
        var colors = ['blue', 'red', 'green'];

        var visualRange = this.drawing.visualRange
        var halfHeight = this.drawing.canvasHalfHeight;
        var visualDayWidth = this.drawing.visualDayWidth;

//        context.lineWidth = 3;
//
//        if (this.lastResult) {
//            for (var bio = 0; bio < 3; bio++) {
//                context.beginPath();
//                for (var i = 0; i < this.lastResult.length - 1; i++) {
//                    var obj = this.lastResult[i][bio];
//
//                    var begX = visualDayWidth * i;
//                    var begY = halfHeight - this.lastResult[i][bio]*halfHeight;
//                    var endX = (i+1) * visualDayWidth;
//                    var endY = halfHeight - this.lastResult[i+1][bio]*halfHeight;
//                    context.moveTo(begX, begY);
//                    //context.bezierCurveTo(begX + halfWidth, 5 + begY - 10 * arr[i+3], endX - halfHeight, 5 + endY - 10 * arr[i], endX, 5 + endY);
//                    context.lineTo(endX, endY);
//                }
//                context.strokeStyle = 'white';
//                context.closePath();
//                context.stroke();
//            }
//
//        }
        context.lineWidth = 2;


//      for (var i = 0; i < arr.length; i++) {
//            var begY = halfHeight - arr[i]*halfHeight + (arr[i]>0 ? 5 : -5);
//            var begX = 0;
//            var begY = halfHeight - arr[i]*halfHeight;
//            var endX = canvas.width;
//            var endY = halfHeight - arr[i+3]*halfHeight;
//            context.moveTo(begX, 5 + begY);
//            context.bezierCurveTo(begX + halfWidth, 5 + begY - 10 * arr[i+3], endX - halfHeight, 5 + endY - 10 * arr[i], endX, 5 + endY);
//
//        }

        for (var bio = 0; bio < 3; bio++) {
            context.beginPath();
            for (var i = 0; i < arr.length - 1; i++) {
                var obj = arr[i][bio];

                var begX = visualDayWidth * i;
                var begY = halfHeight - arr[i][bio]*halfHeight;
                var endX = (i+1) * visualDayWidth;
                var endY = halfHeight - arr[i+1][bio]*halfHeight;
                context.moveTo(begX, begY);
                //context.bezierCurveTo(begX + halfWidth, 5 + begY - 10 * arr[i+3], endX - halfHeight, 5 + endY - 10 * arr[i], endX, 5 + endY);
                context.lineTo(endX, endY);
            }
            context.strokeStyle = colors[bio];
            context.closePath();
            context.stroke();
        }


//        for (var i = 0; i < arr.length-1; i++) {
//            //console.log(arr[i]);
//
//            for (var bio = 0; bio<3; bio++) {
////              var begY = halfHeight - arr[i]*halfHeight + (arr[i]>0 ? 5 : -5);
//                context.beginPath();
//                var begX = visualDayLength * i;
//                var begY = halfHeight - arr[i][bio]*halfHeight;
//                var endX = (i+1) * visualDayLength;
//                var endY = halfHeight - arr[i+1][bio]*halfHeight;
//                context.moveTo(begX, begY);
//                //context.bezierCurveTo(begX + halfWidth, 5 + begY - 10 * arr[i+3], endX - halfHeight, 5 + endY - 10 * arr[i], endX, 5 + endY);
//                context.lineTo(endX, endY);
//                context.strokeStyle = colors[bio];
//                context.closePath();
//                context.stroke();
//            }
//
//        }
        //context.strokeStyle = 'rgba(50,50,50,1)';

        //context.beginPath();
        for (var days = 0; days<visualRange+1; days++) {
            var begin = canvas.width - (this.scrollBio.currentDay - Math.floor(this.scrollBio.currentDay)) * visualDayWidth;
//            context.moveTo(begin - days*visualDayWidth, 0);
//            context.lineTo(begin - days*visualDayWidth, canvas.height);
//            //context.fillText(Math.floor(this.scrollBio.currentDay - days + this.scrollBio.range + 1), begin - days*visualDayLength, 20);
            //this.list[days].style.left = begin - days*visualDayWidth + 'px';

            this.list[days].style['-webkit-transform'] = 'translate(' + (begin - days*visualDayWidth) + 'px)';

            this.list[days].innerHTML = Math.floor(this.scrollBio.currentDay - days + this.scrollBio.range + 1);

            //console.log(this.list[days].style.left);
        }
//        context.moveTo(0, halfHeight);
//        context.lineTo(canvas.width, halfHeight);
//        context.closePath();
//        context.strokeStyle = 'rgba(50,50,50,0.2)';
//        context.stroke();

//        for (var i = 0; i < 3; i++) {
//            var begX = 0;
//            var begY = halfHeight - arr[i]*halfHeight;
//            var endX = canvas.width;
//            var endY = halfHeight - arr[i+3]*halfHeight;
//
//            context.beginPath();
//            context.moveTo(begX, begY);
//            context.bezierCurveTo(begX + halfWidth, begY - 5 * arr[i+3], endX - halfHeight, endY - 5 * arr[i], endX, endY);
//            context.strokeStyle = colors[i];
//            ///context.closePath();
//            context.stroke();
//        }

        this.lastResult = arr;


    },

    getBounds : function(middleDay){
        var birth = new Date(1989, 2, 1);
        //var b = new Date();

        middleDay = middleDay || b;
        var range = this.scrollBio.range;
        var dates = [];
        var middleDayTimestamp = middleDay.getTime();
        for (var d=-this.scrollBio.range - 1; d<= this.scrollBio.range + 1; d++) {
            dates.push(new Date(middleDayTimestamp + this.scrollBio.dayLength*d));
        }
//        dates.push(new Date(middleDay.getTime() - this.scrollBio.dayLength*range));
//        dates.push(new Date(middleDay.getTime() + this.scrollBio.dayLength*range));
        var periods = [23, 28, 33];

        var res = [];

        for (var date in dates)
        {
            var day = [];
            ///console.log(dates[date] - birth);

            for (var per in periods){
                var d = (dates[date] - birth)/this.scrollBio.dayLength;
                day[per] = (Math.sin(2*Math.PI*d/periods[per]));
            }
            res.push(day);
        }
        //console.log(res.length);
        return res;
    },

    getDaysFromBirth : function(){
        var birth = new Date(1989, 2, 1);
        var currentDate = new Date();
        return (currentDate - birth)/this.scrollBio.dayLength;
    }

}));
