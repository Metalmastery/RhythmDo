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

    getBioRange : function(startDay, endDay){
        var birth = this.application.bio.birthDateTimestamp,
            res = [];
        for (var d= startDay; d <= endDay; d++) {
            res.push(this.application.bio.getBioForDay(new Date(birth + 86400000*d)));
        }
        return res;
    },

    prepareGraphParts : function(width, height, lineWidth){

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
            offset = 3;

            canvas.width = width;
            canvas.height = height;

        for (var i = 0; i < periods.length; i++){
            for (var j = 0; j < periods[i]; j++){
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.lineWidth = 4;

                context.beginPath();

                var begX = 0;
                var begY = halfHeight - days[j][i]*(halfHeight-offset);
                var endX = canvas.width;
                var endY = halfHeight - days[j+1][i]*(halfHeight-offset);

                context.moveTo(begX, begY);
                context.lineTo(endX, endY);

                context.strokeStyle = colors[i];
                context.closePath();
                context.stroke();

                self.drawing.graphParts[i][j] = context.getImageData(0, 0, canvas.width, canvas.height);
            }
        }
        console.log(self.drawing.graphParts);
        var ct = $('li canvas').eq(50)[0].getContext('2d');


        ct.globalAlpha = 0.5;
        ct.putImageData(self.drawing.graphParts[2][0], 0, 0);
        ct.globalCompositeOperation = 'darker';
            ct.putImageData(self.drawing.graphParts[1][3], 0, 0);
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

        for (var i = firstRedrawingDay; i < days.length-1; i++) {

            canvas = this.drawing.canvasArray[i];
            context = this.drawing.contextArray[i];
            monthDay = this.drawing.monthDayArray[i];
            weekDay = this.drawing.weekDayArray[i];


            context.clearRect(0, 0, canvas.width, canvas.height);
            context.lineWidth = 5;
            context.lineCap = 'square';

            for (var bio = 0; bio < 3; bio++) {
                context.beginPath();

                var begX = 0,
                    begY = halfHeight - days[i][bio]*(halfHeight-10),
                    endX = canvas.width,
                    endY = halfHeight - days[i+1][bio]*(halfHeight-10),

                    diff = (begY - endY),
                    sideSign = begY > halfHeight ? 1 : -1;

                context.moveTo(begX, begY);
                context.quadraticCurveTo(begX + visualDayWidth/2, begY - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), endX, endY);
                // TODO completely fix the smoothing of curve & edges matching
                context.strokeStyle = colors[bio];
                context.stroke();
            }

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];
        }
        this.prepareGraphParts(this.drawing.visualDayWidth, this.drawing.canvasHalfHeight);
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