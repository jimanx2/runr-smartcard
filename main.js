function RunrSmartcard(){
	var pcsclite = require('pcsclite');
	var pcsc = pcsclite();
	var readers = {};
  pcsc.on('reader', function(reader){
		readers[reader.name] = reader;
		reader.on('end', function(){
			delete readers[this.name];
		});
		reader.on('status', function(status){
			reader.on('status', function(status) {
        /* check what has changed */
				if( status.atr.length != 0 ){
            reader.ATR = status.atr;

            var UID = (
              reader.ATR[0].toString(16) +
              reader.ATR[1].toString(16)
            ).toUpperCase();

            reader.UID = UID;
				}
				
        var changes = this.state ^ status.state;
        if (changes) {
            if (
							(changes & this.SCARD_STATE_EMPTY) && 
							(status.state & this.SCARD_STATE_EMPTY)
						) {
								reader.status = "card_removed";
                disconnect(reader).catch(function(err){ 
									console.log(err); 
								});
						} else if (
							(changes & this.SCARD_STATE_PRESENT) && 
							(status.state & this.SCARD_STATE_PRESENT)
						) {
								reader.status = "card_present";
						}
			  }
		});
	});
	});
	var connect = function(reader){
		return new Promise(function(rs, rx){
			reader.connect({ share_mode : this.SCARD_SHARE_SHARED }, function(err, protocol) {
				if(err) return rx(err);
				rs(reader, protocol);
			});
		});
	};
	
	var disconnect = function(reader){
		return new Promise(function(rs, rx){
			reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) {
					if (err) return rx(err);
					rs();
			});
		});
	};
	
	var transmit = function(reader, proto, payload){
		return new Promise(function(rs, rx){
			reader.transmit(payload, 40, proto, function(err, data) {
				if(reader.status != "card_present") return rx(reader.status);
				if(err) return rx(err);
				rs(reader, data);
			});
		});
	};
	
	return {
		
		getReaderList: function(res){
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(
				Object.keys(readers)
			));
		},
		getATR: function(res, query){
			var reader = readers[ Object.keys(readers)[query ? query.rId || 0 : 0] ];
			res.end(JSON.stringify(reader));
		}
		
	};
};
module.exports = RunrSmartcard.call(this);
