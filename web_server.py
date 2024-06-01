#!/home/kali/anaconda3/bin/python3

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys, subprocess
import experiment_runner
import threading
import glob
import json
import pdb
import re
import os


class SupDOEServer(HTTPServer):

    def __init__(self, scenario_directory, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.scenario_directory = scenario_directory
        self.tdb_files = glob.glob(os.path.join(scenario_directory,"tdb") + "/*.dat")
        self.sdb_files = glob.glob(os.path.join(scenario_directory,"sdb") + "/*.dat")
        self.experiment_assets = None
        self.DOE = experiment_runner.Suppressor_DOE()


class SupDOERequestHandler(SimpleHTTPRequestHandler):

    def __get_documents(self, input_files):

        doc_status = {} 

        for doc in input_files:
            file_elements = os.path.split(doc)
            file_type = os.path.split(file_elements[0])[1]
            file_name = file_elements[1]
            exp_dir = os.path.join(
                self.server.scenario_directory,
                "experiment_inputs",
                file_type,
                file_name.replace(".dat",".json"))

            if not os.path.exists(exp_dir): # NO experiment inputs
                doc_status[file_name] = {"exp_valid": False}

            else: # experiment inputs exist
                file_data = self.server.DOE.collect_file_data(doc)
                f = open(exp_dir)
                exp_data = json.load(f)
                f.close()

                doc_vars = set(file_data["Variable Data"].keys())
                exp_vars = set(exp_data["Variable Data"].keys())
                exp_plrs = [] 
                for plr_set in exp_data["Players"]:
                    for subset in exp_data["Players"][plr_set]["set"]:
                        exp_plrs.extend(subset)

                exp_plrs = set(exp_plrs)
                doc_plrs = set(file_data["Players"])

                if exp_plrs.issubset(doc_plrs) and doc_vars == exp_vars:
                    doc_status[file_name] = {"exp_valid": True}
                else:
                    doc_status[file_name] = {"exp_valid": False}

        return doc_status 


    def __get_experiments(self):

        experiment_dir = os.path.join(self.server.scenario_directory, "experiment_setup")
        experiment_list = os.listdir(experiment_dir)

        experiment_setups = {} 
        for exp_doc in experiment_list:
            f = open(os.path.join(experiment_dir, exp_doc))
            schema = json.load(f)
            f.close()

            exp_name = schema["Experiment Name"]
            experiment_setups[exp_name] = {"tdb": [], "sdb": []}
            for exp_input in schema["Experiment Inputs"]:
                input_type, input_name = exp_input.split("/")
                experiment_setups[exp_name][input_type].append(input_name)

        return experiment_setups 


    def do_GET(self):

        path = self.path

        if path == "/index.html":
            mimetype = "text/html"
        elif path == "/main_page.css":
            mimetype = "text/css"
        elif path == "/main_page.js" or path == "/optimization.js":
            mimetype = "text/javascript"
        elif "tdb" in path or "sdb" in path or path == "/experiment_progress":
            mimetype = "text/plain"
        elif path == "/DOE/" \
            or path == "/experiment_list" \
            or path == "/update_experiment":
            mimetype = "application/json"
        else:
            path = "/index.html"
            mimetype = "text/html"
            
        self.send_response(200, "OK")
        self.send_header("Content-Type", mimetype)
        self.end_headers()

        if path == "/DOE/": 
            scenario_files = {
                "tdb": self.__get_documents(self.server.tdb_files),
                "sdb": self.__get_documents(self.server.sdb_files)}
            scenario_files = json.dumps(scenario_files)
            self.wfile.write(scenario_files.encode())

        elif path == "/experiment_list":
            experiment_list = json.dumps(self.__get_experiments())
            self.wfile.write(experiment_list.encode())

        elif path == "/update_experiment":
            scenario_files = {
                "tdb": self.__get_documents(self.server.tdb_files),
                "sdb": self.__get_documents(self.server.sdb_files)}
            experiment_list = self.__get_experiments()
            updated_experiments = {}
            for exp_name, exp_docs in experiment_list.items():
                updated_experiments[exp_name] = [] 
                for doc_type, doc_names in exp_docs.items():
                    for doc in doc_names: 
                        valid_doc = scenario_files[doc_type][doc]["exp_valid"]
                        updated_experiments[exp_name].append(valid_doc)

            updated_experiments = {
                name: all(valid_docs) 
                for name, valid_docs 
                in updated_experiments.items()}

            self.wfile.write(json.dumps(updated_experiments).encode())


        elif "tdb" in path or "sdb" in path:
            with open(os.path.join(self.server.scenario_directory, path[1:]), 'rb') as file:
                self.wfile.write(file.read())

        elif path == "/experiment_progress":

            if self.server.DOE.get_progress() == 100:
                with open(
                    os.path.join(
                        self.server.scenario_directory, 
                        "experiment_setup",
                        self.server.experiment_assets["Experiment Name"] + ".json"), "w") as f:
                            json.dump(self.server.experiment_assets, f)

            self.wfile.write(str(self.server.DOE.get_progress()).encode())

        else:
            with open(path[1:], 'rb') as file:
                self.wfile.write(file.read())


    def do_POST(self):

        path = self.path

        if path == "/tdb":
            content_length = int(self.headers["Content-Length"])
            post_body = self.rfile.read(content_length).decode()
            file_data = self.server.DOE.collect_file_data(
                os.path.join(self.server.scenario_directory, post_body))

            mimetype = "application/json"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()
            self.wfile.write(bytes(json.dumps(file_data), "utf-8"))

        elif path == "/sdb":
            content_length = int(self.headers["Content-Length"])
            post_body = self.rfile.read(content_length).decode()
            file_data = self.server.DOE.collect_file_data(
                os.path.join(self.server.scenario_directory, post_body))

            mimetype = "application/json"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()
            self.wfile.write(bytes(json.dumps(file_data), "utf-8"))
        
        elif path == "/experiment_inputs/": # upload variables
            content_length = int(self.headers["Content-Length"])
            post_body = self.rfile.read(content_length).decode()
            doc_data = json.loads(post_body)
            doc_path = [path for path in doc_data][0] 
            doc_name = doc_path.split("/")[1]

            experiment_path = os.path.join(
                self.server.scenario_directory, path[1:-1], doc_path.split("/")[0])
            if not os.path.exists(experiment_path):
                os.mkdir(experiment_path)

            with open(os.path.join(experiment_path,doc_name.replace(".dat",".json")),"w") as file:
                file.write(json.dumps(doc_data[doc_path], indent=5))

            mimetype = "text/plain" 
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()
            self.wfile.write("Experiment Inputs Uploaded!".encode())


        
        elif path[1:].split("/")[0] == "experiment_inputs" and len(path[1:].split("/")) > 1:

            path_elements = os.path.split(path[1:])
            doc_name = path_elements[1].split(".")[0] + ".json"

            mimetype = "application/json"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()

            experiment_path = os.path.join(self.server.scenario_directory, path_elements[0], doc_name)

            if os.path.exists(experiment_path):
                with open(experiment_path, 'rb') as file:
                    self.wfile.write(file.read())

        elif path == "/run_experiment":
            content_length = int(self.headers["Content-Length"])
            post_body = self.rfile.read(content_length).decode()
            exp_assets = json.loads(post_body)

            self.server.experiment_assets = exp_assets

            docs = [doc.split("/") for doc in exp_assets["Experiment Inputs"]]
            doc_paths = [os.path.join(
                self.server.scenario_directory, 
                doc[0], 
                doc[1]) for doc in docs]

            exp_paths = [os.path.join(
                self.server.scenario_directory, 
                "experiment_inputs", 
                doc[0], 
                doc[1].replace(".dat",".json")) for doc in docs]

            exp_docs = [{"doc": doc, "exp": exp} 
                        for doc, exp in zip(doc_paths, exp_paths)]

            experiment_thread = threading.Thread(
                target=self.server.DOE.build_run_experiment,
                args=(exp_docs,))
            experiment_thread.start()

            mimetype = "text/plain"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()

        elif path == "/experiment_info":
            content_length = int(self.headers["Content-Length"])
            exp_name = self.rfile.read(content_length).decode()
            f = open(os.path.join(
                self.server.scenario_directory, 
                "experiment_setup",
                exp_name + ".json"))
            experiment_schema = f.read()
            f.close()

            mimetype = "application/json"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()

            self.wfile.write(experiment_schema.encode())

        else: # update document
            content_length = int(self.headers["Content-Length"])
            post_body = self.rfile.read(content_length).decode()

            with open(os.path.join(self.server.scenario_directory, path[1:]), "w") as file:
                file.write(post_body)

            mimetype = "application/json"
            self.send_response(200, "OK")
            self.send_header("Content-Type", mimetype)
            self.end_headers()


if __name__ == "__main__":

    scenario_directory = os.path.join(os.getcwd(),"DOE")

    HOST_NAME = "192.168.192.131"
    PORT = 3000
    server = SupDOEServer(
        scenario_directory, 
        (HOST_NAME, PORT), 
        SupDOERequestHandler)
    print(f"Server started http://{HOST_NAME}:{PORT}")

    try:
        server.serve_forever()

    except KeyboardInterrupt:
        server.server_close()
        print("Server stopped successfully")
        sys.exit(0)
