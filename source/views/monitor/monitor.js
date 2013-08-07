/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/31/13
 * Time: 12:05 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.monitor", RAD.Blanks.View.extend({
    url : 'source/views/monitor/monitor.html',

    currentDay : null,

    currentDayBio : null,

	drawing : {
		canvasArray : [],
		contextArray : [],
		cycleDayArray : [],
		cycleTrendArray : [],
		negativeArray : [],
		colors : ['#01d5be', '#f75d55', '#40b2e4'],
        bioCycles : [23, 28, 33],
		canvasWidth : 0,
		canvasHeight : 0,
        maxBioIndex : 0,
        radius : 0
	},

	currentBio : [0,0,0],

	animation : {
		now : null,
		lasTime : null,
		animID : null,
		destinationBio : [0,0,0],
		displayedBio : [0,0,0],
		circleDelta : 0.1,
		circleStep : 0.1,
        currentPulseRadius : 0,
        currentPulseOpacity : 1
	},

	onEndAttach : function(){
		var self = this;
		window.setInterval(function(){
			self.test();
		}, 3000);
	},

	test : function(){
		var testBio = [];
		for (var i = 0; i < 3; i++) {
			testBio[i] = Math.random() * 2 - 1;
		}

		this.startAnimation(testBio);
	},

	stepAnimation : function(){

	    var self = this,
		    diff,
		    diffSign,
            factor,
		    valChanged = false,
		    now = new Date().getTime(),
		    time =  (now - self.animation.lasTime) / 300,
		    destination = self.animation.destinationBio,
		    current = self.currentBio;

		self.animation.lasTime = now;

		for (var i = 0; i < destination.length; i++){
            factor = self.currentBio[i] / current[i];
			diff = current[i] - destination[i];
			diffSign = diff > 0 ? 1 : -1;
			if (current[i] !== destination[i]) {
				valChanged = true;
			}
			if (Math.abs(diff) > self.animation.circleDelta && factor > 0) {
				current[i] -= Math.min(self.animation.circleStep, time) * diffSign;
				//self.animation.animID = window.requestAnimationFrame(self.stepAnimation);
			} else {
				current[i] = destination[i];
			}
		}
		if (!valChanged){
			self.currentBio = current;
            self.drawing.maxBioIndex = self.currentBio.indexOf(Math.max.apply( Math, self.currentBio ));
			self.animation.lasTime = null;
		}

        for (var i = 0; i < 3; i++){
		    self.drawBio(current[i], i, false);
        }
		return valChanged;
	},

	startAnimation : function(destination){
		var self = this;
		self.animation.destinationBio = destination;

		function callback(){
                var res = self.stepAnimation();
                if (res) {
                    self.animation.animID = window.requestAnimationFrame(callback);
                } else {
                    self.stopAnimation(true);
                }

		}
		self.animation.animID = window.requestAnimationFrame(callback);
	},

    pulse : function(){
        var self = this,
            index = self.drawing.maxBioIndex,
            startRadius = self.drawing.radius,
            step = 0;
            self.animation.currentPulseRadius = self.drawing.radius;
            self.animation.currentPulseOpacity = 1;
            startRadiusDelta = 8;

        function callback(){
            step++;
            var easing = self.easingInBack(step, step, self.drawing.radius, -self.drawing.radius, 20);
            var res = self.stepPulseAnimation(index, easing);
            if (res && easing[0]) {
                self.animation.animID = window.requestAnimationFrame(callback);
            } else {
                self.stopAnimation();
            }

        }
        self.animation.animID = window.requestAnimationFrame(callback);
    },

    easingInBack : function(x, t, b, c, d){
//        if ((t/=d/2) < 0.8) return - c/3.5*t*t*t + b;
//        return c/2*((t-=2)*t*t + 2) + b;
        var value, phase;
        if (x < d){
            t /= d/3;
            if (t < 1) {
                phase = 1;
                value = -c/6*(t*t*t) + b;
            } else if (t < 2) {
                phase = 2;
                t -= 1;
                value = c/6*(t*t*t) + b;
            } else {
                phase = 3;
                t -= 3;
                value = -c/6*(t*t*t) + b;
            }
        } else {
            value = b;
            phase = null;
        }
        return [phase, value]
    },

    stepPulseAnimation : function(index, easing){
        var self = this,
            offset = 8,
            dashed = true,
            diff = self.animation.currentPulseRadius,
            diffSign = diff > 0 ? 1 : 0,
            now = new Date().getTime(),
            time =  (now - self.animation.lasTime) / 100,
            destinationRadius = 0,
            valChanged = false;

        switch (easing[0]) {
            case 1: {
                dashed = false;
                break;
            }
            case 2: {
                dashed = false;
                self.animation.currentPulseOpacity -= 0.3;
                break;
            }
            case 3: {
                dashed = true;
                self.animation.currentPulseOpacity += 0.3;
                break;
            }
        }
        self.animation.currentPulseRadius = easing[1];
        self.drawBio(self.currentBio[index], index, dashed, self.animation.currentPulseRadius, null, self.animation.currentPulseOpacity);

//        console.log(diff);
//        if (Math.abs(diff) > 2) {
//            //self.animation.currentPulseRadius -= Math.min(2, time) * diffSign;
//            if (diff < 70 ){
//                self.animation.currentPulseOpacity -= 0.3;
//            }
//            self.drawing.canvasArray[index].style.opacity = self.animation.currentPulseOpacity;
//            valChanged = true;
//        } else {
//            self.animation.currentPulseRadius = destinationRadius;
//        }
//        self.drawBio(self.currentBio[index], index, true, self.animation.currentPulseRadius, null, self.animation.currentPulseOpacity);
//
        return true;

    },

	stopAnimation : function(launnchPulse){
		var self = this;
		if (this.animation.animID) {
			window.cancelAnimationFrame(self.animation.animID)
		}
        if (launnchPulse){
            self.pulse();
        } else {
		    self.publish('monitor.ready', {});
        }
	},

	onEndRender : function(){
	    this.initMonitor();
	},

	initMonitor : function (){
		var height = this.$el.height();
		var width = this.$el.width();
		console.log(width, height);

		var canvasSize = Math.min(height, width/3, 200);

		this.drawing.canvasWidth = canvasSize;
		this.drawing.canvasHeight = canvasSize;

		this.drawing.lineWidth = Math.min(canvasSize / 10, 13);

		console.log(canvasSize);

		//		this.subscribe('monitor.ready', this.test, this);


		var self = this;
		var blocks = ['strength', 'emo', 'brain'];
		for (var i = 0; i<blocks.length; i++) {
			var block = self.$('.' + blocks[i]).css({
				height : self.drawing.canvasHeight,
				width : self.drawing.canvasWidth
			});
			var canvas = block.find('canvas').attr({
				height : self.drawing.canvasHeight,
				width : self.drawing.canvasWidth
			})[0];
			self.drawing.canvasArray.push(canvas);
			self.drawing.contextArray.push(canvas.getContext('2d'));
            canvas.getContext('2d').lineWidth = 14;
			self.drawing.cycleDayArray.push(block.find('.cycle_day')[0]);
			self.drawing.cycleTrendArray.push(block.find('.cycle_trend')[0]);
			self.drawing.negativeArray.push(block.find('.negative')[0]);
		}
        self.drawing.radius = self.drawing.canvasArray[0].width / 2 - this.drawing.lineWidth;

		self.$('.block_wrap').css({
			width : self.drawing.canvasWidth * 3
		});

		CanvasRenderingContext2D.prototype.dottedArc = function(x,y,radius,startAngle,endAngle,anticlockwise) {
			var g = 0.04, c = 0.01,  sa = startAngle, ea = startAngle + g;
			while(ea < endAngle + g + c) {
				this.beginPath();
				this.arc(x,y,radius,sa,ea,anticlockwise);
				this.stroke();
				sa = ea + g + c;
				ea = sa + g;
			}
		};

	},

    drawBio : function(value, index, dashed, radius, lineWidth, opacity){

        sign = value > 0 ? 1 : -1;

	    var sign,
		    context,
		    color,
		    self = this,
		    offset = - Math.PI / 2,
		    size = self.drawing.canvasArray[0].height,
		    lineWidth = this.drawing.lineWidth,
		    radius = radius || size/2 - lineWidth - 3,
//            lineWidth = lineWidth || 15,

		    opacity = opacity || 1;
//        roundValue = Math.abs(value ) * 2 * Math.PI;
        roundValue = (value + 1) * Math.PI;

        context = self.drawing.contextArray[index];
        color = self.drawing.colors[index];
        self.drawing.canvasArray[index].style.opacity = opacity;

        self.drawing.negativeArray[index].style.display = sign > 0 ? 'none' : 'block';

        context.clearRect(0,0, self.drawing.canvasWidth, self.drawing.canvasHeight);

        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.beginPath();
        if (typeof dashed != 'undefined') {
            if (dashed) {
                //context.setLineDash([2,3]);
               context.dottedArc(size/2, size/2, radius, offset, offset + roundValue /** sign, sign < 0*/);
            } else {
                context.arc(size/2, size/2, radius, offset, offset + roundValue /** sign, sign < 0*/);
            }
        }
        //console.log(context.getLineDash());

        context.stroke();
//	    }
    }
}));