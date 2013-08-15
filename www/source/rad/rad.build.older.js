(function (document, window) {
    'use strict';
    var core, register, defaultOptions = {
        defaultBackstack: false,
        defaultAnimation: 'slide',
        animationTimeout: 3000,
        debug: false
    };

    function execute(func, args, context) {
        if (typeof func !== "function") {
            return;
        }
        if (context && context instanceof Object) {
            func.apply(context, args);
        } else {
            func(args);
        }
    }

    //mediator
    function Mediator(core) {
        var channels = {},
            subscribe = function (channel, fn, context) {
                var id = context.viewID;

                if (!channels[channel]) {
                    channels[channel] = [];
                }
                channels[channel].push({ context: context || this, callback: fn, ID: id});

                if (core.options.debug) {
                    window.console.log(id + " subscribe to channel:" + channel, arguments);
                }
                return this;
            },

            buildName = function (parts, index) {
                var name = parts[0],
                    i;
                for (i = 1; i <= index; i += 1) {
                    name = name + '.' + parts[i];
                }

                return name;
            },

            publish = function (channel) {
                var index,
                    i,
                    l,
                    length,
                    subscription,
                    receiver,
                    parts = channel.split('.'),
                    currentChannel;

                if (!RAD.core.isInitialize) {
                    RAD.core.initialize();
                }

                //prepare View if it needed
                (function (view, data) {
                    var viewID;
                    if ((parts[0] !== 'view') && (parts[0] !== 'service')) {
                        return;
                    }
                    if ((!data || !data.autocreate) && (parts[0] === 'view')) {
                        return;
                    }

                    viewID = parts[0] + '.' + parts[1];
                    core.getView(viewID, core.extractExtras(data));
                }(channel, arguments[1]));

                if (core.options.debug) {
                    window.console.log("publish:", arguments);
                }

                for (index = 0, length = parts.length; index < length; index += 1) {
                    currentChannel = buildName(parts, index);

                    if (channels[currentChannel]) {
                        for (i = 0, l = channels[currentChannel].length; i < l; i += 1) {
                            subscription = channels[currentChannel][i];
                            subscription.callback.apply(subscription.context, arguments);
                            if (core.options.debug) {
                                receiver = subscription.context.options || subscription.context;
                                window.console.log("receiver:" + receiver.viewID + " channel:" + currentChannel, arguments);
                            }
                        }
                    }
                }
            },

            unsubscribe = function (channel, context) {
                var m,
                    i,
                    length,
                    id;

                if (!context) {
                    return this;
                }

                id = context.viewID;
                for (m in channels) {
                    if (channels.hasOwnProperty(m)) {
                        for (i = channels[m].length - 1, length = 0; i >= length; i -= 1) {
                            if ((channel === null || channel === m) && channels[m][i].ID === id) {
                                if (core.options.debug) {
                                    window.console.log(id + " unsubscribe from channel:" + m, arguments);
                                }
                                channels[m].splice(i, 1);
                                if (channel) {
                                    return this;
                                }
                            }
                        }
                    }
                }
                return this;
            };

        return {
            channels: function () {
                return channels;
            },
            publish: publish,
            subscribe: subscribe,
            unsubscribe: unsubscribe
        };
    }

    // core
    function Core($, document, window) {
        var self = this,
            app = {},
            viewData = {},
            mediator = new Mediator(self);

        self.options = defaultOptions;

        //work with views
        self.register = function (viewID, creator) {
            if (viewData[viewID] === undefined) {
                viewData[viewID] = {
                    creator: creator,
                    instance: null
                };
            } else {
                window.console.log('You try register already registered module:' + viewID + '!');
            }
        };

        self.registerAll = function (arrayOfViews) {
            var index, length, options, viewID;

            for (index = 0, length = arrayOfViews.length; index < length; index += 1) {
                options = arrayOfViews[index];
                for (viewID in options) {
                    if (options.hasOwnProperty(viewID)) {
                        self.register(viewID, options[viewID]);
                    }
                }
            }
        };

        self.startViewOrService = function (viewID, extras) {
            var Creator,
                view = viewData[viewID].instance;
            if (view === null || view === undefined) {
                Creator = viewData[viewID].creator;

                if (typeof Creator !== "function") {
                    window.console.log("Sorry, but " + viewID + " wasn't registered!");
                    return;
                }

                viewData[viewID].instance = new Creator({
                    core: self,
                    application: app,
                    viewID: viewID,
                    extras: extras
                });

                if (this.options.debug) {
                    window.console.log("create: " + viewID + " with extras:", extras);
                }
            }
        };

        self.startPlugin = function (viewID) {
            var view = viewData[viewID].instance;
            if (view === null || view === undefined) {
                viewData[viewID].instance = viewData[viewID].creator(this, viewID);
            }
            if (this.options.debug) {
                window.console.log("start plugin:", viewID);
            }
        };

        self.stop = function (viewID, callback, context) {
            var data = viewData[viewID],
                view,
                length,
                index,
                instance;
            if (data && data.instance) {
                instance = data.instance;
                if (instance instanceof RAD.Blanks.View) {
                    instance.unbindModel();
                }

                if (instance.children) {
                    for (index = 0, length = instance.children.length; index < length; index += 1) {
                        self.stop(instance.children[index].content, null);
                    }
                }

                window.setTimeout(function () {
                    view = viewData[viewID].instance;
                    if (!view) {
                        return;
                    }
                    mediator.unsubscribe(null, view);

                    view.destroy();
                    viewData[viewID].instance = null;

                    execute(callback, null, context);
                    if (self.options.debug) {
                        window.console.log("destroy:" + viewID);
                    }
                }, 0);
            }
        };

        self.startAll = function () {
            var viewID, parts;
            for (viewID in viewData) {
                if (viewData.hasOwnProperty(viewID)) {
                    parts = viewID.split('.');
                    if (parts[0] === 'plugin') {
                        this.startPlugin(viewID);
                    } else {
                        this.startViewOrService(viewID);
                    }
                }
            }
        };

        self.stopAll = function () {
            var viewID;
            for (viewID in viewData) {
                if (viewData.hasOwnProperty(viewID)) {
                    this.stop(viewID);
                }
            }
        };

        self.extractExtras = function (data) {
            try {
                return data.extras;
            } catch (err) {
                return null;
            }
        };

        self.getView = function (viewID, extras) {
            var view;

            if (!viewID) { return null; }
            try {
                view = viewData[viewID].instance;
            } catch (err) {
                window.console.log('Error - not register view:' + viewID, err);
                return null;
            }
            if (view === null || view === undefined) {
                self.startViewOrService(viewID, extras);
            } else if (extras) {
                try {
                    view.setExtras(extras);
                } catch (e) {
                    window.console.log(e);
                }
            }

            return viewData[viewID].instance;
        };

        self.getService = self.getView;

        self.initialize = function (application, options) {
            var viewID, parts;

            app = application || app;

            if (options) {
                self.options = options;
            }
            if (self.options.plugins && window.RAD.utils.isArray(self.options.plugins)) {
                self.registerAll(self.options.plugins);
            }

            if (window.RAD && typeof window.RAD.prepareEnvironment === 'function') {
                window.RAD.prepareEnvironment();
            }

            for (viewID in viewData) {
                if (viewData.hasOwnProperty(viewID)) {
                    parts = viewID.split('.');
                    if (parts[0] === 'plugin') {
                        this.startPlugin(viewID);
                    }
                }
            }

            this.isInitialize = true;
        };

        self.getStartedViews = function () {
            var viewID, result = [];
            for (viewID in viewData) {
                if (viewData.hasOwnProperty(viewID) && viewData[viewID].instance) {
                    result.push(viewID);
                }
            }
            return result;
        };

        //work with events
        self.document = document;
        self.window = window;
        self.$ = $;
        self.subscribe = mediator.subscribe;
        self.publish = mediator.publish;
        self.channels = mediator.channels;
        self.unsubscribe = mediator.unsubscribe;

        return self;
    }

    core = new Core(window.jQuery, document, window);
    register = function (id, fabric) {
        var i, l;
        if (window.RAD.utils.isArray(id)) {
            for (i = 0, l = id.length; i < l; i += 1) {
                core.register(id[i], fabric);
            }
        } else {
            core.register(id, fabric);
        }
    };

    function modelMethod(modelID, model, instantiate) {
        var parts = modelID.split('.'),
            parent = window.RAD.models,
            pl,
            i;
        pl = parts.length;
        for (i = 0; i < pl; i += 1) {
            if (parent[parts[i]] === undefined) {
                if (i === pl - 1) {
                    if (model) {
                        if (typeof model === 'function' && (instantiate === undefined || instantiate === true)) {
                            parent[parts[i]] = new model();
                        } else {
                            parent[parts[i]] = model;
                        }
                    }
                } else {
                    parent[parts[i]] = {};
                }
            }
            parent = parent[parts[i]];
        }
        return parent;
    }

    function registerApp(application, instantiate){
        if (typeof application === 'function' && (instantiate === undefined || instantiate === true)) {
           RAD.application = new application(RAD.core);
        } else {
            RAD.application = application;
        }
    }

    window.RAD = {
//      namespaces
        views: {},
        services: {},
        plugins: {},
        models: {},
        utils: {},

//      functionality
        core: core,
        view: register,
        service: register,
        plugin: register,
        model: modelMethod,
        application: registerApp,

        Class: null
    };

    window.RAD.scriptLoader = (function () {
        var loader = {},
            isLoaded = false;

        function loadScript(url, checkCallback) {
            var script = document.createElement("script");

            script.type = "text/javascript";
            script.async = true;

            if (script.readyState) {  //IE
                script.onreadystatechange = function () {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null;
                        checkCallback();
                    }
                };
            } else {  //Others
                script.onload = function () {
                    checkCallback();
                };
            }

            script.src = url;
            document.head.appendChild(script);
        }

        function loadArray(urls, callback, context) {
            var i, l = urls.length, counter = 0;

            loader.arr = null;
            loader.callback = null;
            loader.context = null;

            function check() {
                counter += 1;
                if (counter === l) {
                    execute(callback, null, context);
                }
            }

            for (i = 0; i < l; i += 1) {
                loadScript(urls[i], check);
            }
        }

        function onLoad() {
            isLoaded = true;
            loader.loadScripts = loadArray;
            if (loader.arr && loader.callback) {
                loader.loadScripts(loader.arr, loader.callback, loader.context);
            }
        }

        loader.loadScripts = function (urls, callback, context) {
            loader.arr = urls;
            loader.callback = callback;
            loader.context = context;
        };

        if (window.attachEvent) {
            window.attachEvent('onload', onLoad);
        } else {
            window.addEventListener('load', onLoad, false);
        }

        return loader;
    }());

    window.RAD.prepareEnvironment = function () {
        var isIPad = (/ipad/gi).test(window.navigator.appVersion),
            isAndroid = (/android/gi).test(window.navigator.appVersion),
            overlay = document.querySelector('#overlay');

        _.templateSettings = {
            evaluate:    /\{\{#([\s\S]+?)\}\}/g,            // {{# console.log("blah") }}
            interpolate: /\{\{[^#\{]([\s\S]+?)[^\}]\}\}/g,  // {{ title }}
            escape:      /\{\{\{([\s\S]+?)\}\}\}/g         // {{{ title }}}
        };

        // prevent scrolling
        window.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, false);

        //disable text select
        document.body.onselectstart = function () {
            return false;
        };

        //setup specify device class
        if (isIPad) {
            window.document.body.className = 'i-pad';
        } else if (isAndroid) {
            window.document.body.className = 'android';
        }

        //stopPropagation from overlay
        function stopProp(event) {
            event.stopPropagation();
            event.preventDefault();
        }

        overlay.addEventListener('click', stopProp, false);
        overlay.addEventListener('touchstart', stopProp, false);
        overlay.addEventListener('touchmove', stopProp, false);
        overlay.addEventListener('touchend', stopProp, false);
    };

}(document, window));

(function() {
    var rules = 'html,body{position:relative;height:100%;overflow:hidden;-ms-touch-action:none;-ms-touch-select:none}body{margin:0;-webkit-text-size-adjust:100%;-webkit-touch-callout:none;-webkit-text-size-adjust:none;-webkit-highlight:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{-moz-user-select:none;-o-user-select:none;-khtml-user-select:none;-webkit-user-select:none;-ms-user-select:none;user-select:none}a,input,textarea,button,div{-webkit-tap-highlight-color:rgba(0,0,0,0);-moz-user-select:text;-o-user-select:text;-khtml-user-select:text;-webkit-user-select:text;-ms-user-select:text;user-select:text}img{border-style:none}input,textarea,select{vertical-align:middle}form,fieldset{margin:0;padding:0;border-style:none}div[data-role=view]{position:absolute;top:0;left:0;width:100%;height:100%;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}#screen{position:relative;height:100%;overflow:hidden}#overlay{display:none}#overlay{position:absolute;z-index:1000;left:0;top:0;width:100%;height:100%}#overlay.show{display:block}.lightbox{position:absolute;z-index:999;left:0;top:0;width:100%;height:100%;opacity:0;text-align:center;white-space:nowrap;-webkit-transition:opacity 300ms ease;-moz-transition:opacity 300ms ease;-ms-transition:opacity 300ms ease;-o-transition:opacity 300ms ease;transition:opacity 300ms ease}.lightbox.show{opacity:1}.lightbox:after{content:"";display:inline-block;vertical-align:middle;width:1px;height:100%}.lightbox-frame{position:relative;display:inline-block;vertical-align:middle;width:100%;text-align:left;white-space:normal;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;-moz-transform:scale(0.5,.5);-webkit-transform:scale(0.5,.5);-o-transform:scale(0.5,.5);-ms-transform:scale(0.5,.5);transform:scale(0.5,.5);-webkit-transition:-webkit-transform 300ms ease;-moz-transition:-moz-transform 300ms ease;-ms-transition:-ms-transform 300ms ease;-o-transition:-o-transform 300ms ease;transition:transform 300ms ease}.lightbox.show .lightbox-frame{-moz-transform:scale(1,1);-webkit-transform:scale(1,1);-o-transform:scale(1,1);-ms-transform:scale(1,1);transform:scale(1,1)}.toast{z-index:999;position:absolute;width:auto!important;max-width:50%!important;height:auto!important;opacity:0;-webkit-transition:opacity 300ms ease;-moz-transition:opacity 300ms ease;-ms-transition:opacity 300ms ease;-o-transition:opacity 300ms ease;transition:opacity 300ms ease;text-align:center;display:inline-block}.toast.show{opacity:1;-webkit-transition:opacity 10ms ease;-moz-transition:opacity 10ms ease;-ms-transition:opacity 10ms ease;-o-transition:opacity 10ms ease;transition:opacity 10ms ease}.popup{position:absolute;z-index:999;opacity:0;-webkit-transition:opacity 300ms ease;-moz-transition:opacity 300ms ease;-ms-transition:opacity 300ms ease;-o-transition:opacity 300ms ease;transition:opacity 300ms ease}.popup.show{opacity:1}.slide-in,.slide-out{-webkit-transition:-webkit-transform 350ms ease;-moz-transition:-moz-transform 350ms ease;-ms-transition:-ms-transform 350ms ease;-o-transition:-o-transform 350ms ease;transition:transform 350ms ease}.new-page.slide-in{-webkit-transform:translate3d(100%,0,0);-moz-transform:translate3d(100%,0,0);-ms-transform:translate3d(100%,0,0);-o-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}.old-page.slide-in{-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);-o-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}.animate>.new-page.slide-in{-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);-o-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}.animate>.old-page.slide-in{-webkit-transform:translate3d(-100%,0,0);-moz-transform:translate3d(-100%,0,0);-ms-transform:translate3d(-100%,0,0);-o-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}.new-page.slide-out{-webkit-transform:translate3d(-100%,0,0);-moz-transform:translate3d(-100%,0,0);-ms-transform:translate3d(-100%,0,0);-o-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}.old-page.slide-out{-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);-o-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}.animate>.new-page.slide-out{-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);-ms-transform:translate3d(0,0,0);-o-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}.animate>.old-page.slide-out{-webkit-transform:translate3d(100%,0,0);-moz-transform:translate3d(100%,0,0);-ms-transform:translate3d(100%,0,0);-o-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}.new-page.fade-in,.new-page.fade-out{opacity:0;-webkit-transition:opacity 350ms ease;-moz-transition:opacity 350ms ease;-ms-transition:opacity 350ms ease;-o-transition:opacity 350ms ease;transition:opacity 350ms ease}.old-page.fade-in,.old-page.fade-out{opacity:1;-webkit-transition:opacity 175ms 175ms ease;-moz-transition:opacity 175ms 175ms ease;-ms-transition:opacity 175ms 175ms ease;-o-transition:opacity 175ms 175ms ease;transition:opacity 175ms 175ms ease}.animate>.new-page.fade-in,.animate>.new-page.fade-out{opacity:1}.animate>.old-page.fade-in,.animate>.old-page.fade-out{opacity:0}',
        style = document.createElement("style");
    style.appendChild(document.createTextNode(rules));
    document.head.appendChild(style);
})();

RAD.Class = RAD.Class || (function () {
    "use strict";
    var self = function () {
    };

    function isFn(fn) {
        return typeof fn === "function";
    }

    self.extend = function (proto) {
        var key, k = function (magic) { // call initialize only if there's no magic cookie
            if (magic !== isFn && isFn(this.initialize)) {
                this.initialize.apply(this, arguments);
            }
        };
        k.prototype = new this(isFn); // use our private method as magic cookie
        for (key in proto) {
            (function (fn, sfn) { // create a closure
                k.prototype[key] = !isFn(fn) || !isFn(sfn) ? fn : // add _super method
                    function () {
                        this._super = sfn;
                        return fn.apply(this, arguments);
                    };
            }(proto[key], k.prototype[key]));
        }
        k.prototype.constructor = k;
        k.extend = this.extend || this.create;
        return k;
    };
    return self;
}());

RAD.utils.ElementCreator = function (tagName, attributes) {
    var element = document.createElement(tagName);
    if (attributes) {
        for (var i in attributes) {
            element[i] = attributes[i];
        }
    }
    return element;
};
RAD.utils.trim = function (string) {
    return string.replace(/^\s+|\s+$/g, '');
};
RAD.utils.removeMultipleSpaces = function (string) {
    return string.replace(/\s{2,}/g, ' ');
};
RAD.utils.isArray = function (value) {
    var result = false;
    if (Object.prototype.toString.call(value) === '[object Array]') {
        result = true;
    }

    return result;
};
/*
 * Return an element position {top:px, left:px} relative to parent element.
 * If parent elem not set - relative to browser window.
 */
RAD.utils.getCoords = function (elem, parent) {
    'use strict';

    var parentRect, pTop, pLeft,
        scrollTop = window.pageYOffset,
        scrollLeft = window.pageXOffset,
        elemRect = elem.getBoundingClientRect(),
        top = elemRect.top + scrollTop,
        left = elemRect.left + scrollLeft;

    if (parent) {
        parentRect = parent.getBoundingClientRect();
        pTop = parentRect.top + scrollTop;
        pLeft = parentRect.left + scrollLeft;
        top = top - pTop;
        left = left - pLeft;
    }

    return { top:Math.round(top), left:Math.round(left) };
};
RAD.utils.escape = function (str) {
    'use strict';
    if (!str) return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
RAD.utils.unescape = function (str) {
    'use strict';
    if (!str) return str;
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
};
RAD.utils.encodeURI = function (str) {
    'use strict';
    return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
};
RAD.utils.decodeURI = function (str) {
    'use strict';
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
};
// remove className form elem
RAD.utils.removeClass = function (elem, className) {
    'use strict';
    var pattern = '(?:^|\\s)' + className + '(?!\\S)',
        expression = new RegExp(pattern, 'g');
    return elem.className = elem.className.replace(expression, '');
};
RAD.utils.dispatchResizeEvent = function (target) {
    'use strict';

    var event = document.createEvent('Event');

    if (!target) {
        return false;
    }
    event.initEvent('scrollRefresh', true, false);
    target.dispatchEvent(event);
};
RAD.utils.Base64 = {
    // private property
    _keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode:function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        var Base64 = RAD.utils.Base64;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
                Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode:function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var Base64 = RAD.utils.Base64;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = Base64._keyStr.indexOf(input.charAt(i++));
            enc2 = Base64._keyStr.indexOf(input.charAt(i++));
            enc3 = Base64._keyStr.indexOf(input.charAt(i++));
            enc4 = Base64._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode:function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

// private method for UTF-8 decoding
    _utf8_decode:function (utftext) {
        var string = "";
        var i = 0;
        var c = 0, c1 = 0, c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c1 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                i += 2;
            }
            else {
                c1 = utftext.charCodeAt(i + 1);
                c2 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
                i += 3;
            }

        }
        return string;
    }
};

RAD.utils.QueryFactory = function () {
    "use strict";
    var self = this,
        lastTask;

    function Query(options) {

        var query = this,
            listeners = [],
            success,
            error,
            context;

        function shift(a) {
            var result = [], i;
            for (i = 1; i < a.length; i += 1) {
                result.push(a[i]);
            }
            return result;
        }

        function apply(func) {
            var args = shift(arguments);
            if (typeof func !== "function") {
                return;
            }
            if (context && context instanceof Object) {
                func.apply(context, args);
            } else {
                func.apply(query, args);
            }
        }

        function isArray(vArg) {
            return (Object.prototype.toString.call(vArg) === "[object Array]");
        }

        if (typeof options === "object") {
            success = options.success;
            error = options.error;
            context = options.context;
        }

        query.error = function (data) {
            apply(error, data);
        };

        query.success = function (data) {
            apply(success, data);
        };

        query.then = function (fn) {
            listeners.push(fn);
            return this;
        };

        query.next = function (data) {
            var index,
                length,
                listener;

            if (listeners.length > 0) {
                listener = listeners[0];
                if (isArray(listener)) {
                    if (!listener.isAlreadyRunning) {
                        listener.isAlreadyRunning = true;
                        listener.whileCounter = 0;
                        for (index = 0, length = listener.length; index < length; index += 1) {
                            apply(listener[index], this, data);
                        }
                    } else {
                        listener.whileCounter += 1;
                        if (listener.whileCounter === listener.length) {
                            listeners.shift();
                            apply(listeners.shift(), this, data);
                        }
                    }
                } else {
                    apply(listeners.shift(), this, data);
                }
            } else {
                this.success(data);
            }
        };

        query.when = function () {
            var i, l, array = [];
            for (i = 0, l = arguments.length; i < l; i += 1) {
                array.push(arguments[i]);
            }
            listeners.push(array);
            return this;
        };

        query.resolve = function (data) {
            this.next(data);

            this.then = this.when = this.resolve = function () {
                throw new Error("You try use already resolved query");
            };
        };

        return query;
    }

    self.createQuery = function (option) {
        lastTask = new Query(option);
        return lastTask;
    };

    self.lastQuery = function () {
        return lastTask;
    };

    return self;
};

RAD.utils.serializeFormToObject = function (formSelector) {
    var o = {},
        a = $(formSelector).find('input, select, textarea, button'),
        name, value, i,l;

    for (i = 0, l = a.length; i < l; i+=1){
        name = a.get(i).getAttribute('name') || a.get(i).id||a.get(i).className.replace(' ', '');
        value = a.get(i).value || '';

        if (o[name] !== undefined) {
            if (!o[name].push) {
                o[name] = [o[name]];
            }
            o[name].push(value);
        } else {
            o[name] = value;
        }
    }

    return o;
};

RAD.utils.serializeFormToString = function (formSelector) {
    var result;

    try {
        result = JSON.stringify(RAD.utils.serializeFormToObject(formSelector));
    } catch (e) {
        result = '';
    }
    return result;
};

RAD.Blanks = (function (window, document) {
    'use strict';

    var blanks = {},
        RAD = window.RAD,
        underscore = window._;

    function Deferred() {
        return {
            listeners: [],
            done: function (fn) {
                this.listeners.push(fn);
            },
            doneFirstTask: function (fn) {
                this.firstTask = fn;
            },
            doneLastTask: function (fn) {
                this.lastTask = fn;
            },
            resolve: function () {
                var self = this, index, length, fn;
                self.resolve = function () {
                };
                self.done = function (fn) {
                    if (typeof fn === 'function') {
                        fn();
                    }
                };
                self.doneLastTask = self.doneFirstTask = self.done;
                if (typeof self.firstTask === 'function') {
                    self.firstTask();
                }

                for (index = 0, length = self.listeners.length; index < length; index += 1) {
                    fn = self.listeners[index];
                    if (typeof fn === 'function') {
                        fn();
                    }
                }

                if (typeof self.lastTask === 'function') {
                    self.lastTask();
                }
                delete self.listeners;
            }
        };
    }

    blanks.Deferred = Deferred;

    function detachSubview(parent, data) {
        var content = RAD.core.getView(data.content, data.extras);
        content.detach();
    }

    function insertSubview(parent, data) {
        var content = RAD.core.getView(data.content, data.extras),
            container = parent.$el.find(data.container_id);

        if (data && data.backstack) {
            RAD.core.publish("router.beginTransition", data);
        }

        content.appendIn(container, function () {
            container.attr('view', data.content);
            if (typeof data.callback === 'function') {
                if (typeof data.context === 'object') {
                    data.callback.call(data.context);
                } else {
                    data.callback();
                }
            }
        });
    }

    blanks.View = window.Backbone.View.extend({
        className: 'backbone-view',
        attributes: {
            'data-role': 'view'
        },

        getChildren: function () {
            if (!this.children) {
                this.children = [];
            }
            return this.children;
        },

        initialize: function () {
            var self = this,
                children,
                core;

            self.loader = new Deferred();
            self.renderRequest = true;

            // transfer options
            self.viewID = self.options.viewID;
            core = self.options.core;
            self.publish = core.publish;
            self.subscribe = core.subscribe;
            self.unsubscribe = core.unsubscribe;
            self.$ = core.$;
            self.finish = function () {
                core.stop(self.viewID);
            };
            self.application = self.options.application;
            self.extras = self.options.extras;

            //delete options
            delete self.options;

            children = underscore.clone(self.getChildren());
            self.children = children;

            $.get(self.url, function (data) {
                var innerTemplate, wrapper, i, l, templArr;

                templArr = window.$('<div></div>').html(data).find('[data-template]');
                if (templArr.length > 0) { self.innerTemplate = []; }
                for (i = 0, l = templArr.length; i < l; i += 1) {
                    wrapper = templArr.get(i);
                    innerTemplate = wrapper.innerHTML;
                    self.innerTemplate[i] = underscore.template(RAD.utils.unescape(innerTemplate));
                }

                self.template = underscore.template(data);
                self.bindModel(self.model);
                self.loader.resolve();
            }, 'text');

            self.subscribe(self.viewID, self.receiveMsg, self);

            self.oninit();
            self.onInitialize();
            self.setExtras(self.extras);

            return self;
        },

        setExtras: function (extras) {
            this.onNewExtras(extras);
            this.extras = extras;
        },

        bindModel: function (model) {
            var self = this;
            if (model) {
                self.model = model;

                self.listenTo(model, 'add', self.render);
                self.listenTo(model, 'remove', self.render);
                self.listenTo(model, 'fetch', self.render);
                self.listenTo(model, 'sort', self.render);
                self.listenTo(model, 'change', self.render);
                self.listenTo(model, 'reset', self.render);

                if (self.template) {
                    model.trigger('change');
                }
            }
        },

        unbindModel: function () {
            if (this.model) {
                this.stopListening(this.model);
                this.model = null;
                this.render();
            }
        },

        changeModel: function (newModel) {
            var self = this;
            self.unbindModel();
            self.bindModel(newModel);
        },

        render: function () {
            var self = this,
                json = (self.model) ? self.model.toJSON() : undefined,
                children,
                index,
                length,
                arr;

            self.onStartRender();

            //detach children
            children = self.getChildren();
            for (index = 0, length = children.length; index < length; index += 1) {
                detachSubview(self, children[index]);
            }

            if (self.innerTemplate && self.$el.html().length > 0) {
                for (index = 0, length = self.innerTemplate.length; index < length; index += 1) {
                    self.t_m_p = self.innerTemplate[index];
                    $(self.$inner[index]).html(self.t_m_p({model: json}));
                }
                delete self.t_m_p;
            } else {
                self.$el.html(self.template({model: json}));

                if (self.innerTemplate) {
                    self.$inner = [];
                    arr = self.$el.find('[data-template]');
                    for (index = 0, length = self.innerTemplate.length; index < length; index += 1) {
                        self.$inner[index] = arr.get(index);
                    }
                }
            }

            //attach children
            for (index = 0, length = children.length; index < length; index += 1) {
                insertSubview(self, children[index]);
            }

            self.onrender();
            self.onEndRender();

            self.initScrollRefresh();
            self.renderRequest = false;

            return self;
        },

        appendIn: function (container, callback) {
            var self = this, $container = $(container);

            if (!container || $container.length === 0) {
                window.console.log('Container for ' + self.viewID + ' doesn\'t exist!');
                return;
            }

            function onEnd() {
                self.attachScroll();
                callback();
            }

            $container.append(self.$el);
            if (self.renderRequest) {
                self.loader.doneFirstTask(function () {
                    self.render();
                    onEnd();
                });
            } else {
                onEnd();
            }
        },

        initScrollRefresh: function (target) {
            var elem = target || this.el,
                event = document.createEvent('Event');

            event.initEvent('scrollRefresh', true, true);
            elem.dispatchEvent(event);

            this.refreshScroll();
        },

        receiveMsg: function msgFunc(msg, data) {
            var self = this,
                parts = msg.split('.');

            switch (parts[2]) {
                case 'attach':
                    self.loader.done(function () {
                        self.onattach();
                        self.onStartAttach(msg, data);
                    });
                    break;
                case 'detach':
                    self.ondetach();
                    self.onEndDetach(msg, data);
                    break;
                case 'attach_complete':
                    self.loader.doneLastTask(function () {
                        self.onEndAttach(msg, data);
                    });
                    break;
                default:
                    self.onReceiveMsg(msg, data);
                    break;
            }

            return self;
        },

        detach: function () {
            var self = this;
            self.detachScroll();
            self.$el.detach();
        },

        destroy: function () {
            var property,
                self = this;

            self.onDestroy();
            self.ondestroy();
            self.unbindModel();
            self.off(null, null, self);

            self.unsubscribe(self.viewID, self);

            //COMPLETELY UNBIND THE VIEW
            self.undelegateEvents();
            self.$el.removeData().unbind();

            //Remove view from DOM
            self.remove();
            window.Backbone.View.prototype.remove.call(self);

            for (property in self) {
                if (self.hasOwnProperty(property)) {
                    delete self[property];
                }
            }

            return this;
        },

        //stubs for inner service callback functions
        oninit: function () {},
        onattach: function () {},
        ondetach: function () {},
        onrender: function () {},
        ondestroy: function () {},

        attachScroll: function () {},
        refreshScroll: function () {},
        detachScroll: function () {},

        //stubs for external service callback functions
        onInitialize: function () {},
        onNewExtras: function () {},
        onReceiveMsg: function () {},
        onStartRender: function () {},
        onEndRender: function () {},
        onStartAttach: function () {},
        onEndAttach: function () {},
        onEndDetach: function () {},
        onDestroy: function () {}
    });

    blanks.ScrollableView = blanks.View.extend({

        className: 'scroll-view',
        offsetY: 0,

        attachScroll: function () {
            var self = this,
                scrollView = self.el.querySelector('.scroll-view') || self.el;
            self.detachScroll();
            self.loader.done(function () {
                if (self.renderRequest) {
                    return;
                }
                self.mScroll = new window.iScroll(scrollView, {
                    bounce: false,
                    onBeforeScrollStart: function (e) {
                        var target = e.target;

                        while (target.nodeType !== 1) {
                            target = target.parentNode;
                        }
                        if (target.tagName !== 'SELECT' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                            e.preventDefault();
                        }
                    }
                });
            });
        },

        onattach: function () {
            var self = this;
            window.setTimeout(function () {
                if (self.mScroll) {
                    self.mScroll.refresh();
                    self.mScroll.scrollTo(0, self.offsetY, 0);
                }
            }, 0);
        },

        refreshScroll: function () {
            if (this.mScroll) {
                this.mScroll.refresh();
            }
        },

        detachScroll: function () {
            var self = this;
            if (self.mScroll) {
                self.offsetY = self.mScroll.y;
                self.mScroll.destroy();
                self.mScroll = null;
            }
        }
    });

    blanks.Toast = blanks.View.extend({
        className: 'toast',

        closeTimeOut: undefined,

        showTime: 4000,

        close: function () {
            window.clearTimeout(this.closeTimeOut);

            var options = {
                content: this.viewID
            };
            $(document.body).off('click.close');
            this.publish('navigation.toast.close', options);
        },

        onattach: function () {
            var self = this;
            self.closeTimeOut = window.setTimeout(function () {
                self.close();
            }, self.showTime);
            $(document.body).one('click.close', function () {
                self.close();
            });
        }
    });

    blanks.Popup = blanks.ScrollableView.extend({
        className: 'popup',

        close: function () {
            var self = this,
                options = {
                    content: self.viewID,
                    destroy: self.onCloseDestroy
                },
                viewID,
                array = self.viewID.split('.');
            viewID = array[array.length - 1];

            $(document.body).off('tapdown.' + viewID);
            $(document.body).off('click.' + viewID);

            self.publish('navigation.popup.close', options);
        },

        onattach: function (msg, data) {
            var self = this,
                viewID,
                array = self.viewID.split('.');

            blanks.ScrollableView.prototype.onattach.call(self);

            viewID = array[array.length - 1];
            function close() {
                self.close();
            }
            function stopPropagation(e) {
                e.stopPropagation();
            }

            if (self.outSideClose) {
                self.$el.on('tapdown.' + viewID, stopPropagation);
                self.$el.on('click.' + viewID, stopPropagation);
                $(document.body).one('tapdown.' + viewID, close);
                $(document.body).one('click.' + viewID, close);
            }

            $(window).one('orientationchange.' + viewID, close);
        },

        ondetach: function () {
            var self = this,
                viewID,
                array = self.viewID.split('.');

            viewID = array[array.length - 1];

            $(document.body).off('tapdown.' + viewID);
            $(document.body).off('click.' + viewID);
            self.$el.off('tapdown.' + viewID);
            self.$el.off('click.' + viewID);
            $(window).off('orientationchange.' + viewID);
        }
    });

    return blanks;
}(window, document));

RAD.Blanks.Service = RAD.Class.extend({
    initialize: function (options) {
        "use strict";
        this.publish = options.core.publish;
        this.subscribe = options.core.subscribe;
        this.unsubscribe = options.core.unsubscribe;
        this.serviceID = this.viewID = options.viewID;
        this.application = options.animation;

        this.subscribe(this.serviceID, this.onReceiveMsg, this);
        this.onInitialize();
    },
    destroy: function () {
        "use strict";
        this.onDestroy();
        this.unsubscribe(null, this);
    },
    onInitialize: function () {
        "use strict";
    },
    onReceiveMsg: function () {
        "use strict";
    },
    onDestroy: function () {
        "use strict";
    }
});

RAD.plugin("plugin.fastclick", function (core, id) {
    'use strict';

    var document = window.document,
        body = document.body,
        self = {moduleID: id},
        GHOST_CLICK_TIMEOUT = 500,
        TOUCH_DIFFERENCE = 10,
        coordinates = [];

    function Swiper(element) {
        var swiper = this,
            lastMove,
            preLastMove;

        function extractCoord(e) {
            var result = {},
                touchEvent = e;

            if (swiper.touch) {
                if (e.touches && e.touches[0] && e.type !== "touchend") {
                    touchEvent = e.touches[0];
                } else if (e.changedTouches && e.changedTouches[0]) {
                    touchEvent = e.changedTouches[0];
                }
            }

            result.screenX = touchEvent.screenX;
            result.screenY = touchEvent.screenY;
            result.clientX = touchEvent.clientX;
            result.clientY = touchEvent.clientY;
            return result;
        }

        function getDirection(startX, startY, endX, endY) {
            var result;

            if (Math.abs(startX - endX) > Math.abs(startY - endY)) {
                if (startX > endX) {
                    result = "left";
                } else {
                    result = "right";
                }
            } else {
                if (startY > endY) {
                    result = "top";
                } else {
                    result = "bottom";
                }
            }
            return result;
        }

        function fireEvent(type, e) {
            var coords = extractCoord(e),
                customEvent = document.createEvent('Event');

            customEvent.initEvent(type, true, true);
            customEvent[type] = {
                clientX: coords.clientX,
                clientY: coords.clientY,
                screenX: coords.screenX,
                screenY: coords.screenY,
                timeStamp: e.timeStamp
            };
            e.target.dispatchEvent(customEvent);
        }

        function getDirectionVelosity(lastX, lastY, lastTime, endX, endY, endTime) {
            var distance,
                velocity,
                direction = getDirection(lastX, lastY, endX, endY);

            switch (direction) {
                case "left":
                    distance = lastX - endX;
                    break;
                case "right":
                    distance = endX - lastX;
                    break;
                case "top":
                    distance = lastY - endY;
                    break;
                case "bottom":
                    distance = endY - lastY;
                    break;
            }
            velocity = (distance / (endTime - lastTime)).toFixed(3);
            return velocity;
        }

        function distance(x1, y1, x2, y2) {
            var xdiff = x2 - x1,
                ydiff = y2 - y1;
            return Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
        }

        function saveLastPoint(e) {
            var coords = extractCoord(e);
            lastMove = preLastMove;
            preLastMove = {
                screenX: coords.screenX,
                screenY: coords.screenY,
                timeStamp: e.timeStamp
            };
        }

        swiper.down = function (e) {
            var coords = extractCoord(e);
            swiper.startX = coords.screenX;
            swiper.startY = coords.screenY;
            swiper.startClientX = coords.clientX;
            swiper.startClientY = coords.clientY;
            swiper.timeStamp = e.timeStamp;
            swiper.moved = false;
            swiper.isDown = true;
            swiper.touchStartTime = new Date().getTime();

            preLastMove = {
                screenX: 0,
                screenY: 0,
                timeStamp: new Date().getTime()
            };
            saveLastPoint(e);
            fireEvent("tapdown", e);
        };

        swiper.move = function (e) {
            var coords = extractCoord(e);
            if (swiper.isDown) {
                fireEvent("tapmove", e);
            }
            if (Math.abs(coords.screenX - swiper.startX) > TOUCH_DIFFERENCE || (Math.abs(coords.screenY - swiper.startY) > TOUCH_DIFFERENCE)) {
                swiper.moved = true;
                saveLastPoint(e);
            }
        };

        swiper.cancel = function (e) {
            if (swiper.isDown) {
                fireEvent("tapcancel", e);
            }
        };

        swiper.clear = function (e) {
            fireEvent("tapclear", e);
        };

        swiper.up = function (e) {
            var swipeEvent,
                coord = extractCoord(e),
                dVelocity,
                velocity,
                duration = new Date().getTime() - swiper.touchStartTime;

            if (!swiper.isDown) {
                return;
            }

            swiper.isDown = false;
            if (!swiper.moved && duration <= 200) {
                fireEvent("tap", e);
            }

            velocity = (distance(lastMove.screenX, lastMove.screenY, coord.screenX, coord.screenY) / (e.timeStamp - lastMove.timeStamp)).toFixed(3);
            if (swiper.moved && velocity > 0) {

                dVelocity = getDirectionVelosity(lastMove.screenX, lastMove.screenY, lastMove.timeStamp, coord.screenX, coord.screenY, e.timeStamp);

                swipeEvent = document.createEvent('Event');
                swipeEvent.initEvent('swipe', true, true);
                swipeEvent.swipe = {
                    //start point event attributes
                    start: {
                        screenX: swiper.startX,
                        screenY: swiper.startY,
                        clientX: swiper.startClientX,
                        clientY: swiper.startClientY,
                        timeStamp: swiper.timeStamp
                    },
                    //end point event attributes
                    end: {
                        screenX: coord.screenX,
                        screenY: coord.screenY,
                        clientX: coord.clientX,
                        clientY: coord.clientY,
                        timeStamp: e.timeStamp
                    },
                    //velocity(px/ms) in end point without direction
                    velocity: velocity,
                    //swipe direction ("left", "right", "top", "bottom")
                    direction: getDirection(swiper.startX, swiper.startY, coord.screenX, coord.screenY),
                    //swipe speed(px/ms) in end point by direction
                    speed: dVelocity
                };
                e.target.dispatchEvent(swipeEvent);
            }

            fireEvent("tapup", e);
        };

        swiper.destroy = function () {
            if (!this.touch) {
                this.el.removeEventListener('mousedown', this.down);
                this.el.removeEventListener('mouseup', this.up);
                this.el.removeEventListener('mousemove', this.move);
                this.el.removeEventListener('mouseout', this.cancel);
                this.el.removeEventListener('mouseover', this.clear);
            } else {
                this.el.removeEventListener('touchstart', this.down);
                this.el.removeEventListener('touchend', this.up);
                this.el.removeEventListener('touchmove', this.move);
                this.el.removeEventListener('touchcancel', this.cancel);
            }
            delete this.el;
        };

        // init
        swiper.el = element;
        element = null;
        swiper.touch = (window.ontouchstart !== undefined);
        if (!swiper.touch) {
            swiper.el.addEventListener('mousedown', swiper.down, false);
            swiper.el.addEventListener('mouseup', swiper.up, false);
            swiper.el.addEventListener('mousemove', swiper.move, false);
            swiper.el.addEventListener('mouseout', swiper.cancel, false);
            swiper.el.addEventListener('mouseover', swiper.clear, false);
        } else {
            swiper.el.addEventListener('touchstart', swiper.down, false);
            swiper.el.addEventListener('touchend', swiper.up, false);
            swiper.el.addEventListener('touchmove', swiper.move, false);
            swiper.el.addEventListener('touchcancel', swiper.cancel, false);
        }

        return swiper;
    }

    function preventGhostClick(x, y) {
        coordinates.push(x, y);
        window.setTimeout(function () {
            coordinates.splice(0, 2);
        }, GHOST_CLICK_TIMEOUT);
    }

    function onClick(event) {
        var x, y, i;

        for (i = 0; i < coordinates.length; i += 2) {
            x = coordinates[i];
            y = coordinates[i + 1];
            if (Math.abs(event.screenX - x) < TOUCH_DIFFERENCE && Math.abs(event.screenY - y) < TOUCH_DIFFERENCE) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
        }
        preventGhostClick(event.screenX, event.screenY);
        return false;
    }

    function onTouchStart(e) {
        self.startX = e.touches[0].screenX;
        self.startY = e.touches[0].screenY;
        self.touchStartTime = new Date().getTime();
        self.move = false;
        self.cancelsed = false;

        return true;
    }

    function onTouchCancel() {
        self.cancelsed = true;
    }

    function onTouchMove(e) {
        if (Math.abs(e.touches[0].screenX - self.startX) > TOUCH_DIFFERENCE || (Math.abs(e.touches[0].screenY - self.startY) > TOUCH_DIFFERENCE)) {
            self.move = true;
        }
    }

    function sendClick(event, newType) {
        var clickEvent, touch;

        touch = event.changedTouches[0];
        clickEvent = window.document.createEvent('MouseEvents');
        clickEvent.initMouseEvent(newType, true, true, window, 1,
            touch.screenX, touch.screenY, touch.clientX, touch.clientY,
            false, false, false, false, 0, null);
        event.target.dispatchEvent(clickEvent);
    }

    function onTouchEnd(event) {
        var touch = event.changedTouches[0],
            duration = new Date().getTime() - self.touchStartTime;
        if (self.move || self.cancelsed || duration > 200) {
            return false;
        }

        // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect
        if (window.document.activeElement && window.document.activeElement !== event.target) {
            window.document.activeElement.blur();
        }

        sendClick(event, 'click');

        if (event.target.focus) {
            event.target.focus();
        }
        preventGhostClick(touch.screenX, touch.screenY);

        event.preventDefault();
        event.stopPropagation();

        return true;
    }

    function isAndroid() {
        return window.navigator.userAgent.indexOf('Android') > 0;
    }

    function fastClickNeeded() {
        var metaViewport;

        // Devices that don't support touch don't need FastClick
        if (window.ontouchstart === undefined) {
            return false;
        }

        if ((/Chrome\/[0-9]+/).test(window.navigator.userAgent)) {

            // Chrome on Android with user-scalable="no" doesn't need FastClick
            if (isAndroid()) {
                metaViewport = document.querySelector('meta[name=viewport]');
                if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
                    return false;
                }

                // Chrome desktop doesn't need FastClick
            } else {
                return false;
            }
        }

        return true;
    }

    //  constructor
    self.swipe = new Swiper(body);
    if (fastClickNeeded()) {
        body.addEventListener('click', onClick, true);
        body.addEventListener('touchstart', onTouchStart, false);
        body.addEventListener('touchend', onTouchEnd, false);
        body.addEventListener('touchmove', onTouchMove, false);
        body.addEventListener('touchcancel', onTouchCancel, false);
    }

    // destuctor
    self.destroy = function () {
        if (fastClickNeeded()) {
            body.removeEventListener('click', onClick, true);
            body.removeEventListener('touchstart', onTouchStart, false);
            body.removeEventListener('touchend', onTouchEnd, false);
            body.removeEventListener('touchmove', onTouchMove, false);
            body.removeEventListener('touchcancel', onTouchCancel, false);
        }
        this.swipe.destroy();
    };

    return self;
});

RAD.plugin("plugin.navigator", function (core, id) {
    'use strict';

    var self = {},
        window = core.window,
        defaultAnimation = core.options.defaultAnimation || 'slide',
        animationTimeout = core.options.animationTimeout || 1000,
        transEndEventName = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
        overlay,
        defaultSaveInBackstack = (core.options && core.options.defaultBackstack !== undefined) ? core.options.defaultBackstack : false,
        animator;


    function apply(callback, context, data) {
        if (typeof callback !== 'function') { return; }
        if (typeof context === 'object') {
            callback.apply(context, data);
        } else {
            callback(data);
        }
    }

    function getViewIDBySelector(root, selector) {
        var result,
            element = root.querySelector(selector);
        if (element && element.getAttribute) {
            result = element.getAttribute('view');
        }
        return result;
    }

    function getParentViewIDForSelector(selector) {
        var result;

        function recursion(element) {
            if (!element || !element.parentNode) {
                return null;
            }

            element = element.parentNode;
            if (element && element.getAttribute) {
                result = element.getAttribute('view');
                if (result) {
                    return result;
                } else {
                    return recursion(element);
                }
            }
        }

        return recursion(core.document.querySelector(selector));
    }


    function getSubviewsID(view) {
        var i,
            j,
            children,
            index,
            length,
            childID,
            views,
            result = [];
        if (!view) {
            return result;
        }

        children = view.getChildren();
        for (index = 0, length = children.length; index < length; index += 1) {
            childID = children[index].content;
            result.push(childID);
            views = getSubviewsID(core.getView(childID));
            for (i = 0, j = views.length; i < j; i += 1) {
                result.push(views[i]);
            }
        }
        return result;
    }

    function setupPopupPosition(popup, target, gravity, width, height) {
        var winW = window.innerWidth,
            winH = window.innerHeight,
            popupW = width || 150,
            popupH = height || 150,
            popupX = 0,
            popupY = 0,
            $target =  $(target),
            targetY = $target.offset().top,
            targetX = $target.offset().left,
            targetW = $target.outerWidth(),
            targetH = $target.outerHeight(),
            gravityEnable = (gravity && gravity.length > 0 && ("top bottom left right center".indexOf(gravity) !== -1)),
            popupStyle = window.getComputedStyle(popup),
            pointer = popup.querySelector('.popup-pointer'),
            pointerOffsetLeft = 0,
            pointerOffsetTop = 0;

        //autoposition
        function inRect(left, top, right, bottom, width, height) {
            return (width < (right - left)) && (height < (bottom - top));
        }

        if (!gravityEnable) {
            gravity = 'center';
            if (inRect(0, 0, targetX, winH, popupW, popupH)) {
                gravity = 'left';
            }
            if (inRect(0, targetY + targetH, winW, winH, popupW, popupH)) {
                gravity = 'bottom';
            }
            if (inRect(targetX + targetW, 0, winW, winH, popupW, popupH)) {
                gravity = 'right';
            }
            if (inRect(0, 0, winW, targetY, popupW, popupH)) {
                gravity = 'top';
            }
        }

        //setup popup position
        switch (gravity) {
            case 'center':
                popupX = (winW - popupW) / 2;
                popupY = (winH - popupH) / 2;
                break;
            case 'top':
                popupX = targetX - popupW / 2 + targetW / 2;
                popupY = targetY - popupH;
                break;
            case 'bottom':
                popupX = targetX - popupW / 2 + targetW / 2;
                popupY = targetY + targetH;
                break;
            case 'left':
                popupY = targetY - popupH / 2 + targetH / 2;
                popupX = targetX - popupW;
                break;
            case 'right':
                popupY = targetY - popupH / 2 + targetH / 2;
                popupX = targetX + targetW;
                break;
            default:
                break;
        }

        popup.style.left = Math.round(popupX + window.pageXOffset) + 'px';
        popup.style.top = Math.round(popupY + window.pageYOffset) + 'px';
        popup.style.width = width + 'px';
        popup.style.height = height + 'px';

        //setup pointer position
        if (pointer) {
            pointer.style.top = '';
            pointer.style.left = '';
            pointer.className = 'popup-pointer ' + gravity;

            if (gravity === 'top' || gravity === 'bottom') {
                pointerOffsetLeft = (pointer.offsetWidth / 2) + parseInt(popupStyle.paddingLeft, 10);
                pointer.style.left = (targetX + Math.round(target.offsetWidth / 2)) - popupX - pointerOffsetLeft + 'px';
            }
            if (gravity === 'left' || gravity === 'right') {
                pointerOffsetTop = (pointer.offsetHeight / 2) + parseInt(popupStyle.paddingTop, 10);
                pointer.style.top = (targetY + Math.round(target.offsetHeight / 2)) - popupY - pointerOffsetTop + 'px';
            }
        }
    }

    function setToastGravity(el, gravity) {
        var x = 0, y = 0,
            w = el.offsetWidth,
            h = el.offsetHeight,
            width = window.innerWidth,
            height = window.innerHeight;

        switch (gravity) {
            case 'center':
                x = (width - w) / 2;
                y = (height - h) / 2;
                break;
            case 'left':
                y = (height - h) / 2;
                break;
            case 'right':
                x = width - w;
                y = (height - h) / 2;
                break;
            case 'bottom':
                x = (width - w) / 2;
                y = height - h;
                break;
            default:
                x = (width - w) / 2;
                break;
        }
        el.style.left = Math.round(x + window.pageXOffset) + 'px';
        el.style.top = Math.round(y + window.pageYOffset) + 'px';
    }

    function Animator() {
        var self = {};

        self.inAnimation = 0;

        function publish(msg, subscrabers) {
            var index,
                length;
            for (index = 0, length = subscrabers.length; index < length; index += 1) {
                core.publish(subscrabers[index] + '.' + msg);
            }
        }

        self.animate = function (datawrapper, revers) {
            var newPage, oldPage, newView, oldView,
                container,
                parent,
                effectName,
                animationName = '',
                endFunc,
                done = false,
                previous,
                attachedViews,
                detachedViews = [],
                parentViewID,
                parentView,
                children,
                child,
                newChildOptions,
                index,
                length;

            /* IMPORTANT: remove focus from active elements (inputs, textareas etc) before view is detached.
             * Otherwise content can disappear (not render properly) on iOS device after detaching old view/view
             * in case if some element was focused before detaching.
             */
            if (window.document.activeElement) {
                window.document.activeElement.blur(); // remove focus from active element
            }

            if (datawrapper === null || datawrapper === undefined) {
                return;
            }

            effectName = datawrapper.animation || defaultAnimation;
            container = core.$(datawrapper.container_id);
            // new adding view
            newView = core.getView(datawrapper.content, core.extractExtras(datawrapper));
            previous = container.attr('view');
            // old removing view
            oldView = previous ? core.getView(previous) : undefined;

            if (oldView && oldView.viewID === (newView && newView.viewID)) {
                window.console.log("You try navigate the same view:" + oldView.viewID + " as old and new widget!");
                return;
            }

            // get array of detached viewsID
            parent = getViewIDBySelector(core.document, datawrapper.container_id);
            if (parent) {
                detachedViews = getSubviewsID(core.getView(parent));
                detachedViews.push(parent);
            }

            // get array attached viewsID
            attachedViews = getSubviewsID(newView);
            attachedViews.push(datawrapper.content);

            //remove old child from parent view and add new information about child
            parentViewID = getParentViewIDForSelector(datawrapper.container_id);
            if (parentViewID) {
                parentView = core.getView(parentViewID);
                children = parentView.getChildren();
                newChildOptions = {
                    container_id: datawrapper.container_id,
                    content: datawrapper.content,
                    animation: datawrapper.animation
                };

                if (children) {
                    for (index = 0, length = children.length; index < length; index += 1) {
                        child = children[index];
                        if (child.container_id === newChildOptions.container_id) {
                            children.splice(index, 1);
                            break;
                        }
                    }
                }

                children.push(newChildOptions);
            }

            container.attr('view', datawrapper.content);

            function startAnimation() {
                window.setTimeout(function () {

                    if (newView && newView.el) {
                        // Force the browser to calculate new element styles, before CSS animation start
                        window.getComputedStyle(newView.el, null).getPropertyValue('left');

                        publish('attach', attachedViews);
                    }

                    // Start CSS animation
                    if (!newView && !oldView) {
                        overlay.removeClass('show');
                    } else {
                        container.addClass('animate');
                    }
                }, 0);
            }

            function showView() {
                if (oldPage) {
                    oldPage.addClass('old-page ' + animationName);
                }
                if (newPage) {
                    newPage.addClass('new-page ' + animationName);
                    newView.appendIn(container, startAnimation);
                } else {
                    startAnimation();
                }
            }

            function callEnd() {
                self.inAnimation -= 1;
                if (self.inAnimation === 0) {
                    overlay.removeClass('show');
                }
                apply(datawrapper.callback, datawrapper.context, [newView, oldView]);
                publish('detach', detachedViews);
                publish('attach_complete', attachedViews);

                //create url for navigation
                core.publish("router.endTransition", datawrapper);
            }

            newPage = newView ? newView.$el : undefined;
            oldPage = oldView ? oldView.$el : undefined;

            overlay.addClass('show');
            self.inAnimation += 1;

            if (datawrapper.animation === 'none' || (defaultAnimation === 'none' && !datawrapper.animation)) {
                if (oldView) {
                    oldView.detach();
                }

                if (newPage) {
                    newView.appendIn(datawrapper.container_id, function () {
                        publish('attach', attachedViews);
                    });
                }
                callEnd();
            } else {
                endFunc = function (e) {
                    var flag = e && ((newView && e.target === newView.el) || (oldView && e.target === oldView.el));

                    if (done || !flag) {
                        return;
                    }

                    container.removeClass('animate');
                    if (newPage) {
                        newPage.removeClass('new-page ' + animationName);
                    }
                    if (oldPage) {
                        oldPage.removeClass('old-page ' + animationName);
                        oldView.detach();
                    }
                    container.off(transEndEventName, endFunc);

                    callEnd();
                    done = true;
                };

                container.on(transEndEventName, endFunc);
                window.setTimeout(endFunc, 4000);

                if (revers) {
                    if (effectName.indexOf('-out') !== -1) {
                        animationName = effectName.replace('-out', '-in');
                    } else if (effectName.indexOf('-in') !== -1) {
                        animationName = effectName.replace('-in', '-out');
                    } else {
                        animationName = effectName + '-out';
                    }
                } else {
                    if ((effectName.indexOf('-out') !== -1) || (effectName.indexOf('-in') !== -1)) {
                        animationName = effectName;
                    } else {
                        animationName = effectName + '-in';
                    }
                }
                showView();
            }
        };

        return self;
    }

    function showModal(data, type) {
        var newView = core.getView(data.content, core.extractExtras(data)),
            $element,
            endFunc,
            done = false;
        if (newView === null || newView === undefined) {
            return;
        }

        if (newView.isShown) {
            return;
        }
        newView.isShown = true;

        $element = newView.$el;
        endFunc = function () {
            if (done) {
                return;
            }
            done = true;

            apply(data.callback, data.context, newView);
            overlay.removeClass('show');
            $element.off(transEndEventName, endFunc);
            core.publish(data.content + '.' + 'attach', null); //TODO only root view receive onStartAttach
            newView = null;
        };

        overlay.addClass('show');
        window.setTimeout(endFunc, animationTimeout);

        newView.appendIn('body', function () {
            $element.attr('id', data.content);

            switch (type) {
                case 'dialog':
                    $element.addClass('lightbox');
                    break;
                case 'toast':
                    setToastGravity(newView.el, data.gravity);
                    break;
                case 'popup':
                    setupPopupPosition(newView.el, data.target, data.gravity, data.width, data.height);
                    break;
            }

            $element.on(transEndEventName, endFunc);
            $element.width();
            $element.addClass('show');
        });
    }

    function closeModal(data) {
        var oldDialog = core.getView(data.content),
            oldElement = oldDialog.$el,
            endFunc,
            done = false;

        /* IMPORTANT: remove focus from active elements (inputs, textareas etc) before view is detached.
         * Otherwise content can disappear (not render properly) on iOS device after detaching old view/view
         * in case if some element was focused before detaching.
         */
        if (window.document.activeElement) {
            window.document.activeElement.blur(); // remove focus from active element
        }

        endFunc = function () {
            if (done) {
                return;
            }
            done = true;

            oldDialog.detach();
            apply(data.callback, data.context, oldDialog);
            overlay.removeClass('show');
            oldElement.off(transEndEventName, endFunc);

            core.publish(data.content + '.' + 'detach', null); //TODO only root view receive onEndDetach

            //destroy dialog
            if (!data || data.destroy === undefined || data.destroy) {
                core.stop(data.content);
            } else {
                oldDialog.isShown = false;
            }
            oldDialog = null;
        };

        overlay.addClass('show');
        oldElement.on(transEndEventName, endFunc);
        window.setTimeout(function () {
            endFunc();
        }, animationTimeout);

        oldElement.removeClass('show');
    }

    function onNavigationEvent(channel, data) {
        var parts = channel.split('.'),
            index,
            direction,
            length;

        function initBackstack(dataWrapper) {
            var bkstk = dataWrapper ? dataWrapper.backstack : undefined;
            if (bkstk || (defaultSaveInBackstack && bkstk === undefined)) {
                core.publish("router.beginTransition", dataWrapper);
            }
        }

        switch (parts[1]) {
            case 'show':
                if (window.RAD.utils.isArray(data)) {
                    for (index = 0, length = data.length; index < length; index += 1) {
                        initBackstack(data[index]);
                        animator.animate(data[index], false);
                    }
                } else {
                    initBackstack(data);
                    animator.animate(data, false);
                }
                break;
            case 'back':
                direction = (data.direction !== undefined) ? data.direction : true;
                animator.animate(data, direction);
                break;
            case 'toast':
            case 'popup':
            case 'dialog':
                switch (parts[2]) {
                    case 'show':
                        showModal(data, parts[1]);
                        break;
                    case 'close':
                        closeModal(data);
                        break;
                }
                break;
        }
    }

    //initialization (auto constructor)
    // you should call instantiate NavManager after DOM was loaded
    animator = new Animator();
    core.subscribe('navigation', onNavigationEvent, self);
    overlay = core.$('#overlay');
    self.viewID = id;

    self.destroy = function () {
        core.unsubscribe(onNavigationEvent, self);
    };

    return self;
});

RAD.plugin("plugin.router", function (core, id) {
    'use strict';

    var self = {},
        router,
        toForward = false,
        START_URL = 'index.html',
        ID_SEPARATOR = '%%%',
        newAPI = (typeof history.pushState === 'function');

    function getRootView(el) {
        var result,
            nodes,
            i,
            l;

        nodes = el.childNodes;
        for (i = 0, l = nodes.length; i < l; i += 1) {
            if (nodes[i].getAttribute) {
                result = nodes[i].getAttribute('view');
                if (result) {
                    return {content: result, container_id: '#' + nodes[i].getAttribute('id')};
                }
            }
        }
        for (i = 0, l = nodes.length; i < l; i += 1) {
            result = getRootView(nodes[i]);
            if (result) {
                return result;
            }
        }
    }

    function buildURL(view) {
        var children,
            index,
            length,
            childID,
            child,
            tmp,
            result = [];

        function comparator(a, b) {
            var val1 = a.container_id, val2 = b.container_id, result = 0;
            if (val1 > val2) {
                result = 1;
            } else if (val1 < val2) {
                result = -1;
            }
            return result;
        }

        if (!view) {
            return result;
        }

        children = view.getChildren();
        for (index = 0, length = children.length; index < length; index += 1) {
            child = _.clone(children[index]);
            result.push(child);

            childID = child.content;
            tmp = buildURL(core.getView(childID));
            if (tmp && tmp.length > 0) {
                child.children = tmp;
            }
        }
        result.sort(comparator);

        return result;
    }

    function packURL(urlObj, timestamp) {
        return RAD.utils.encodeURI(JSON.stringify(urlObj)) + '$$$' + timestamp;
    }

    function unpackURL(packURLString) {
        var result = {},
            tmpArr;

        tmpArr = packURLString.split('$$$');
        result.urlObj = JSON.parse(RAD.utils.decodeURI(tmpArr[0]));
        result.timestamp = tmpArr[1];

        return result;
    }

    function HistoryStack() {
        var self = this,
            lastValue,
            currentPosition = -1,
            stack = [];

        self.push = function (data) {
            var position;
            // slice stack
            if (currentPosition !== stack.length - 1) {
                position = currentPosition + 1;
                stack = stack.slice(0, position);
            }

            if ((lastValue !== undefined) && (lastValue !== null)) {
                stack.push(lastValue);
            }

            lastValue = data;
            currentPosition = stack.length - 1;
        };

        self.getCurrent = function () {
            if ((lastValue !== undefined) && (lastValue !== null)) {
                return lastValue;
            }
            return stack[currentPosition];
        };

        self.getNext = function () {
            var position,
                result;

            position = currentPosition + 1;
            if ((position > -1) && (position < stack.length)) {
                result = stack[position];
                currentPosition = position;
            }

            return result;
        };

        self.getPrevious = function () {
            var position,
                result;

            if (lastValue) {
                stack.push(lastValue);
                currentPosition = stack.length - 1;
                lastValue = null;
            }

            position = currentPosition - 1;
            if ((position > -1) && (position < stack.length)) {
                result = stack[position];
                currentPosition = position;
            }
            return result;
        };

        self.clear = function () {
            lastValue = null;
            stack = [];
            currentPosition = stack.length - 1;
        };

        return self;
    }

    router = {

        // remove bugs associated with cleaning the local stack and repeat urls
        currentID: Math.floor(Math.random() * 100000),

        // used to calculate the difference in the current and future layouts
        currentURL: undefined,

        // used to calculate direction of stack popup (back/forward)
        lastURL: undefined,

        toBack: true,

        isBlocked: false,

        stack: new HistoryStack(),

        pushToStackRequest: false,

        navigate: function (newUrl) {
            var self = this;

            //enable entry in native history
            if (newAPI) {
                history.pushState({url: newUrl, id: self.currentID}, null, null);
            } else {
                toForward = true;
                window.location.href = START_URL + '#!' + newUrl + ID_SEPARATOR + self.currentID;
            }

            self.lastURL = newUrl;
            self.currentURL = newUrl;

            self.pushToStackRequest = false;
            self.stack.push(newUrl);
        },

        saveScoopeAsURL: function () {
            var timestamp = +new Date().getTime(),
                rootModule = getRootView(document.getElementsByTagName('body')[0]),
                rootView = core.getView(rootModule.content),
                children = buildURL(rootView);

            if (children && children.length > 0) {
                rootModule.children = children;
            }
            this.navigate(packURL(rootModule, timestamp));
        },

        onNewTransition: function () {
            this.toBack = true;
            this.isBlocked = false;
            this.pushToStackRequest = true;
        },

        back: function () {
            this.toBack = true;
            history.back();
        },

        clearAndBlock: function () {
            this.toBack = true;
            this.isBlocked = true;
            this.currentURL = undefined;
            this.lastURL = undefined;
            this.currentID = Math.floor(Math.random() * 100000);

            this.stack.clear();
        },

        extractDiffer: function (oldLayout, newLayout) {
            var i,
                l,
                result,
                attr;

            for (attr in oldLayout) {
                if (oldLayout.hasOwnProperty(attr) && attr !== "children") {
                    if (oldLayout[attr] !== newLayout[attr]) {
                        delete newLayout.children;
                        return newLayout;
                    }
                }
            }

            if (oldLayout.hasOwnProperty('children')) {
                for (i = 0, l = oldLayout.children.length; i < l; i += 1) {
                    result = this.extractDiffer(oldLayout.children[i], newLayout.children[i]);
                    if (result) {
                        return result;
                    }
                }
            }

            return result;
        },

        onPopState: function (event) {
            var param,
                differ,
                directionStr,
                changeDirection = false,
                flagToBackDirection = this.toBack;

            if (event.state && event.state.id === this.currentID && this.currentURL && !this.isBlocked) {

                if (this.lastURL && this.lastURL === event.state.url) {
                    changeDirection = true;
                    flagToBackDirection = !flagToBackDirection;
                }

                if (flagToBackDirection) {
                    param = this.stack.getPrevious();
                } else {
                    param = this.stack.getNext();
                }

                directionStr = (this.toBack) ? 'back' : 'forward';
                if (param) {
                    if (changeDirection) {
                        this.toBack = !this.toBack;
                    }
                    differ = this.extractDiffer(unpackURL(this.currentURL).urlObj, unpackURL(param).urlObj);
                    differ.direction = this.toBack;
                    core.publish("navigation.back", differ);

                    this.lastURL = this.currentURL;
                    this.currentURL = param;
                    differ.direction = directionStr;

                    core.publish('backstack.pop', differ);
                } else {
                    core.publish('backstack.empty', {direction: directionStr});
                }
            }
        }
    };

    function onMessage(channel, data) {
        var parts = channel.split('.');
        switch (parts[1]) {
            case 'beginTransition':
                router.onNewTransition();
                break;
            case 'endTransition':
                if (router.pushToStackRequest) {
                    router.saveScoopeAsURL();
                }
                break;
            case 'back':
                router.back();
                break;
            case 'clear':
                router.clearAndBlock();
                break;
        }
    }

    //initialization (auto constructor)
    self.viewID = id;
    core.subscribe('router', onMessage, self);

    if (!newAPI) {
        $(window).bind('hashchange', function () {
            var tmp = window.location.href.substring(window.location.href.lastIndexOf('#!') + 2),
                strings = tmp.split(ID_SEPARATOR),
                href = strings[0],
                id = parseInt(strings[1], 10),
                event;

            if (!toForward) {
                event = {state: {
                    id: id,
                    url: href
                }};
                router.onPopState(event);
            }
            toForward = false;
        });
    } else {
        core.window.onpopstate = function (event) {
            router.onPopState(event);
        };
    }

    self.destroy = function () {
        core.unsubscribe(onMessage, self);
    };

    return self;
});
