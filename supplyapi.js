var fs=require('fs');
request_json = require('request-json');
require('console-stamp')(console, 'HH:MM:ss');
const express = require("express");
const app = express();
const cors=require('cors');

var config = fs.readFileSync('config.json'); //include configuration file
var config_json_parsed = JSON.parse(config); //parse config file
var daemon_protocol = "http://";
if (config_json_parsed["is_daemon_ssl"]) daemon_protocol = "https://";
var infinium_daemon_address_jsonrpc = daemon_protocol + config_json_parsed["daemon_host"] + ":" + config_json_parsed["daemon_port"];
var client_json_rpc = request_json.createClient(infinium_daemon_address_jsonrpc);
var last_block_header;

app.listen(config_json_parsed["api_port"], () => console.log("Server started at port",config_json_parsed["api_port"])); //set api port

app.use(express.static('public'));
app.use(cors());
app.get('/', supply);

function GetTotalSupply()
{
    client_json_rpc.post('/json_rpc', {
        jsonrpc: "2.0",
        id: "0",
        method: "get_status",
        params: {
        }
    }, function (err, res, body_old) {
        var first_response = body_old;
        if (err == null) {
            console.log("reading get_status [\x1b[32mOK\x1b[0m]");  //OK message for data readout from daemon
            client_json_rpc.post('/json_rpc', {
                jsonrpc: "2.0",
                id: "0",
                method: "get_block_header",
                params: {
                    "height_or_depth": first_response.result.top_block_height
                }
            }, function (err, res, body) {
                last_block_header = body;
                if (err == null) {
                    console.log("reading get_block_header [\x1b[32mOK\x1b[0m]");  //OK message for data readout from daemon
                    
                }
                else {
                    console.log("reading get_block_header [\x1b[31mERROR\x1b[0m]"); //ERROR message for data readout from daemon
                    console.log(error);
                }
            });
        }
        else {
            console.log("reading get_status [\x1b[31mERROR\x1b[0m]"); //ERROR message for data readout from daemon
            console.log(error);
        }
    });
}

auto_update_api_data();

function auto_update_api_data() {

	GetTotalSupply();
	//getNetworkData_json_rpc();
	console.log("updating api data...");

	setTimeout(function () {
		auto_update_api_data();
	}, config_json_parsed["api_data_update_interval"]);
}

function supply(request, response) {
    if(last_block_header)
    {
        var supply_num = last_block_header.result.block_header.already_generated_coins/(config_json_parsed["coin_decimals"]/last_block_header.result.block_header.already_generated_coins_multiply_by);
        response.send(supply_num+'');
    }
    else
    {
        response.send('N/A');
    }
}