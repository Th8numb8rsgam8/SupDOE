const initFunction = (function () {

	"use strict";

	const vartype_input = {
		categorical: 
		'<div class="category_text">' + 
		'<div><input type="text" placeholder="name" required>' + 
		'<textarea rows="10" cols="40" placeholder="value" required></textarea>' + 
		'</div></div>' + 
		'<button class="remove_category">Remove Category</button>' + 
		'<button class="add_category">Add Category</button>',

		integer: 
		'<input type="text" class="low_int" title="Enter Integer" placeholder="low integer" required>' + 
		'<input type="text" class="high_int" title="Enter Integer" placeholder="high integer" required>',

		continuous: 
		'<input type="text" class="low_num" title="Enter Number" placeholder="low limit" required>' + 
		'<input type="text" class="high_num" title="Enter Number" placeholder="high limit" required>'
	};

	// create variable type selection menu
	const variable_options = ["categorical", "integer", "continuous"];
	let variable_options_select = "";
	variable_options.forEach( (option) => 
	{
		if (option == "categorical") {
		variable_options_select += `<option selected="selected" value="${option}">${option}</option>`;
		}
		else {
		variable_options_select += `<option value="${option}">${option}</option>`;
		}
	});

	function openNav() {
		const experiment_menu = document.getElementById("experiment_nav");
		experiment_menu.style.display = "block";

		const docs = document.getElementsByClassName("document");
		let sdb_exps = "";
		let tdb_exps = "";
		for (let i=0; i < docs.length; i++)
		{
			const doc_path = docs[i].attributes["value"].value;
			const doc_type = doc_path.split("/")[0];
			let draggable_doc = false;
			if (docs[i].title == "true"){draggable_doc = true};

			if (doc_type == "tdb")
			{
				tdb_exps += `<div id='exp ${doc_path}' draggable='${draggable_doc}'` + 
							` value='${doc_path}'>${docs[i].innerHTML}</div>`;
			}
			else if (doc_type == "sdb")
			{
				sdb_exps += `<div id='exp ${doc_path}' draggable='${draggable_doc}'` + 
							`value='${doc_path}'>${docs[i].innerHTML}</div>`;
			}
		}

		document.getElementById("sdb_experiments").innerHTML = sdb_exps;
		document.getElementById("tdb_experiments").innerHTML = tdb_exps;
	}


	function closeNav() {
		document.getElementById("experiment_nav").style.display = "none";
		document.getElementById("jog_files").innerHTML = "";
		document.getElementById("experiments_chosen").innerHTML = "";
		document.getElementById("sdb_experiments").innerHTML = "";
		document.getElementById("tdb_experiments").innerHTML = "";
	}


	function drag_experiment() {
		event.dataTransfer.setData("doc_name", event.target.attributes["value"].value); 
	}


	function drop_experiment() {
		event.preventDefault();
		let doc_name = event.dataTransfer.getData("doc_name");
		let tgt = null;

		if (doc_name)
		{
			if (event.target.classList.contains("exp"))
				{tgt = event.target;}
			else
				{tgt = event.target.parentElement;}

			if (tgt.id == "experiments_chosen" || tgt.id.slice(0,3) == doc_name.split("/")[0])
			{
			  tgt.appendChild(document.getElementById(`exp ${doc_name}`));
			}
		}
	}


	function drag_jogfile() {
		event.dataTransfer.setData("jog_id", event.target.id); 
	}


	function drop_jogfile() {
		event.preventDefault();
		let jog_id = event.dataTransfer.getData("jog_id");

		if (jog_id)
		{
			let jog_doc = document.getElementById(jog_id);
			let tgt = null;

			if (jog_id != event.target.id)
			{
				if (event.target.id == "jog_files")
				{
					tgt = event.target;
					tgt.removeChild(jog_doc);
					tgt.appendChild(jog_doc);
				}
				else if (event.target.parentElement.id == "jog_files")
				{
					tgt = event.target.parentElement;
					tgt.removeChild(jog_doc);
					tgt.insertBefore(jog_doc, tgt.children[event.target.id]);
				}
				else
				{
					document.getElementById("jog_files").removeChild(jog_doc);
				}
			}
		}
	}


	function addCategory()
	{
		const current_inputs = event.target.parentElement;
		let new_category = document.createElement("input");
		new_category.type = "text";
		new_category.placeholder = "name";
		new_category.required = "required";

		let new_textarea = document.createElement("textarea");
		new_textarea.rows = "10";
		new_textarea.cols = "40";
		new_textarea.placeholder = "value";
		new_textarea.required = "required";

		let category_field = document.createElement("div");
		category_field.appendChild(new_category);
		category_field.appendChild(new_textarea);

		current_inputs.querySelector(".category_text").appendChild(category_field);
	}


	function removeCategory()
	{
		const current_inputs = event.target.parentElement;
		let category_text = current_inputs.querySelector(".category_text");
		const num_inputs = category_text.getElementsByTagName("div").length;

		if (num_inputs > 2)
		{
			category_text.removeChild(category_text.lastChild);
		}
	}


	function select_vartype()
	{
		let vartype_selection = event.target.value;
		let vartype_name = event.target.id;
		let value_inputs = document.getElementById(`${vartype_name} values`);

		value_inputs.innerHTML = vartype_input[vartype_selection];

		if (vartype_selection == "categorical") {

			value_inputs.querySelector(".add_category").onclick = addCategory;
			value_inputs.querySelector(".remove_category").onclick = removeCategory;
			value_inputs.querySelector(".add_category").click();
		}
	}


	function allowDrop()
	{
		event.preventDefault();
	}


	function drag_player()
	{
		event.dataTransfer.setData("player_name", event.target.title); 
		event.dataTransfer.setData("source_classes", event.target.parentElement.classList);
	}


	function drop_player()
	{
		event.preventDefault();
		let target_classes = [];
		let player_name = event.dataTransfer.getData("player_name");
		let source_classes = event.dataTransfer.getData("source_classes").split(" ");
		let player_added = document.createElement("div");

		player_added.innerHTML = player_name;
		player_added.title = player_name;
		player_added.draggable = true;

		if (event.target.classList.contains("subset") || event.target.classList.contains("player_select")) {
			target_classes = event.target.classList;
			//event.target.appendChild(player_added);
		}
		else {
			target_classes = event.target.parentElement.classList;
			//event.target.parentElement.appendChild(player_added);
		}

		if (source_classes.join(" ") != target_classes.toString()) {
			if (source_classes[1] == target_classes[1]) {

				document.getElementsByClassName(target_classes.toString())[0].appendChild(player_added);
				document.querySelectorAll(`.${source_classes.join(".")} div`).forEach( (option) => {
					if (option.title == player_name) {
						option.remove();
					}
				});
			}
		}
	}


	function reset_subsets() {
		let set_number = event.target.classList[1];
		let subsets = document.getElementsByClassName(`subset ${set_number}`);
		let player_selections = document.getElementsByClassName(`player_select ${set_number}`)[0];

		for (let i=0; i < subsets.length; i++) {

			while (subsets[i].children.length > 1) {
				player_selections.appendChild(subsets[i].children[1]);

			}
		}
	}


	function add_subset() {
		let set_number = event.target.classList[1];
		let subsets = document.getElementById(set_number);

		let new_subset = document.createElement("div");
		new_subset.classList.add("subset",`${set_number}`,`subset_${subsets.children.length + 1}`);
		new_subset.ondragstart = drag_player;
		new_subset.ondragover = allowDrop;
		new_subset.ondrop = drop_player;
		let subset_title = document.createElement("div");
		subset_title.innerHTML = `Subset ${subsets.children.length + 1}`;
		subset_title.draggable = false;
		new_subset.appendChild(subset_title);
		subsets.appendChild(new_subset);
	}


	function remove_subset() {
		let set_number = event.target.classList[1];
		let subsets = document.getElementById(set_number);

		if (subsets.children.length > 2) {
			let last_subset = subsets.lastChild;
			let player_selections = document.getElementsByClassName(`player_select ${set_number}`)[0];
			while (last_subset.children.length > 1) {
				player_selections.appendChild(last_subset.children[1]);
			}
			subsets.removeChild(last_subset);
		}
	}


	function add_set(column_space, players) {

		let set_list = document.querySelector("#player_content ul");
		let set_content = document.querySelector("#player_content ul").innerHTML;
		const min_subsets_list = set_list.querySelectorAll(".min_subsets");
		const max_subsets_list = set_list.querySelectorAll(".max_subsets");

		let new_set = "<li class='table_row'>";
		new_set += `<div style='flex-basis:${column_space}%;'>Set ${set_list.children.length}</div>`;

		// add second column
		new_set += `<div style='flex-basis:${column_space}%;' class='player_set'>`;
		new_set += `<div id='set_${set_list.children.length}'>`;
		new_set += `<div class='subset set_${set_list.children.length} subset_1'>`;
		new_set += `<div draggable='false'>Subset 1</div></div>`;
		new_set += `<div class='subset set_${set_list.children.length} subset_2'>`;
		new_set += `<div draggable='false'>Subset 2</div></div></div>`;
		new_set += `<button class='add_subset set_${set_list.children.length}'>Add Subset</button>`;
		new_set += `<button class='remove_subset set_${set_list.children.length}'>Remove Subset</button>`;
		new_set += `<button class='reset_subsets set_${set_list.children.length}'>Reset</button></div>`;

		// add third column
		new_set += `<div style='flex-basis: ${column_space}%;'>`;
		new_set += `<div class='player_select set_${set_list.children.length}'>`;
		players.forEach((player) =>
			{
				new_set += `<div draggable='true' title='${player}'>${player}</div>`;
			});
		new_set += `</div>`;
		new_set += `<div>${vartype_input.integer}</div>`;
		new_set += `</div></li>`;

		document.querySelector("#player_content ul").innerHTML = set_content + new_set;

		// preserve set limit numbers
		const new_set_content = document.querySelector("#player_content ul");
		for (let i=0; i < min_subsets_list.length; i++)
		{
			const min_limit = new_set_content.querySelector(`.min_subsets.set_${i+1}`);
			const max_limit = new_set_content.querySelector(`.max_subsets.set_${i+1}`);
			min_limit.value = min_subsets_list[i].value;
			max_limit.value = max_subsets_list[i].value;
		}

		let subsets = document.querySelectorAll(".subset");
		subsets.forEach((subset) =>
		{
			subset.ondragstart = drag_player;
			subset.ondragover = allowDrop;
			subset.ondrop = drop_player;
		});
		
		let player_menus = document.querySelectorAll(".player_select");
		player_menus.forEach((plr_menu) =>
		{
			plr_menu.ondragstart = drag_player;
			plr_menu.ondragover = allowDrop;
			plr_menu.ondrop = drop_player;
		});
		const subset_limits = player_menus[player_menus.length-1].parentElement.lastChild;
		subset_limits.firstChild.placeholder = "min. subsets";
		subset_limits.firstChild.classList.remove("low_int");
		subset_limits.firstChild.classList.add("min_subsets", `set_${set_list.children.length-1}`);
		subset_limits.lastChild.placeholder = "max. subsets";
		subset_limits.lastChild.classList.remove("high_int");
		subset_limits.lastChild.classList.add("max_subsets", `set_${set_list.children.length-1}`);

		let add_subset_btns = document.querySelectorAll(".add_subset");
		let remove_subset_btns = document.querySelectorAll(".remove_subset");
		let reset_subsets_btns = document.querySelectorAll(".reset_subsets");
		add_subset_btns.forEach((btn) => {btn.onclick = add_subset;});
		remove_subset_btns.forEach((btn) => {btn.onclick = remove_subset;});
		reset_subsets_btns.forEach((btn) => {btn.onclick = reset_subsets;});
	}


	function remove_set() {
		let set_list = document.querySelectorAll("#player_content ul")[0];
		if (set_list.children.length > 2) {
			set_list.removeChild(set_list.lastChild);
		}
	}


	function upload_error(error_msg) {
		const error_screen = document.getElementById("error_screen");
		error_screen.children[0].innerHTML = error_msg;
		error_screen.classList.add("fade_out");
	}


	function upload_variables() {

		const variable_data = document.querySelectorAll("#variable_content ul .table_row");
		const player_data = document.getElementsByClassName("player_set");

		// abort upload if no experiment inputs are found
		if (variable_data.length == 0)
		{
			if (player_data.length == 0)
			{
				upload_error("NO EXPERIMENT INPUTS FOUND!");
				return;
			}
			else if (player_data.length == 1)
			{
				let empty_subsets = 0;
				let subset_list = player_data[0].firstChild.childNodes;
				subset_list.forEach( (subset) => {
					if (subset.children.length == 1) {
						empty_subsets += 1;
					}
				});

				if (empty_subsets == subset_list.length)
				{
					upload_error("NO EXPERIMENT INPUTS FOUND!");
					return;
				}
			}
		}

		// check variable data for input errors
		variable_data.forEach(function(row) {
			const variable_name = row.querySelector("div select").id;
			const variable_type = row.querySelector("div select").value;
			const row_values = row.children[`${variable_name} values`];

			if (variable_type == "integer") {

				const low_int = row_values.querySelector(".low_int");
				const high_int = row_values.querySelector(".high_int");

				if (low_int.value == parseInt(low_int.value) &&
					parseInt(low_int.value) <= parseInt(high_int.value)) {
					low_int.classList.remove("err");
				}
				else {
					low_int.classList.add("err");
				}

				if (high_int.value == parseInt(high_int.value) &&
					parseInt(low_int.value) <= parseInt(high_int.value)) 
				{
					high_int.classList.remove("err");
				}
				else {
					high_int.classList.add("err");
				}
			}

			else if (variable_type == "continuous") {

				const low_num = row_values.querySelector(".low_num");
				const high_num = row_values.querySelector(".high_num");

				if (low_num.value == parseFloat(low_num.value) &&
					parseFloat(low_num.value) <= parseFloat(high_num.value)) 
				{
					low_num.classList.remove("err");
				}
				else {
					low_num.classList.add("err");
				}

				if (high_num.value == parseFloat(high_num.value) &&
					parseFloat(low_num.value) <= parseFloat(high_num.value)) 
				{
					high_num.classList.remove("err");
				}
				else {
					high_num.classList.add("err");
				}
			}
			
			else if (variable_type == "categorical") {
				const categories = row_values.querySelector(".category_text").children;

				for (let i=0; i < categories.length; i++) {
					const category_name = categories[i].firstChild;
					const category_value = categories[i].lastChild;

					if (category_name.value.trim().length == 0) {
						category_name.classList.add("err");
					}
					else {
						category_name.classList.remove("err");
					}

					if (category_value.value.trim().length == 0) {
						category_value.classList.add("err");
					}
					else {
						category_value.classList.remove("err");
					}
				}
			}
		});


		// check player data for input errors
		if (player_data.length == 1) {
			let subset_list = player_data[0].firstChild.childNodes;
			let empty_subsets = 0;
			subset_list.forEach( (subset) => {
				if (subset.children.length == 1) {
					empty_subsets += 1;
				}
			});

			if (empty_subsets < subset_list.length) {
				subset_list.forEach( (subset) => {
					if (subset.children.length == 1) {
						subset.classList.add("err");
					}
					else {
						subset.classList.remove("err");
					}
				});

				const subset_limits = player_data[0].nextSibling.lastChild.children;
				const min_subsets = subset_limits[0];
				const max_subsets = subset_limits[1];

				if (min_subsets.value == parseInt(min_subsets.value) &&
					parseInt(min_subsets.value) > 0 &&
					parseInt(min_subsets.value) <= subset_list.length &&
					parseInt(min_subsets.value) <= parseInt(max_subsets.value))
				{
					min_subsets.classList.remove("err");
				}
				else {
					min_subsets.classList.add("err");
				}

				if (max_subsets.value == parseInt(max_subsets.value) &&
					parseInt(max_subsets.value) > 0 &&
					parseInt(max_subsets.value) <= subset_list.length &&
					parseInt(min_subsets.value) <= parseInt(max_subsets.value))
				{
					max_subsets.classList.remove("err");
				}
				else {
					max_subsets.classList.add("err");
				}
			}
			else 
			{
				subset_list.forEach( (subset) => {
						subset.classList.remove("err");
				});
			}
		}

		// there is more than one set
		else {
			for (let i=0; i < player_data.length; i++) {
				let subset_list = player_data[i].firstChild.childNodes;
				subset_list.forEach( (subset) => {
					if (subset.children.length == 1) {
						subset.classList.add("err");
					}
					else {
						subset.classList.remove("err");
					}
				});

				const subset_limits = player_data[i].nextSibling.lastChild.children;
				const min_subsets = subset_limits[0];
				const max_subsets = subset_limits[1];

				if (min_subsets.value == parseInt(min_subsets.value) &&
					parseInt(min_subsets.value) > 0 &&
					parseInt(min_subsets.value) <= subset_list.length &&
					parseInt(min_subsets.value) <= parseInt(max_subsets.value))
				{
					min_subsets.classList.remove("err");
				}
				else {
					min_subsets.classList.add("err");
				}

				if (max_subsets.value == parseInt(max_subsets.value) &&
					parseInt(max_subsets.value) > 0 &&
					parseInt(max_subsets.value) <= subset_list.length &&
					parseInt(min_subsets.value) <= parseInt(max_subsets.value))
				{
					max_subsets.classList.remove("err");
				}
				else {
					max_subsets.classList.add("err");
				}
			}
		}

		// gather all inputs with errors
		const input_errors = document.getElementsByClassName("err");
		if (input_errors.length > 0) {
			upload_error("YOU HAVE INPUT ERRORS! \n\n CHECK YOUR VARIABLES!");
		}
		else { // NO INPUT ERRORS!
			const doc_name = document.getElementById("document_variables").title.toString();
			let document_data = {};
			document_data[doc_name] = {"Variable Data": {}, "Players": {}};

			variable_data.forEach(function(row) {
				const variable_name = row.querySelector("div select").id;
				const variable_type = row.querySelector("div select").value;
				const row_values = row.children[`${variable_name} values`];

				if (variable_type == "integer") {
					const low_int = row_values.querySelector(".low_int");
					const high_int = row_values.querySelector(".high_int");

					document_data[doc_name]["Variable Data"][variable_name] = {
						"values": [parseInt(low_int.value), parseInt(high_int.value)], 
						"type": variable_type
					}
				}
				else if (variable_type == "continuous") {
					const low_num = row_values.querySelector(".low_num");
					const high_num = row_values.querySelector(".high_num");

					document_data[doc_name]["Variable Data"][variable_name] = {
						"values": [parseFloat(low_num.value), parseFloat(high_num.value)], 
						"type": variable_type
					}
				}
				else if (variable_type == "categorical") {
					const categories = row_values.querySelector(".category_text").children;
					let category_dictionary = {}; 
					for (let i=0; i < categories.length; i++) {
						const category_name = categories[i].firstChild;
						const category_value = categories[i].lastChild;
						category_dictionary[category_name.value] = category_value.value;
					}
					document_data[doc_name]["Variable Data"][variable_name] = {
						"values": category_dictionary, 
						"type": variable_type
					}
				}
			});

			for (let i=0; i < player_data.length; i++) {
				const subset_list = player_data[i].firstChild.childNodes;
				const limits = player_data[i].nextSibling.lastChild.children;
				let collect_subset_list = [];
				subset_list.forEach( (subset) => {
					if (subset.children.length > 1) {
						let collect_subset = [];
						for (let j=1; j < subset.children.length; j++) {
							collect_subset.push(subset.children[j].textContent);
						}
						collect_subset_list.push(collect_subset);
					}
				});
				document_data[doc_name]["Players"][i] = {
					"set": collect_subset_list,
					"limits": [parseInt(limits[0].value), parseInt(limits[1].value)]};
			}

			const xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					const upload_success = document.getElementById("upload_success");
					upload_success.innerHTML = this.responseText;
					upload_success.classList.add("fade_out");
					const doc = document.querySelector(`.document[value='${doc_name}']`);
					doc.title = true;
					update_experiment_schema();
				}
			}
			const data = JSON.stringify(document_data);
			xhttp.open("POST", "/experiment_inputs/");
			xhttp.send(data);
		}
	}


	function update_document() {
		const document_text = document.getElementById("scenario_text").value;
		const doc_path = document.getElementById("scenario_text").title;

		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				const documents = document.querySelectorAll(".document");
				documents.forEach((doc) =>

					// call load_Variables by clicking on the document name from menu
					{if (doc.attributes["value"].value == doc_path) {doc.click();}});
				update_experiment_schema();
			}
		}
		xhttp.open("POST", doc_path);
		xhttp.send(document_text);
	}


	let exp_progress_id;
	function experiment_progress() {
		var xhttp = new XMLHttpRequest();
		const e = new Event("change");
		const exp_progress = document.getElementById("exp_progress");
		document.getElementById("experiment_nav").style.setProperty("pointer-events","none");
		exp_progress.classList.add("show_progress");
		const exp_ring = exp_progress.firstElementChild;
		const progress_value = exp_ring.firstElementChild;
		exp_ring.style.setProperty('--progress', "0");
		progress_value.value = "0%";

		return setInterval(function()
		{
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					progress_value.value = `${this.responseText}%`;
					exp_ring.style.setProperty('--progress', this.responseText);
					progress_value.dispatchEvent(e);
				}
			}
			xhttp.open("GET", "experiment_progress");
			xhttp.send();
		}, 1000);
	}


	function exp_progress_check() {
		const progress_value = event.target.value;
		if (progress_value == '100%')
		{
			const existing_schema = document.querySelectorAll(".schema_name");
			let schema_exists = false;
			for (let i=0; i < existing_schema.length; i++)
			{
				if (existing_schema[i].id === event.target.title)
				{
					schema_exists = true;
					break;
				}
			}
			if (!schema_exists)
			{
				// add new experiment to existing list
				const exp_schema = document.getElementById("experiment_schema").firstChild;
				const schema_item = document.createElement("li");
				const schema_name = document.createElement("span");
				schema_item.style.setProperty("--backgrnd-color", "darkturquoise");
				schema_item.style.setProperty("--name-color", "#fce4ec");
				schema_item.onclick = get_experiment_info;
				schema_name.style.setProperty("--hover-name", "black");
				schema_item.id = event.target.title;
				schema_item.classList.add("schema_name");
				schema_name.innerHTML = event.target.title;
				schema_item.appendChild(schema_name);
				exp_schema.appendChild(schema_item);
			}

			// stop dispaying progress wheel and requesting for progress
			const exp_progress = document.getElementById("exp_progress");
			exp_progress.classList.remove("show_progress");
			document.getElementById("experiment_nav").style.setProperty("pointer-events","auto");
			clearInterval(exp_progress_id)
		}
	}


	function run_experiment() {
		const msg_file = document.getElementById("msg_file").value;
		let experiment_name = document.getElementById("experiment_name").value;
		const experiment_list = document.getElementById("experiments_chosen").childNodes;
		const sample_size = document.getElementById("num_of_samples").value;
		const jog_files = document.getElementById("jog_files").childNodes;
		const msg_list = document.querySelectorAll(".msg input");
		let error_msgs = ""; 

		let experiment_assets = new Object();

		const exp_name_pattern = /^[\w-\s]+$/;
		if (exp_name_pattern.test(experiment_name))
		{
			experiment_name = experiment_name
				.replace(/^[-_\s]+|[-_\s]+$/g,'')
				.replace(/[-\s]+/g,'_')
				.toLowerCase();
		}
		else 
		{
			error_msgs += "IMPROPER EXPERIMENT NAME FORMAT! \n\n";
		}

		const msg_file_pattern = /^[\w-]+$/;
		if (!msg_file_pattern.test(msg_file))
		{
			error_msgs += "IMPROPER/MISSING MESSAGE FILE NAME! \n\n";
		}

		if (jog_files.length == 0) 
		{
			error_msgs += "NO JOG FILES PROVIDED! \n\n";
		}

		if (experiment_list.length == 0) 
		{
			error_msgs += "NO EXPERIMENT INPUTS PROVIDED! \n\n";
		}

		if (sample_size != parseInt(sample_size) || parseInt(sample_size) <= 0)
		{
			error_msgs += "IMPROPER/MISSING SAMPLE SIZE! \n\n";
		}

		let selected_msgs = [];
		msg_list.forEach( (msg) => {
			if (msg.checked){selected_msgs.push(msg.id);}
		});

		if (selected_msgs.length == 0)
		{
			error_msgs += "NO MESSAGES SELECTED!";
		}

		if (error_msgs)
		{
			const exp_error_screen = document.getElementById("exp_error_screen");
			exp_error_screen.children[0].innerHTML = error_msgs;
			exp_error_screen.classList.add("fade_out");
		}
		else { // no experiment assets errors
			experiment_assets["Experiment Name"] = experiment_name;
			experiment_assets["Sample Size"] = sample_size;
			experiment_assets["Jog Files"] = []; 
			experiment_assets["Experiment Inputs"] = []; 
			experiment_assets["Messages"] = selected_msgs;
			experiment_assets["Message File"] = msg_file;
			for (let i=0; i < jog_files.length; i++) {
				experiment_assets["Jog Files"].push(
				{
					"name": jog_files[i].innerHTML,
					"content": jog_files[i].value
				});
			}
			experiment_list.forEach((list) => {
				experiment_assets["Experiment Inputs"].push(list.attributes["value"].value);
			});

			const xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					document.getElementById("exp_progress_value").title = experiment_name;
					exp_progress_id = experiment_progress();
				}
			}

			let post_body = JSON.stringify(experiment_assets);
			xhttp.open("POST", 'run_experiment'); 
			xhttp.send(post_body);
		}
	}


	function get_experiment_info()
	{
		let experiment_name;
		if (event.target.nodeName == "SPAN")
		{
			experiment_name = event.target.parentElement.id;
		}
		else
		{
			experiment_name = event.target.id;
		}

		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				const exp_schema = JSON.parse(this.responseText);

				document.getElementById("msg_file").value = exp_schema["Message File"]
				document.getElementById("experiment_name").value = exp_schema["Experiment Name"]
				document.getElementById("num_of_samples").value = exp_schema["Sample Size"]

				const jog_file_list = document.getElementById("jog_files");
				if (jog_file_list.childNodes.length > 0)
				{
					jog_file_list.innerHTML = "";
				}

				const jog_files = exp_schema["Jog Files"];
				jog_files.forEach((file) =>
				{
					let new_jog_file = document.createElement("div");
					new_jog_file.id = `jog ${file["name"]}`;
					new_jog_file.innerHTML = file["name"];
					new_jog_file.draggable = true;
					new_jog_file.value = file["content"];
					jog_file_list.appendChild(new_jog_file);
				});

				const msg_list = document.querySelectorAll(".msg input");
				const selected_msgs = exp_schema["Messages"];
				msg_list.forEach( (msg) => {
					msg.checked = false;
					if (selected_msgs.includes(msg.id)){msg.checked = true;}
				});

				const experiment_list = document.getElementById("experiments_chosen");
				const tdb_list = document.getElementById("tdb_experiments");
				const sdb_list = document.getElementById("sdb_experiments");
				let restore_docs = {"tdb": [], "sdb": []};
				experiment_list.childNodes.forEach((input_file) => 
				{
					const doc_name = input_file.attributes["value"].value;
					const doc_type = doc_name.split("/")[0];
					restore_docs[doc_type].push(doc_name);
				});

				for (let [type, names] of Object.entries(restore_docs))
				{
					names.forEach((name) =>
					{
						if (type === "tdb")
						{
							tdb_list.appendChild(document.getElementById(`exp ${name}`));
						}
						else if (type === "sdb")
						{
							sdb_list.appendChild(document.getElementById(`exp ${name}`));
						}
					});
				}
				const selected_files = exp_schema["Experiment Inputs"];
				selected_files.forEach((name) =>
				{
					experiment_list.appendChild(document.getElementById(`exp ${name}`));
				});
			}
		}
		xhttp.open("POST", "experiment_info");
		xhttp.send(experiment_name);
	}


	function load_experiment_schema(doc_info)
	{
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				const exp_schema = document.getElementById("experiment_schema").firstChild;
				if (this.responseText)
				{
					const experiment_list = JSON.parse(this.responseText);
					for (let [exp_name, docs] of Object.entries(experiment_list))
					{
						let valid_docs = []
						for (let [doctype, doc_list] of Object.entries(docs))
						{
							doc_list.forEach((doc_name) => {
								try
								{
									const valid = doc_info[doctype][doc_name]["exp_valid"];
									valid_docs.push(valid);
								}
								catch (err)
								{
									valid_docs.push(false);
								}
							});
						}
						const all_valid = valid_docs.every(v => v === true);
						const schema_item = document.createElement("li");
						const schema_name = document.createElement("span");

						if (all_valid)
						{
							schema_item.style.setProperty("--backgrnd-color", "darkturquoise");
							schema_item.style.setProperty("--name-color", "#fce4ec");
							schema_item.onclick = get_experiment_info;
							schema_name.style.setProperty("--hover-name", "black");
						}
						else
						{
							schema_item.style.setProperty("--backgrnd-color", "crimson");
							schema_item.style.setProperty("--name-color", "crimson");
							schema_name.style.setProperty("--hover-name", "white");
						}
						schema_item.id = exp_name;
						schema_item.classList.add("schema_name");
						schema_name.innerHTML = exp_name;
						schema_item.appendChild(schema_name);
						exp_schema.appendChild(schema_item);
					}
				}
			}
		}
		xhttp.open("GET", "experiment_list"); 
		xhttp.send();
	}


	function update_experiment_schema()
	{
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) 
			{
				const updated_experiments = JSON.parse(this.responseText);
				for (let [exp_name, valid] of Object.entries(updated_experiments))
				{
					const schema_item = document.getElementById(exp_name);
					if (valid)
					{
						schema_item.style.setProperty("--backgrnd-color", "darkturquoise");
						schema_item.style.setProperty("--name-color", "#fce4ec");
						schema_item.onclick = get_experiment_info;
						schema_item.firstChild.style.setProperty("--hover-name", "black");
					}
					else
					{
						schema_item.style.setProperty("--backgrnd-color", "crimson");
						schema_item.style.setProperty("--name-color", "crimson");
						schema_item.onclick = null;
						schema_item.firstChild.style.setProperty("--hover-name", "white");
					}
				}
			}
		}
		xhttp.open("GET", "update_experiment");
		xhttp.send();
	}


	function load_experiment(experiment_path, document_inputs) {

		let doc_selection = document.querySelector(`[value='${experiment_path}']`);
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {

				// add experiment data if experiment inputs for the document exist
				if (this.responseText)
				{
					doc_selection.title = true;
					const experiment_inputs = JSON.parse(this.responseText);
					let combined_sets = []
					for (let set in experiment_inputs["Players"])
					{
						for (let i=0; i < experiment_inputs["Players"][set]["set"].length; i++)
						{
							combined_sets.splice(combined_sets.length, 0, ...experiment_inputs["Players"][set]["set"][i]);
						}
					}

					const variable_inputs = document.querySelectorAll("#variable_content .table_row");
					const add_set_btn = document.getElementById("add_set");
					let doc_vars = []; 

					for (let row = 0; row < variable_inputs.length; row++)
					{
						try
						{
							let variable_name = variable_inputs[row].firstChild.innerHTML;
							doc_vars.push(variable_name);
							let experiment_data = experiment_inputs["Variable Data"][variable_name];

							let var_type_select = variable_inputs[row].querySelector(`[id='${variable_name}']`);
							let variable_values = variable_inputs[row].querySelector(`[id='${variable_name} values']`);

							// change variable type based on experiment input variable type
							var_type_select.value = experiment_data["type"];
							const e = new Event("change");
							var_type_select.dispatchEvent(e);

							if (var_type_select.value == "categorical")
							{
								let add_category_btn = variable_values.querySelector(".add_category");
								let category_text = variable_values.firstChild.children;
								let category_names = Object.keys(experiment_data["values"])
								let additional_categories = category_names.length - category_text.length;
								for (let i=0; i < additional_categories; i++) { add_category_btn.click(); }
								for (let i=0; i < category_names.length; i++)
								{
									category_text[i].firstChild.value = category_names[i];
									category_text[i].lastChild.value = experiment_data["values"][category_names[i]];
								}
							}
							else
							{
								variable_values.firstChild.value = experiment_data["values"][0]; 
								variable_values.lastChild.value = experiment_data["values"][1]; 
							}
						}
						catch (err)
						{
							//console.log("Document has variables not in experiment");
							doc_selection.title = false;
							continue;
						}
					}

					// check if all experiment variables are in the document
					const contains_vars = Object.keys(experiment_inputs["Variable Data"]).every(exp_var => doc_vars.includes(exp_var));
					if (!contains_vars)
					{
						doc_selection.title = false; 
						//console.log("Experiment has variables not in document");
					}

					// check if all the players in experiment inputs are within the loaded document
					const contains_players = combined_sets.every(player => document_inputs.includes(player));
					if (contains_players)
					{
						const exp_sets = Object.keys(experiment_inputs["Players"]).length;
						for (let set in experiment_inputs["Players"])
						{
							// add another set if there is more than 1
							const doc_sets = document.querySelectorAll("#player_content .table_row").length;
							if (set > 0 && doc_sets < exp_sets)
							{
								try
								{
									add_set_btn.click();
								}
								catch(err)
								{
									if (err instanceof TypeError){continue;};
								}
							}
						}

						const player_inputs = document.querySelectorAll("#player_content .table_row");
						if (player_inputs.length != 0) // player set rows are loaded correctly
						{
							for (let set in experiment_inputs["Players"])
							{
								const player_list = player_inputs[set].querySelector(".player_select");
								const exp_subsets = experiment_inputs["Players"][set]["set"].length;
								for (let i=0; i < exp_subsets; i++)
								{
									const doc_subsets = player_inputs[set].querySelector(`#set_${parseInt(set)+1}`).children.length;
									if (i > 1 && doc_subsets < exp_subsets) //add another subset if there are more than 2
									{
										let add_subset_btn = player_inputs[set].querySelector(".add_subset");
										add_subset_btn.click();
									}
								}

								// move players from selection menu to respective subsets
								const subsets = player_inputs[set].querySelector(`#set_${parseInt(set)+1}`);
								for (let i=0; i < experiment_inputs["Players"][set]["set"].length; i++)
								{
									for (let j=0; j < experiment_inputs["Players"][set]["set"][i].length; j++)
									{
										const plr = experiment_inputs["Players"][set]["set"][i][j];
										const drag_player = player_list.querySelector(`[title='${plr}']`);
										try {
											subsets.children[i].appendChild(drag_player);
										}
										catch(err)
										{
											if (err instanceof TypeError){continue;}
										}
									}
								}
								const plr_limits = experiment_inputs["Players"][set]["limits"];
								player_inputs[set].querySelector(".min_subsets").value = plr_limits[0];
								player_inputs[set].querySelector(".max_subsets").value = plr_limits[1];
							}
						}
					}
					else
					{
						doc_selection.title = false;
						//console.log("Not All Players Are in Document");
					}
				}
			}
		}
		xhttp.open("POST", `/experiment_inputs/${experiment_path}`); 
		xhttp.send();
	}


	function load_Variables() {

		document.getElementById("variable_content").innerHTML = "";
		document.getElementById("player_content").innerHTML = "";
		const selected_doc = event.target;
		const doc_path = selected_doc.attributes["value"].value;
		const doc_type = doc_path.split("/")[0];

		load_Document(doc_path);

		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {

				// build data tables for user input - variables & players
				const document_variables = JSON.parse(this.responseText);

				document.getElementById("document_variables").title = doc_path
				for (let [var_type, variables] of Object.entries(document_variables)) {

					if (Object.keys(document_variables[var_type]).length == 0) {continue;}

					let column_titles = new Array(); 
					if (var_type == "Variable Data") {
						column_titles = Object.keys(Object.values(variables)[0]);
						column_titles.splice(0, 0, "name");
					}
					else if (var_type == "Players") {
						column_titles = ["players set", "mut. exclusive subsets", "player choices"];
					}

					const column_space = (1 / column_titles.length) * 100;

					if (var_type == "Variable Data") {

						let var_content = `<ul><li class="table_header">`;
						column_titles.forEach(function (title) {
							var_content += `<div style="flex-basis:${column_space}%">${title}</div>`;
						});	var_content += "</li>";

						for (let [var_name, var_fields] of Object.entries(variables)){
							var_content += `<li class="table_row"><div style="flex-basis:${column_space}%">${var_name}</div>`; 
							for (let [var_field, field_value] of Object.entries(var_fields)){
								var_content += `<div style="flex-basis:${column_space}%"`;
								if (var_field == "type") {
									field_value = `<select class="var_data_select" id="${var_name}"> ${variable_options_select} </select>`;
								} 
								else if (var_field == "values") 
								{
									var_content += ` id="${var_name} values"`;
								}
								var_content += `>${field_value}</div>`;
							}
							var_content += "</li>";
						}
						var_content += "</ul>";
						document.getElementById("variable_content").innerHTML = var_content;
					}

					else if (var_type == "Players") {

						let plr_header = "<ul><li class='table_header'>"
						column_titles.forEach((title) =>
							{
								plr_header += `<div style="flex-basis:${column_space}%;">${title}</div>`;
							});

						plr_header += "</li>";

						// add table header
						document.getElementById("player_content").innerHTML = plr_header;

						// const players = Object.keys(variables);
						const players = variables;
						add_set(column_space, players);

						let add_set_button = document.createElement("button");
						add_set_button.id = "add_set";
						add_set_button.innerHTML = "Add Set";
						add_set_button.addEventListener("click", () => {
							add_set(column_space, players);
						}, false);

						let remove_set_button = document.createElement("button");
						remove_set_button.id = "remove_set";
						remove_set_button.innerHTML = "Remove Set";
						remove_set_button.onclick = remove_set;

						let set_buttons = document.createElement("div");
						set_buttons.id = "set_buttons";

						set_buttons.appendChild(add_set_button);
						set_buttons.appendChild(remove_set_button);
						document.getElementById("player_content").appendChild(set_buttons);
					}
				}

				// initialize active button & add event listener to variable data content buttons
				const variable_tabs = document.getElementsByClassName("var_tab");
				for (let i=0; i < variable_tabs.length; i++) {
					variable_tabs[i].title == "variable_content" ?
					variable_tabs[i].classList.add("active") :
					variable_tabs[i].classList.remove("active");
				}

				for (let i=0; i < variable_tabs.length; i++) {
					variable_tabs[i].addEventListener("click", ()=> {
						const tab_content = document.getElementById(variable_tabs[i].title);
						const content_tables = document.getElementsByClassName("content_table");
						for (let j=0; j < content_tables.length; j++) {
							content_tables[j].style.display = "none";
							variable_tabs[j].classList.remove("active");
						}
						variable_tabs[i].classList.add("active");
						tab_content.style.display = "block";
					}, false);
				}

				// add function to select menu for changing variable type & show initial selected option
				let select_tags = document.getElementsByClassName("var_data_select");
				for (let i=0; i < select_tags.length; i++) {
					select_tags[i].onchange = select_vartype;
					let select_menu_id = select_tags[i].id;
					let options = select_tags[i].children;
					for (let j=0; j < options.length; j++) {
						if (options[j].getAttribute("selected")) {

						let value_inputs = document.getElementById(`${select_menu_id} values`);
						value_inputs.innerHTML = vartype_input[options[j].value];

							if (options[j].value == "categorical") {

							value_inputs.querySelector(".add_category").onclick = addCategory;
							value_inputs.querySelector(".remove_category").onclick = removeCategory;
							value_inputs.querySelector(".add_category").click();
							}
						}
					}
				}
				document.getElementById("variable_content").style.display = "block";
				document.getElementById("player_content").style.display = "none";
				load_experiment(doc_path, document_variables["Players"]);
			}
		}
		xhttp.open("POST", doc_type);
		xhttp.send(doc_path);
	}


	let initFunction = function () {

		return new Promise((resolve, reject) => {

		document.getElementById("scenario_text").value = "";
		const xhttp = new XMLHttpRequest();
		xhttp.open("GET", "/DOE/");
		xhttp.onload = () => {
			if (xhttp.readyState == 4 && xhttp.status == 200){
				const scenario_documents = JSON.parse(xhttp.responseText);
				let documents_menu = "<ul>";
				for (let [doc_type, docs] of Object.entries(scenario_documents)) {
					documents_menu += `<li>${doc_type.toUpperCase()}<ul>`;
					for (let doc_name in docs)
					{
						const doc_path = doc_type + "/" + doc_name; 
						documents_menu += `<li class="document" title="${docs[doc_name]["exp_valid"]}" value="${doc_path}">${doc_name}</li>`;
					}
					documents_menu += "</ul></li>";
				}

				documents_menu += "</ul>";
				document.getElementById("scenario_documents").innerHTML = documents_menu;
				const doc_collection = document.getElementsByClassName("document");
				for (let i=0; i < doc_collection.length; i++) 
				{
					doc_collection[i].onclick = load_Variables;
				}
				document.getElementById("create_experiment").onclick = openNav; 
				document.getElementById("close_experiment").onclick = closeNav;

				let exp_inputs = document.getElementById("experiments").children;
				for (let i=0; i < exp_inputs.length-1; i++)
				{
					exp_inputs[i].ondragstart = drag_experiment;
					exp_inputs[i].ondragover = allowDrop;
					exp_inputs[i].ondrop = drop_experiment;
				}

				const exp_nav = document.getElementById("experiment_nav");
				exp_nav.ondragover = allowDrop;
				exp_nav.ondrop = drop_jogfile;

				let jog_files_input = document.querySelector("#jog_files_btn input");
				let jog_files_list = document.getElementById("jog_files");
				jog_files_list.ondragstart = drag_jogfile;
				jog_files_list.ondragover = allowDrop;
				jog_files_list.ondrop = drop_jogfile;

				jog_files_input.addEventListener("change", () => {
					for (let i=0; i < jog_files_input.files.length; i++)
					{
						// append jog file name and its content if not present in list
						if (!document.getElementById(`jog ${jog_files_input.files[i].name}`))
						{
							let new_jog_file = document.createElement("div");
							new_jog_file.id = `jog ${jog_files_input.files[i].name}`;
							new_jog_file.innerHTML = jog_files_input.files[i].name;
							new_jog_file.draggable = true;
							let reader = new FileReader();
							reader.readAsText(jog_files_input.files[i], "UTF-9");
							reader.onload = readerEvent => {
								let content = readerEvent.target.result;
								new_jog_file.value = content;
							}
							jog_files_list.appendChild(new_jog_file);
						}
					}
				});

				const messages = [
					"EVALUATES-LASER-EVENT-AGAINST", 
					"TERMINATES-LASER-EVENT-AGAINST",
					"STARTS-TRACKING",
					"ATTEMPTS-TO-DETECT",
					"SUCCESSFULLY-HIT"
				];
				const msg_options = document.getElementById("msg_choices");
				let msg_checklist = "";
				messages.forEach( (msg) => {
					msg_checklist += `<div class="msg">` +
						`<input type="checkbox" id="${msg}">` +
						`<label for="${msg}">${msg}` + 
						`<div class="check_mark"></div>` +
						`</label></div>`;
				});
				msg_options.innerHTML = msg_checklist;

				const run_exp_btn = document.getElementById("run_exp_btn");
				run_exp_btn.onclick = run_experiment;

				let error_screen = document.getElementById("error_screen");
				error_screen.addEventListener("animationend", () =>
				{
					error_screen.classList.remove("fade_out");
				});

				let upload_success = document.getElementById("upload_success");
				upload_success.addEventListener("animationend", () =>
				{
					upload_success.classList.remove("fade_out");
				});

				let exp_error_screen = document.getElementById("exp_error_screen");
				exp_error_screen.addEventListener("animationend", () =>
				{
					exp_error_screen.classList.remove("fade_out");
				});

				const exp_progress_value = document.getElementById("exp_progress_value");
				exp_progress_value.onchange = exp_progress_check;

				load_experiment_schema(scenario_documents);
				resolve(scenario_documents);
			}
			else {reject(xhttp.statusText);}
		}
		xhttp.onerror = () => reject(xhttp.statusText);
		xhttp.send();
		});
	}


	function load_Document(docPath) {
		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200){
				let scenario_text = document.getElementById("scenario_text");
				let highlights_text = document.getElementById("highlights");
				let highlight_text = this.responseText
					.replace(/\n$/g,'\n\n')
					.replace(/(?<=@{)([\w\s-]*?)(?=}@)/g, '<mark>$1</mark>');

				scenario_text.value = this.responseText;
				scenario_text.title = docPath;
				highlights_text.innerHTML = highlight_text;

				scenario_text.addEventListener("input", () => {
					const text = event.target.value;
					const highlighted_text = text
						.replace(/\n$/g,'\n\n')
						.replace(/(?<=@{)([\w\s-]*?)(?=}@)/g, '<mark>$1</mark>');
					document.getElementById("highlights").innerHTML = highlighted_text;
				}, false);

				scenario_text.addEventListener("scroll", () => {
					const backdrop = document.getElementById("text_backdrop");
					backdrop.scrollTop = event.target.scrollTop;
					backdrop.scrollLeft = event.target.scrollLeft;
				}, false);

				document.getElementById("upload_variables").onclick = upload_variables;
				document.getElementById("update_document").onclick = update_document;
			}
		}
		xhttp.open("GET", docPath);
		xhttp.send();
	};
	return initFunction;
})();
