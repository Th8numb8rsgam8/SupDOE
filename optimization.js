(function() {

	"use strict";
	
	document.addEventListener("DOMContentLoaded", () => 
	{
		initFunction()
			.then(docs_menu => { optimInit(docs_menu);})
			.catch(error => { console.log(error);})
	}, false);


	function show_msg_fields()
	{
		const messages = document.getElementById("msg_list").childNodes;
		messages.forEach(msg => {
			if (msg !== this) 
			{
				msg.classList.remove("open");
				msg.style.height = '42px';
			}
		});
		const is_open = this.classList.contains("open");
		const fields_height = this.querySelector(".msg_fields").getBoundingClientRect().height;
		if (is_open) {
			this.classList.remove("open");
			this.style.height = '42px';
		} else {
			this.classList.add("open");
			this.style.height = `${42 + fields_height}px`;
		}
	}


	function openNav() {
		const experiment_menu = document.getElementById("optimization_nav");
		experiment_menu.style.display = "block";
	}

	function closeNav() {
		document.getElementById("optimization_nav").style.display = "none";
	}

	function optimInit(docs_menu)
	{
		const experiment_menu = document.getElementById("optimization_nav");
		experiment_menu.ondragend = drag_value_op;

		let optim_inputs = "<ul>";
		for (let [doc_type, docs] of Object.entries(docs_menu))
		{
			optim_inputs += `<li><a>${doc_type.toUpperCase()}</a><ul>`;
			for (let doc_name in docs)
			{
				const doc_path = doc_type + "/" + doc_name;
				optim_inputs += "<li" +
					' class="optim_input" ' +
					` title="${docs[doc_name]["exp_valid"]}" ` + 
					` value="${doc_path}">` +
					`<a>${doc_name}</a></li>`;
			}
			optim_inputs += "</ul></li>";
		}
		optim_inputs += "</ul>";
		document.getElementById("optimization_inputs").innerHTML = optim_inputs;
		document.getElementById("create_optimization").onclick = openNav; 
		document.getElementById("close_optimization").onclick = closeNav;

		const val_function = document.getElementById("value_function");
		val_function.ondragover = allowDrop;
		val_function.ondrop = to_value_function;

		build_msg_list();
		build_ops_list();

		const msg_options = document.getElementById("msg_list").childNodes;
		msg_options.forEach((option) =>
		{
			option.onclick = show_msg_fields;
		});
	}


	function build_ops_list() {
		const math_operations = {
			"plus": {"symbol": '&#43', "type": "math"},
			"minus": {"symbol": '&#8722', "type": "math"},
			"multiply": {"symbol": '&#215', "type": "math"},
			"divide": {"symbol": '&#247', "type": "math"},
			"square": {"symbol": '&#178', "type": "math"},
			"average": {"symbol": 'avg ( )', "type": "agg"},
			"sum": {"symbol": 'sum ( )', "type": "agg"},
			"max": {"symbol": 'max ( )', "type": "agg"},
			"min": {"symbol": 'min ( )', "type": "agg"},
			"count": {"symbol": 'count ( )', "type": "count"}
		}

		let ops_list_content = "<ul>";
		for (let [op_name, op_data] of Object.entries(math_operations)) {
			ops_list_content += `<li id="${op_name}"` +
				`title="${op_data.type}"` +
				'class="math_operations"' +
				'draggable=true>' +
				`${op_data.symbol}</li>`;
		}
		ops_list_content += "</ul>";
		const math_ops = document.getElementById("math_operations");
		math_ops.innerHTML = ops_list_content;
		math_ops.ondragstart = drag_operation;
	}


	function drag_operation() {
		event.dataTransfer.setData("op_type", event.target.title);
		event.dataTransfer.setData("operation", event.target.id);
		event.dataTransfer.setData("symbol", event.target.innerHTML);
		event.dataTransfer.setData("section", event.target.classList.value);
	}


	function drag_field() {
		event.dataTransfer.setData("section", event.target.classList.value);
		event.dataTransfer.setData("field_name", event.target.title);
	}


	function to_value_function() {
		event.preventDefault();
		const section = event.dataTransfer.getData("section").split(" ");
		if (section.includes("math_operations"))
		{
			drop_operation();
		}
		else if (section.includes("field"))
		{
			drop_field();
		}
	}


	const drop_operation = function()
	{
		const op_type = event.dataTransfer.getData("op_type");
		const operation = event.dataTransfer.getData("operation");
		const symbol = event.dataTransfer.getData("symbol");

		const val_function = document.querySelector("#value_function ul");
		const op_elements = {
			"agg": `<li title="${operation.toUpperCase()}"` +
				'class="aggregate_op val_func function_item" draggable="true">' +
				`<a class="aggregate_op val_func">${symbol}</a>` +
				'<ul class="val_func"><li class="val_func">' + 
				'<a class="val_func">add_filter</a></li></ul></li>',

			"math": '<li class="val_func empty latch latch-1">' +
				'<a class="val_func empty latch latch-1">Enter Here</a></li>' +
				`<li title="${operation.toUpperCase()}"` + 
				'class="math_op val_func function_item" draggable="true">' +
				`<a class="val_func">${symbol}</a></li>` +
				'<li class="val_func empty latch latch-2">' +
				'<a class="val_func empty latch latch-2">Enter Here</a></li>'
		}

		const val_func_items = val_function.querySelectorAll(".function_item");
		if (val_func_items.length === 0)
		{
			val_function.innerHTML = op_elements[op_type];
		}
		else
		{
			switch (op_type)
			{
				case "agg":
					if (event.target.matches(".latch.empty"))
					{
						const chosen_op = new DOMParser()
							.parseFromString(op_elements[op_type], "text/html")
							.body.firstChild;
						if (event.target.tagName === "A")
						{
							chosen_op.classList
								.add(...event.target.parentElement.classList);
							chosen_op.classList.remove("empty");
							chosen_op.classList.add("filled");
							event.target.parentElement.replaceWith(chosen_op);
						}
						else
						{
							chosen_op.classList
								.add(...event.target.classList);
							chosen_op.classList.remove("empty");
							chosen_op.classList.add("filled");
							event.target.replaceWith(chosen_op);
						}
					}
					break;

				case "math":
					if (val_func_items.length === 1)
					{
						if (val_func_items[0].classList.contains("math_op"))
						{
							const latch_2 = val_function.querySelector("li.latch-2");
							val_function.removeChild(latch_2);
							val_function.innerHTML += op_elements[op_type]
								.replaceAll("latch-1", "latched");
						}
						else // aggregate_op
						{
							val_function.innerHTML += op_elements[op_type];
							const latch_1 = val_function.querySelector("li.latch-1");
							const agg_op = val_function.querySelector("li.aggregate_op");
							agg_op.classList.add(...latch_1.classList);
							agg_op.classList.remove("empty");
							agg_op.classList.add("filled");
							val_function.removeChild(latch_1);
						}
					}
					else
					{
						const latch_2 = val_function.querySelector("li.latch-2");
						if (latch_2.classList.contains("empty"))
						{
							val_function.removeChild(latch_2);
							val_function.innerHTML += op_elements[op_type]
								.replaceAll("latch-1", "latched");
						}
						else // latch space is filled
						{
							const chosen_op = new DOMParser()
								.parseFromString(op_elements[op_type], "text/html")
								.body.children;
							val_function.appendChild(chosen_op[1]);
							val_function.appendChild(chosen_op[1]);
							latch_2.classList.remove("latch-2");
							latch_2.classList.add("latched");
						}
					}
					break;
			}
		}
	}


	function drop_field()
	{
		const field_classes = event.dataTransfer.getData("section").split(" ");
		const field_name = event.dataTransfer.getData("field_name");
		const tag = event.target.tagName;
		let target = event.target;
		if (tag === "A")
		{
			target = event.target.parentElement;
		}

		const tgt_classes = target.classList;
		if (tgt_classes.contains("aggregate_op"))
		{
			if (field_classes.includes("float"))
			{
				target.firstChild.innerHTML = `${target.title} ( ${field_name} )`;
			}
		}
	}


	function drag_value_op()
	{
		const class_list = event.target.classList;
		if (class_list.contains("val_func"))
		{
			if (class_list.contains("function_item"))
			{
				const ops_list = document.querySelector("ul.val_func");
				const math_ops = document.querySelectorAll(".math_op.function_item");
				let new_element = '<li class="val_func empty latch latch-1">' +
					'<a class="val_func empty latch latch-1">Enter Here</a></li>';
				if (class_list.contains("math_op"))
				{
					if (math_ops.length > 1)
					{
						if (event.target === math_ops[math_ops.length-1]) // first math_op
						{
							new_element = new_element.replaceAll("latch-1", "latch-2");
						}
						else if (event.target !== math_ops[0])
						{
							new_element = new_element.replaceAll("latch-1", "latched");
						}
						const to_insert = new DOMParser()
							.parseFromString(new_element, "text/html")
							.body.firstChild;
						ops_list.insertBefore(to_insert, event.target.previousSibling);
					}
					event.target.previousSibling.remove();
					event.target.nextSibling.remove();
					event.target.remove();
				}
				else if (class_list.contains("aggregate_op"))
				{
					if (math_ops.length > 0)
					{
						if (class_list.contains("latch-2"))
						{
							new_element = new_element.replaceAll("latch-1", "latch-2");
						}
						else if (class_list.contains("latched"))
						{
							new_element = new_element.replaceAll("latch-1", "latched");
						}
						const to_insert = new DOMParser()
							.parseFromString(new_element, "text/html")
							.body.firstChild;
						ops_list.insertBefore(to_insert, event.target);
					}
					event.target.remove();
				}
			}
		}
	}


	function allowDrop()
	{
		event.preventDefault();
	}


	function build_msg_list() {
		const msg_fields = {
			"EVALUATES-LASER-EVENT-AGAINST":
			{
				"Occurrence": {"type": "message"},
				"Player": {"type": "categorical"},
				"Intensity": {"type": "float"},
				"Effective Intensity": {"type": "float"},
				"3D Range": {"type": "float"}
			},
			"TERMINATES-LASER-EVENT-AGAINST":
			{
				"Occurrence": {"type": "message"},
				"Player": {"type": "categorical"},
				"Laser Name": {"type": "categorical"},
				"Accumulated Energy": {"type": "float"}
			},
			"ATTEMPTS-TO-DETECT":
			{
				"Occurrence": {"type": "message"},
				"Succeeds With": {"type": "categorical"},
				"Emitter": {"type": "categorical"},
				"Probability": {"type": "float"}
			}
		}

		const msg_list = document.createElement("ul");
		msg_list.id = "msg_list";
		let msg_list_content = "";
		for (let [msg, fields_object] of Object.entries(msg_fields))
		{
			let msg_item = `<li id="${msg}"><div class="msg_dropdown">${msg}` +
				'<i class="chevron_down"></i></div>' +
				'<ul class="msg_fields">';
			for (let [field, var_type] of Object.entries(fields_object))
			{
				msg_item += `<li draggable="true" title="${field}"` +
					`class="${msg} ${var_type.type} field">` + 
					`<a title="${field}" class="${msg} ${var_type.type} field">${field}</a></li>`;
			}
			msg_item += '</ul></li>';
			msg_list_content += msg_item;
		}
		msg_list.innerHTML = msg_list_content;
		document.getElementById("msg_vars").appendChild(msg_list);
		document.getElementById("msg_vars").ondragstart = drag_field;
	}
})(initFunction);
