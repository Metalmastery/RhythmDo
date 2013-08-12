(function( $ ) {
    $.fn.tapNavigator = function(options) {

        var defaults = {
                navIconsCount : 3,
                bodyHeight : 0,
                bodyWidth : 0,
                navSize : 30,
                navDistance : 100,
		        arrangement : 'arc',    // TODO implement HORIZONTAL and VERTICAL line arrangement
		        gravity : 'hj',     // TODO implement LEFT, RIGHT, TOP, BOTTOM, CENTER
		        base : 'tap',           // TODO implement TAP, center
		        appearance : 'both',     // TODO implement POSITION, OPACITY, BOTH
		        navItemWidth : 60,
		        navItemHeight : 60,
		        navReactionDistance : 100,
		        navCss : {
			        width: 60,
			        height: 60,
			        borderRadius : 30,
			        background : '#ddd'
		        },
		        navHighlightCss : {
			        background : '#f45'
		        },
		        animateIcon : function(){}
            },
            self = this,
            timer = null,
	        mouseIsDown = false,
	        angleStep = 3 * Math.asin(2*defaults.navSize / ( 2 * (defaults.navDistance + defaults.navSize ))),
            pi = Math.PI,
            overlay = $('<div id="tapNavigatorOverlay"></div>'),
            navigator = $('<div id="tapNavigator"></div>'),
            currentPosition = [],
            navIcons = [],
            gridCellWidth = 0,
            gridCellHeight = 0;

        $.extend(defaults, options);

	    var arranger = {
		    arc : function(iconsArray, navigator){
			    var angles = orientateToCenter(),
				    xArray = [], yArray = [];

			    var angle = - angleStep * Math.floor(defaults.navIconsCount / 2);
			    for (var i = 0; i < defaults.navIconsCount; i++) {

				    var x = defaults.navDistance * Math.cos(angles - angle) - defaults.navSize;
				    var y = defaults.navDistance * Math.sin(angles - angle) - defaults.navSize;
				    setPosition(iconsArray[i][0], x, y);
				    xArray.push(x);
					yArray.push(y);
				    angle += angleStep;
			    }
			    navigator[0].width = Math.max.apply(null, xArray) - Math.min.apply(null, xArray) + defaults.navItemWidth;
			    navigator[0].height = Math.max.apply(null, yArray) - Math.min.apply(null, yArray) + defaults.navItemHeight;
		    },
		    horizontal : function(iconsArray, navigator){
				var halfWidth = iconsArray.length * defaults.navItemWidth / 2;
			    for (var i = 0; i<iconsArray.length; i++){
				    setPosition(iconsArray[i][0], i * defaults.navItemWidth - halfWidth, 0);
			    }
			    navigator[0].width = halfWidth * 2;
			    navigator[0].height = defaults.navItemHeight;
		    },
		    vertical : function(iconsArray, navigator){
			    var halfHeight = iconsArray.length * defaults.navItemHeight / 2;
			    for (var i = 0; i<iconsArray.length; i++){
				    setPosition(iconsArray[i][0], 0, i * defaults.navItemWidth - halfHeight - defaults.navItemHeight/2);
			    }
			    navigator[0].width = defaults.navItemWidth;
			    navigator[0].height = halfHeight * 2;
		    }
	    };

	    var gravitate = function(eventX, eventY){
	        var x = eventX, y = eventY;
		    switch (defaults.gravity) {
			    case 'center' :
				    x = defaults.bodyWidth / 2;
				    y = defaults.bodyHeight / 2;
				    break;
			    case 'left' :
				    x = 0;
				    break;
			    case 'right' :
				    x = defaults.bodyWidth;
				    break;
			    case 'top' :
				    y = 0;
				    break;
			    case 'bottom' :
				    y = defaults.bodyHeight;
				    break;
		    }
		    setPosition(navigator[0], x, y)
	    };

	    /* callbacks */
	    var animateIcon = defaults.animateIcon,
	        arrangeIcons = arranger[defaults.arrangement];
	    /* ========= */

        defaults.bodyHeight = $('body').height();
        defaults.bodyWidth = $('body').width();

        function _buildHTML (){
            console.log('created');
            overlay.appendTo('body').css({
                width : '100%',
                height : '100%',
	            opacity: 0.4,
	            background : '#000',
	            position : 'absolute',
	            top : 0,
	            left : 0,
	            'z-index' : 997,
	            display : 'none'
            });

            for (var i = 0; i < defaults.navIconsCount; i++) {
                navIcons[i] = $('<div class="navLink"></div>').css(defaults.navCss).appendTo(navigator);
	            defaultView(navIcons[i][0])
            }
            navigator.css({
                position: 'absolute',
                top : 0,
                display : 'none',
	            'z-index' : 998
            }).appendTo('body');
        }

        function checkTapPosition(){
            showNavLinks(cellX,cellY);

        }

        function showNavLinks(){
	        toggleOverlay(true);

	        arrangeIcons(navIcons, navigator);

	        gravitate(currentPosition[0], currentPosition[1]);

	        //setNavigatorPosition();

	        _animateIcons();
            navigator.show();
        }

        function setPosition (item, x, y) {
            item.style.position = 'absolute';
            var value = "translate3d(" + x + "px, " + y +  "px, 0) scale(1)";

            item.style.webkitTransform = value;
            item.style.transform = value;
            item.style.oTransform = value;
            item.style.msTransform = value;
            item.style.mozTransform = value;
	        item.posX = x;
	        item.posY = y;
        }

	    function fixNavigatorPosition(){

	    }

        function startTimer () {
            timer = setTimeout(showNavLinks, 300);
        }

        function stopTimer(){
            clearTimeout(timer);
        }

        function checkAngles(){

        }

	    function orientateToCenter(){
		    var xFromCenter = defaults.bodyWidth/2 - currentPosition[0];
		    var yFromCenter = defaults.bodyHeight/2 - currentPosition[1];
		    var atan = Math.atan2(yFromCenter, xFromCenter);
		    return atan;
	    }

	    function enableHighlight(item){
	        item.style['z-index'] = 999;
		    $(item).css(defaults.navHighlightCss)
	    }

	    function defaultView(item){
		    item.style['z-index'] = 998;
		    $(item).css(defaults.navCss)
	    }

	    function navigate(item){
	        console.log('navigate ' + $(item).index());
	    }

	    function toggleOverlay(factor){
		    if (factor) {
			    overlay[0].style.display = 'block'
		    } else {
			    overlay[0].style.display = 'none'
		    }
	    }

	    function _animateIcons(e){
		    var coord;
		    if (!e) {
			    coord = {
				    x : currentPosition[0],
				    y : currentPosition[1]
			    }
		    } else {
		        coord =  extractCoordinates(e, 'tapmove');
		    }

		    if (mouseIsDown) {
			    for (var i = 0; i < navIcons.length; i++) {
				    var mouseDistance = Math.sqrt(Math.pow(navIcons[i][0].posX + navigator[0].posX - coord.x + defaults.navItemWidth/2, 2) + Math.pow(navIcons[i][0].posY + navigator[0].posY - coord.y  + defaults.navItemHeight/2, 2));
//				    var initialDistance = Math.sqrt(Math.pow(navIcons[i][0].posX - currentPosition[0] + defaults.navItemWidth/2, 2) + Math.pow(navIcons[i][0].posY - currentPosition[1]  + defaults.navItemHeight/2, 2));
				    var initialDistance = defaults.navReactionDistance;
				    animateIcon(navIcons[i], mouseDistance/initialDistance);
			    }
		    }
	    }

	    function extractCoordinates(e, eventName) {
		    var x = e.originalEvent[eventName].clientX,
			    y = e.originalEvent[eventName].clientY;
		    return {x : x, y : y};
	    }

        _buildHTML();

        $('body').on('tapdown', function(e){
	        e.preventDefault();
	        mouseIsDown = true;
            currentPosition[0] = e.originalEvent.tapdown.clientX;
            currentPosition[1] = e.originalEvent.tapdown.clientY;

	        startTimer();
	        //showNavLinks();
            //checkTapPosition();

            console.log('start', e);
        }).on('tapup', function(e){
            navigator.hide();
		    mouseIsDown = false;
		    toggleOverlay(false);
            stopTimer();
            console.log('end', e);
        }).on('tapmove', function(e){
            //navigator.hide();
            stopTimer();
		    // TODO allow that small movements not causing timer stop
		    _animateIcons(e);
            console.log('move', e);
            var с = extractCoordinates(e, 'tapmove');
            if (document.elementFromPoint(с.x, с.y).className == 'navLink') {
                enableHighlight(document.elementFromPoint(с.x, с.y))
            } else {
                for (var i in navIcons){
                    defaultView(navIcons[i][0])
                }
            }
            console.log(document.elementFromPoint(с.x, с.y));
        });

        $('.navLink').on('tapmove', function(){
            console.log('NAV');
        })

    };

})(jQuery);

$.fn.tapNavigator({
	animateIcon : function (item, distancePercentage){
		var diff = (1 - distancePercentage) > 0 ? (1 - distancePercentage) : 0,
			value = Math.floor(60 + diff * 20 );

		item[0].style['margin'] = Math.floor(-diff * 10) + 'px 0 0 ' + Math.floor(-diff * 10) + 'px';


//		item[0].style['margin-top'] = -diff * 10 + 'px';
//		item[0].style['margin-left'] = -diff * 10 + 'px';
		item[0].style['width'] = value + 'px';
		item[0].style['height'] = value + 'px';

		item[0].style['opacity'] = 0.5 + diff;

		item.css({
			borderRadius: value/2
			//marginTop :  -diff * 10,
			//marginLeft :  -diff * 10,
//			with : value,
//			height : value,
//			opacity : 0.5 + diff
		})

	},
	navCss : {
		boxShadow : 'none',
		background: '#ccc'
	},
	navHighlightCss : {
		boxShadow : '0 0 20px rgba(230,240,250,0.5)',
		background: '#222'
	},
	navIconsCount: 5,
	arrangement: 'horizontal',
	navItemWidth: 70,
	navItemHeight: 70,
	gravity: 'center'
});