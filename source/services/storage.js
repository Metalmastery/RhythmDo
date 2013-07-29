/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/17/13
 * Time: 2:12 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.service('service.storage', RAD.Blanks.Service.extend({
    onReceiveMsg : function (channel, data) {
        "use strict";

        localStorage.setItem('userData', unescape("%7B%22birthDate%22%3A604702800000%2C%22tasks%22%3A%5B%7B%22text%22%3A%22%22%2C%22type%22%3A2%2C%22id%22%3A269%2C%22date%22%3A1375115298172%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22dgfhdh%22%2C%22type%22%3A2%2C%22id%22%3A88%2C%22date%22%3A1375115298176%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%22%2C%22type%22%3A3%2C%22id%22%3A152%2C%22date%22%3A1375201698180%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%u0432%u0430%u0440%u0430%u043F%22%2C%22type%22%3A3%2C%22id%22%3A294%2C%22date%22%3A1375201698183%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22gi%22%2C%22type%22%3A1%2C%22id%22%3A292%2C%22date%22%3A1375115298187%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%u0432%u0430%u043F%u0440%u0432%u0430%u0440%u0430%22%2C%22type%22%3A3%2C%22id%22%3A130%2C%22date%22%3A1375201698190%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%20%20%20%202%20%20%20%20%20%20123132%u0432%u0430%u043F%u044B%u0432%u0430%u043F%u0440%22%2C%22type%22%3A1%2C%22id%22%3A39%2C%22date%22%3A1374942498194%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22gadfgasdfasdfasdfasd%22%2C%22type%22%3A1%2C%22id%22%3A58%2C%22date%22%3A1375547298197%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%22%2C%22type%22%3A3%2C%22id%22%3A267%2C%22date%22%3A1375028898201%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%20%20%20%202%20%20%20%20%20%20123132%u0432%u0430%u043F%u044B%u0432%u0430%u043F%u0440%22%2C%22type%22%3A2%2C%22id%22%3A100%2C%22date%22%3A1375460898206%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22SDAGFSDFGSD%22%2C%22type%22%3A2%2C%22id%22%3A102%2C%22date%22%3A1374769698210%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%22%2C%22type%22%3A3%2C%22id%22%3A138%2C%22date%22%3A1374942498213%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%u0432%u0430%u0440%u043F%u0430%22%2C%22type%22%3A1%2C%22id%22%3A209%2C%22date%22%3A1374942498217%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22sdfgsdfg%22%2C%22type%22%3A3%2C%22id%22%3A247%2C%22date%22%3A1375201698220%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%2255555555555%22%2C%22type%22%3A3%2C%22id%22%3A32%2C%22date%22%3A1375374498223%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%2255555555555%22%2C%22type%22%3A1%2C%22id%22%3A210%2C%22date%22%3A1375547298225%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22fdhdfgh%22%2C%22type%22%3A3%2C%22id%22%3A137%2C%22date%22%3A1375115298228%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22fghjfghj%22%2C%22type%22%3A%221%22%2C%22id%22%3A241%2C%22date%22%3A1374769698232%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%2C%7B%22text%22%3A%22%u0432%u0430%u043F%u0440%u0432%u0430%u0440%22%2C%22type%22%3A%221%22%2C%22id%22%3A64%2C%22date%22%3A1374942498234%2C%22time%22%3A%2219%3A28%3A18%22%2C%22repeat%22%3Anull%2C%22reminder%22%3Afalse%7D%5D%7D"));

        var action = channel.split('.');
        action = action[action.length-1] + 'Data';
        if (typeof this[action] === 'function'){
            this[action].apply(this, data);
        }
    },

    onInitialize : function(){
        "use strict";
        this.model = RAD.model('task_list');
    },

    restoreData : function(){
        "use strict";
        var data = localStorage.getItem('userData');
        if (data && data.length) {
            data = JSON.parse(data);
        }

        if (data.birthDate && data.tasks) {
            this.model.set(data.tasks);
            this.application.bio.birthDateTimestamp = data.birthDate;
            this.application.bio.birthDate = new Date(data.birthDate);
            this.application.bio.currentDay = Math.floor(((new Date().getTime() - data.birthDate)) / 86400000);
        }
    },

    saveData : function(data){
        "use strict";
        localStorage.setItem('userData', JSON.stringify({birthDate : this.application.bio.birthDate, tasks : this.model.toJSON()}));
    }

}));