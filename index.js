#! /usr/bin/env node

var express = require('express');
var app = express();
var exec = require('child_process').exec;
var util = require('util');
var clc = require('cli-color');
var events = require('events');
var _ = require('underscore')
var http = require('http');
var qs = require('querystring');
var command = new events.EventEmitter();
var username;
var myip;
var receiver
var users=[{name:'alpha'},{name:'corvo attano'},{name:'max payne'}]
var userid={}
var selfie={}
var requests={}
var error = clc.red.bold;
var warn = clc.yellow;
var notice = clc.green;
var interf = process.argv.slice(2)[0]
if(interf==undefined){
  printError('Please provide an interface.\nExample: "hostel e"')
  done()
}

ip(interf)
username=getMyName()
selfie={name:username,ip:myip}

broadcast(myip)

function restart() {
  delete app
  app = express()
  requests={}
  app.get('/', function(req,res){
    if(req.query.name != username){
      users[users.length]=req.query
      userid[req.query.name]=req.query
      res.send(selfie)
    }

  });

  app.get('/request',function (req,res) {
    printWarn(req.query.name + ' is trying to connect to you')
    res.send('ack')
  })

}
function getMyName() {
  return require('os').hostname()
}

function ip(interface) {
  var os = require('os');
  var ifaces = os.networkInterfaces();

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        return;
      } else {
        // this interface has only one ipv4 adress
        if(ifname.toLowerCase().indexOf(interface) == 0){
          myip=iface.address
        }
      }
      ++alias;
    });
  });
}


function broadcast(sip) {
  var splits=sip.split('.')
  var base = _.first(splits,2).join('.')
  var subbase = Number(splits[2])
  for(var i=(subbase-2 >=0 ?subbase-2 : 0);i<=subbase+2;i++){
    for(j=1;j<=254;j++){
      var ip = base+'.'+i+'.'+j
      if(ip != myip){
        contact(ip,'',selfie,function (argument) {
          var user = JSON.parse(argument)
          users[users.length]=user
          userid[user.name]=user
        })
      }
    }
  }
}

function printNotice(argument) {
  console.log(notice(argument)+'\n');
}

function printError(argument) {
  console.log(error(argument)+'\n');
}

function printWarn(argument) {
  console.log(warn(argument)+'\n');
}

function done() {
  process.exit();
}

function contact(ip,p,args,action){
  //The url we want is `www.nodejitsu.com:1337/`
  var options = {
    host: ip,
    path: '/'+p+'?'+qs.stringify(args),
    //since we are listening on a custom port, we need to specify it by hand
    port: '8080',
    //This is what changes the request to a POST request
    method: 'GET'
  };
  callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      action(str)
    });
  }


  var req = http.request(options, callback);
  req.on('socket', function (socket) {
    socket.setTimeout(800);
    socket.on('timeout', function() {
      req.abort();
    });
  });

  req.on('error',function (argument) {
  })
  req.end();

}

function message(name,msg,action){
  //The url we want is `www.nodejitsu.com:1337/`
  var options = {
    host: userid[name].ip,
    path: '/'+username+'/?'+qs.stringify(msg),
    //since we are listening on a custom port, we need to specify it by hand
    port: '8080',
    //This is what changes the request to a POST request
    method: 'GET'
  };
  callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      action(str)
    });
  }


  var req = http.request(options, callback);
  req.on('socket', function (socket) {
    socket.setTimeout(800);
    socket.on('timeout', function() {
      if(receiver!=undefined){
        printError('Looks like '+receiver.name +' is not connected to you.')
      }
      req.abort();
    });
  });

  req.on('error',function (argument) {
  })
  req.end();

}

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdout.write(username+'> ');
process.stdin.on('data', function (text) {
  var input = text.trim('\n')
  if(receiver == undefined || input.split(' ')[0]=='upld'){
    var splits = input.split(' ')
    command.emit(splits[0], _.rest(splits))
  }else{
    if(input != 'disconnect')
    message(receiver.name,{msg:input},function (argument) {
      if(argument!='received'){
        printError('Looks like '+receiver.name +' is not connected to you.')
      }
    })
    else
      command.emit('disconnect')
  }
  process.stdout.write(username+'> ');
  if (text === 'quit\n') {
    done();
  }
});

command.on('connect',function (args) {
  if(receiver != undefined)
  printWarn("Overriding previous connection list")
  if(userid[args[0]] != undefined){
    if(receiver != undefined)
      restart()
    receiver = userid[args[0]]
    printNotice('Connected to '+receiver.name)
    contact(receiver.ip,'request/',{name:username},function (argument) {
      // body...
    })
    app.get('/'+receiver.name, function(req,res){
      if(receiver != undefined){
        if(req.query.msg=='disc'){
          printError(receiver.name+ ' has disconnected')
          command.emit('disconnect')
        }else {
          console.log(clc.blue(receiver.name)+' : '+clc.green(req.query.msg));
          res.send('received')
        }
      }
    });
  }else{
    printError("No such user")
  }

})

command.on('users',function () {
  printNotice('\nCurrently online...')
  _.each(users,function (argument) {
    printWarn('     '+argument.name)
  })
  console.log('\n');
})

command.on('disconnect',function() {
  restart()
  if(receiver!=undefined){
    message(receiver.name,{msg:'disc'},function(argument) {
      // body...
    })
  }
  receiver = undefined
})

command.on('receiver',function () {
  printNotice('   '+receiver)
  _.each(app._router.map.get,console.log)
})

command.on('upld',function (argument) {
  if(receiver != undefined){
    var path = argument.join(' ')
    console.log(path)
    var filename = require('crypto').createHash('md5').update(path.split('/')[path.split('/').length -1]).digest("hex")
    var link='/'+receiver.name+'/'+filename
    app.get(link,function (req,res) {
      res.sendfile(path)
    })
    message(receiver.name,{msg:'http://'+myip+':8080/'+receiver.name+'/'+filename},function(argument) {
      // body...
    })
  }else {
    printError('You are disconnected')
  }

})

app.get('/', function(req,res){
  if(req.query.name != username){
    users[users.length]=req.query
    userid[req.query.name]=req.query
    res.send(selfie)
  }
});

app.get('/request',function (req,res) {
  if(requests[req.query.name] == undefined && req.query.name != undefined)
    printWarn(req.query.name +' is trying to connect to you')
  requests[req.query.name]=req.query.name
  res.send('ack')
})

app.listen(8080);
