class SimplifiedWebSocket {
	constructor(url='wss://obtain.life', connect_func=null, message_func=null, close_func=null) {
		let self = this; // Plaeholder for anon functions
		if(!connect_func) {
			connect_func = function(event) {
				console.log("WebSocket Connected!");
				self.dispatch_send();
			}
		}
		if(!close_func) {
			close_func = function (event) {
				console.log("WebSocket closed!");
				if(self.last_message) {
					self.send_queue.push(self.last_message);
					self.last_message = null;
				}
				self.socket.close();
				self.timers['reconnecting'] = setTimeout(function() {
					self.connect();
				}, 500);
			}
		}
		if(!message_func) {
			message_func = function(event) {
				let data = event.data;
				if(typeof data == "string") {
					try {
						data = JSON.parse(data);
					} catch(err) {
						//console.log(err);
					}
				}
				console.log("WebSocket got data:");
				console.log(data);
			}
		}

		this.connect_func = function(event) {
			connect_func.call(self, event);
		}
		this.close_func = function(event) {
			close_func.call(self, event);
		};
		this.message_func = function(event) {
			message_func.call(self, event);
		};
		this.timers = {};
		this.send_queue = [];
		this.last_message = null;

		this.url = url;
		this.connect();
	}

	dispatch_send() {
		let self = this;
		for (let i=0; i<this.send_queue.length; i++) {
			if (this.socket && this.socket.readyState == 1) {
				let data = this.send_queue.pop();
				this.last_message = data;
				this.socket.send(data);
			} else {
				this.timers['resend'] = setTimeout(function() {
					self.dispatch_send();
					clearTimer('resend');
				}, 25)
			}
		}
	}

	connect() {
		this.socket = new WebSocket(this.url);
		this.socket.addEventListener('open', this.connect_func);
		this.socket.addEventListener('close', this.close_func);
		this.socket.addEventListener('message', this.message_func);
	}

	send(data) {
		if (typeof data == "object")
			data = JSON.stringify(data);
		this.send_queue.push(data);
		this.dispatch_send();
	}
}

window['SimplifiedWebSocket'] = SimplifiedWebSocket;
