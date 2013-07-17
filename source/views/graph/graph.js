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
        'tapdown .graph_container' : 'stopGraph'

    },

    onEndRender : function(){
        window.test = this.$el;
        this.$el.find('canvas').attr({width : this.$el.width(), height : this.$el.height()});
        var self = this;
        var i = 0;
        var y = 0;
	    window.speed = 0;
        var callback = function(){
            y++;
			if (Math.abs(window.speed) > 1) {
				window.speed*=0.98;
			} else {
				window.speed = 0;
			}
            if (y>2) {
                i+=window.speed;
                self.draw(self.getBounds(new Date(2000, 5, 1, i), 3));
                y=0;
            }

            window.mozRequestAnimationFrame(callback);
        };
        window.mozRequestAnimationFrame(callback);

    },

    swipeGraph : function(e){

	    if (e.originalEvent.swipe.speed !== 'Infinity') window.speed = e.originalEvent.swipe.speed * 24 * (e.originalEvent.swipe.direction === 'right' ? -1 : 1);
     	/*function(t, b, c, d) {
		    var ts=(t/=d)*t;
		    var tc=ts*t;
		    return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
	    }*/
    },

	stopGraph : function(){
		if (window.speed) window.speed = 0;
	},

    draw : function(arr){
        var canvas = this.$el.find('canvas')[0];
        var context = canvas.getContext('2d');
        context.clearRect(0,0,canvas.width, canvas.height);
        //context.moveTo(0, 0);
        var colors = ['black', 'red', 'green'];
        context.lineWidth = 2;
        //context.lineTo(100, 100);
        for (var i = 0; i < 3; i++) {
            var begX = 0;
            var begY = canvas.height/2 - arr[i]*canvas.height/2;
            var endX = canvas.width;
            var endY = canvas.height/2 - arr[i+3]*canvas.height/2;
            context.beginPath();
            context.moveTo(begX, begY);
            context.bezierCurveTo(begX + begX/2, begY, endX - endX/2, endY, endX, endY);
            context.strokeStyle = colors[i];
            ///context.closePath();
            context.stroke();
        }

    },

    getBounds : function(middleDay, range){
        var birth = new Date(1989, 2, 1);
        var b = new Date();
        var dayLength = 86400000;
        middleDay = middleDay || b;
        var range = range || 5;
        var dates = [];
        dates.push(new Date(middleDay.getTime() - dayLength*range));
        dates.push(new Date(middleDay.getTime() + dayLength*range));
        var periods = [23, 28, 33];

        var res = [];

        for (var date in dates)
        {
            for (var per in periods){
                var days = (dates[date] - birth)/dayLength;
                res.push(Math.sin(2*Math.PI*days/periods[per]));
            }
        }

        return res;
    }

}));
