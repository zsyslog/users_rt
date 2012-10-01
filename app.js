var md5 = require('blueimp-md5').md5;

var master_key = "CLAVE-CLAVE-CLAVE-CLAVO-CLAVE";

var totalOnline = 0;

// MongoDB defs

var mongo = require("mongodb");

var conn = new mongo.Server("localhost", 27017, {});

var	db =  new mongo.Db('db1', conn, {});

// Socket.io defs

var io_settings = {

	'browser client expires':31557600000,
	
	'polling duration':60,
	
	'log level':1,
	
	'heartbeat interval':30,
	
	'heartbeat timeout':10,
	
	'browser client minification':true,
	
	'browser client etag':true,
	
	'browser client gzip':true,
	
	'transports':['websocket','htmlfile','xhr-polling','jsonp-polling','flashsocket']

}

db.open(function() {

	var io = require('socket.io').listen(443, io_settings);

	io.sockets.on("connection", function(message) {

		message.on("newMessage", function(data) {

	        var server_hash = md5(master_key);

	        if (server_hash == data.hash) {

	            io.sockets.emit("sendEvent", data);

	            }

	    });
	
	    message.on("newSession", function(session){

	    	db.collection('onlineusers',function(err,coll) {

	            var new_sess = {

		            "url":session.url,

		            "sess_id":message.id,

	            }

				coll.insert(new_sess, function(){

					//console.log("Insert: "+session.url+"->"+message.id);

				});
					
			});
			
            totalOnline++
            
            message.on('disconnect', function (socket) {

	            totalOnline--;

	            db.collection('onlineusers',function(err,coll) {

		            var bye_sess = {

			            "url":session.url,

			            "sess_id":message.id

		            }

					coll.remove(bye_sess, function(){

						//console.log("Remove : "+session.url+"->"+message.id);

					});

				});

			});

	    });
				

        message.on("requestTotal", function(data){

            var server_hash = md5(master_key);

            if (server_hash == data.hash) {
            		
	            	db.collection('onlineusers',function(err,coll) {
	            		
	            		coll.find().count(function(err,count){
	
	                    	io.sockets.emit("pushTotal", count);
	                    	
	                    });
                    
                    });

                }

        });
        
        message.on("requestStats", function(data){

            var server_hash = md5(master_key);

            if (server_hash == data.hash) {
            	
            		db.collection('onlineusers',function(err,coll) {
						
						var reduce = function (key, value) {
						
						    var sum = 0;
						
						    value.forEach(function (v) {
						    
						    	sum++;
						    
						    });
						 
						    return sum;
						
						}
						
						var map = function () {
						    
						    emit(this.url, {s:this.sess_id});
						
						}
						
						reduce.toString();
						
						coll.mapReduce(map,reduce,{out:{inline:0},verbose:true},function(err,response,stats){
							
							var json_out = {};
							
							json_out.response = response;
							
							io.sockets.json.emit("pushStats", response);
						
						});
						
	
					}); 

                }

        });
	
	});

});