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

    drawing: {
        canvasWidth : 38,
        canvasHeight : 300,
        canvasHalfHeight : 150,
        visualDayWidth : 38,
        daysMargin : 2,
        daysPosAbsolute : true,
        graphParts : [[],[],[]]
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

    drawOneDay : function(dayFromBirth, canvas){

        var self = this,
            bounds = null,
            cycleDay,
            diff,
            sideSign,
            factor = 2,
            periods = [23, 28, 33],
            context = canvas.getContext('2d'),
            width = 38,
            height = 120,
            lineWidth = 10;

        context.clearRect(0,0,canvas.width, canvas.height);
        context.lineWidth = lineWidth;
        context.lineCap = 'square';

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

        for (var i = firstRedrawingDay; i < days.length-1; i++) {

            canvas = this.drawing.canvasArray[i];
            context = this.drawing.contextArray[i];
            monthDay = this.drawing.monthDayArray[i];
            weekDay = this.drawing.weekDayArray[i];


//            context.clearRect(0, 0, canvas.width, canvas.height);
//            context.lineWidth = 5;
//            context.lineCap = 'square';
//
//            for (var bio = 0; bio < 3; bio++) {
//                context.beginPath();
//
//                var begX = 0,
//                    begY = halfHeight - days[i][bio]*(halfHeight-10),
//                    endX = canvas.width,
//                    endY = halfHeight - days[i+1][bio]*(halfHeight-10),
//
//                    diff = (begY - endY),
//                    sideSign = begY > halfHeight ? 1 : -1;
//
//                context.moveTo(begX, begY);
//                context.quadraticCurveTo(begX + visualDayWidth/2, begY - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), endX, endY);
//                // TODO completely fix the smoothing of curve & edges matching
//                context.strokeStyle = colors[bio];
//                context.stroke();
//            }
//

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];

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