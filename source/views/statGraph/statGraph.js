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
        daysPosAbsolute : true
    },

    rearrangeDaysList : function(speed, count){
        var side = speed > 0 ? 1 : -1,
            list = this.drawing.list,
            elem = null,
            count = count || 1,
            dayWidth = this.drawing.visualDayWidth;


    },

    drawRange : function(days, index){
        console.log('STAT');
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
            context.lineWidth = 2;

            for (var bio = 0; bio < 3; bio++) {
                context.beginPath();

                var begX = 0,
                    begY = halfHeight - days[i][bio]*(halfHeight-3),
                    endX = canvas.width,
                    endY = halfHeight - days[i+1][bio]*(halfHeight-3),

                    diff = (begY - endY),
                    sideSign = begY > halfHeight ? 1 : -1;

                context.moveTo(begX, begY);
                context.quadraticCurveTo(begX + visualDayWidth/2, begY - diff / 2 + (Math.abs(diff) < 30 ? factor*sideSign : 1), endX, endY);

                context.strokeStyle = colors[bio];
                context.stroke();
            }

            monthDay.innerHTML = days[i][3];
            weekDay.innerHTML = days[i][4];
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